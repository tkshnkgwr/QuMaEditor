//! # Tauri IPC コマンドハンドラーモジュール
//!
//! フロントエンド (TypeScript) から呼び出される Tauri コマンド群を定義し Specta 型出力と連携します。

use crate::diff::{self, TextDiffChunk};
use crate::encoding::{self, EncodingDetectResult};
use crate::file_io::{self, FileChunkResult, FileMetadataDto, FileWriteResultDto};
use crate::search::{self, DocSearchInput, SearchResult};
use crate::text_processing::{self, HeadingItemDto, ParsedYamlDocResult, TextStatsDto};

/// バイト配列から文字コード（UTF-8, Shift_JIS, EUC-JP）を自動判別し UTF-8 文字列へ変換する
#[tauri::command]
#[specta::specta]
pub fn detect_and_convert_to_utf8(bytes: Vec<u8>) -> Result<EncodingDetectResult, String> {
    encoding::detect_and_convert_to_utf8(bytes)
}

/// UTF-8 文字列を指定された文字エンコーディングのバイト列に変換する
#[tauri::command]
#[specta::specta]
pub fn convert_utf8_to_encoding(text: String, target_encoding: String) -> Result<Vec<u8>, String> {
    encoding::convert_utf8_to_encoding(text, target_encoding)
}

/// ファイルパスを指定してテキスト本文と文字エンコーディングを高速読込する
#[tauri::command]
#[specta::specta]
pub fn read_file_native(file_path: String) -> Result<EncodingDetectResult, String> {
    file_io::read_file_native(file_path)
}

/// 指定ファイルパスのメタデータ（存在有無、最終更新日時mtime、サイズ）を超軽量に取得する
#[tauri::command]
#[specta::specta]
pub fn get_file_metadata_native(file_path: String) -> Result<FileMetadataDto, String> {
    file_io::get_file_metadata_native(file_path)
}

/// 大容量ファイルを指定オフセットと長さで部分チャンク読込する
#[tauri::command]
#[specta::specta]
pub fn read_file_chunk_native(
    file_path: String,
    offset: u32,
    length: u32,
) -> Result<FileChunkResult, String> {
    file_io::read_file_chunk_native(file_path, offset, length)
}

/// 全文検索用ドキュメントインデックスを一括登録・更新する
#[tauri::command]
#[specta::specta]
pub fn index_documents_native(docs: Vec<DocSearchInput>) -> Result<bool, String> {
    search::index_documents_native(docs)
}

/// インデックス登録済みドキュメントに対してキーワード全文検索を実行する
#[tauri::command]
#[specta::specta]
pub fn search_documents_native(query: String) -> Result<Vec<SearchResult>, String> {
    search::search_documents_native(query)
}

/// pulldown-cmark による Markdown から HTML への高速変換を実行する
#[tauri::command]
#[specta::specta]
pub fn parse_markdown_native(markdown_text: String) -> Result<String, String> {
    diff::parse_markdown_native(markdown_text)
}

/// 2つのテキスト文字列間の行単位・単語単位リアルタイム差分 (Diff) を計算する
#[tauri::command]
#[specta::specta]
pub fn compute_text_diff_native(
    old_text: String,
    new_text: String,
) -> Result<Vec<TextDiffChunk>, String> {
    diff::compute_text_diff_native(old_text, new_text)
}

/// 指定ファイルパスへ生バイト列を直接書き込み保存し、保存直後の mtime を返す
#[tauri::command]
#[specta::specta]
pub fn write_file_bytes_native(
    file_path: String,
    bytes: Vec<u8>,
) -> Result<FileWriteResultDto, String> {
    file_io::write_file_bytes_native(file_path, bytes)
}

/// 指定ファイルパスへ UTF-8 テキスト文字列を直接書き込み保存し、保存直後の mtime を返す
#[tauri::command]
#[specta::specta]
pub fn write_file_native(file_path: String, content: String) -> Result<FileWriteResultDto, String> {
    file_io::write_file_native(file_path, content)
}

/// テキストのリアルタイム統計（文字数、単語数、行数、読了時間）を高速計算する
#[tauri::command]
#[specta::specta]
pub fn calculate_text_stats_native(text: String) -> Result<TextStatsDto, String> {
    text_processing::calculate_text_stats_native(text)
}

/// Markdown の YAML Front Matter と本文を高速分離・パースする
#[tauri::command]
#[specta::specta]
pub fn parse_yaml_front_matter_native(full_text: String) -> Result<ParsedYamlDocResult, String> {
    text_processing::parse_yaml_front_matter_native(full_text)
}

