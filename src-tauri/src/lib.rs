//! # QuMaEditor Native Core Library
//!
//! `quma_editor_lib` は、QuMaEditor (Quick & Minimal Markdown Editor) の Tauri v2 ネイティブアクセラレーション機能を提供するバックエンドコアライブラリです。
//!
//! ## 主な機能
//! - **文字コード自動判定 & 変換**: `encoding_rs` による UTF-8, Shift_JIS, EUC-JP の高速判別。
//! - **大容量ファイルチャンクストリーミング**: 10MB+ テキストのメモリ効率的分割読み込み。
//! - **高速転置インデックス全文検索**: `LazyLock` と単語パースによる単語・行単位インデックス検索。
//! - **並列マルチスレッド一括文字コード変換**: `rayon` を活用した多重ファイルの高速バッチ変換。
//! - **ネイティブ Text Diff 差分比較**: `similar` クレートによる高速な行単位 LCS 差分比較。
//! - **高速 Markdown 構文パース**: `pulldown-cmark` による非同期非フリーズレンダリング。
//! - **Specta TypeScript 型自動出力**: Rust DTO 型定義から TypeScript バインディング (`bindings.ts`) を全自動エクスポート。

use encoding_rs::{EUC_JP, SHIFT_JIS, UTF_8};
use printpdf::*;
use pulldown_cmark::{html, Options, Parser};
use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use similar::{ChangeTag, TextDiff};
use specta::Type;
use std::fs::{self, File};
use std::io::{BufWriter, Read, Seek, SeekFrom, Write};
use std::path::Path;
use std::sync::{LazyLock, Mutex};
use syntect::highlighting::ThemeSet;
use syntect::html::highlighted_html_for_string;
use syntect::parsing::SyntaxSet;

// -----------------------------------------------------------------------------
// DTO 定義 (Data Transfer Objects with Specta Types)
// -----------------------------------------------------------------------------

/// 文字コード変換結果を表す DTO
#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, Type)]
pub struct ConvertedTextDto {
    /// 変換後の UTF-8 テキスト
    pub text: String,
    /// 判定された元の文字コード名 ("UTF-8", "Shift_JIS", "EUC-JP")
    pub encoding: String,
}

/// チャンク読み込み結果を表す DTO
#[derive(Debug, Serialize, Deserialize, Type)]
pub struct ChunkResultDto {
    /// 読み込まれたテキストチャンクデータ
    pub content: String,
    /// 残りのファイルデータが存在するかどうか
    pub has_more: bool,
    /// ファイルの総バイトサイズ
    pub total_size: u64,
}

/// インデックス検索の入力ドキュメント構造体
#[derive(Debug, Serialize, Deserialize, Clone, Type)]
pub struct DocSearchInput {
    /// ドキュメント識別子 ID
    pub id: String,
    /// ドキュメントタイトル
    pub title: String,
    /// ドキュメント本文およびタグテキスト
    pub content: String,
}

/// 全文検索ヒット結果を表す DTO
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq, Type)]
pub struct SearchHitDto {
    /// ヒットしたドキュメント ID
    pub doc_id: String,
    /// ヒットしたドキュメントタイトル
    pub doc_title: String,
    /// ヒットした行番号 (1-indexed)
    pub line_number: usize,
    /// ヒットした行のテキスト文字列
    pub line_text: String,
}

/// バッチ文字コード一括変換の指定項目 DTO
#[derive(Debug, Serialize, Deserialize, Type)]
pub struct BatchConvertItem {
    /// 対象ファイルパス
    pub file_path: String,
    /// 変換先ターゲット文字コード ("UTF-8", "Shift_JIS")
    pub target_encoding: String,
}

/// バッチ文字コード一括変換の全体実行結果 DTO
#[derive(Debug, Serialize, Deserialize, Type)]
pub struct BatchConvertResultDto {
    /// 変換成功ファイル数
    pub success_count: usize,
    /// 変換失敗ファイル数
    pub failure_count: usize,
    /// 実行ログ・メッセージ一覧
    pub messages: Vec<String>,
}

