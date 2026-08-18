//! # YAML Front Matter 解析サブモジュール
//!
//! Markdown ドキュメントのヘッダーメタデータ (YAML Front Matter) と本文の高速分離・パースを提供します。

use serde::{Deserialize, Serialize};
use specta::Type;

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

/// YAML Front Matter と本文を高速分離・パースする
///
/// # Arguments
/// * `full_text` - Front Matter を含む可能性のある完全な Markdown 文字列
///
/// # Returns
/// * `Ok(ParsedYamlDocResult)` - 分離されたメタデータと本文
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_yaml_front_matter_native() {
        let md = "---\ntitle: \"テスト文書\"\nauthor: \"山田太郎\"\ntags: [\"rust\", \"tauri\"]\n---\n\n# 本文タイトル";
        let parsed = parse_yaml_front_matter_native(md.to_string()).unwrap();
        assert_eq!(parsed.title.as_deref(), Some("テスト文書"));
        assert_eq!(parsed.author.as_deref(), Some("山田太郎"));
        assert_eq!(parsed.tags, vec!["rust", "tauri"]);
        assert!(parsed.body.contains("# 本文タイトル"));
    }
}