/// Markdown から H1〜H6 見出し（目次アウトラインツリー）を高速抽出する
#[tauri::command]
#[specta::specta]
pub fn extract_headings_native(markdown_text: String) -> Result<Vec<HeadingItemDto>, String> {
    text_processing::extract_headings_native(markdown_text)
}

/// 指定インデックスのタスク項目チェックボックス状態をトグル/巡回置換する
#[tauri::command]
#[specta::specta]
pub fn toggle_task_native(markdown_text: String, target_index: u32) -> Result<String, String> {
    text_processing::toggle_task_native(markdown_text, target_index)
}

/// パース済み Markdown とスタイルシートを埋め込んだスタンドアロン完全 HTML を生成する
#[tauri::command]
#[specta::specta]
pub fn export_html_full_native(
    title: String,
    markdown_text: String,
    is_dark: bool,
) -> Result<String, String> {
    text_processing::export_html_full_native(title, markdown_text, is_dark)
}

/// Markdown ドキュメントの高速ネイティブ自動整形（空行圧縮・見出し空行・表組み垂直整列）を実行する
#[tauri::command]
#[specta::specta]
pub fn format_markdown_native(markdown_text: String) -> Result<String, String> {
    text_processing::format_markdown_native(markdown_text)
}

/// syntect による構文ハイライト付きネイティブ HTML をレンダリングする
#[tauri::command]
#[specta::specta]
pub fn render_markdown_html_native(markdown_text: String, is_dark: bool) -> Result<String, String> {
    text_processing::render_markdown_html_native(markdown_text, is_dark)
}

/// 指定ファイルパスへ生バイト列をアトミックに書き込み保存し、保存直後の mtime を返す
#[tauri::command]
#[specta::specta]
pub fn atomic_write_file_bytes_native(
    file_path: String,
    bytes: Vec<u8>,
) -> Result<FileWriteResultDto, String> {
    file_io::atomic_write_file_bytes_native(file_path, bytes)
}

/// 指定ファイルパスへ UTF-8 テキスト文字列をアトミックに書き込み保存し、保存直後の mtime を返す
#[tauri::command]
#[specta::specta]
pub fn atomic_write_file_native(
    file_path: String,
    content: String,
) -> Result<FileWriteResultDto, String> {
    file_io::atomic_write_file_native(file_path, content)
}

/// ワークスペースディレクトリを走査し rayon 並列で高速全文検索を行う
#[tauri::command]
#[specta::specta]
pub fn search_workspace_dir_native(
    dir_path: String,
    query: String,
    extensions: Vec<String>,
) -> Result<Vec<SearchResult>, String> {
    search::search_workspace_dir_native(dir_path, query, extensions)
}

/// Rope バッファを初期化する
#[tauri::command]
#[specta::specta]
pub fn rope_init_buffer(id: String, text: String) -> Result<crate::rope_buffer::RopeInfo, String> {
    crate::rope_buffer::rope_init_buffer(id, text)
}

/// Rope バッファの情報を取得する
#[tauri::command]
#[specta::specta]
pub fn rope_get_info(id: String) -> Result<Option<crate::rope_buffer::RopeInfo>, String> {
    crate::rope_buffer::rope_get_info(id)
}

/// Rope バッファから指定文字範囲の文字列を取得する
#[tauri::command]
#[specta::specta]
pub fn rope_get_text_range(id: String, start_char: u32, end_char: u32) -> Result<String, String> {
    crate::rope_buffer::rope_get_text_range(id, start_char, end_char)
}

/// Rope バッファから指定行範囲の文字列を取得する
#[tauri::command]
#[specta::specta]
pub fn rope_get_lines(id: String, start_line: u32, end_line: u32) -> Result<String, String> {
    crate::rope_buffer::rope_get_lines(id, start_line, end_line)
}

/// Rope バッファの指定位置に文字列を挿入する
#[tauri::command]
#[specta::specta]
pub fn rope_insert_text(
    id: String,
    char_index: u32,
    text: String,
) -> Result<crate::rope_buffer::RopeInfo, String> {
    crate::rope_buffer::rope_insert_text(id, char_index, text)
}

/// Rope バッファの指定範囲の文字列を削除する
#[tauri::command]
#[specta::specta]
pub fn rope_remove_text(
    id: String,
    start_char: u32,
    end_char: u32,
) -> Result<crate::rope_buffer::RopeInfo, String> {
    crate::rope_buffer::rope_remove_text(id, start_char, end_char)
}

/// Rope バッファの全文を取得する
#[tauri::command]
#[specta::specta]
pub fn rope_get_entire_text(id: String) -> Result<String, String> {
    crate::rope_buffer::rope_get_entire_text(id)
}