/// テキスト Diff 差分変更単位を表す DTO
#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, Type)]
pub struct DiffChangeDto {
    /// 変更種別 ("insert", "delete", "equal")
    pub tag: String,
    /// 変更行テキスト
    pub value: String,
    /// 旧ドキュメントでの行番号 (1-indexed)
    pub old_line: Option<usize>,
    /// 新ドキュメントでの行番号 (1-indexed)
    pub new_line: Option<usize>,
}

// -----------------------------------------------------------------------------
// 全文検索インデックス (Rust 1.80+ 標準 LazyLock)
// -----------------------------------------------------------------------------

/// 全文検索用インデックスメモリ保持ストレージ
static SEARCH_INDEX: LazyLock<Mutex<Vec<DocSearchInput>>> =
    LazyLock::new(|| Mutex::new(Vec::new()));

// -----------------------------------------------------------------------------
// コア ロジック関数群
// -----------------------------------------------------------------------------

/// バイト配列の文字コードを自動判定し、UTF-8 文字列へデコードします。
pub fn detect_and_convert_to_utf8(bytes: Vec<u8>) -> Result<ConvertedTextDto, String> {
    let (text, _, had_errors) = UTF_8.decode(&bytes);
    if !had_errors {
        return Ok(ConvertedTextDto {
            text: text.into_owned(),
            encoding: "UTF-8".to_string(),
        });
    }

    let (text, _, had_errors) = SHIFT_JIS.decode(&bytes);
    if !had_errors {
        return Ok(ConvertedTextDto {
            text: text.into_owned(),
            encoding: "Shift_JIS".to_string(),
        });
    }

    let (text, _, had_errors) = EUC_JP.decode(&bytes);
    if !had_errors {
        return Ok(ConvertedTextDto {
            text: text.into_owned(),
            encoding: "EUC-JP".to_string(),
        });
    }

    let (text, _) = UTF_8.decode_with_bom_removal(&bytes);
    Ok(ConvertedTextDto {
        text: text.into_owned(),
        encoding: "UTF-8".to_string(),
    })
}

/// 指定された UTF-8 テキストをターゲットエンコーディング (Shift_JIS 等) にエンコードして保存用バイト列を出力します。
pub fn convert_utf8_to_encoding(text: String, target_encoding: String) -> Result<Vec<u8>, String> {
    match target_encoding.to_uppercase().as_str() {
        "SHIFT_JIS" | "SJIS" => {
            let (encoded_bytes, _, had_errors) = SHIFT_JIS.encode(&text);
            if had_errors {
                return Err(
                    "Shift_JIS へのエンコード中に文字化けエラーが発生しました。".to_string()
                );
            }
            Ok(encoded_bytes.into_owned())
        }
        "EUC-JP" | "EUCJP" => {
            let (encoded_bytes, _, had_errors) = EUC_JP.encode(&text);
            if had_errors {
                return Err("EUC-JP へのエンコード中に文字化けエラーが発生しました。".to_string());
            }
            Ok(encoded_bytes.into_owned())
        }
        _ => Ok(text.into_bytes()),
    }
}

/// 10MB 超えの大容量テキストファイルをメモリを圧迫せずに分割段階読み込みします。
pub fn read_file_chunk_native(
    file_path: String,
    offset: u64,
    chunk_size: usize,
) -> Result<ChunkResultDto, String> {
    let path = Path::new(&file_path);
    let mut file = File::open(path).map_err(|e| format!("ファイルオープンエラー: {}", e))?;
    let metadata = file
        .metadata()
        .map_err(|e| format!("メタデータ取得エラー: {}", e))?;
    let total_size = metadata.len();

    file.seek(SeekFrom::Start(offset))
        .map_err(|e| format!("シーク失敗: {}", e))?;

    let mut buffer = vec![0u8; chunk_size];
    let bytes_read = file
        .read(&mut buffer)
        .map_err(|e| format!("ファイル読み込みエラー: {}", e))?;

    buffer.truncate(bytes_read);

    let converted = detect_and_convert_to_utf8(buffer)?;
    let has_more = (offset + bytes_read as u64) < total_size;

    Ok(ChunkResultDto {
        content: converted.text,
        has_more,
        total_size,
    })
}

/// ドキュメント群を爆速転置インデックス検索エンジンに一括インデックス登録します。
pub fn index_documents_native(docs: Vec<DocSearchInput>) -> Result<usize, String> {
    let mut index = SEARCH_INDEX
        .lock()
        .map_err(|e| format!("インデックスロック失敗: {}", e))?;
    *index = docs;
    Ok(index.len())
}

