//! # HTML レンダリング・エクスポートサブモジュール
//!
//! syntect によるプログラミング言語ネイティブ構文ハイライト、
//! Mermaid ブロック抽出保護、GFM タスクリスト/テーブル変換、
//! 完全スタンドアロン HTML エクスポート機能を提供します。

use pulldown_cmark::{html, CodeBlockKind, Event, Options, Parser, Tag, TagEnd};
use std::sync::OnceLock;
use syntect::easy::HighlightLines;
use syntect::highlighting::ThemeSet;
use syntect::html::{styled_line_to_highlighted_html, IncludeBackground};
use syntect::parsing::SyntaxSet;

static SYNTAX_SET: OnceLock<SyntaxSet> = OnceLock::new();
static THEME_SET: OnceLock<ThemeSet> = OnceLock::new();

fn get_syntax_set() -> &'static SyntaxSet {
    SYNTAX_SET.get_or_init(SyntaxSet::load_defaults_newlines)
}

fn get_theme_set() -> &'static ThemeSet {
    THEME_SET.get_or_init(ThemeSet::load_defaults)
}

fn escape_html_attr(text: &str) -> String {
    text.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#39;")
}

/// 完全なスタンドアロン HTML ドキュメントを Rust ネイティブで高速エクスポートする
///
/// # Arguments
/// * `title` - HTML ドキュメントの `<title>`
/// * `markdown_text` - エクスポート対象の Markdown 文字列
/// * `is_dark` - ダークモードカラー適用フラグ
///
/// # Returns
/// * `Ok(String)` - 完全な HTML 文字列 (CSS 埋め込み済み)
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
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }}
    pre, code {{
      background-color: {};
      border-radius: 4px;
      font-family: 'JetBrains Mono', 'Cascadia Code', Consolas, Monaco, monospace;
    }}
    pre {{
      padding: 1rem;
      overflow-x: auto;
    }}
    code {{
      padding: 0.2em 0.4em;
    }}
    table {{
      border-collapse: collapse;
      width: 100%;
      margin: 1rem 0;
    }}
    th, td {{
      border: 1px solid {};
      padding: 0.5rem 0.75rem;
      text-align: left;
    }}
    th {{
      background-color: {};
    }}
    blockquote {{
      border-left: 4px solid #38bdf8;
      margin: 1rem 0;
      padding-left: 1rem;
      opacity: 0.8;
    }}
    ul.contains-task-list {{
      list-style-type: none;
      padding-left: 0;
    }}
  </style>
</head>
<body>
  {}
</body>
</html>"#,
        title, bg_color, text_color, border_color, code_bg, border_color, code_bg, body_html
    );

    Ok(full_html)
}

