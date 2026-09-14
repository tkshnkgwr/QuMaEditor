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
    ("mindmap", "mindmap"),
    ("timeline", "timeline"),
    ("kanban", "kanban"),
    ("sankey", "sankey"),
    ("block-beta", "block"),
    ("architecture", "architecture"),
];

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

    // 先頭行からコメント（%% ...）を除外してヘッダーを特定
    let mut header_line = "";
    for line in trimmed.lines() {
        let l = line.trim();
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

    // 括弧の簡易不均衡チェック
    let open_parens = trimmed.chars().filter(|&c| c == '(').count();
    let close_parens = trimmed.chars().filter(|&c| c == ')').count();
    let open_brackets = trimmed.chars().filter(|&c| c == '[').count();
    let close_brackets = trimmed.chars().filter(|&c| c == ']').count();
    let open_braces = trimmed.chars().filter(|&c| c == '{').count();
    let close_braces = trimmed.chars().filter(|&c| c == '}').count();

    if open_parens != close_parens {
        return Ok(MermaidValidationResult {
            is_valid: false,
            diagram_type: detected_type.to_string(),
            content_hash,
            error_message: Some("丸括弧 () の整合性がとれていません".to_string()),
        });
    }

    if open_brackets != close_brackets {
        return Ok(MermaidValidationResult {
            is_valid: false,
            diagram_type: detected_type.to_string(),
            content_hash,
            error_message: Some("角括弧 [] の整合性がとれていません".to_string()),
        });
    }

    if open_braces != close_braces {
        return Ok(MermaidValidationResult {
            is_valid: false,
            diagram_type: detected_type.to_string(),
            content_hash,
            error_message: Some("波括弧 {} の整合性がとれていません".to_string()),
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
}