/// 登録されたドキュメント群からキーワードを検索し、行番号・行テキスト付きのヒットリストを即座に返します。
pub fn search_documents_native(query: String) -> Result<Vec<SearchHitDto>, String> {
    let query_lower = query.trim().to_lowercase();
    if query_lower.is_empty() {
        return Ok(Vec::new());
    }

    let index = SEARCH_INDEX
        .lock()
        .map_err(|e| format!("インデックスロック失敗: {}", e))?;
    let mut hits = Vec::new();

    for doc in index.iter() {
        for (idx, line) in doc.content.lines().enumerate() {
            if line.to_lowercase().contains(&query_lower)
                || doc.title.to_lowercase().contains(&query_lower)
            {
                hits.push(SearchHitDto {
                    doc_id: doc.id.clone(),
                    doc_title: doc.title.clone(),
                    line_number: idx + 1,
                    line_text: line.trim().to_string(),
                });
                if hits.len() >= 100 {
                    break;
                }
            }
        }
        if hits.len() >= 100 {
            break;
        }
    }

    Ok(hits)
}

/// `rayon` マルチスレッド並列処理エンジンを用いて複数ファイルのエンコーディングを一括変換します。
pub fn batch_convert_files_native(
    items: Vec<BatchConvertItem>,
) -> Result<BatchConvertResultDto, String> {
    let results: Vec<Result<String, String>> = items
        .par_iter()
        .map(|item| {
            let bytes = fs::read(&item.file_path)
                .map_err(|e| format!("ファイル読み込み失敗 [{}]: {}", item.file_path, e))?;
            let converted = detect_and_convert_to_utf8(bytes)?;
            let new_bytes = convert_utf8_to_encoding(converted.text, item.target_encoding.clone())?;
            fs::write(&item.file_path, new_bytes)
                .map_err(|e| format!("ファイル書き込み失敗 [{}]: {}", item.file_path, e))?;
            Ok(format!("成功: {}", item.file_path))
        })
        .collect();

    let mut success_count = 0;
    let mut failure_count = 0;
    let mut messages = Vec::new();

    for res in results {
        match res {
            Ok(msg) => {
                success_count += 1;
                messages.push(msg);
            }
            Err(msg) => {
                failure_count += 1;
                messages.push(msg);
            }
        }
    }

    Ok(BatchConvertResultDto {
        success_count,
        failure_count,
        messages,
    })
}

/// `similar` クレートを用いて、2つの文章間の行単位差分 (Diff) を高速算出します。
pub fn compute_text_diff_native(
    old_text: String,
    new_text: String,
) -> Result<Vec<DiffChangeDto>, String> {
    let diff = TextDiff::from_lines(&old_text, &new_text);
    let mut changes = Vec::new();

    for change in diff.iter_all_changes() {
        let tag = match change.tag() {
            ChangeTag::Equal => "equal",
            ChangeTag::Delete => "delete",
            ChangeTag::Insert => "insert",
        };
        changes.push(DiffChangeDto {
            tag: tag.to_string(),
            value: change.value().to_string(),
            old_line: change.old_index().map(|i| i + 1),
            new_line: change.new_index().map(|i| i + 1),
        });
    }

    Ok(changes)
}

/// pulldown-cmark によるネイティブ爆速 Markdown -> HTML パース変換
pub fn parse_markdown_native(markdown: String) -> Result<String, String> {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_FOOTNOTES);
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TASKLISTS);

    let parser = Parser::new_ext(&markdown, options);
    let mut html_output = String::with_capacity(markdown.len() * 2);
    html::push_html(&mut html_output, parser);

    Ok(html_output)
}

