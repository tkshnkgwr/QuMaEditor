//! # 大容量編集用 Rope データ構造モジュール (RopeBuffer)
//!
//! `ropey` クレートを利用し、巨大なファイル（数十MB〜数百MB規模）でも
//! メモリ断片化やコピーコストを抑え、$O(\log N)$ での挿入・削除・行スライス抽出を実現します。

use ropey::Rope;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::HashMap;
use std::sync::{LazyLock, Mutex};

/// Rope バッファのメタ情報 DTO
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub struct RopeInfo {
    /// バッファ識別子（ファイルパスやUUIDなど）
    pub id: String,
    /// 総文字数 (Unicode scalar / chars)
    pub total_chars: u32,
    /// 総行数
    pub total_lines: u32,
    /// 総バイト数
    pub total_bytes: u32,
}

/// インメモリ Rope バッファマネージャー
pub struct RopeBufferManager {
    buffers: HashMap<String, Rope>,
}

impl Default for RopeBufferManager {
    fn default() -> Self {
        Self::new()
    }
}

impl RopeBufferManager {
    pub fn new() -> Self {
        Self {
            buffers: HashMap::new(),
        }
    }

    /// テキストから Rope バッファを初期化または上書き
    pub fn init_buffer(&mut self, id: &str, text: &str) -> RopeInfo {
        let rope = Rope::from_str(text);
        let info = RopeInfo {
            id: id.to_string(),
            total_chars: rope.len_chars() as u32,
            total_lines: rope.len_lines() as u32,
            total_bytes: rope.len_bytes() as u32,
        };
        self.buffers.insert(id.to_string(), rope);
        info
    }

    /// バッファ情報を取得
    pub fn get_info(&self, id: &str) -> Option<RopeInfo> {
        self.buffers.get(id).map(|rope| RopeInfo {
            id: id.to_string(),
            total_chars: rope.len_chars() as u32,
            total_lines: rope.len_lines() as u32,
            total_bytes: rope.len_bytes() as u32,
        })
    }

    /// 文字範囲を指定して文字列をスライス取得 (start_char .. end_char)
    pub fn get_text_range(
        &self,
        id: &str,
        start_char: u32,
        end_char: u32,
    ) -> Result<String, String> {
        let rope = self
            .buffers
            .get(id)
            .ok_or_else(|| format!("バッファが見つかりません: {}", id))?;

        let total_chars = rope.len_chars();
        let start = start_char as usize;
        if start > total_chars {
            return Ok(String::new());
        }
        let end = std::cmp::min(end_char as usize, total_chars);
        if start >= end {
            return Ok(String::new());
        }

        let slice = rope.slice(start..end);
        Ok(slice.to_string())
    }

    /// 行範囲を指定して文字列を取得 (start_line .. end_line)
    pub fn get_lines(&self, id: &str, start_line: u32, end_line: u32) -> Result<String, String> {
        let rope = self
            .buffers
            .get(id)
            .ok_or_else(|| format!("バッファが見つかりません: {}", id))?;

        let total_lines = rope.len_lines();
        let start = start_line as usize;
        if start >= total_lines {
            return Ok(String::new());
        }
        let end = std::cmp::min(end_line as usize, total_lines);
        if start >= end {
            return Ok(String::new());
        }

        let start_char = rope.line_to_char(start);
        let end_char = if end >= total_lines {
            rope.len_chars()
        } else {
            rope.line_to_char(end)
        };

        let slice = rope.slice(start_char..end_char);
        Ok(slice.to_string())
    }

    /// 指定位置に文字列を挿入
    pub fn insert_text(
        &mut self,
        id: &str,
        char_index: u32,
        text: &str,
    ) -> Result<RopeInfo, String> {
        let rope = self
            .buffers
            .get_mut(id)
            .ok_or_else(|| format!("バッファが見つかりません: {}", id))?;

        let total_chars = rope.len_chars();
        let idx = std::cmp::min(char_index as usize, total_chars);
        rope.insert(idx, text);

        Ok(RopeInfo {
            id: id.to_string(),
            total_chars: rope.len_chars() as u32,
            total_lines: rope.len_lines() as u32,
            total_bytes: rope.len_bytes() as u32,
        })
    }

    /// 指定範囲の文字列を削除 (start_char .. end_char)
    pub fn remove_text(
        &mut self,
        id: &str,
        start_char: u32,
        end_char: u32,
    ) -> Result<RopeInfo, String> {
        let rope = self
            .buffers
            .get_mut(id)
            .ok_or_else(|| format!("バッファが見つかりません: {}", id))?;

        let total_chars = rope.len_chars();
        let start = start_char as usize;
        if start < total_chars {
            let end = std::cmp::min(end_char as usize, total_chars);
            if start < end {
                rope.remove(start..end);
            }
        }

        Ok(RopeInfo {
            id: id.to_string(),
            total_chars: rope.len_chars() as u32,
            total_lines: rope.len_lines() as u32,
            total_bytes: rope.len_bytes() as u32,
        })
    }

