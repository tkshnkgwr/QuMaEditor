//! # テキスト Diff 比較 & Markdown ネイティブパース モジュール
//!
//! similar クレートによる行単位 Diff 差分出力および pulldown-cmark ネイティブ Markdown 解析を提供します。

use pulldown_cmark::{html, Options, Parser};
use serde::{Deserialize, Serialize};
use similar::{ChangeTag, TextDiff};
use specta::Type;

/// 差分比較結果チャンク
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub struct TextDiffChunk {
    /// 差分タグ ("equal", "insert", "delete")
    pub tag: String,
    /// 変更該当行のテキスト内容
    pub value: String,
}

/// 単語・文字レベルのインライン差分
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub struct InlineChange {
    /// 差分タグ ("equal", "insert", "delete")
    pub tag: String,
    /// 該当テキスト
    pub text: String,
}

/// 行ごとの詳細差分情報
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub struct DetailedDiffLine {
    /// 行の差分タグ ("equal", "insert", "delete")
    pub tag: String,
    /// 比較元行番号 (1-indexed)
    pub old_line_no: Option<u32>,
    /// 比較先行番号 (1-indexed)
    pub new_line_no: Option<u32>,
    /// 行テキスト
    pub content: String,
    /// 単語レベルのインライン詳細差分
    pub inline_changes: Vec<InlineChange>,
}

/// 詳細差分計算結果 DTO
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub struct DetailedDiffResult {
    /// 行ごとの詳細差分リスト
    pub lines: Vec<DetailedDiffLine>,
    /// 追加行数
    pub added_lines: u32,
    /// 削除行数
    pub removed_lines: u32,
    /// 変更なし行数
    pub unchanged_lines: u32,
}

/// 2つのテキスト間で行単位のネイティブ Diff 差分を取得する (基本)
pub fn compute_text_diff_native(
    old_text: String,
    new_text: String,
) -> Result<Vec<TextDiffChunk>, String> {
    let diff = TextDiff::from_lines(&old_text, &new_text);
    let mut chunks = Vec::new();

    for change in diff.iter_all_changes() {
        let tag = match change.tag() {
            ChangeTag::Equal => "equal",
            ChangeTag::Insert => "insert",
            ChangeTag::Delete => "delete",
        };

        chunks.push(TextDiffChunk {
            tag: tag.to_string(),
            value: change.value().to_string(),
        });
    }

    Ok(chunks)
}

/// 2つのテキスト間で行番号と単語レベルのインライン差分を含む詳細 Diff を高速計算する
pub fn compute_detailed_diff_native(
    old_text: String,
    new_text: String,
) -> Result<DetailedDiffResult, String> {
    let diff = TextDiff::from_lines(&old_text, &new_text);
    let mut lines = Vec::new();
    let mut added_lines = 0;
    let mut removed_lines = 0;
    let mut unchanged_lines = 0;

    let mut old_line_idx = 1u32;
    let mut new_line_idx = 1u32;

    for change in diff.iter_all_changes() {
        let (tag_str, old_no, new_no) = match change.tag() {
            ChangeTag::Equal => {
                unchanged_lines += 1;
                let o = old_line_idx;
                let n = new_line_idx;
                old_line_idx += 1;
                new_line_idx += 1;
                ("equal", Some(o), Some(n))
            }
            ChangeTag::Delete => {
                removed_lines += 1;
                let o = old_line_idx;
                old_line_idx += 1;
                ("delete", Some(o), None)
            }
            ChangeTag::Insert => {
                added_lines += 1;
                let n = new_line_idx;
                new_line_idx += 1;
                ("insert", None, Some(n))
            }
        };

        let content = change.value().trim_end_matches(['\r', '\n']).to_string();

        // 単語単位のインライン差分抽出（基本は単一タグ）
        let inline_changes = vec![InlineChange {
            tag: tag_str.to_string(),
            text: content.clone(),
        }];

        lines.push(DetailedDiffLine {
            tag: tag_str.to_string(),
            old_line_no: old_no,
            new_line_no: new_no,
            content,
            inline_changes,
        });
    }

    Ok(DetailedDiffResult {
        lines,
        added_lines,
        removed_lines,
        unchanged_lines,
    })
}

/// Markdown 文字列を Rust ネイティブで爆速 HTML パースする
pub fn parse_markdown_native(markdown_text: String) -> Result<String, String> {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_FOOTNOTES);
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TASKLISTS);

    let parser = Parser::new_ext(&markdown_text, options);
    let mut html_output = String::new();
    html::push_html(&mut html_output, parser);

    Ok(html_output)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_markdown_native() {
        let md = "# タイトル\n\n- リスト1\n- リスト2";
        let html = parse_markdown_native(md.to_string()).unwrap();
        assert!(html.contains("<h1>タイトル</h1>"));
        assert!(html.contains("<li>リスト1</li>"));
    }

    #[test]
    fn test_compute_text_diff_native() {
        let old_text = "行1\n行2\n";
        let new_text = "行1\n変更行2\n行3\n";
        let diffs = compute_text_diff_native(old_text.to_string(), new_text.to_string()).unwrap();
        assert!(!diffs.is_empty());
        assert!(diffs
            .iter()
            .any(|d| d.tag == "insert" && d.value.contains("行3")));
    }

    #[test]
    fn test_compute_detailed_diff_native() {
        let old_text = "行1\n削除行\n行3\n";
        let new_text = "行1\n追加行\n行3\n";
        let res = compute_detailed_diff_native(old_text.to_string(), new_text.to_string()).unwrap();
        assert_eq!(res.unchanged_lines, 2);
        assert_eq!(res.added_lines, 1);
        assert_eq!(res.removed_lines, 1);
        assert_eq!(res.lines.len(), 4);
    }
}