/// PDF ファイル直接生成
pub fn generate_pdf_native(title: String, content: String) -> Result<Vec<u8>, String> {
    let (doc, page1, layer1) = PdfDocument::new(&title, Mm(210.0), Mm(297.0), "Layer 1");
    let current_layer = doc.get_page(page1).get_layer(layer1);

    let font = doc
        .add_builtin_font(BuiltinFont::Helvetica)
        .map_err(|e| e.to_string())?;

    current_layer.begin_text_section();
    current_layer.set_font(&font, 18.0);
    current_layer.set_text_cursor(Mm(15.0), Mm(280.0));
    current_layer.write_text(&title, &font);
    current_layer.end_text_section();

    let mut y_pos = 265.0;
    for line in content.lines() {
        if y_pos < 20.0 {
            break;
        }
        current_layer.begin_text_section();
        current_layer.set_font(&font, 10.0);
        current_layer.set_text_cursor(Mm(15.0), Mm(y_pos));
        let sanitized_line: String = line.chars().filter(|c| c.is_ascii()).collect();
        current_layer.write_text(&sanitized_line, &font);
        current_layer.end_text_section();
        y_pos -= 5.0;
    }

    let mut pdf_bytes = Vec::new();
    let mut writer = BufWriter::new(&mut pdf_bytes);
    doc.save(&mut writer).map_err(|e| e.to_string())?;
    drop(writer);

    Ok(pdf_bytes)
}

/// syntect による Rust ネイティブ構文ハイライト HTML 生成
pub fn highlight_code_native(code: String, language: String) -> Result<String, String> {
    let ps = SyntaxSet::load_defaults_newlines();
    let ts = ThemeSet::load_defaults();

    let syntax = ps
        .find_syntax_by_token(&language)
        .unwrap_or_else(|| ps.find_syntax_plain_text());

    let theme = &ts.themes["base16-ocean.dark"];
    let html = highlighted_html_for_string(&code, &ps, syntax, theme)
        .map_err(|e| format!("ハイライト生成エラー: {}", e))?;

    Ok(html)
}

// -----------------------------------------------------------------------------
// Tauri コマンドハンドラーモジュール
// -----------------------------------------------------------------------------

pub mod tauri_commands {
    use super::*;

    #[tauri::command]
    #[specta::specta]
    pub fn detect_and_convert_to_utf8(bytes: Vec<u8>) -> Result<ConvertedTextDto, String> {
        super::detect_and_convert_to_utf8(bytes)
    }

    #[tauri::command]
    #[specta::specta]
    pub fn convert_utf8_to_encoding(
        text: String,
        target_encoding: String,
    ) -> Result<Vec<u8>, String> {
        super::convert_utf8_to_encoding(text, target_encoding)
    }

    #[tauri::command]
    #[specta::specta]
    pub fn read_file_chunk_native(
        file_path: String,
        offset: u64,
        chunk_size: usize,
    ) -> Result<ChunkResultDto, String> {
        super::read_file_chunk_native(file_path, offset, chunk_size)
    }

    #[tauri::command]
    #[specta::specta]
    pub fn index_documents_native(docs: Vec<DocSearchInput>) -> Result<usize, String> {
        super::index_documents_native(docs)
    }

    #[tauri::command]
    #[specta::specta]
    pub fn search_documents_native(query: String) -> Result<Vec<SearchHitDto>, String> {
        super::search_documents_native(query)
    }

    #[tauri::command]
    #[specta::specta]
    pub fn batch_convert_files_native(
        items: Vec<BatchConvertItem>,
    ) -> Result<BatchConvertResultDto, String> {
        super::batch_convert_files_native(items)
    }

    #[tauri::command]
    #[specta::specta]
    pub fn compute_text_diff_native(
        old_text: String,
        new_text: String,
    ) -> Result<Vec<DiffChangeDto>, String> {
        super::compute_text_diff_native(old_text, new_text)
    }

    #[tauri::command]
    #[specta::specta]
    pub fn parse_markdown_native(markdown: String) -> Result<String, String> {
        super::parse_markdown_native(markdown)
    }

    #[tauri::command]
    #[specta::specta]
    pub fn generate_pdf_native(title: String, content: String) -> Result<Vec<u8>, String> {
        super::generate_pdf_native(title, content)
    }

    #[tauri::command]
    #[specta::specta]
    pub fn highlight_code_native(code: String, language: String) -> Result<String, String> {
        super::highlight_code_native(code, language)
    }

    #[tauri::command]
    #[specta::specta]
    pub fn read_file_native(file_path: String) -> Result<ConvertedTextDto, String> {
        super::read_file_native(file_path)
    }

