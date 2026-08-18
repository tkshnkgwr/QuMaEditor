//! # Markdown 自動整形・表組み垂直整列サブモジュール
//!
//! RULES.md 準拠の Unicode 幅計算付きテーブル垂直整列、
//! 見出し前後の空行確保、連続空行圧縮、Front Matter & コードブロック保護を提供します。

use unicode_width::UnicodeWidthStr;

/// Markdown テーブルのアライメント（配置）種別
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TableAlignment {
    /// 左寄せ (`:---`)
    Left,
    /// 中央寄せ (`:---:`)
    Center,
    /// 右寄せ (`---:`)
    Right,
    /// デフォルト / アライメント指定なし (`---`)
    None,
}

/// テーブルのアライメント指定行をパースする
pub fn parse_table_alignments(row_cells: &[String]) -> Option<Vec<TableAlignment>> {
    let mut alignments = Vec::new();
    for cell in row_cells {
        let trimmed = cell.trim();
        if trimmed.is_empty() {
            return None;
        }
        let has_left_colon = trimmed.starts_with(':');
        let has_right_colon = trimmed.ends_with(':');
        let core = trimmed.trim_matches(':');
        if core.is_empty() || !core.chars().all(|c| c == '-') {
            return None;
        }
        let align = match (has_left_colon, has_right_colon) {
            (true, true) => TableAlignment::Center,
            (true, false) => TableAlignment::Left,
            (false, true) => TableAlignment::Right,
            (false, false) => TableAlignment::None,
        };
        alignments.push(align);
    }
    Some(alignments)
}

/// 1行の表テキストをセル配列に分割する
pub fn split_table_row(line: &str) -> Vec<String> {
    let trimmed = line.trim();
    let inner = if trimmed.starts_with('|') && trimmed.ends_with('|') && trimmed.len() >= 2 {
        &trimmed[1..trimmed.len() - 1]
    } else if let Some(stripped) = trimmed.strip_prefix('|') {
        stripped
    } else if let Some(stripped) = trimmed.strip_suffix('|') {
        stripped
    } else {
        trimmed
    };

    inner.split('|').map(|c| c.trim().to_string()).collect()
}

/// 表ブロック（複数行）を RULES.md 準拠で垂直整列してフォーマットする
pub fn format_table_block(table_lines: &[String]) -> Vec<String> {
    if table_lines.len() < 2 {
        return table_lines.to_vec();
    }

    let parsed_rows: Vec<Vec<String>> = table_lines.iter().map(|l| split_table_row(l)).collect();
    let align_row_idx = 1;
    let alignments = match parse_table_alignments(&parsed_rows[align_row_idx]) {
        Some(a) => a,
        None => return table_lines.to_vec(),
    };

    let col_count = alignments.len();
    if col_count == 0 {
        return table_lines.to_vec();
    }

    // 各列の最大幅を算出
    let mut col_widths = vec![3usize; col_count];
    for (r_idx, row) in parsed_rows.iter().enumerate() {
        if r_idx == align_row_idx {
            continue;
        }
        for (c_idx, cell) in row.iter().enumerate() {
            if c_idx < col_count {
                let w = cell.as_str().width();
                if w > col_widths[c_idx] {
                    col_widths[c_idx] = w;
                }
            }
        }
    }

    let mut result_lines = Vec::new();
    for (r_idx, row) in parsed_rows.iter().enumerate() {
        if r_idx == align_row_idx {
            let mut parts = Vec::new();
            for (c_idx, &align) in alignments.iter().enumerate() {
                let target_w = col_widths[c_idx];
                let align_str = match align {
                    TableAlignment::Center => {
                        let dashes = "-".repeat(target_w.saturating_sub(2));
                        format!(":{}:", dashes)
                    }
                    TableAlignment::Left => {
                        let dashes = "-".repeat(target_w.saturating_sub(1));
                        format!(":{}", dashes)
                    }
                    TableAlignment::Right => {
                        let dashes = "-".repeat(target_w.saturating_sub(1));
                        format!("{}:", dashes)
                    }
                    TableAlignment::None => "-".repeat(target_w),
                };
                parts.push(align_str);
            }
            result_lines.push(format!("| {} |", parts.join(" | ")));
        } else {
            let mut parts = Vec::new();
            for c_idx in 0..col_count {
                let cell_text = row.get(c_idx).map(|s| s.as_str()).unwrap_or("");
                let cell_w = cell_text.width();
                let pad_needed = col_widths[c_idx].saturating_sub(cell_w);
                let align = alignments[c_idx];

                let formatted_cell = match align {
                    TableAlignment::Right => {
                        format!("{}{}", " ".repeat(pad_needed), cell_text)
                    }
                    TableAlignment::Center => {
                        let left_pad = pad_needed / 2;
                        let right_pad = pad_needed - left_pad;
                        format!(
                            "{}{}{}",
                            " ".repeat(left_pad),
                            cell_text,
                            " ".repeat(right_pad)
                        )
                    }
                    _ => {
                        format!("{}{}", cell_text, " ".repeat(pad_needed))
                    }
                };
                parts.push(formatted_cell);
            }
            result_lines.push(format!("| {} |", parts.join(" | ")));
        }
    }

    result_lines
}

