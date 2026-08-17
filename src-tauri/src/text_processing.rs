//! # ネイティブ テキスト処理・統計・YAML解析モジュール
//!
//! 大容量ドキュメントに対する高速統計計算、YAML Front Matter パース、
//! 見出しアウトライン抽出、タスク状態トグル、HTML 完全エクスポートを提供します。

use pulldown_cmark::{html, Event, HeadingLevel, Options, Parser, Tag, TagEnd};
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

/// YAML Front Matter パース結果 DTO
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct ParsedYamlDocResult {
    /// Front Matter を除外した Markdown 本文
    pub body: String,
    /// タイトル
    pub title: Option<String>,
    /// 作成者
    pub author: Option<String>,
    /// 作成日時
    pub created: Option<String>,
    /// 更新日時
    pub updated: Option<String>,
    /// 更新者
    pub updated_by: Option<String>,
    /// 文字コード
    pub encoding: Option<String>,
    /// タグ一覧
    pub tags: Vec<String>,
}

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

/// CSV プレビュー解析結果 DTO
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct CsvPreviewDto {
    /// ヘッダー列（1行目）
    pub headers: Vec<String>,
    /// プレビュー用データ行一覧
    pub rows: Vec<Vec<String>>,
    /// 総行数
    pub total_lines: u32,
    /// 最大列数
    pub total_cols: u32,
    /// 実際にプレビュー表示した行数
    pub displayed_lines: u32,
}

/// CJK 文字判定（ひらがな、カタカナ、CJK漢字、全角記号等）
#[inline]
fn is_cjk(c: char) -> bool {
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

    if !text.is_empty() && !text.ends_with('\n') {
        lines += 1;
    } else if text.ends_with('\n') {
        // 末尾が改行で終わっている場合も行数カウントを調整
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

/// YAML Front Matter と本文を高速分離・パースする
pub fn parse_yaml_front_matter_native(full_text: String) -> Result<ParsedYamlDocResult, String> {
    let normalized = full_text.replace("\r\n", "\n");

    if !normalized.starts_with("---\n") {
        return Ok(ParsedYamlDocResult {
            body: full_text,
            title: None,
            author: None,
            created: None,
            updated: None,
            updated_by: None,
            encoding: None,
            tags: Vec::new(),
        });
    }

    let rest = &normalized[4..];
    if let Some(end_idx) = rest.find("\n---\n") {
        let yaml_str = &rest[..end_idx];
        let body = rest[end_idx + 5..].trim_start_matches('\n').to_string();

        let yaml_val: serde_yaml::Value =
            serde_yaml::from_str(yaml_str).unwrap_or(serde_yaml::Value::Null);

        let mut title = None;
        let mut author = None;
        let mut created = None;
        let mut updated = None;
        let mut updated_by = None;
        let mut encoding = None;
        let mut tags = Vec::new();

        if let serde_yaml::Value::Mapping(map) = yaml_val {
            for (k, v) in map {
                if let serde_yaml::Value::String(key_str) = k {
                    match key_str.as_str() {
                        "title" => title = v.as_str().map(|s| s.to_string()),
                        "author" => author = v.as_str().map(|s| s.to_string()),
                        "created" => created = v.as_str().map(|s| s.to_string()),
                        "updated" => updated = v.as_str().map(|s| s.to_string()),
                        "updatedBy" | "updated_by" => {
                            updated_by = v.as_str().map(|s| s.to_string())
                        }
                        "encoding" => encoding = v.as_str().map(|s| s.to_string()),
                        "tags" => {
                            if let serde_yaml::Value::Sequence(tag_seq) = v {
                                for t in tag_seq {
                                    if let Some(tag_str) = t.as_str() {
                                        tags.push(tag_str.to_string());
                                    }
                                }
                            }
                        }
                        _ => {}
                    }
                }
            }
        }

        Ok(ParsedYamlDocResult {
            body,
            title,
            author,
            created,
            updated,
            updated_by,
            encoding,
            tags,
        })
    } else {
        Ok(ParsedYamlDocResult {
            body: full_text,
            title: None,
            author: None,
            created: None,
            updated: None,
            updated_by: None,
            encoding: None,
            tags: Vec::new(),
        })
    }
}

/// Markdown から見出し (H1〜H6) のアウトライン目次を高速抽出する
pub fn extract_headings_native(markdown_text: String) -> Result<Vec<HeadingItemDto>, String> {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_TASKLISTS);

    let parser = Parser::new_ext(&markdown_text, options);
    let mut headings = Vec::new();

    let mut current_heading_level: Option<u8> = None;
    let mut current_heading_text = String::new();

    for event in parser {
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
                            line_number: 1, // 行番号はフロントまたは行走査で補正
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
                } else if trimmed.chars().nth(3) == Some('/') || trimmed.chars().nth(3) == Some('-')
                {
                    "x" // 進行中 -> 完了
                } else {
                    " " // 完了 -> 未完了
                };

                result.push_str(&format!("{}{} [{}] {}", indent, bullet, new_state, content));
            } else {
                result.push_str(line);
            }
            current_idx += 1;
        } else {
            result.push_str(line);
        }
        result.push('\n');
    }

    if !markdown_text.ends_with('\n') && result.ends_with('\n') {
        result.pop();
    }

    Ok(result)
}

