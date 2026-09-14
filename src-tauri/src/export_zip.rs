//! # 複数ノート ZIP アーカイブ一括エクスポートモジュール (ExportZip)
//!
//! `zip` クレートを使用し、複数ドキュメントや埋め込み画像アセットを
//! 高速かつメモリ効率良く単一の ZIP アーカイブとして圧縮出力します。

use serde::{Deserialize, Serialize};
use specta::Type;
use std::fs::{self, File};
use std::io::Write;
use std::path::Path;
use zip::write::SimpleFileOptions;
use zip::CompressionMethod;
use zip::ZipWriter;

/// ZIP アーカイブ内に含めるエントリ DTO
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub struct ZipEntryInput {
    /// ZIP 内での相対ファイルパス (例: "notes/memo.md", "assets/diagram.png")
    pub file_path_in_zip: String,
    /// テキスト形式のコンテンツ (Markdown等)
    pub content_text: Option<String>,
    /// バイナリ形式のコンテンツ (画像や添付ファイル等)
    pub content_bytes: Option<Vec<u8>>,
}

/// 複数エントリを ZIP ファイルとして一括圧縮保存し、書き込みバイト数を返却する
pub fn export_notes_to_zip_native(
    output_zip_path: String,
    entries: Vec<ZipEntryInput>,
) -> Result<u32, String> {
    let clean_path = output_zip_path.trim_matches('"');
    let path = Path::new(clean_path);

    if let Some(parent) = path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| format!("ディレクトリ作成失敗: {}", e))?;
        }
    }

    let file = File::create(path).map_err(|e| format!("ZIP ファイル作成失敗: {}", e))?;
    let mut zip = ZipWriter::new(file);
    let options = SimpleFileOptions::default()
        .compression_method(CompressionMethod::Deflated)
        .unix_permissions(0o644);

    for entry in entries {
        let entry_path = entry.file_path_in_zip.trim_start_matches(['/', '\\']);
        if entry_path.is_empty() {
            continue;
        }

        zip.start_file(entry_path, options)
            .map_err(|e| format!("ZIP エントリ作成失敗 ({}): {}", entry_path, e))?;

        if let Some(text) = entry.content_text {
            zip.write_all(text.as_bytes())
                .map_err(|e| format!("ZIP エントリ書き込み失敗 ({}): {}", entry_path, e))?;
        } else if let Some(bytes) = entry.content_bytes {
            zip.write_all(&bytes)
                .map_err(|e| format!("ZIP バイナリ書き込み失敗 ({}): {}", entry_path, e))?;
        }
    }

    zip.finish()
        .map_err(|e| format!("ZIP アーカイブのクローズ失敗: {}", e))?;

    let meta = fs::metadata(path).map_err(|e| format!("ZIP メタデータ取得失敗: {}", e))?;
    Ok(meta.len() as u32)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_export_notes_to_zip_native() {
        let temp_dir = std::env::temp_dir().join("quma_test_zip_dir");
        let _ = fs::create_dir_all(&temp_dir);
        let zip_file_path = temp_dir.join("test_export.zip");
        let zip_path_str = zip_file_path.to_string_lossy().to_string();

        let entries = vec![
            ZipEntryInput {
                file_path_in_zip: "doc1.md".to_string(),
                content_text: Some("# 第一ノート\n本文テキスト".to_string()),
                content_bytes: None,
            },
            ZipEntryInput {
                file_path_in_zip: "sub/doc2.md".to_string(),
                content_text: Some("# 第二ノート\nサブフォルダ内".to_string()),
                content_bytes: None,
            },
            ZipEntryInput {
                file_path_in_zip: "data.bin".to_string(),
                content_text: None,
                content_bytes: Some(vec![1, 2, 3, 4, 5]),
            },
        ];

        let size = export_notes_to_zip_native(zip_path_str, entries).unwrap();
        assert!(size > 0);
        assert!(zip_file_path.exists());

        // ZIP を展開して検証
        let file = File::open(&zip_file_path).unwrap();
        let mut archive = zip::ZipArchive::new(file).unwrap();
        assert_eq!(archive.len(), 3);
        assert!(archive.by_name("doc1.md").is_ok());
        assert!(archive.by_name("sub/doc2.md").is_ok());
        assert!(archive.by_name("data.bin").is_ok());

        let _ = fs::remove_dir_all(&temp_dir);
    }
}
