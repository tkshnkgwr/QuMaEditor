//! # 日本語校正 ＆ Markdown 構文 lint モジュール (Proofreading)
//!
//! タイピング応答性を 1 ナノ秒も損なうことなく、バックグラウンドで
//! 連続助詞・表記ゆれ・未閉じ括弧・未閉じコードブロック等の校正警告を高速抽出します。

use serde::{Deserialize, Serialize};
use specta::Type;

/// 校正指摘項目 DTO
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub struct ProofreadingIssue {
    /// 該当行番号 (1-indexed)
    pub line_number: u32,
    /// 該当列番号 (1-indexed)
    pub column: u32,
    /// 指摘メッセージ
    pub message: String,
    /// 重要度 ("info" | "warning" | "error")
    pub severity: String,
    /// 推奨修正案 (あれば)
    pub suggestion: Option<String>,
}

/// 表記ゆれの検出ルールペア (短い表記, 長音付き表記)
const VARIANT_PAIRS: &[(&str, &str)] = &[
    ("サーバ", "サーバー"),
    ("ユーザ", "ユーザー"),
    ("エディタ", "エディター"),
    ("インタフェース", "インターフェース"),
    ("メモリ", "メモリー"),
    ("ブラウザ", "ブラウザー"),
    ("フォルダ", "フォルダー"),
    ("プリンタ", "プリンター"),
];

/// 連続助詞のパターン
const DUPLICATE_PARTICLES: &[&str] = &["のの", "はは", "がが", "をを", "にに", "でで", "へとへと"];

/// Markdown ドキュメントの日本語校正および記法 lint を高速実行する
pub fn lint_markdown_document_native(content: String) -> Result<Vec<ProofreadingIssue>, String> {
    let mut issues = Vec::new();
    let mut in_code_block = false;
    let mut code_block_start_line = 0u32;

    let mut has_jp_comma = false; // 「、」
    let mut has_en_comma = false; // 「，」

    // 全体での括弧バランス追跡
    let mut paren_round_open = 0i32; // （）
    let mut paren_corner_open = 0i32; // 「」
    let mut paren_thick_open = 0i32; // 【】

    for (line_idx, line) in content.lines().enumerate() {
        let line_no = (line_idx + 1) as u32;
        let trimmed = line.trim();

        // コードブロック境界の検知
        if trimmed.starts_with("```") {
            in_code_block = !in_code_block;
            if in_code_block {
                code_block_start_line = line_no;
            }
            continue;
        }

        // コードブロック内は文章校正の対象外
        if in_code_block {
            continue;
        }

        // 1. 連続助詞の検知
        for &particle in DUPLICATE_PARTICLES {
            if let Some(byte_pos) = line.find(particle) {
                let char_pos = line[..byte_pos].chars().count() as u32 + 1;
                issues.push(ProofreadingIssue {
                    line_number: line_no,
                    column: char_pos,
                    message: format!("助詞が重複している可能性があります:「{}」", particle),
                    severity: "warning".to_string(),
                    suggestion: Some(particle.chars().take(1).collect()),
                });
            }
        }

        // 2. 句読点混在の検知（行内）
        if line.contains('、') {
            has_jp_comma = true;
        }
        if line.contains('，') {
            has_en_comma = true;
        }

        // 3. 行内インラインコード未閉じ検知 (奇数個のバッククォート)
        let backtick_count = line.chars().filter(|&c| c == '`').count();
        if backtick_count % 2 != 0 {
            issues.push(ProofreadingIssue {
                line_number: line_no,
                column: (line.chars().count() as u32) + 1,
                message: "インラインコードのバッククォート (`) が閉じられていません".to_string(),
                severity: "warning".to_string(),
                suggestion: Some("`".to_string()),
            });
        }

        // 4. 括弧の増減追跡
        for ch in line.chars() {
            match ch {
                '（' | '(' => paren_round_open += 1,
                '）' | ')' => paren_round_open -= 1,
                '「' => paren_corner_open += 1,
                '」' => paren_corner_open -= 1,
                '【' => paren_thick_open += 1,
                '】' => paren_thick_open -= 1,
                _ => {}
            }
        }
    }

    // コードブロック全体の未閉じチェック
    if in_code_block {
        issues.push(ProofreadingIssue {
            line_number: code_block_start_line,
            column: 1,
            message: "コードブロック (```) がファイル末尾まで閉じられていません".to_string(),
            severity: "error".to_string(),
            suggestion: Some("```".to_string()),
        });
    }

    // 句読点の全域混在警告
    if has_jp_comma && has_en_comma {
        issues.push(ProofreadingIssue {
            line_number: 1,
            column: 1,
            message: "読点「、」とカンマ「，」がドキュメント内で混在しています".to_string(),
            severity: "info".to_string(),
            suggestion: Some("「、」または「，」のどちらかへの統一を推奨します".to_string()),
        });
    }

    // 括弧の全域不一致チェック
    if paren_round_open != 0 {
        issues.push(ProofreadingIssue {
            line_number: 1,
            column: 1,
            message: "丸括弧（）の開きと閉じの数が一致していません".to_string(),
            severity: "warning".to_string(),
            suggestion: None,
        });
    }
    if paren_corner_open != 0 {
        issues.push(ProofreadingIssue {
            line_number: 1,
            column: 1,
            message: "かぎ括弧「」の開きと閉じの数が一致していません".to_string(),
            severity: "warning".to_string(),
            suggestion: None,
        });
    }
    if paren_thick_open != 0 {
        issues.push(ProofreadingIssue {
            line_number: 1,
            column: 1,
            message: "墨付き括弧【】の開きと閉じの数が一致していません".to_string(),
            severity: "warning".to_string(),
            suggestion: None,
        });
    }

    // 5. 表記ゆれの全域チェック
    for &(v1, v2) in VARIANT_PAIRS {
        if content.contains(v1) && content.contains(v2) {
            issues.push(ProofreadingIssue {
                line_number: 1,
                column: 1,
                message: format!(
                    "表記ゆれを検出しました:「{}」と「{}」が混在しています",
                    v1, v2
                ),
                severity: "info".to_string(),
                suggestion: Some(format!(
                    "「{}」または「{}」のどちらかに統一してください",
                    v1, v2
                )),
            });
        }
    }

    Ok(issues)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lint_duplicate_particles() {
        let content = "これはテストのの文章です。".to_string();
        let issues = lint_markdown_document_native(content).unwrap();
        assert!(issues.iter().any(|i| i.message.contains("のの")));
    }

    #[test]
    fn test_lint_unclosed_code_block() {
        let content = "# 見出し\n```rust\nfn main() {}\n".to_string();
        let issues = lint_markdown_document_native(content).unwrap();
        assert!(issues
            .iter()
            .any(|i| i.severity == "error" && i.message.contains("閉じられていません")));
    }

    #[test]
    fn test_lint_variant_pairs() {
        let content = "Webサーバの構成と、バックエンドサーバーの構築。".to_string();
        let issues = lint_markdown_document_native(content).unwrap();
        assert!(issues.iter().any(|i| i.message.contains("表記ゆれ")));
    }
}
