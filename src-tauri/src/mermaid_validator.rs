//! # Mermaid 図の構文検証 ＆ SVG 差分キャッシュ最適化モジュール (MermaidValidator)
//!
//! Mermaid コードの構文事前検証および SHA-256 ハッシュ計算を行い、
//! 構文エラーの事前防止と未変更ダイアグラムの不要な再描画（レイアウト計算）コストを根絶します。

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use specta::Type;

/// Mermaid 構文検証結果 DTO
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub struct MermaidValidationResult {
    /// 構文が有効と判定されたか
    pub is_valid: bool,
    /// 判定されたダイアグラム種別 (例: "flowchart", "sequenceDiagram", "unknown")
    pub diagram_type: String,
    /// コンテンツの SHA-256 ハッシュ文字列 (キャッシュ照合用)
    pub content_hash: String,
    /// 検出されたエラーメッセージ (無効時)
    pub error_message: Option<String>,
}

/// サポートされる Mermaid ダイアグラム宣言プレフィックス
const KNOWN_DIAGRAM_PREFIXES: &[(&str, &str)] = &[
    ("flowchart", "flowchart"),
    ("graph", "graph"),
    ("sequencediagram", "sequenceDiagram"),
    ("classdiagram", "classDiagram"),
    ("statediagram", "stateDiagram"),
    ("erdiagram", "erDiagram"),
    ("gantt", "gantt"),
    ("pie", "pie"),
    ("gitgraph", "gitGraph"),
    ("quadrantchart", "quadrantChart"),
    ("c4context", "c4Context"),
    ("c4container", "c4Container"),
    ("c4component", "c4Component"),
    ("c4dynamic", "c4Dynamic"),
    ("c4deployment", "c4Deployment"),
    ("mindmap", "mindmap"),
    ("timeline", "timeline"),
    ("kanban", "kanban"),
    ("sankey-beta", "sankey"),
    ("sankey", "sankey"),
    ("xychart-beta", "xychart"),
    ("xychart", "xychart"),
    ("journey", "journey"),
    ("requirementdiagram", "requirementDiagram"),
    ("zenuml", "zenuml"),
    ("packet-beta", "packet"),
    ("block-beta", "block"),
    ("architecture", "architecture"),
];

/// ER 図のリレーション記法（`||--o{`, `}o--||`, `|o..|{` 等）や文字列・コメントを除外して括弧の均衡を検証する
fn check_brackets_balanced(code: &str, diagram_type: &str) -> Option<&'static str> {
    let mut open_parens = 0usize;
    let mut close_parens = 0usize;
    let mut open_brackets = 0usize;
    let mut close_brackets = 0usize;
    let mut open_braces = 0usize;
    let mut close_braces = 0usize;

    for raw_line in code.lines() {
        let trimmed_line = raw_line.trim();
        if trimmed_line.is_empty() || trimmed_line.starts_with("%%") {
            continue;
        }

        // ER 図のリレーション記号 (}o, o{, }|, |{) を一時的に無害化
        let sanitized_line = if diagram_type == "erDiagram" {
            trimmed_line
                .replace("}o", "||")
                .replace("o{", "||")
                .replace("}|", "||")
                .replace("|{", "||")
        } else {
            trimmed_line.to_string()
        };

        let mut in_quotes = false;
        let chars: Vec<char> = sanitized_line.chars().collect();
        let mut i = 0;
        while i < chars.len() {
            let c = chars[i];
            // 行内コメント %% の開始
            if !in_quotes && c == '%' && i + 1 < chars.len() && chars[i + 1] == '%' {
                break;
            }
            if c == '"' && (i == 0 || chars[i - 1] != '\\') {
                in_quotes = !in_quotes;
                i += 1;
                continue;
            }
            if !in_quotes {
                match c {
                    '(' => open_parens += 1,
                    ')' => close_parens += 1,
                    '[' => open_brackets += 1,
                    ']' => close_brackets += 1,
                    '{' => open_braces += 1,
                    '}' => close_braces += 1,
                    _ => {}
                }
            }
            i += 1;
        }
    }

    if open_parens != close_parens {
        return Some("丸括弧 () の整合性がとれていません");
    }
    if open_brackets != close_brackets {
        return Some("角括弧 [] の整合性がとれていません");
    }
    if open_braces != close_braces {
        return Some("波括弧 {} の整合性がとれていません");
    }
    None
}

