//! # CSV プレビュー解析サブモジュール
//!
//! CSV 形式のデータを高速パースし、ヘッダー、プレビューデータ行、
//! 総行数・総列数の統計情報を生成します。

use serde::{Deserialize, Serialize};
use specta::Type;

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

/// 簡易 CSV 行パース（クォート "..." 考慮）
pub fn parse_csv_line(line: &str) -> Vec<String> {
    let mut cols = Vec::new();
    let mut current = String::new();
    let mut in_quotes = false;
    let mut chars = line.chars().peekable();

    while let Some(c) = chars.next() {
        match c {
            '"' => {
                if in_quotes && chars.peek() == Some(&'"') {
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
///
/// # Arguments
/// * `content` - CSV テキスト文字列
/// * `max_rows` - プレビューとして読み込む最大行数
///
/// # Returns
/// * `Ok(CsvPreviewDto)` - パースされたヘッダーと行データ
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
    fn test_parse_csv_preview_native() {
        let csv = "ID,Name,Role\n1,\"Yamada, Taro\",Admin\n2,Tanaka,User";
        let res = parse_csv_preview_native(csv.to_string(), 10).unwrap();
        assert_eq!(res.headers, vec!["ID", "Name", "Role"]);
        assert_eq!(res.rows.len(), 2);
        assert_eq!(res.rows[0][1], "Yamada, Taro");
    }
}
