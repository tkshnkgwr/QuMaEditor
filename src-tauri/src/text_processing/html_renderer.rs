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

fn escape_html(text: &str) -> String {
    text.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
}

#[derive(Clone, Debug)]
struct CalloutInfo {
    kind: String,
    title: String,
    icon: &'static str,
}

fn parse_callout_header(text: &str) -> Option<CalloutInfo> {
    let trimmed = text.trim();
    if !trimmed.starts_with("[!") {
        return None;
    }

    let close_bracket = trimmed.find(']')?;
    let kind_str = trimmed[2..close_bracket].trim().to_lowercase();
    let rest = trimmed[close_bracket + 1..].trim();

    let (icon, default_title, normalized_kind) = match kind_str.as_str() {
        "note" => ("ℹ️", "Note", "note"),
        "tip" | "hint" => ("💡", "Tip", "tip"),
        "important" => ("⚡", "Important", "important"),
        "warning" | "warn" => ("⚠️", "Warning", "warning"),
        "caution" | "attention" => ("🛑", "Caution", "caution"),
        "info" => ("ℹ️", "Info", "info"),
        "todo" => ("📋", "Todo", "todo"),
        "success" | "check" | "done" => ("✅", "Success", "success"),
        "question" | "help" | "faq" => ("❓", "Question", "question"),
        "failure" | "fail" | "missing" => ("❌", "Failure", "failure"),
        "danger" | "error" => ("🔴", "Danger", "danger"),
        "bug" => ("🐛", "Bug", "bug"),
        "example" => ("📝", "Example", "example"),
        "quote" | "cite" => ("💬", "Quote", "quote"),
        _ => return None,
    };

    let title = if rest.is_empty() {
        default_title.to_string()
    } else {
        rest.to_string()
    };

    Some(CalloutInfo {
        kind: normalized_kind.to_string(),
        title,
        icon,
    })
}