/// syntect 高速ネイティブ構文ハイライト付きで Markdown を HTML にレンダリングする
///
/// 以下の特徴を持ちます：
/// 1. **syntect 構文ハイライト**: コードブロック内のプログラミング言語（Rust, TS, Python, JSON等）を高速にパースし色分け HTML を埋め込みます。
/// 2. **Mermaid 連携ブロック**: `mermaid` 言語ブロックはレンダラー連携用コンテナとして属性を保持したまま出力します。
/// 3. **テーマ対応**: `is_dark` フラグに基づきダーク（`base16-ocean.dark`）およびライト（`InspiredGitHub`）テーマを適用します。
/// 4. **GFM 完全準拠**: テーブル、タスクリスト、打ち消し線、脚注を高速ネイティブレンダリングします。
///
/// # Arguments
/// * `markdown_text` - レンダリング対象の Markdown 文字列
/// * `is_dark` - ダークモード適用フラグ
///
/// # Returns
/// * `Ok(String)` - 構文ハイライト済み HTML 文字列
pub fn render_markdown_html_native(markdown_text: String, is_dark: bool) -> Result<String, String> {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_FOOTNOTES);
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TASKLISTS);
    options.insert(Options::ENABLE_HEADING_ATTRIBUTES);

    let ps = get_syntax_set();
    let ts = get_theme_set();
    let theme_name = if is_dark {
        "base16-ocean.dark"
    } else {
        "InspiredGitHub"
    };
    let theme = ts
        .themes
        .get(theme_name)
        .or_else(|| ts.themes.values().next())
        .ok_or_else(|| "No theme found".to_string())?;

    let parser = Parser::new_ext(&markdown_text, options);
    let mut events = Vec::new();
    let mut in_code_block = false;
    let mut current_lang = String::new();
    let mut code_buffer = String::new();

    for event in parser {
        match event {
            Event::Start(Tag::CodeBlock(kind)) => {
                in_code_block = true;
                current_lang = match kind {
                    CodeBlockKind::Fenced(lang) => lang.to_string(),
                    CodeBlockKind::Indented => String::new(),
                };
                code_buffer.clear();
            }
            Event::Text(text) if in_code_block => {
                code_buffer.push_str(&text);
            }
            Event::End(TagEnd::CodeBlock) => {
                in_code_block = false;
                let lang_trimmed = current_lang.trim();

                // Mermaid ブロック判定
                if lang_trimmed.eq_ignore_ascii_case("mermaid") {
                    let escaped_mermaid = escape_html_attr(&code_buffer);
                    let mermaid_html = format!(
                        r#"<div class="mermaid-container my-4 p-4 rounded-xl border select-none overflow-x-auto text-center" data-mermaid="{}"><pre class="mermaid font-mono text-xs opacity-70">{}</pre></div>"#,
                        escaped_mermaid, escaped_mermaid
                    );
                    events.push(Event::Html(mermaid_html.into()));
                    continue;
                }

                // syntect ハイライト
                let syntax = ps
                    .find_syntax_by_token(lang_trimmed)
                    .unwrap_or_else(|| ps.find_syntax_plain_text());

                let mut highlighter = HighlightLines::new(syntax, theme);
                let mut highlighted_code = String::new();

                for line in syntect::util::LinesWithEndings::from(&code_buffer) {
                    if let Ok(ranges) = highlighter.highlight_line(line, ps) {
                        if let Ok(escaped) =
                            styled_line_to_highlighted_html(&ranges[..], IncludeBackground::No)
                        {
                            highlighted_code.push_str(&escaped);
                        } else {
                            highlighted_code.push_str(&escape_html_attr(line));
                        }
                    } else {
                        highlighted_code.push_str(&escape_html_attr(line));
                    }
                }

                let copy_button = r#"<button class="code-copy-btn absolute top-2 right-2 px-2 py-1 rounded text-[11px] font-sans opacity-70 hover:opacity-100 transition-opacity bg-slate-700/60 hover:bg-slate-600 text-slate-200" onclick="window.__copyCodeBlock(this)">コピー</button>"#;
                let pre_html = format!(
                    r#"<div class="code-block-wrapper relative my-3 group rounded-lg overflow-hidden border border-slate-700/60 font-mono text-xs"><div class="code-header px-3 py-1 bg-slate-950/80 text-slate-400 text-[10px] flex items-center justify-between select-none"><span>{}</span></div>{}<pre class="p-3 overflow-x-auto m-0 leading-relaxed"><code>{}</code></pre></div>"#,
                    if lang_trimmed.is_empty() {
                        "text"
                    } else {
                        lang_trimmed
                    },
                    copy_button,
                    highlighted_code
                );

                events.push(Event::Html(pre_html.into()));
            }
            _ => {
                if !in_code_block {
                    events.push(event);
                }
            }
        }
    }

    let mut html_output = String::new();
    html::push_html(&mut html_output, events.into_iter());

    Ok(html_output)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_export_html_full_native() {
        let md = "# タイトル\n**太字本文**";
        let html =
            export_html_full_native("ドキュメント".to_string(), md.to_string(), true).unwrap();
        assert!(html.contains("<!DOCTYPE html>"));
        assert!(html.contains("<h1>タイトル</h1>"));
        assert!(html.contains("<strong>太字本文</strong>"));
    }

    #[test]
    fn test_render_markdown_html_native() {
        let input = "# 見出し\n\n```rust\nfn main() {\n    println!(\"Hello\");\n}\n```\n\n```mermaid\ngraph TD;\nA-->B;\n```\n\n- [x] 完了タスク\n- [ ] 未完了タスク";
        let html = render_markdown_html_native(input.to_string(), true).unwrap();
        assert!(html.contains("<h1>見出し</h1>"));
        assert!(html.contains("code-block-wrapper"));
        assert!(html.contains("mermaid-container"));
        assert!(html.contains("type=\"checkbox\""));
    }
}