/// 完全なスタンドアロン HTML ドキュメントを Rust ネイティブで高速エクスポートする
pub fn export_html_full_native(
    title: String,
    markdown_text: String,
    is_dark: bool,
) -> Result<String, String> {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_FOOTNOTES);
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TASKLISTS);

    let parser = Parser::new_ext(&markdown_text, options);
    let mut body_html = String::new();
    html::push_html(&mut body_html, parser);

    let bg_color = if is_dark { "#0f172a" } else { "#ffffff" };
    let text_color = if is_dark { "#e2e8f0" } else { "#0f172a" };
    let border_color = if is_dark { "#334155" } else { "#e2e8f0" };
    let code_bg = if is_dark { "#1e293b" } else { "#f8fafc" };

    let full_html = format!(
        r#"<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{}</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: {};
      color: {};
      line-height: 1.6;
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
    }}
    h1, h2, h3, h4, h5, h6 {{
      border-bottom: 1px solid {};
      padding-bottom: 0.3em;
    }}
    pre {{
      background: {};
      padding: 1rem;
      border-radius: 6px;
      overflow-x: auto;
    }}
    code {{
      font-family: Consolas, Monaco, 'Courier New', monospace;
      background: {};
      padding: 0.2em 0.4em;
      border-radius: 4px;
    }}
    table {{
      border-collapse: collapse;
      width: 100%;
      margin: 1rem 0;
    }}
    th, td {{
      border: 1px solid {};
      padding: 0.5rem 1rem;
      text-align: left;
    }}
    blockquote {{
      border-left: 4px solid #0284c7;
      margin: 1rem 0;
      padding-left: 1rem;
      color: #64748b;
    }}
  </style>
</head>
<body>
  {}
</body>
</html>"#,
        title, bg_color, text_color, border_color, code_bg, code_bg, border_color, body_html
    );

    Ok(full_html)
}

/// 簡易 CSV 行パース（クォート "..." 考慮）
fn parse_csv_line(line: &str) -> Vec<String> {
    let mut cols = Vec::new();
    let mut current = String::new();
    let mut in_quotes = false;
    let mut chars = line.chars().peekable();

    while let Some(c) = chars.next() {
        match c {
            '"' => {
                if in_quotes && chars.peek() == Some(&'"') {
                    // エスケープされたダブルクォート ("")
                    chars.next();
                    current.push('"');
                } else {
                    in_quotes = !in_quotes;
                }
            }
            ',' if !in_quotes => {
                cols.push(current.trim().to_string());
                current.clear();
            }
            _ => {
                current.push(c);
            }
        }
    }
    cols.push(current.trim().to_string());
    cols
}

/// CSV データを高速解析し、プレビュー用サマリーと統計を返却する
pub fn parse_csv_preview_native(content: String, max_rows: u32) -> Result<CsvPreviewDto, String> {
    let mut total_lines = 0u32;
    let mut rows = Vec::new();
    let mut headers = Vec::new();
    let mut total_cols = 0u32;

    for (idx, line) in content.lines().enumerate() {
        total_lines += 1;
        if (idx as u32) < max_rows + 1 {
            let cols = parse_csv_line(line);
            if idx == 0 {
                total_cols = cols.len() as u32;
                headers = cols;
            } else {
                total_cols = total_cols.max(cols.len() as u32);
                rows.push(cols);
            }
        }
    }

    let displayed_lines = rows.len() as u32;

    Ok(CsvPreviewDto {
        headers,
        rows,
        total_lines,
        total_cols,
        displayed_lines,
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

    #[test]
    fn test_parse_csv_preview_native() {
        let csv = "ID,名前,部署,\"備考,補足\"\n1,山田,開発,\"特記事項, なし\"\n2,田中,営業,通常\n3,佐藤,人事,中途採用";
        let preview = parse_csv_preview_native(csv.to_string(), 2).unwrap();
        assert_eq!(preview.total_lines, 4);
        assert_eq!(preview.displayed_lines, 2);
        assert_eq!(preview.headers, vec!["ID", "名前", "部署", "備考,補足"]);
        assert_eq!(preview.rows.len(), 2);
        assert_eq!(preview.rows[0][3], "特記事項, なし");
    }

    #[test]
    fn test_parse_yaml_front_matter_native() {
        let md = "---\ntitle: \"テスト文書\"\nauthor: \"山田太郎\"\ntags: [\"rust\", \"tauri\"]\n---\n\n# 本文タイトル";
        let parsed = parse_yaml_front_matter_native(md.to_string()).unwrap();
        assert_eq!(parsed.title.as_deref(), Some("テスト文書"));
        assert_eq!(parsed.author.as_deref(), Some("山田太郎"));
        assert_eq!(parsed.tags, vec!["rust", "tauri"]);
        assert!(parsed.body.contains("# 本文タイトル"));
    }

    #[test]
    fn test_extract_headings_native() {
        let md = "# 大見出し\nテキスト\n## 中見出し\n### 小見出し";
        let headings = extract_headings_native(md.to_string()).unwrap();
        assert_eq!(headings.len(), 3);
        assert_eq!(headings[0].level, 1);
        assert_eq!(headings[0].text, "大見出し");
        assert_eq!(headings[1].level, 2);
        assert_eq!(headings[2].level, 3);
    }

    #[test]
    fn test_toggle_task_native() {
        let md = "- [ ] タスク1\n- [x] タスク2";
        let toggled = toggle_task_native(md.to_string(), 0).unwrap();
        assert!(toggled.contains("- [/] タスク1"));

        let toggled_again = toggle_task_native(toggled, 0).unwrap();
        assert!(toggled_again.contains("- [x] タスク1"));
    }

    #[test]
    fn test_export_html_full_native() {
        let md = "# タイトル\n\n**太字本文**";
        let html =
            export_html_full_native("ドキュメント".to_string(), md.to_string(), true).unwrap();
        assert!(html.contains("<!DOCTYPE html>"));
        assert!(html.contains("<h1>タイトル</h1>"));
        assert!(html.contains("<strong>太字本文</strong>"));
    }
}