    /// 全文を取得
    pub fn get_entire_text(&self, id: &str) -> Result<String, String> {
        let rope = self
            .buffers
            .get(id)
            .ok_or_else(|| format!("バッファが見つかりません: {}", id))?;
        Ok(rope.to_string())
    }

    /// バッファを破棄
    pub fn drop_buffer(&mut self, id: &str) -> bool {
        self.buffers.remove(id).is_some()
    }
}

/// グローバルな RopeBufferManager シングルトン
static ROPE_MANAGER: LazyLock<Mutex<RopeBufferManager>> =
    LazyLock::new(|| Mutex::new(RopeBufferManager::new()));

/// バッファを初期化
pub fn rope_init_buffer(id: String, text: String) -> Result<RopeInfo, String> {
    let mut mgr = ROPE_MANAGER
        .lock()
        .map_err(|e| format!("Ropeマネージャーロック失敗: {}", e))?;
    Ok(mgr.init_buffer(&id, &text))
}

/// バッファ情報を取得
pub fn rope_get_info(id: String) -> Result<Option<RopeInfo>, String> {
    let mgr = ROPE_MANAGER
        .lock()
        .map_err(|e| format!("Ropeマネージャーロック失敗: {}", e))?;
    Ok(mgr.get_info(&id))
}

/// 指定文字範囲を取得
pub fn rope_get_text_range(id: String, start_char: u32, end_char: u32) -> Result<String, String> {
    let mgr = ROPE_MANAGER
        .lock()
        .map_err(|e| format!("Ropeマネージャーロック失敗: {}", e))?;
    mgr.get_text_range(&id, start_char, end_char)
}

/// 指定行範囲を取得
pub fn rope_get_lines(id: String, start_line: u32, end_line: u32) -> Result<String, String> {
    let mgr = ROPE_MANAGER
        .lock()
        .map_err(|e| format!("Ropeマネージャーロック失敗: {}", e))?;
    mgr.get_lines(&id, start_line, end_line)
}

/// 指定位置に挿入
pub fn rope_insert_text(id: String, char_index: u32, text: String) -> Result<RopeInfo, String> {
    let mut mgr = ROPE_MANAGER
        .lock()
        .map_err(|e| format!("Ropeマネージャーロック失敗: {}", e))?;
    mgr.insert_text(&id, char_index, &text)
}

/// 指定範囲を削除
pub fn rope_remove_text(id: String, start_char: u32, end_char: u32) -> Result<RopeInfo, String> {
    let mut mgr = ROPE_MANAGER
        .lock()
        .map_err(|e| format!("Ropeマネージャーロック失敗: {}", e))?;
    mgr.remove_text(&id, start_char, end_char)
}

/// 全文を取得
pub fn rope_get_entire_text(id: String) -> Result<String, String> {
    let mgr = ROPE_MANAGER
        .lock()
        .map_err(|e| format!("Ropeマネージャーロック失敗: {}", e))?;
    mgr.get_entire_text(&id)
}

/// バッファを破棄
pub fn rope_drop_buffer(id: String) -> Result<bool, String> {
    let mut mgr = ROPE_MANAGER
        .lock()
        .map_err(|e| format!("Ropeマネージャーロック失敗: {}", e))?;
    Ok(mgr.drop_buffer(&id))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rope_manager_operations() {
        let mut mgr = RopeBufferManager::new();
        let id = "test_doc";
        let initial = "Line 1\nLine 2\nLine 3\nLine 4";

        let info = mgr.init_buffer(id, initial);
        assert_eq!(info.total_lines, 4);
        assert_eq!(info.total_chars, initial.chars().count() as u32);

        // スライス取得
        let range = mgr.get_text_range(id, 0, 6).unwrap();
        assert_eq!(range, "Line 1");

        // 行範囲取得 (1行目と2行目: 0..2)
        let lines = mgr.get_lines(id, 0, 2).unwrap();
        assert_eq!(lines, "Line 1\nLine 2\n");

        // 挿入
        mgr.insert_text(id, 6, " (Added)").unwrap();
        let updated = mgr.get_text_range(id, 0, 14).unwrap();
        assert_eq!(updated, "Line 1 (Added)");

        // 削除
        mgr.remove_text(id, 6, 14).unwrap();
        let restored = mgr.get_text_range(id, 0, 6).unwrap();
        assert_eq!(restored, "Line 1");

        // 全文取得
        let entire = mgr.get_entire_text(id).unwrap();
        assert_eq!(entire, initial);

        // バッファ破棄
        assert!(mgr.drop_buffer(id));
        assert!(mgr.get_info(id).is_none());
    }
}