/// Markdown ドキュメントの高速ネイティブ自動整形を実行する
///
/// 以下の整形処理を一括で高速実行します：
/// 1. **YAML Front Matter & コードブロックの完全保護**: メタデータやプログラムコード内のテキストは一切改変しません。
/// 2. **表組み（Markdown Table）の垂直整列**: `RULES.md` に準拠し、全角・半角 Unicode 表示幅を精密計算してパイプ `|` とハイフン `-` を垂直整列します。
/// 3. **連続空行の圧縮**: 3行以上の連続改行を2行（空行1行分）へ圧縮します。
/// 4. **見出し・リスト前後の空行確保**: 見出し (`#`) や通常段落後のリスト項目直前に適切な空行を自動挿入します。
///
/// # Arguments
/// * `markdown_text` - 整形対象の Markdown 文字列
///
/// # Returns
/// * `Ok(String)` - 整形後の Markdown 文字列
pub fn format_markdown_native(markdown_text: String) -> Result<String, String> {
    let normalized = markdown_text.replace("\r\n", "\n");

    // 1. YAML Front Matter の抽出と保護
    let (front_matter, body) = if let Some(stripped) = normalized.strip_prefix("---\n") {
        if let Some(end_idx) = stripped.find("\n---\n") {
            let fm = &normalized[..end_idx + 8];
            let rest = &normalized[end_idx + 8..];
            (Some(fm.to_string()), rest)
        } else {
            (None, normalized.as_str())
        }
    } else {
        (None, normalized.as_str())
    };

    let lines: Vec<&str> = body.lines().collect();
    let mut formatted_lines: Vec<String> = Vec::new();

    let mut in_code_block = false;
    let mut code_fence = "";
    let mut table_buffer: Vec<String> = Vec::new();

    let flush_table = |tbl: &mut Vec<String>, out: &mut Vec<String>| {
        if !tbl.is_empty() {
            let formatted_table = format_table_block(tbl);
            out.extend(formatted_table);
            tbl.clear();
        }
    };

    let is_heading = |line: &str| -> bool {
        let trimmed = line.trim_start();
        trimmed.starts_with('#')
            && trimmed
                .chars()
                .take_while(|&c| c == '#')
                .count()
                .clamp(1, 6)
                > 0
            && trimmed
                .chars()
                .nth(trimmed.chars().take_while(|&c| c == '#').count())
                == Some(' ')
    };

    let is_list_item = |line: &str| -> bool {
        let trimmed = line.trim_start();
        trimmed.starts_with("- ")
            || trimmed.starts_with("* ")
            || trimmed.starts_with("+ ")
            || (trimmed.len() >= 3
                && trimmed.chars().next().is_some_and(|c| c.is_ascii_digit())
                && trimmed.contains(". "))
    };

    let is_table_row = |line: &str| -> bool {
        let trimmed = line.trim();
        trimmed.starts_with('|') && trimmed.ends_with('|') && trimmed.contains('|')
    };

    for line in lines {
        let trimmed = line.trim();

        // コードブロックの開始/終了判定
        if !in_code_block && (trimmed.starts_with("```") || trimmed.starts_with("~~~")) {
            flush_table(&mut table_buffer, &mut formatted_lines);
            in_code_block = true;
            code_fence = if trimmed.starts_with("```") {
                "```"
            } else {
                "~~~"
            };
            formatted_lines.push(line.to_string());
            continue;
        } else if in_code_block {
            if trimmed.starts_with(code_fence) {
                in_code_block = false;
            }
            formatted_lines.push(line.to_string());
            continue;
        }

        // 表組み行の判定
        if is_table_row(line) {
            table_buffer.push(line.to_string());
            continue;
        } else {
            flush_table(&mut table_buffer, &mut formatted_lines);
        }

        // 見出し行の空行自動挿入
        if is_heading(line) {
            if let Some(last) = formatted_lines.last() {
                if !last.is_empty() {
                    formatted_lines.push(String::new());
                }
            }
            formatted_lines.push(line.trim_end().to_string());
            continue;
        }

        // リスト項目の空行調整
        if is_list_item(line) {
            if let Some(last) = formatted_lines.last() {
                if !last.is_empty() && !is_list_item(last) && !last.starts_with('#') {
                    formatted_lines.push(String::new());
                }
            }
            formatted_lines.push(line.trim_end().to_string());
            continue;
        }

        // 通常行
        formatted_lines.push(line.trim_end().to_string());
    }

    flush_table(&mut table_buffer, &mut formatted_lines);

    // 連続する空行を圧縮 (コードブロック外の 3行以上の空行 -> 1行の空行)
    let mut compressed_lines: Vec<String> = Vec::new();
    let mut in_code = false;
    let mut code_fence_end = "";
    let mut consecutive_empty = 0;

    for line in formatted_lines {
        let trimmed = line.trim();
        if !in_code && (trimmed.starts_with("```") || trimmed.starts_with("~~~")) {
            in_code = true;
            code_fence_end = if trimmed.starts_with("```") {
                "```"
            } else {
                "~~~"
            };
            consecutive_empty = 0;
            compressed_lines.push(line);
            continue;
        } else if in_code {
            if trimmed.starts_with(code_fence_end) {
                in_code = false;
            }
            compressed_lines.push(line);
            continue;
        }

        if trimmed.is_empty() {
            consecutive_empty += 1;
            if consecutive_empty <= 1 {
                compressed_lines.push(String::new());
            }
        } else {
            consecutive_empty = 0;
            compressed_lines.push(line);
        }
    }

    while compressed_lines.first().is_some_and(|l| l.is_empty()) {
        compressed_lines.remove(0);
    }
    while compressed_lines.last().is_some_and(|l| l.is_empty()) {
        compressed_lines.pop();
    }

    let mut result = String::new();
    if let Some(fm) = front_matter {
        result.push_str(&fm);
        if !fm.ends_with('\n') {
            result.push('\n');
        }
    }

    result.push_str(&compressed_lines.join("\n"));
    result.push('\n');

    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_markdown_native() {
        let input = r#"# 見出し1
本文段落1



### 小見出し
- リスト1
- リスト2
| 列A | 列B | 数値 |
| :--- | :---: | ---: |
| 短 | 日本語 | 123 |
| 長い文字列 | OK | 45678 |
"#;
        let formatted = format_markdown_native(input.to_string()).unwrap();
        assert!(formatted.contains("本文段落1\n\n### 小見出し"));
        assert!(!formatted.contains("\n\n\n"));
        assert!(formatted.contains("| :--------- | :----: | ----: |"));
        assert!(formatted.contains("| 長い文字列 |   OK   | 45678 |"));
    }

    #[test]
    fn test_format_markdown_native_front_matter_and_code_block_protection() {
        let input = "---\ntitle: \"保護テスト\"\nauthor: \"管理者\"\n---\n\n```rust\n// コードブロック内の過剰な空行は保護されるべき\nfn test() {\n\n\n    let x = 1;\n}\n```\n\n# 見出し2";
        let formatted = format_markdown_native(input.to_string()).unwrap();
        assert!(formatted.starts_with("---\ntitle: \"保護テスト\"\nauthor: \"管理者\"\n---\n"));
        assert!(formatted.contains("fn test() {\n\n\n    let x = 1;\n}"));
    }
}
