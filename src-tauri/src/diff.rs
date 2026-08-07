//! # テキスト Diff 比較 & Markdown ネイティブパース モジュール
//!
//! similar クレートによる行単位 Diff 差分出力および pulldown-cmark ネイティブ Markdown 解析を提供します。

use pulldown_cmark::{html, Options, Parser};
use serde::{Deserialize, Serialize};
use similar::{ChangeTag, TextDiff};
use specta::Type;

/// 差分比較結果チャンク
#[derive(Debug, Serialize, Deserialize, Type)]
pub struct TextDiffChunk {
    /// 差分タグ ("equal", "insert", "delete")
    pub tag: String,
    /// 変更該当行のテキスト内容
    pub value: String,
}

/// 2つのテキスト間で行単位のネィティブ Diff 差分を取得する
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
}
