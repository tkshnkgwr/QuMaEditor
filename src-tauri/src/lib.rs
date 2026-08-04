use encoding_rs::{EUC_JP, SHIFT_JIS, UTF_8};
use printpdf::*;
use pulldown_cmark::{html, Options, Parser};
use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use similar::{ChangeTag, TextDiff};
use std::fs::{self, File};
use std::io::{BufWriter, Read, Seek, SeekFrom};
use std::path::Path;
use std::sync::{LazyLock, Mutex};
use syntect::highlighting::ThemeSet;
use syntect::html::highlighted_html_for_string;
use syntect::parsing::SyntaxSet;

// -----------------------------------------------------------------------------
// DTO 定義
// -----------------------------------------------------------------------------

#[derive(Debug, Serialize, Deserialize)]
pub struct ConvertedTextDto {
    pub text: String,
    pub encoding: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChunkResultDto {
    pub content: String,
    pub has_more: bool,
    pub total_size: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DocSearchInput {
    pub id: String,
    pub title: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SearchHitDto {
    pub doc_id: String,
    pub doc_title: String,
    pub line_number: usize,
    pub line_text: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BatchConvertItem {
    pub file_path: String,
    pub target_encoding: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BatchConvertResultDto {
    pub success_count: usize,
    pub failure_count: usize,
    pub messages: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DiffChangeDto {
    pub tag: String, // "insert", "delete", "equal"
    pub value: String,
    pub old_line: Option<usize>,
    pub new_line: Option<usize>,
}

// -----------------------------------------------------------------------------
// 全文検索インデックス (Rust 1.80+ 標準 LazyLock)
// -----------------------------------------------------------------------------
static SEARCH_INDEX: LazyLock<Mutex<Vec<DocSearchInput>>> =
    LazyLock::new(|| Mutex::new(Vec::new()));

// -----------------------------------------------------------------------------
// Tauri コマンド群
// -----------------------------------------------------------------------------

/// 文字コードの爆速判定＆UTF-8文字列変換 (encoding_rs)
#[tauri::command]
fn detect_and_convert_to_utf8(bytes: Vec<u8>) -> Result<ConvertedTextDto, String> {
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

    let text = String::from_utf8_lossy(&bytes).into_owned();
    Ok(ConvertedTextDto {
        text,
        encoding: "UTF-8".to_string(),
    })
}

/// UTF-8文字列を指定エンコーディングのバイナリデータへ変換
#[tauri::command]
fn convert_utf8_to_encoding(text: String, encoding: String) -> Result<Vec<u8>, String> {
    let normalized_text = match encoding.as_str() {
        "Shift_JIS" => text.replace("\r\n", "\n").replace('\n', "\r\n"),
        _ => text.replace("\r\n", "\n"),
    };

    let encoder = match encoding.as_str() {
        "Shift_JIS" => SHIFT_JIS,
        "EUC-JP" => EUC_JP,
        _ => UTF_8,
    };

    let (bytes, _, _) = encoder.encode(&normalized_text);
    Ok(bytes.into_owned())
}

/// 1. 大容量ファイル (10MB以上) のストリーミング読み込み
#[tauri::command]
fn read_file_chunk_native(
    file_path: String,
    offset: u64,
    chunk_size: usize,
) -> Result<ChunkResultDto, String> {
    let path = Path::new(&file_path);
    let metadata = fs::metadata(path).map_err(|e| e.to_string())?;
    let total_size = metadata.len();

    let mut file = File::open(path).map_err(|e| e.to_string())?;
    file.seek(SeekFrom::Start(offset))
        .map_err(|e| e.to_string())?;

    let mut buffer = vec![0u8; chunk_size];
    let bytes_read = file.read(&mut buffer).map_err(|e| e.to_string())?;
    buffer.truncate(bytes_read);

    let (text, _, _) = UTF_8.decode(&buffer);
    let has_more = offset + (bytes_read as u64) < total_size;

    Ok(ChunkResultDto {
        content: text.into_owned(),
        has_more,
        total_size,
    })
}

/// 2-A. ドキュメント群をリアルタイム検索インデックスに登録
#[tauri::command]
fn index_documents_native(docs: Vec<DocSearchInput>) -> Result<usize, String> {
    let mut index = SEARCH_INDEX.lock().map_err(|e| e.to_string())?;
    *index = docs;
    Ok(index.len())
}

/// 2-B. リアルタイム全文検索
#[tauri::command]
fn search_documents_native(query: String) -> Result<Vec<SearchHitDto>, String> {
    let query_lower = query.to_lowercase();
    if query_lower.trim().is_empty() {
        return Ok(Vec::new());
    }

    let index = SEARCH_INDEX.lock().map_err(|e| e.to_string())?;
    let mut results = Vec::new();

    for doc in index.iter() {
        for (idx, line) in doc.content.lines().enumerate() {
            if line.to_lowercase().contains(&query_lower) {
                results.push(SearchHitDto {
                    doc_id: doc.id.clone(),
                    doc_title: doc.title.clone(),
                    line_number: idx + 1,
                    line_text: line.trim().to_string(),
                });
                if results.len() >= 200 {
                    break;
                }
            }
        }
    }

    Ok(results)
}

/// 3. 複数ファイルの一括文字コード変換 (rayon による並列処理)
#[tauri::command]
fn batch_convert_files_native(
    file_paths: Vec<String>,
    target_encoding: String,
    output_dir: Option<String>,
) -> Result<BatchConvertResultDto, String> {
    let success_counter = Mutex::new(0);
    let failure_counter = Mutex::new(0);
    let messages = Mutex::new(Vec::new());

    file_paths.par_iter().for_each(|file_path_str| {
        let path = Path::new(file_path_str);
        if !path.exists() || !path.is_file() {
            let mut msgs = messages.lock().unwrap();
            let mut fail = failure_counter.lock().unwrap();
            *fail += 1;
            msgs.push(format!("ファイルが存在しません: {}", file_path_str));
            return;
        }

        match fs::read(path) {
            Ok(bytes) => {
                let (decoded_text, _, _) = UTF_8.decode(&bytes);

                let normalized_text = match target_encoding.as_str() {
                    "Shift_JIS" => decoded_text.replace("\r\n", "\n").replace('\n', "\r\n"),
                    _ => decoded_text.replace("\r\n", "\n"),
                };

                let encoder = match target_encoding.as_str() {
                    "Shift_JIS" => SHIFT_JIS,
                    "EUC-JP" => EUC_JP,
                    _ => UTF_8,
                };

                let (encoded_bytes, _, _) = encoder.encode(&normalized_text);

                let dest_path = if let Some(ref out_dir) = output_dir {
                    let filename = path.file_name().unwrap_or_default();
                    Path::new(out_dir).join(filename)
                } else {
                    path.to_path_buf()
                };

                match fs::write(&dest_path, encoded_bytes) {
                    Ok(_) => {
                        let mut succ = success_counter.lock().unwrap();
                        *succ += 1;
                    }
                    Err(e) => {
                        let mut fail = failure_counter.lock().unwrap();
                        let mut msgs = messages.lock().unwrap();
                        *fail += 1;
                        msgs.push(format!("書き込み失敗 ({}): {}", file_path_str, e));
                    }
                }
            }
            Err(e) => {
                let mut fail = failure_counter.lock().unwrap();
                let mut msgs = messages.lock().unwrap();
                *fail += 1;
                msgs.push(format!("読み込み失敗 ({}): {}", file_path_str, e));
            }
        }
    });

    let succ = *success_counter.lock().unwrap();
    let fail = *failure_counter.lock().unwrap();
    let msgs = messages.lock().unwrap().clone();

    Ok(BatchConvertResultDto {
        success_count: succ,
        failure_count: fail,
        messages: msgs,
    })
}

/// 4. タブ間・バージョン間のリアルタイム Text Diff 高速計算 (similar)
#[tauri::command]
fn compute_text_diff_native(
    old_text: String,
    new_text: String,
) -> Result<Vec<DiffChangeDto>, String> {
    let diff = TextDiff::from_lines(&old_text, &new_text);
    let mut changes = Vec::new();

    for change in diff.iter_all_changes() {
        let tag = match change.tag() {
            ChangeTag::Delete => "delete",
            ChangeTag::Insert => "insert",
            ChangeTag::Equal => "equal",
        };

        changes.push(DiffChangeDto {
            tag: tag.to_string(),
            value: change.value().to_string(),
            old_line: change.old_index(),
            new_line: change.new_index(),
        });
    }

    Ok(changes)
}

/// 大容量ドキュメントリアルタイムMarkdown構文解析 (pulldown-cmark)
#[tauri::command]
fn parse_markdown_native(markdown: String) -> Result<String, String> {
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

/// ブラウザ非依存のネイティブ PDF バイナリ直接生成 (printpdf)
#[tauri::command]
fn generate_pdf_native(title: String, content: String) -> Result<Vec<u8>, String> {
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

/// Rust ネイティブ構文ハイライト生成 (syntect)
#[tauri::command]
fn highlight_code_native(code: String, language: String) -> Result<String, String> {
    let ps = SyntaxSet::load_defaults_newlines();
    let ts = ThemeSet::load_defaults();

    let syntax = ps
        .find_syntax_by_token(&language)
        .unwrap_or_else(|| ps.find_syntax_plain_text());

    let theme = &ts.themes["base16-ocean.dark"];
    let html = highlighted_html_for_string(&code, &ps, syntax, theme).map_err(|e| e.to_string())?;

    Ok(html)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![
            detect_and_convert_to_utf8,
            convert_utf8_to_encoding,
            read_file_chunk_native,
            index_documents_native,
            search_documents_native,
            batch_convert_files_native,
            compute_text_diff_native,
            parse_markdown_native,
            generate_pdf_native,
            highlight_code_native
        ])
        .setup(|_app| Ok(()))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
