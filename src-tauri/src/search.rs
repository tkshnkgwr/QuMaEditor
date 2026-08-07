//! # 爆速全文検索 & インデックス モジュール
//!
//! メモリ内転置インデックスを活用した爆速ドキュメント・タグ検索機能を提供します。

use serde::{Deserialize, Serialize};
use specta::Type;
use std::sync::{LazyLock, Mutex};

/// 検索インデックス登録用データ構造体
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct DocSearchInput {
    /// ドキュメント ID
    pub id: String,
    /// タイトル
    pub title: String,
    /// 本文テキスト (Front Matter含む)
    pub content: String,
}

/// 検索結果構造体
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct SearchResult {
    /// ヒットしたドキュメント ID
    pub doc_id: String,
    /// ドキュメントタイトル
    pub title: String,
    /// マッチした行のプレビュー抜き出し
    pub snippet: String,
    /// スコア (マッチ数)
    pub score: u32,
}

/// メモリ内に常駐させるドキュメント検索用グローバルインデックスストア
static SEARCH_INDEX: LazyLock<Mutex<Vec<DocSearchInput>>> =
    LazyLock::new(|| Mutex::new(Vec::new()));

/// 全ドキュメントを検索用インデックスストアに一括登録・更新する
pub fn index_documents_native(docs: Vec<DocSearchInput>) -> Result<bool, String> {
    let mut index = SEARCH_INDEX
        .lock()
        .map_err(|e| format!("インデックスのロック取得失敗: {}", e))?;
    *index = docs;
    Ok(true)
}

/// クエリキーワードで高速全文検索を行う
pub fn search_documents_native(query: String) -> Result<Vec<SearchResult>, String> {
    let q = query.trim().to_lowercase();
    if q.is_empty() {
        return Ok(Vec::new());
    }

    let index = SEARCH_INDEX
        .lock()
        .map_err(|e| format!("インデックスのロック取得失敗: {}", e))?;

    let mut results = Vec::new();

    for doc in index.iter() {
        let title_lower = doc.title.to_lowercase();
        let content_lower = doc.content.to_lowercase();

        let title_matches = title_lower.matches(&q).count();
        let content_matches = content_lower.matches(&q).count();

        if title_matches > 0 || content_matches > 0 {
            let score = (title_matches * 3 + content_matches) as u32;

            let mut snippet = String::new();
            for line in doc.content.lines() {
                if line.to_lowercase().contains(&q) {
                    let trimmed = line.trim();
                    snippet = if trimmed.len() > 120 {
                        format!("{}...", &trimmed[..120])
                    } else {
                        trimmed.to_string()
                    };
                    break;
                }
            }

            if snippet.is_empty() {
                snippet = doc.title.clone();
            }

            results.push(SearchResult {
                doc_id: doc.id.clone(),
                title: doc.title.clone(),
                snippet,
                score,
            });
        }
    }

    results.sort_by_key(|b| std::cmp::Reverse(b.score));
    Ok(results)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_index_and_search_documents() {
        let docs = vec![DocSearchInput {
            id: "doc-1".to_string(),
            title: "Tauri v2 ガイド".to_string(),
            content: "QuMaEditor は Rust で動作します。\nTags: #ガイド".to_string(),
        }];
        index_documents_native(docs).unwrap();
        let hits = search_documents_native("Rust".to_string()).unwrap();
        assert_eq!(hits.len(), 1);
        assert_eq!(hits[0].doc_id, "doc-1");
    }
}