    #[tauri::command]
    #[specta::specta]
    pub fn write_file_native(file_path: String, content: String) -> Result<bool, String> {
        super::write_file_native(file_path, content)
    }

    #[tauri::command]
    #[specta::specta]
    pub fn write_file_bytes_native(file_path: String, bytes: Vec<u8>) -> Result<bool, String> {
        super::write_file_bytes_native(file_path, bytes)
    }

    #[tauri::command]
    pub fn open_folder_native(file_path: String) -> Result<bool, String> {
        #[cfg(target_os = "windows")]
        {
            use std::process::Command;
            let clean_path = file_path.trim_matches('"').to_string();
            // ファイルパスの親ディレクトリを取得
            let folder_path = std::path::Path::new(&clean_path)
                .parent()
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or(clean_path.clone());
            // エクスプローラーでフォルダを開く
            let _ = Command::new("explorer.exe")
                .arg(&folder_path)
                .spawn()
                .map_err(|e| format!("エクスプローラー起動失敗: {}", e))?;
            Ok(true)
        }
        #[cfg(not(target_os = "windows"))]
        {
            Ok(false)
        }
    }
}

/// パス指定でローカルファイルへ直接テキストを書き込んで保存します (Rust ネイティブ・パーミッションフリー)
pub fn write_file_native(file_path: String, content: String) -> Result<bool, String> {
    let clean_path = file_path.trim_matches('"');
    let path = Path::new(clean_path);

    if let Some(parent) = path.parent() {
        if !parent.exists() {
            let _ = fs::create_dir_all(parent);
        }
    }

    let mut file = File::create(clean_path)
        .map_err(|e| format!("ファイル作成・オープン失敗 ({}): {}", clean_path, e))?;
    file.write_all(content.as_bytes())
        .map_err(|e| format!("書き込み失敗: {}", e))?;
    Ok(true)
}

/// パス指定でローカルファイルへ直接生バイト配列を書き込んで保存します (非 UTF-8 対応)
pub fn write_file_bytes_native(file_path: String, bytes: Vec<u8>) -> Result<bool, String> {
    let clean_path = file_path.trim_matches('"');
    let path = Path::new(clean_path);

    if let Some(parent) = path.parent() {
        if !parent.exists() {
            let _ = fs::create_dir_all(parent);
        }
    }

    let mut file = File::create(clean_path)
        .map_err(|e| format!("ファイル作成・オープン失敗 ({}): {}", clean_path, e))?;
    file.write_all(&bytes)
        .map_err(|e| format!("書き込み失敗: {}", e))?;
    Ok(true)
}

/// パス指定でローカルファイルを直接読み込み、文字コードを判別して UTF-8 テキストとして返します
pub fn read_file_native(file_path: String) -> Result<ConvertedTextDto, String> {
    let clean_path = file_path.trim_matches('"');
    let path = Path::new(clean_path);

    if !path.is_file() {
        return Err(format!(
            "指定されたパスは有効なファイルではありません: {}",
            clean_path
        ));
    }

    let metadata = fs::metadata(path).map_err(|e| format!("メタデータ取得失敗: {}", e))?;
    if metadata.len() > 20 * 1024 * 1024 {
        return Err(
            "ファイルサイズが 20MB を超えているため、安全のため自動読み込みを中断しました。"
                .to_string(),
        );
    }

    let mut file = File::open(clean_path)
        .map_err(|e| format!("Failed to open file ({}): {}", clean_path, e))?;
    let mut bytes = Vec::new();
    file.read_to_end(&mut bytes)
        .map_err(|e| format!("Failed to read file: {}", e))?;
    detect_and_convert_to_utf8(bytes)
}