fn transform_inline_obsidian(text: &str) -> Option<String> {
    let has_highlight = text.contains("==");
    let has_wikilink = text.contains("[[");

    if !has_highlight && !has_wikilink {
        return None;
    }

    let chars: Vec<char> = text.chars().collect();
    let len = chars.len();
    let mut result = String::with_capacity(text.len() + 32);
    let mut i = 0;
    let mut modified = false;

    while i < len {
        // ==highlight==
        if i + 3 < len && chars[i] == '=' && chars[i + 1] == '=' {
            if let Some(close_pos) =
                (i + 2..len - 1).find(|&p| chars[p] == '=' && chars[p + 1] == '=')
            {
                let inner: String = chars[i + 2..close_pos].iter().collect();
                if !inner.trim().is_empty() {
                    result.push_str("<mark class=\"obsidian-highlight\">");
                    result.push_str(&escape_html(&inner));
                    result.push_str("</mark>");
                    i = close_pos + 2;
                    modified = true;
                    continue;
                }
            }
        }

        // [[wikilink]] or [[wikilink|alias]]
        if i + 3 < len && chars[i] == '[' && chars[i + 1] == '[' {
            if let Some(close_pos) =
                (i + 2..len - 1).find(|&p| chars[p] == ']' && chars[p + 1] == ']')
            {
                let inner: String = chars[i + 2..close_pos].iter().collect();
                if !inner.trim().is_empty() {
                    let parts: Vec<&str> = inner.splitn(2, '|').collect();
                    let target = parts[0].trim();
                    let label = if parts.len() > 1 {
                        parts[1].trim()
                    } else {
                        target
                    };
                    result.push_str(&format!(
                        r#"<a class="internal-link" data-href="{}" href="javascript:void(0)">{}</a>"#,
                        escape_html_attr(target),
                        escape_html(label)
                    ));
                    i = close_pos + 2;
                    modified = true;
                    continue;
                }
            }
        }

        result.push(chars[i]);
        i += 1;
    }

    if modified {
        Some(result)
    } else {
        None
    }
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

    // Step 1: 連続する Text の結合 ＆ SoftBreak -> HardBreak (Enter 1回で改行 = Obsidian デフォルト動作)
    let mut raw_events = Vec::new();
    let mut text_acc: Option<String> = None;

    for event in parser {
        match event {
            Event::Text(t) => {
                if let Some(ref mut acc) = text_acc {
                    acc.push_str(&t);
                } else {
                    text_acc = Some(t.to_string());
                }
            }
            _ => {
                if let Some(acc) = text_acc.take() {
                    raw_events.push(Event::Text(acc.into()));
                }
                match event {
                    Event::SoftBreak => {
                        raw_events.push(Event::HardBreak);
                    }
                    _ => {
                        raw_events.push(event);
                    }
                }
            }
        }
    }
    if let Some(acc) = text_acc.take() {
        raw_events.push(Event::Text(acc.into()));
    }

    // Step 2: コールアウト (> [!NOTE]) のインターセプト
    let mut processed_events = Vec::new();
    let mut i = 0;
    while i < raw_events.len() {
        match &raw_events[i] {
            Event::Start(Tag::BlockQuote(kind)) => {
                let start_kind = *kind;
                let mut depth = 1;
                let mut j = i + 1;
                while j < raw_events.len() && depth > 0 {
                    match &raw_events[j] {
                        Event::Start(Tag::BlockQuote(_)) => depth += 1,
                        Event::End(TagEnd::BlockQuote(_)) => depth -= 1,
                        _ => {}
                    }
                    j += 1;
                }

                let bq_slice = &raw_events[i + 1..j - 1];
                let mut callout_found = None;
                let mut first_text_idx = None;

                for (idx, ev) in bq_slice.iter().enumerate() {
                    match ev {
                        Event::Start(Tag::Paragraph) => continue,
                        Event::Text(t) => {
                            if let Some(info) = parse_callout_header(t) {
                                callout_found = Some(info);
                                first_text_idx = Some(idx);
                            }
                            break;
                        }
                        _ => break,
                    }
                }

                if let Some(info) = callout_found {
                    let text_idx = first_text_idx.unwrap();
                    let callout_start_html = format!(
                        r#"<div class="callout callout-{}" data-callout="{}"><div class="callout-title"><span class="callout-icon">{}</span><span class="callout-title-text">{}</span></div><div class="callout-content">"#,
                        info.kind,
                        info.kind,
                        info.icon,
                        escape_html(&info.title)
                    );
                    processed_events.push(Event::Html(callout_start_html.into()));

                    // タイトル行となった最初の Text および直後の改行をスキップ
                    let mut skip_next_break = false;
                    for (idx, ev) in bq_slice.iter().enumerate() {
                        if idx == text_idx {
                            skip_next_break = true;
                            continue;
                        }
                        if skip_next_break {
                            skip_next_break = false;
                            if matches!(ev, Event::HardBreak | Event::SoftBreak) {
                                continue;
                            }
                        }
                        processed_events.push(ev.clone());
                    }

                    processed_events.push(Event::Html("</div></div>".into()));
                } else {
                    processed_events.push(Event::Start(Tag::BlockQuote(start_kind)));
                    for ev in bq_slice {
                        processed_events.push(ev.clone());
                    }
                    processed_events.push(Event::End(TagEnd::BlockQuote(start_kind)));
                }

                i = j;
            }
            _ => {
                processed_events.push(raw_events[i].clone());
                i += 1;
            }
        }
    }

    // Step 3: コードブロック・インライン記法・タスクリスト
    let mut final_events = Vec::new();
    let mut in_code_block = false;
    let mut current_lang = String::new();
    let mut code_buffer = String::new();
    let mut task_index = 0;

    for event in processed_events {
        match event {
            Event::TaskListMarker(checked) => {
                let checked_attr = if checked { "checked " } else { "" };
                let task_html = format!(
                    r#"<input type="checkbox" class="task-list-item-checkbox cursor-pointer align-middle mr-1.5" data-task-index="{}" {}/>"#,
                    task_index, checked_attr
                );
                task_index += 1;
                final_events.push(Event::Html(task_html.into()));
            }
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
                    final_events.push(Event::Html(mermaid_html.into()));
                    continue;
                }

                // syntect ハイライト (大文字・小文字の表記ゆれフォールバック対応)
                let lang_lower = lang_trimmed.to_lowercase();
                let syntax = ps
                    .find_syntax_by_token(lang_trimmed)
                    .or_else(|| ps.find_syntax_by_token(&lang_lower))
                    .or_else(|| ps.find_syntax_by_name(lang_trimmed))
                    .or_else(|| ps.find_syntax_by_name(&lang_lower))
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

                final_events.push(Event::Html(pre_html.into()));
            }
            Event::Text(text) if !in_code_block => {
                if let Some(transformed) = transform_inline_obsidian(&text) {
                    final_events.push(Event::Html(transformed.into()));
                } else {
                    final_events.push(Event::Text(text));
                }
            }
            _ => {
                if !in_code_block {
                    final_events.push(event);
                }
            }
        }
    }

    let mut html_output = String::new();
    html::push_html(&mut html_output, final_events.into_iter());

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
        assert!(html.contains("data-task-index=\"0\""));
        assert!(html.contains("data-task-index=\"1\""));
    }

    #[test]
    fn test_obsidian_soft_break_to_hard_break() {
        let md = "行1\n行2";
        let html = render_markdown_html_native(md.to_string(), true).unwrap();
        assert!(
            html.contains("<br />") || html.contains("<br>"),
            "Should convert single Enter to br"
        );
    }

    #[test]
    fn test_obsidian_callout_rendering() {
        let md = "> [!NOTE] メモタイトル\n> 本文";
        let parser = Parser::new_ext(md, Options::all());
        for ev in parser {
            println!("Ev: {:?}", ev);
        }
        let html = render_markdown_html_native(md.to_string(), true).unwrap();
        println!("Callout HTML: {}", html);
        assert!(html.contains("callout callout-note"));
        assert!(html.contains("メモタイトル"));
        assert!(html.contains("本文"));
    }

    #[test]
    fn test_obsidian_highlight_and_wikilink() {
        let md = "これは ==重要ハイライト== と [[マイノート|別名リンク]] です。";
        let parser = Parser::new_ext(md, Options::all());
        for ev in parser {
            println!("WikiEv: {:?}", ev);
        }
        let html = render_markdown_html_native(md.to_string(), true).unwrap();
        println!("Wikilink HTML: {}", html);
        assert!(html.contains("<mark class=\"obsidian-highlight\">重要ハイライト</mark>"));
        assert!(html.contains("<a class=\"internal-link\" data-href=\"マイノート\""));
        assert!(html.contains("別名リンク</a>"));
    }
}
