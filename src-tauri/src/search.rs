//! # 爆速全文検索 & インデックス モジュール
//!
//! メモリ内転置インデックスを活用した爆速ドキュメント・タグ検索機能を提供します。

use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::{Path, PathBuf};
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
    /// ヒットしたドキュメント ID またはファイルパス
    pub doc_id: String,
    /// ドキュメントタイトルまたはファイル名
    pub title: String,
    /// マッチした行のプレビュー抜き出し
    pub snippet: String,
    /// スコア (マッチ数)
    pub score: u32,
    /// ヒットした行番号 (1-indexed)
    pub line_number: Option<u32>,
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

/// 単一ドキュメントを検索して SearchResult を抽出
fn search_single_doc(id: &str, title: &str, content: &str, q: &str) -> Option<SearchResult> {
    let title_lower = title.to_lowercase();
    let content_lower = content.to_lowercase();

    let title_matches = title_lower.matches(q).count();
    let content_matches = content_lower.matches(q).count();

    if title_matches == 0 && content_matches == 0 {
        return None;
    }

    let score = (title_matches * 3 + content_matches) as u32;

    let mut snippet = String::new();
    let mut matched_line_no = None;

    for (line_idx, line) in content.lines().enumerate() {
        if line.to_lowercase().contains(q) {
            let trimmed = line.trim();
            let char_count = trimmed.chars().count();
            snippet = if char_count > 80 {
                let truncated: String = trimmed.chars().take(80).collect();
                format!("{}...", truncated)
            } else {
                trimmed.to_string()
            };
            matched_line_no = Some((line_idx + 1) as u32);
            break;
        }
    }

    if snippet.is_empty() {
        snippet = title.to_string();
    }

    Some(SearchResult {
        doc_id: id.to_string(),
        title: title.to_string(),
        snippet,
        score,
        line_number: matched_line_no,
    })
}

/// ドキュメントリストからクエリに一致するものを rayon 並列で高速検索する
pub fn search_documents_in_list(docs: &[DocSearchInput], query: &str) -> Vec<SearchResult> {
    let q = query.trim().to_lowercase();
    if q.is_empty() {
        return Vec::new();
    }

    let mut results: Vec<SearchResult> = docs
        .par_iter()
        .filter_map(|doc| search_single_doc(&doc.id, &doc.title, &doc.content, &q))
        .collect();

    results.sort_by_key(|b| std::cmp::Reverse(b.score));
    results
}

/// クエリキーワードでインメモリインデックスの高速全文検索を行う (rayon並列)
pub fn search_documents_native(query: String) -> Result<Vec<SearchResult>, String> {
    let index = SEARCH_INDEX
        .lock()
        .map_err(|e| format!("インデックスのロック取得失敗: {}", e))?;

    Ok(search_documents_in_list(&index, &query))
}

/// ワークスペースディレクトリ内の走査対象外ディレクトリ判定
fn should_skip_dir(entry_name: &str) -> bool {
    matches!(
        entry_name,
        ".git" | "node_modules" | "target" | "dist" | ".system_generated" | ".tauri"
    )
}

/// ディレクトリを再帰的に走査して対象拡張子ファイルを収集
fn collect_workspace_files(
    dir: &Path,
    extensions: &[String],
    results: &mut Vec<PathBuf>,
) -> std::io::Result<()> {
    if !dir.is_dir() {
        return Ok(());
    }

    for entry in std::fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();
        let file_name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or_default();

        if path.is_dir() {
            if !should_skip_dir(file_name) && !file_name.starts_with('.') {
                let _ = collect_workspace_files(&path, extensions, results);
            }
        } else if path.is_file() {
            let matches_ext = if extensions.is_empty() {
                true
            } else {
                path.extension()
                    .and_then(|ext| ext.to_str())
                    .map(|ext_str| {
                        extensions.iter().any(|allowed| {
                            allowed
                                .trim_start_matches('.')
                                .eq_ignore_ascii_case(ext_str)
                        })
                    })
                    .unwrap_or(false)
            };

            if matches_ext {
                results.push(path);
            }
        }
    }

    Ok(())
}