/// Rope バッファを破棄する
#[tauri::command]
#[specta::specta]
pub fn rope_drop_buffer(id: String) -> Result<bool, String> {
    crate::rope_buffer::rope_drop_buffer(id)
}

/// ファイル同期マネージャーにファイルと mtime を登録する
#[tauri::command]
#[specta::specta]
pub fn sync_register_file(file_path: String, mtime_ms: f64) -> Result<bool, String> {
    crate::sync_manager::sync_register_file(file_path, mtime_ms)
}

/// 自プロセスによる保存開始をマークする
#[tauri::command]
#[specta::specta]
pub fn sync_begin_save(file_path: String) -> Result<bool, String> {
    crate::sync_manager::sync_begin_save(file_path)
}

/// 自プロセスによる保存完了を記録する
#[tauri::command]
#[specta::specta]
pub fn sync_finish_save(file_path: String, mtime_ms: f64) -> Result<bool, String> {
    crate::sync_manager::sync_finish_save(file_path, mtime_ms)
}

/// 自プロセスが保存中または直後かを判定する
#[tauri::command]
#[specta::specta]
pub fn sync_is_self_saving(file_path: String, window_ms: f64) -> Result<bool, String> {
    crate::sync_manager::sync_is_self_saving(file_path, window_ms)
}

/// ネイティブファイル監視を開始する
#[tauri::command]
#[specta::specta]
pub fn watch_file_native(app_handle: tauri::AppHandle, file_path: String) -> Result<bool, String> {
    crate::file_watcher::watch_file_native(app_handle, file_path)
}

/// ネイティブファイル監視を解除する
#[tauri::command]
#[specta::specta]
pub fn unwatch_file_native(file_path: String) -> Result<bool, String> {
    crate::file_watcher::unwatch_file_native(file_path)
}

/// すべてのネイティブファイル監視を解除する
#[tauri::command]
#[specta::specta]
pub fn unwatch_all_native() -> Result<bool, String> {
    crate::file_watcher::unwatch_all_native()
}

/// 指定ファイルの親フォルダをエクスプローラーで選択表示して開く (Windows)
#[tauri::command]
#[specta::specta]
pub fn open_folder_native(file_path: String) -> Result<bool, String> {
    file_io::open_folder_native(file_path)
}

/// 2つのテキスト間で行番号と単語レベルのインライン差分を含む詳細 Diff を高速計算する
#[tauri::command]
#[specta::specta]
pub fn compute_detailed_diff_native(
    old_text: String,
    new_text: String,
) -> Result<crate::diff::DetailedDiffResult, String> {
    crate::diff::compute_detailed_diff_native(old_text, new_text)
}

/// 複数ノートと画像アセットを一括で ZIP アーカイブに圧縮エクスポートする
#[tauri::command]
#[specta::specta]
pub fn export_notes_to_zip_native(
    output_zip_path: String,
    entries: Vec<crate::export_zip::ZipEntryInput>,
) -> Result<u32, String> {
    crate::export_zip::export_notes_to_zip_native(output_zip_path, entries)
}

/// Markdown ドキュメントの日本語校正および記法 lint をバックグラウンド高速実行する
#[tauri::command]
#[specta::specta]
pub fn lint_markdown_document_native(
    content: String,
) -> Result<Vec<crate::proofreading::ProofreadingIssue>, String> {
    crate::proofreading::lint_markdown_document_native(content)
}

/// Mermaid コードブロックの構文事前検証と SHA-256 ハッシュ計算を行う
#[tauri::command]
#[specta::specta]
pub fn validate_mermaid_syntax_native(
    code: String,
) -> Result<crate::mermaid_validator::MermaidValidationResult, String> {
    crate::mermaid_validator::validate_mermaid_syntax_native(code)
}

/// メモリマップドファイル (mmap) を用いて超巨大ファイルの指定オフセット・長さをゼロコピーで高速読み出し
#[tauri::command]
#[specta::specta]
pub fn mmap_read_file_chunk_native(
    file_path: String,
    offset: f64,
    length: u32,
) -> Result<crate::mmap_reader::MmapChunkResult, String> {
    crate::mmap_reader::mmap_read_file_chunk_native(file_path, offset, length)
}

/// ワークスペースディレクトリを .gitignore 準拠で並列高速走査し、ファイルツリーを構築する
#[tauri::command]
#[specta::specta]
pub fn scan_workspace_tree_native(
    root_dir: String,
    max_depth: u32,
) -> Result<crate::workspace_scanner::WorkspaceTreeNode, String> {
    crate::workspace_scanner::scan_workspace_tree_native(root_dir, max_depth)
}