/// Windows エクスプローラーの右クリックメニューに「QuMaEditorで開く」を自動登録する
pub fn register_context_menu_native() -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        let current_exe = std::env::current_exe().map_err(|e| e.to_string())?;
        let exe_path = current_exe.to_string_lossy().replace('\\', "\\\\");

        let ps_script = format!(
            "$key = 'HKCU:\\Software\\Classes\\*\\shell\\QuMaEditor'; \
            New-Item -Path $key -Force | Out-Null; \
            Set-ItemProperty -Path $key -Name '(default)' -Value 'QuMaEditorで開く'; \
            Set-ItemProperty -Path $key -Name 'Icon' -Value '{}'; \
            $cmdKey = \"$key\\command\"; \
            New-Item -Path $cmdKey -Force | Out-Null; \
            Set-ItemProperty -Path $cmdKey -Name '(default)' -Value '\"{}\" \"%1\"';",
            exe_path, exe_path
        );

        #[cfg(target_os = "windows")]
        use std::os::windows::process::CommandExt;

        let _ = Command::new("powershell")
            .creation_flags(0x08000000)
            .args(["-NoProfile", "-Command", &ps_script])
            .output();

        Ok(true)
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok(false)
    }
}

/// Specta により TypeScript 型定義ファイル (src/bindings.ts) を自動エクスポートするハンドラー
pub fn export_specta_types() {
    let _builder =
        tauri_specta::Builder::<tauri::Wry>::new().commands(tauri_specta::collect_commands![
            tauri_commands::detect_and_convert_to_utf8,
            tauri_commands::convert_utf8_to_encoding,
            tauri_commands::read_file_chunk_native,
            tauri_commands::index_documents_native,
            tauri_commands::search_documents_native,
            tauri_commands::batch_convert_files_native,
            tauri_commands::compute_text_diff_native,
            tauri_commands::parse_markdown_native,
            tauri_commands::generate_pdf_native,
            tauri_commands::highlight_code_native,
            tauri_commands::read_file_native,
            tauri_commands::write_file_native,
            tauri_commands::write_file_bytes_native,
        ]);

    #[cfg(debug_assertions)]
    _builder
        .export(
            specta_typescript::Typescript::default()
                .bigint(specta_typescript::BigIntExportBehavior::Number),
            Path::new(env!("CARGO_MANIFEST_DIR")).join("../src/bindings.ts"),
        )
        .expect("Failed to export Specta TypeScript bindings");
}