/// Mermaid コードブロックの構文検証と SHA-256 ハッシュ計算を行う
pub fn validate_mermaid_syntax_native(code: String) -> Result<MermaidValidationResult, String> {
    let trimmed = code.trim();

    // SHA-256 ハッシュの計算
    let mut hasher = Sha256::new();
    hasher.update(trimmed.as_bytes());
    let hash_bytes = hasher.finalize();
    let content_hash = format!("{:x}", hash_bytes);

    if trimmed.is_empty() {
        return Ok(MermaidValidationResult {
            is_valid: false,
            diagram_type: "empty".to_string(),
            content_hash,
            error_message: Some("Mermaid コードが空です".to_string()),
        });
    }

    // 先頭行から YAML フロントマター（--- ... ---）およびコメント（%% ...）を除外してヘッダーを特定
    let mut header_line = "";
    let mut in_frontmatter = false;
    for (idx, line) in trimmed.lines().enumerate() {
        let l = line.trim();
        if idx == 0 && l == "---" {
            in_frontmatter = true;
            continue;
        }
        if in_frontmatter {
            if l == "---" {
                in_frontmatter = false;
            }
            continue;
        }
        if !l.is_empty() && !l.starts_with("%%") {
            header_line = l;
            break;
        }
    }

    let header_lower = header_line.to_lowercase();
    let mut detected_type = "unknown";

    for &(prefix, canonical) in KNOWN_DIAGRAM_PREFIXES {
        if header_lower.starts_with(prefix) {
            detected_type = canonical;
            break;
        }
    }

    if detected_type == "unknown" {
        return Ok(MermaidValidationResult {
            is_valid: false,
            diagram_type: "unknown".to_string(),
            content_hash,
            error_message: Some(format!(
                "未対応または未知の Mermaid 宣言ヘッダーです: 「{}」",
                header_line
            )),
        });
    }

    // 括弧の不均衡チェック（ER図記法・文字列・コメント考慮）
    if let Some(err_msg) = check_brackets_balanced(trimmed, detected_type) {
        return Ok(MermaidValidationResult {
            is_valid: false,
            diagram_type: detected_type.to_string(),
            content_hash,
            error_message: Some(err_msg.to_string()),
        });
    }

    Ok(MermaidValidationResult {
        is_valid: true,
        diagram_type: detected_type.to_string(),
        content_hash,
        error_message: None,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_valid_flowchart() {
        let code = "graph TD;\nA-->B;\nB-->C;".to_string();
        let res = validate_mermaid_syntax_native(code).unwrap();
        assert!(res.is_valid);
        assert_eq!(res.diagram_type, "graph");
        assert!(!res.content_hash.is_empty());
        assert!(res.error_message.is_none());
    }

    #[test]
    fn test_validate_unbalanced_brackets() {
        let code = "flowchart LR\nA[開始 --> B".to_string();
        let res = validate_mermaid_syntax_native(code).unwrap();
        assert!(!res.is_valid);
        assert!(res.error_message.unwrap().contains("角括弧"));
    }

    #[test]
    fn test_validate_unknown_header() {
        let code = "invalidDiagramHeader\nA-->B".to_string();
        let res = validate_mermaid_syntax_native(code).unwrap();
        assert!(!res.is_valid);
        assert_eq!(res.diagram_type, "unknown");
    }

    #[test]
    fn test_validate_er_diagram_with_crow_foot() {
        let code =
            "erDiagram\n    USER ||--o{ DOCUMENT : creates\n    USER {\n        string id\n    }"
                .to_string();
        let res = validate_mermaid_syntax_native(code).unwrap();
        assert!(res.is_valid);
        assert_eq!(res.diagram_type, "erDiagram");
    }
}