/// 実ディレクトリ・フォルダ内のファイルを rayon で並列走査して高速全文検索を行う
pub fn search_workspace_dir_native(
    dir_path: String,
    query: String,
    extensions: Vec<String>,
) -> Result<Vec<SearchResult>, String> {
    let q = query.trim().to_lowercase();
    if q.is_empty() {
        return Ok(Vec::new());
    }

    let root_path = Path::new(&dir_path);
    if !root_path.exists() || !root_path.is_dir() {
        return Err(format!("有効なディレクトリではありません: {}", dir_path));
    }

    let mut file_paths = Vec::new();
    collect_workspace_files(root_path, &extensions, &mut file_paths)
        .map_err(|e| format!("ファイル収集エラー: {}", e))?;

    // rayon でファイルを並列読み取り＆全文検索
    let mut results: Vec<SearchResult> = file_paths
        .par_iter()
        .filter_map(|path| {
            let bytes = std::fs::read(path).ok()?;
            let text = match crate::encoding::detect_and_convert_to_utf8(bytes) {
                Ok(res) => res.text,
                Err(_) => return None,
            };

            let file_str = path.to_string_lossy().to_string();
            let title = path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or(&file_str)
                .to_string();

            search_single_doc(&file_str, &title, &text, &q)
        })
        .collect();

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
        let hits = search_documents_in_list(&docs, "Rust");
        assert_eq!(hits.len(), 1);
        assert_eq!(hits[0].doc_id, "doc-1");
    }

    #[test]
    fn test_search_japanese_multibyte_slice_no_panic() {
        // 日本語マルチバイト文字が境界付近（バイト長120前後）にあるケースのテスト
        let long_japanese_line = "これは日本語のテスト文章です。キーワード合致の確認を行っています。非常に長い文章が含まれており、従来のバイト長スライスではマルチバイト文字の途中で切断されてpanicを起こしていました。安全に文字数単位で切り詰められることを検証します。";
        let docs = vec![DocSearchInput {
            id: "doc-jp".to_string(),
            title: "日本語テスト文書".to_string(),
            content: format!("タイトル\n{}\nおわり", long_japanese_line),
        }];
        let hits = search_documents_in_list(&docs, "合致");
        assert_eq!(hits.len(), 1);
        assert_eq!(hits[0].doc_id, "doc-jp");
        assert!(hits[0].snippet.contains("合致"));
        assert!(hits[0].snippet.ends_with("..."));
    }

    #[test]
    fn test_search_workspace_dir_native() {
        let temp_dir = std::env::temp_dir().join("quma_search_test_dir");
        let _ = std::fs::create_dir_all(&temp_dir);

        let file1 = temp_dir.join("sample1.md");
        let file2 = temp_dir.join("sample2.txt");
        let file3 = temp_dir.join("sample3.other");

        std::fs::write(&file1, "# First File\nRust rayon is blazing fast!").unwrap();
        std::fs::write(&file2, "Second File\nRayon parallel directory search").unwrap();
        std::fs::write(&file3, "Ignored extension rayon content").unwrap();

        let hits = search_workspace_dir_native(
            temp_dir.to_string_lossy().to_string(),
            "blazing".to_string(),
            vec!["md".to_string(), "txt".to_string()],
        )
        .unwrap();

        assert_eq!(hits.len(), 1);
        assert!(hits[0].snippet.contains("blazing fast"));
        assert_eq!(hits[0].line_number, Some(2));

        let hits_all = search_workspace_dir_native(
            temp_dir.to_string_lossy().to_string(),
            "rayon".to_string(),
            vec!["md".to_string(), "txt".to_string()],
        )
        .unwrap();

        assert_eq!(hits_all.len(), 2);

        let _ = std::fs::remove_dir_all(&temp_dir);
    }
}