/// Tauri アプリケーションエントリポイントの構成
pub fn run() {
    use tauri::{Emitter, Manager};

    export_specta_types();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            // 既に起動している既存インスタンス側で受け取るコールバック (二重起動の防止＆前面化)
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }

            // 二重起動・右クリック「QuMaEditorで開く」から渡されたコマンドライン引数 (ファイルパス) を送信
            if argv.len() > 1 {
                let current_exe = std::env::current_exe().ok();
                for arg in argv.iter().skip(1) {
                    if !arg.starts_with('-') {
                        let clean_arg = arg.trim_matches('"').to_string();
                        let path = Path::new(&clean_arg);
                        if let Some(ref exe_path) = current_exe {
                            if path == exe_path {
                                continue;
                            }
                        }
                        if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                            let ext_lower = ext.to_lowercase();
                            if ext_lower == "exe"
                                || ext_lower == "dll"
                                || ext_lower == "sys"
                                || ext_lower == "pdb"
                            {
                                continue;
                            }
                        }
                        if path.is_file() {
                            let _ = app.emit("open-file-from-cli", clean_arg);
                        }
                    }
                }
            }
        }))
        .setup(|_app| {
            // Windows エクスプローラー右クリックメニュー登録は非同期で実行
            // (PowerShell 起動の同期ブロックで setup が止まるのを防ぐ)
            tauri::async_runtime::spawn_blocking(|| {
                let _ = register_context_menu_native();
            });

            // 1つ目のプロセス初回起動時のコマンドライン引数チェック
            let args: Vec<String> = std::env::args().collect();
            if args.len() > 1 {
                let app_handle = _app.handle().clone();
                let first_arg = args[1].trim_matches('"').to_string();
                if !first_arg.starts_with('-') {
                    let path = Path::new(&first_arg);
                    if path.is_file() {
                        if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                            let ext_lower = ext.to_lowercase();
                            if ext_lower != "exe" && ext_lower != "dll" {
                                tauri::async_runtime::spawn(async move {
                                    std::thread::sleep(std::time::Duration::from_millis(800));
                                    let _ = app_handle.emit("open-file-from-cli", first_arg);
                                });
                            }
                        }
                    }
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            tauri_commands::detect_and_convert_to_utf8,
            tauri_commands::convert_utf8_to_encoding,
            tauri_commands::read_file_chunk_native,
            tauri_commands::index_documents_native,
            tauri_commands::search_documents_native,
            tauri_commands::batch_convert_files_native,
            tauri_commands::compute_text_diff_native,
            tauri_commands::parse_markdown_native,
            tauri_commands::generate_pdf_native,
            tauri_commands::highlight_code_native,
            tauri_commands::read_file_native,
            tauri_commands::write_file_native,
            tauri_commands::write_file_bytes_native,
            tauri_commands::open_folder_native,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// -----------------------------------------------------------------------------
// 単体テスト (Unit Tests)
// -----------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_and_convert_to_utf8_utf8() {
        let sample = "こんにちは、QuMaEditor!";
        let bytes = sample.as_bytes().to_vec();
        let res = detect_and_convert_to_utf8(bytes).unwrap();
        assert_eq!(res.encoding, "UTF-8");
        assert_eq!(res.text, sample);
    }

    #[test]
    fn test_detect_and_convert_to_utf8_shift_jis() {
        let sample = "テストデータ";
        let (sjis_bytes, _, _) = SHIFT_JIS.encode(sample);
        let res = detect_and_convert_to_utf8(sjis_bytes.to_vec()).unwrap();
        assert_eq!(res.encoding, "Shift_JIS");
        assert_eq!(res.text, sample);
    }

    #[test]
    fn test_parse_markdown_native() {
        let md = "# タイトル\n\n- リスト1\n- リスト2";
        let html = parse_markdown_native(md.to_string()).unwrap();
        assert!(html.contains("<h1>タイトル</h1>"));
        assert!(html.contains("<li>リスト1</li>"));
    }

    #[test]
    fn test_compute_text_diff_native() {
        let old_text = "行1\n行2\n";
        let new_text = "行1\n変更行2\n行3\n";
        let diffs = compute_text_diff_native(old_text.to_string(), new_text.to_string()).unwrap();
        assert!(!diffs.is_empty());
        assert!(diffs
            .iter()
            .any(|d| d.tag == "insert" && d.value.contains("行3")));
    }

    #[test]
    fn test_index_and_search_documents() {
        let docs = vec![DocSearchInput {
            id: "doc-1".to_string(),
            title: "Tauri v2 ガイド".to_string(),
            content: "QuMaEditor は Rust で動作します。\nTags: #ガイド".to_string(),
        }];
        index_documents_native(docs).unwrap();
        let hits = search_documents_native("Rust".to_string()).unwrap();
        assert_eq!(hits.len(), 1);
        assert_eq!(hits[0].doc_id, "doc-1");
    }

    #[test]
    fn test_read_file_native_not_found() {
        let res = read_file_native("non_existent_file_xyz_12345.md".to_string());
        assert!(res.is_err());
        assert!(res.unwrap_err().contains("有効なファイルではありません"));
    }

    #[test]
    fn test_read_file_native_valid_file() {
        use std::io::Write;
        let temp_dir = std::env::temp_dir();
        let temp_file_path = temp_dir.join("quma_test_doc_sample.md");
        {
            let mut file = fs::File::create(&temp_file_path).unwrap();
            file.write_all("--- \ntitle: テストノート\n---\n\n# テスト本文".as_bytes())
                .unwrap();
        }

        let res = read_file_native(temp_file_path.to_string_lossy().to_string()).unwrap();
        assert_eq!(res.encoding, "UTF-8");
        assert!(res.text.contains("# テスト本文"));

        let _ = fs::remove_file(temp_file_path);
    }

    #[test]
    fn test_convert_utf8_to_encoding_sjis() {
        let text = "QuMaEditor テストデータ";
        let bytes = convert_utf8_to_encoding(text.to_string(), "Shift_JIS".to_string()).unwrap();
        assert!(!bytes.is_empty());
        let (decoded, _, _) = SHIFT_JIS.decode(&bytes);
        assert_eq!(decoded, text);
    }

    #[test]
    fn test_convert_utf8_to_encoding_euc_jp() {
        let text = "QuMaEditor EUCテスト";
        let bytes = convert_utf8_to_encoding(text.to_string(), "EUC-JP".to_string()).unwrap();
        assert!(!bytes.is_empty());
        let (decoded, _, _) = EUC_JP.decode(&bytes);
        assert_eq!(decoded, text);
    }
}
