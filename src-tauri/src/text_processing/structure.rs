//! # Markdown 構造解析・操作サブモジュール
//!
//! 見出し目次ツリー (H1〜H6) の抽出および GFM タスクリスト項目の状態トグルを提供します。

use pulldown_cmark::{Event, HeadingLevel, Options, Parser, Tag, TagEnd};
use serde::{Deserialize, Serialize};
use specta::Type;

/// 見出し（アウトライン）抽出結果 DTO
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct HeadingItemDto {
    /// 見出しレベル (1〜6)
    pub level: u8,
    /// 見出しテキスト
    pub text: String,
    /// 該当行番号 (1-indexed)
    pub line_number: u32,
}

/// Markdown から見出し (H1〜H6) のアウトライン目次を高速抽出する
///
/// # Arguments
/// * `markdown_text` - 解析対象の Markdown 文字列
///
/// # Returns
/// * `Ok(Vec<HeadingItemDto>)` - 抽出された見出し要素一覧
pub fn extract_headings_native(markdown_text: String) -> Result<Vec<HeadingItemDto>, String> {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_TASKLISTS);

    // 行開始のバイトインデックスを事前構築して O(log N) で行番号を引けるように最適化
    let line_starts: Vec<usize> = std::iter::once(0)
        .chain(markdown_text.match_indices('\n').map(|(i, _)| i + 1))
        .collect();

    let get_line_number = |byte_offset: usize| -> u32 {
        match line_starts.binary_search(&byte_offset) {
            Ok(line_idx) => (line_idx + 1) as u32,
            Err(line_idx) => line_idx as u32,
        }
    };

    let parser = Parser::new_ext(&markdown_text, options).into_offset_iter();
    let mut headings = Vec::new();

    let mut current_heading_level: Option<u8> = None;
    let mut current_heading_start_line = 1u32;
    let mut current_heading_text = String::new();

    for (event, range) in parser {
        match event {
            Event::Start(Tag::Heading { level, .. }) => {
                let lvl = match level {
                    HeadingLevel::H1 => 1,
                    HeadingLevel::H2 => 2,
                    HeadingLevel::H3 => 3,
                    HeadingLevel::H4 => 4,
                    HeadingLevel::H5 => 5,
                    HeadingLevel::H6 => 6,
                };
                current_heading_level = Some(lvl);
                current_heading_start_line = get_line_number(range.start);
                current_heading_text.clear();
            }
            Event::Text(text) | Event::Code(text) => {
                if current_heading_level.is_some() {
                    current_heading_text.push_str(&text);
                }
            }
            Event::End(TagEnd::Heading(_)) => {
                if let Some(lvl) = current_heading_level.take() {
                    let trimmed = current_heading_text.trim().to_string();
                    if !trimmed.is_empty() {
                        headings.push(HeadingItemDto {
                            level: lvl,
                            text: trimmed,
                            line_number: current_heading_start_line,
                        });
                    }
                }
            }
            _ => {}
        }
    }

    Ok(headings)
}

/// 指定インデックスのタスクチェック状態を高速トグルする
///
/// 状態遷移: `[ ]` (未完了) -> `[/]` (進行中) -> `[x]` (完了) -> `[ ]` (未完了)
///
/// # Arguments
/// * `markdown_text` - 対象 Markdown 文字列
/// * `target_index` - トグル対象タスクの出現インデックス (0-indexed)
///
/// # Returns
/// * `Ok(String)` - トグル反映後の Markdown 文字列
pub fn toggle_task_native(markdown_text: String, target_index: u32) -> Result<String, String> {
    let mut current_idx = 0u32;
    let mut result = String::with_capacity(markdown_text.len());

    for line in markdown_text.lines() {
        let trimmed = line.trim_start();
        if trimmed.starts_with("- [ ] ")
            || trimmed.starts_with("- [/] ")
            || trimmed.starts_with("- [x] ")
            || trimmed.starts_with("- [X] ")
            || trimmed.starts_with("* [ ] ")
            || trimmed.starts_with("* [/] ")
            || trimmed.starts_with("* [x] ")
            || trimmed.starts_with("+ [ ] ")
            || trimmed.starts_with("+ [/] ")
            || trimmed.starts_with("+ [x] ")
        {
            if current_idx == target_index {
                let indent_len = line.len() - trimmed.len();
                let indent = &line[..indent_len];
                let bullet = &trimmed[..1];
                let content = &trimmed[6..];

                let new_state = if trimmed.chars().nth(3) == Some(' ') {
                    "/" // 未完了 -> 進行中
                } else if trimmed.chars().nth(3) == Some('/') {
                    "x" // 進行中 -> 完了
                } else {
                    " " // 完了 -> 未完了
                };

                result.push_str(indent);
                result.push_str(bullet);
                result.push_str(" [");
                result.push_str(new_state);
                result.push_str("] ");
                result.push_str(content);
                result.push('\n');
            } else {
                result.push_str(line);
                result.push('\n');
            }
            current_idx += 1;
        } else {
            result.push_str(line);
            result.push('\n');
        }
    }

    if result.ends_with('\n') && !markdown_text.ends_with('\n') {
        result.pop();
    }

    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_headings_native() {
        let md = "# 見出し1\n本文1\n本文2\n## 見出し2\n\n### 見出し3";
        let headings = extract_headings_native(md.to_string()).unwrap();
        assert_eq!(headings.len(), 3);
        assert_eq!(headings[0].level, 1);
        assert_eq!(headings[0].text, "見出し1");
        assert_eq!(headings[0].line_number, 1);

        assert_eq!(headings[1].level, 2);
        assert_eq!(headings[1].text, "見出し2");
        assert_eq!(headings[1].line_number, 4);

        assert_eq!(headings[2].level, 3);
        assert_eq!(headings[2].text, "見出し3");
        assert_eq!(headings[2].line_number, 6);
    }

    #[test]
    fn test_toggle_task_native() {
        let md = "- [ ] タスクA\n- [x] タスクB";
        let toggled = toggle_task_native(md.to_string(), 0).unwrap();
        assert!(toggled.contains("- [/] タスクA"));

        let toggled2 = toggle_task_native(toggled, 0).unwrap();
        assert!(toggled2.contains("- [x] タスクA"));
    }
}
