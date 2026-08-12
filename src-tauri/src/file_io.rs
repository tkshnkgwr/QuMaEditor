//! # ネイティブファイル I/O モジュール
//!
//! 大容量ファイルのチャンクストリーミング読み込み、ネイティブ書き込み、親フォルダオープン機能を提供します。

use crate::encoding::{detect_and_convert_to_utf8, EncodingDetectResult};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::fs::{self, File};
use std::io::{Read, Seek, SeekFrom};
use std::path::Path;

/// チャンク読み込み結果構造体
#[derive(Debug, Serialize, Deserialize, Type)]
pub struct FileChunkResult {
    /// 読み込まれたチャンク文字列データ
    pub chunk_text: String,
    /// 全体サイズ (バイト)
    pub total_bytes: u32,
    /// 次回読み込み用オフセット (バイト)
    pub next_offset: u32,
    /// 読み込みが完了したかどうか
    pub is_eof: bool,
}

/// ファイルパスを指定してテキスト本文と文字エンコーディングを取得する
pub fn read_file_native(file_path: String) -> Result<EncodingDetectResult, String> {
    let clean_path = file_path.trim_matches('"');
    let path = Path::new(clean_path);

    if !path.exists() || !path.is_file() {
        return Err(format!("有効なファイルではありません: {}", path.display()));
    }

    let bytes = fs::read(path).map_err(|e| format!("ファイル読み込み失敗: {}", e))?;
    detect_and_convert_to_utf8(bytes)
}

/// 大容量ファイルを指定したオフセットとサイズで部分読み込みする
pub fn read_file_chunk_native(
    file_path: String,
    offset: u32,
    length: u32,
) -> Result<FileChunkResult, String> {
    let clean_path = file_path.trim_matches('"');
    let path = Path::new(clean_path);

    let mut file = File::open(path).map_err(|e| format!("ファイルオープン失敗: {}", e))?;
    let total_bytes = file
        .metadata()
        .map_err(|e| format!("メタデータ取得失敗: {}", e))?
        .len() as u32;

    if offset >= total_bytes {
        return Ok(FileChunkResult {
            chunk_text: String::new(),
            total_bytes,
            next_offset: total_bytes,
            is_eof: true,
        });
    }

    file.seek(SeekFrom::Start(offset as u64))
        .map_err(|e| format!("シーク失敗: {}", e))?;

    let read_size = std::cmp::min(length, total_bytes - offset);
    let mut buffer = vec![0u8; read_size as usize];
    file.read_exact(&mut buffer)
        .map_err(|e| format!("チャンク読み込み失敗: {}", e))?;

    let is_eof = (offset + read_size) >= total_bytes;
    let next_offset = offset + read_size;
    let chunk_text = String::from_utf8_lossy(&buffer).to_string();

    Ok(FileChunkResult {
        chunk_text,
        total_bytes,
        next_offset,
        is_eof,
    })
}

/// バイト配列を指定されたパスへ直書き保存する
pub fn write_file_bytes_native(file_path: String, bytes: Vec<u8>) -> Result<bool, String> {
    let clean_path = file_path.trim_matches('"');
    let path = Path::new(clean_path);

    if let Some(parent) = path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| format!("ディレクトリ作成失敗: {}", e))?;
        }
    }

    fs::write(path, bytes).map_err(|e| format!("ファイル書き込み失敗: {}", e))?;
    Ok(true)
}

/// 指定ファイルが存在する場合は選択ハイライト表示で親フォルダをエクスプローラーで開く (Windows)
pub fn open_folder_native(file_path: String) -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        #[cfg(target_os = "windows")]
        use std::os::windows::process::CommandExt;
        use std::process::Command;

        let clean_path = file_path.trim_matches('"').to_string();
        let path_obj = Path::new(&clean_path);

        if path_obj.exists() && path_obj.is_file() {
            let select_arg = format!("/select,{}", clean_path);
            let _ = Command::new("explorer.exe")
                .creation_flags(0x08000000)
                .arg(&select_arg)
                .spawn()
                .map_err(|e| format!("エクスプローラー起動失敗: {}", e))?;
        } else {
            let folder_path = path_obj
                .parent()
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or(clean_path.clone());

            let _ = Command::new("explorer.exe")
                .creation_flags(0x08000000)
                .arg(&folder_path)
                .spawn()
                .map_err(|e| format!("エクスプローラー起動失敗: {}", e))?;
        }
        Ok(true)
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok(false)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    #[test]
    fn test_read_file_native_not_found() {
        let res = read_file_native("non_existent_file_xyz_12345.md".to_string());
        assert!(res.is_err());
        assert!(res.unwrap_err().contains("有効なファイルではありません"));
    }

    #[test]
    fn test_read_file_native_valid_file() {
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
    fn test_write_file_bytes_native() {
        let temp_dir = std::env::temp_dir();
        let temp_file_path = temp_dir.join("quma_test_write_bytes.txt");
        let path_str = temp_file_path.to_string_lossy().to_string();
        let sample_bytes = b"Hello QuMaEditor Bytes Test".to_vec();

        let res = write_file_bytes_native(path_str.clone(), sample_bytes).unwrap();
        assert!(res);
        let read_back = fs::read_to_string(&temp_file_path).unwrap();
        assert_eq!(read_back, "Hello QuMaEditor Bytes Test");

        let _ = fs::remove_file(temp_file_path);
    }

    #[test]
    fn test_open_folder_native() {
        let temp_dir = std::env::temp_dir();
        let temp_file_path = temp_dir.join("quma_test_folder_open.txt");
        let path_str = temp_file_path.to_string_lossy().to_string();

        let res = open_folder_native(path_str).unwrap();
        assert!(res);
    }
}
