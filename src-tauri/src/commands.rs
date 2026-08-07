//! # Tauri IPC コマンドハンドラーモジュール
//!
//! フロントエンド (TypeScript) から呼び出される Tauri コマンド群を定義し Specta 型出力と連携します。

use crate::diff::{self, TextDiffChunk};
use crate::encoding::{self, EncodingDetectResult};
use crate::file_io::{self, FileChunkResult};
use crate::search::{self, DocSearchInput, SearchResult};

#[tauri::command]
#[specta::specta]
pub fn detect_and_convert_to_utf8(bytes: Vec<u8>) -> Result<EncodingDetectResult, String> {
    encoding::detect_and_convert_to_utf8(bytes)
}

#[tauri::command]
#[specta::specta]
pub fn convert_utf8_to_encoding(text: String, target_encoding: String) -> Result<Vec<u8>, String> {
    encoding::convert_utf8_to_encoding(text, target_encoding)
}

#[tauri::command]
#[specta::specta]
pub fn read_file_native(file_path: String) -> Result<EncodingDetectResult, String> {
    file_io::read_file_native(file_path)
}

#[tauri::command]
#[specta::specta]
pub fn read_file_chunk_native(
    file_path: String,
    offset: u32,
    length: u32,
) -> Result<FileChunkResult, String> {
    file_io::read_file_chunk_native(file_path, offset, length)
}

#[tauri::command]
#[specta::specta]
pub fn index_documents_native(docs: Vec<DocSearchInput>) -> Result<bool, String> {
    search::index_documents_native(docs)
}

#[tauri::command]
#[specta::specta]
pub fn search_documents_native(query: String) -> Result<Vec<SearchResult>, String> {
    search::search_documents_native(query)
}

#[tauri::command]
#[specta::specta]
pub fn parse_markdown_native(markdown_text: String) -> Result<String, String> {
    diff::parse_markdown_native(markdown_text)
}

#[tauri::command]
#[specta::specta]
pub fn compute_text_diff_native(
    old_text: String,
    new_text: String,
) -> Result<Vec<TextDiffChunk>, String> {
    diff::compute_text_diff_native(old_text, new_text)
}

#[tauri::command]
#[specta::specta]
pub fn write_file_bytes_native(file_path: String, bytes: Vec<u8>) -> Result<bool, String> {
    file_io::write_file_bytes_native(file_path, bytes)
}

#[tauri::command]
pub fn open_folder_native(file_path: String) -> Result<bool, String> {
    file_io::open_folder_native(file_path)
}
