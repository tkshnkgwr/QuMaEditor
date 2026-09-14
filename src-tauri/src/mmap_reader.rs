//! # メモリマップドファイル (mmap) 高速ゼロコピー読込モジュール (MmapReader)
//!
//! `memmap2` クレートを使用し、OS の仮想メモリページキャッシュを直接利用することで、
//! GB 級の巨大テキストやログファイルでもヒープを浪費せず、0 秒で瞬時オープン＆部分参照を可能にします。

use memmap2::MmapOptions;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::fs::File;
use std::path::Path;

/// mmap チャンク読み込み結果 DTO
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub struct MmapChunkResult {
    /// 読み込まれたチャンク文字列データ
    pub chunk_text: String,
    /// ファイル全体の総バイトサイズ
    pub total_file_size: f64,
    /// 読み込み開始オフセット (バイト)
    pub loaded_offset: f64,
    /// 読み込まれた実バイト数
    pub loaded_length: u32,
    /// ファイル終端 (EOF) に達したか
    pub is_eof: bool,
}

/// メモリマップドファイルを用いて指定オフセット・長さのチャンクをゼロコピーで高速読み出し
pub fn mmap_read_file_chunk_native(
    file_path: String,
    offset: f64,
    length: u32,
) -> Result<MmapChunkResult, String> {
    let clean_path = file_path.trim_matches('"');
    let path = Path::new(clean_path);

    if !path.exists() || !path.is_file() {
        return Err(format!("有効なファイルではありません: {}", clean_path));
    }

    let file = File::open(path).map_err(|e| format!("ファイルオープン失敗: {}", e))?;
    let metadata = file
        .metadata()
        .map_err(|e| format!("メタデータ取得失敗: {}", e))?;
    let total_file_size = metadata.len() as f64;

    if total_file_size == 0.0 {
        return Ok(MmapChunkResult {
            chunk_text: String::new(),
            total_file_size: 0.0,
            loaded_offset: 0.0,
            loaded_length: 0,
            is_eof: true,
        });
    }

    let offset_u64 = offset.max(0.0) as u64;
    if offset_u64 >= metadata.len() {
        return Ok(MmapChunkResult {
            chunk_text: String::new(),
            total_file_size,
            loaded_offset: offset,
            loaded_length: 0,
            is_eof: true,
        });
    }

    // OS 仮想メモリへのゼロコピーマッピング
    let mmap = unsafe {
        MmapOptions::new()
            .map(&file)
            .map_err(|e| format!("メモリマップ作成失敗: {}", e))?
    };

    let start = offset_u64 as usize;
    let available_len = mmap.len().saturating_sub(start);
    let read_len = std::cmp::min(length as usize, available_len);
    let end = start + read_len;

    let slice = &mmap[start..end];
    let is_eof = end >= mmap.len();

    // UTF-8 文字列へデコード (不正なマルチバイト境界は置換)
    let chunk_text = String::from_utf8_lossy(slice).to_string();

    Ok(MmapChunkResult {
        chunk_text,
        total_file_size,
        loaded_offset: offset,
        loaded_length: read_len as u32,
        is_eof,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    #[test]
    fn test_mmap_read_file_chunk_native() {
        let temp_dir = std::env::temp_dir().join("quma_mmap_test");
        let _ = std::fs::create_dir_all(&temp_dir);
        let file_path = temp_dir.join("sample_mmap.txt");
        let path_str = file_path.to_string_lossy().to_string();

        {
            let mut file = File::create(&file_path).unwrap();
            file.write_all(b"Hello Memory-Mapped World! 0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZ")
                .unwrap();
        }

        // オフセット 0 から 12 バイト
        let res1 = mmap_read_file_chunk_native(path_str.clone(), 0.0, 12).unwrap();
        assert_eq!(res1.chunk_text, "Hello Memory");
        assert!(!res1.is_eof);
        assert!(res1.total_file_size > 0.0);

        // オフセット 6 から 13 バイト
        let res2 = mmap_read_file_chunk_native(path_str.clone(), 6.0, 13).unwrap();
        assert_eq!(res2.chunk_text, "Memory-Mapped");

        let _ = std::fs::remove_dir_all(&temp_dir);
    }
}
