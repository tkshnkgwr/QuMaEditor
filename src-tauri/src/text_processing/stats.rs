//! # テキスト統計解析サブモジュール
//!
//! 大容量ドキュメントに対するリアルタイム文字数、空白除外文字数、
//! CJK/英単語数、行数、読了予想時間の高速算出を提供します。

use serde::{Deserialize, Serialize};
use specta::Type;

/// テキスト詳細統計 DTO
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct TextStatsDto {
    /// 全文字数
    pub characters: u32,
    /// 空白・改行除外の文字数
    pub characters_no_space: u32,
    /// 単語数 (CJK文字 + 英単語)
    pub words: u32,
    /// 行数
    pub lines: u32,
    /// 読了予想時間 (分)
    pub reading_time_minutes: u32,
}

/// CJK 文字判定（ひらがな、カタカナ、CJK漢字、全角記号等）
#[inline]
pub fn is_cjk(c: char) -> bool {
    matches!(c,
        '\u{3040}'..='\u{309F}' | // Hiragana
        '\u{30A0}'..='\u{30FF}' | // Katakana
        '\u{3400}'..='\u{4DBF}' | // CJK Unified Ideographs Ext A
        '\u{4E00}'..='\u{9FFF}' | // CJK Unified Ideographs
        '\u{F900}'..='\u{FAFF}' | // CJK Compatibility Ideographs
        '\u{FF66}'..='\u{FF9F}'   // Halfwidth Katakana
    )
}

/// テキストのリアルタイム統計（文字数・単語数・行数等）をメモリ確保ゼロで高速算出する
///
/// # Arguments
/// * `text` - 統計計算対象のテキスト文字列
///
/// # Returns
/// * `Ok(TextStatsDto)` - 計算された統計情報
pub fn calculate_text_stats_native(text: String) -> Result<TextStatsDto, String> {
    let mut characters = 0u32;
    let mut characters_no_space = 0u32;
    let mut words = 0u32;
    let mut lines = if text.is_empty() { 1u32 } else { 0u32 };

    let mut in_ascii_word = false;

    for c in text.chars() {
        characters += 1;
        if !c.is_whitespace() {
            characters_no_space += 1;
        }

        if c == '\n' {
            lines += 1;
        }

        if is_cjk(c) {
            words += 1;
            in_ascii_word = false;
        } else if c.is_alphanumeric() || c == '_' {
            if !in_ascii_word {
                words += 1;
                in_ascii_word = true;
            }
        } else {
            in_ascii_word = false;
        }
    }

    if !text.is_empty() {
        lines += 1;
    }

    // 平均的な日本語読書速度（約400文字/分）
    let reading_time_minutes = std::cmp::max(1, characters_no_space.div_ceil(400));

    Ok(TextStatsDto {
        characters,
        characters_no_space,
        words,
        lines,
        reading_time_minutes,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_text_stats_native() {
        let text = "こんにちは World!\n2行目テスト";
        let stats = calculate_text_stats_native(text.to_string()).unwrap();
        assert_eq!(stats.lines, 2);
        assert!(stats.characters > 10);
        assert!(stats.words >= 4);
    }
}
