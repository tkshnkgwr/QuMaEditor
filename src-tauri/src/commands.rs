//! # Tauri IPC コマンドハンドラーモジュール
//!
//! フロントエンド (TypeScript) から呼び出される Tauri コマンド群を定義し Specta 型出力と連携します。

use crate::diff::{self, TextDiffChunk};
use crate::encoding::{self, EncodingDetectResult};
use crate::file_io::{self, FileChunkResult, FileMetadataDto};
use crate::search::{self, DocSearchInput, SearchResult};
use crate::text_processing::{
    self, CsvPreviewDto, HeadingItemDto, ParsedYamlDocResult, TextStatsDto,
};

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

/// 指定ファイルパスへ生バイト列を直接書き込み保存する
#[tauri::command]
#[specta::specta]
pub fn write_file_bytes_native(file_path: String, bytes: Vec<u8>) -> Result<bool, String> {
    file_io::write_file_bytes_native(file_path, bytes)
}

/// 指定ファイルパスへ UTF-8 テキスト文字列を直接書き込み保存する
#[tauri::command]
#[specta::specta]
pub fn write_file_native(file_path: String, content: String) -> Result<bool, String> {
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

/// CSV データを高速解析し、プレビュー用サマリーと統計を返却する
#[tauri::command]
#[specta::specta]
pub fn parse_csv_preview_native(content: String, max_rows: u32) -> Result<CsvPreviewDto, String> {
    text_processing::parse_csv_preview_native(content, max_rows)
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

/// 指定ファイルの親フォルダをエクスプローラーで選択表示して開く (Windows)
#[tauri::command]
pub fn open_folder_native(file_path: String) -> Result<bool, String> {
    file_io::open_folder_native(file_path)
}
