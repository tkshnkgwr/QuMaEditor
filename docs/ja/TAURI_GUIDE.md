# Tauri v2 開発・IPC 仕様・テストガイド (TAURI_GUIDE)

[English Version](../en/TAURI_GUIDE.md) | **日本語版**

本ドキュメントは、QuMaEditor における **Tauri v2** ネイティブバックエンドのアーキテクチャ、IPC 通信プロトコル、パーミッション設定（Capabilities）、およびテストコード作成ガイドラインです。

---

## 1. Tauri v2 IPC 通信アーキテクチャ

QuMaEditor は、フロントエンド (React 18 + TypeScript) とバックエンド (Rust Engine) 間で高速な **IPC (Inter-Process Communication)** 通信を行っています。

```
+-----------------------------------------------------------------------+
|  Frontend (React)                                                     |
|  src/utils/tauriNative.ts                                             |
|   - invoke('detect_and_convert_to_utf8', { bytes })                   |
|   - invoke('search_documents_native', { query })                      |
+-----------------------------------------------------------------------+
                                  │ (Tauri IPC Protocol)
                                  ▼
+-----------------------------------------------------------------------+
|  Backend (Tauri v2 + Rust)                                            |
|  src-tauri/src/lib.rs                                                 |
|   - #[tauri::command] pub fn detect_and_convert_to_utf8(...)          |
|   - #[tauri::command] pub fn search_documents_native(...)           |
+-----------------------------------------------------------------------+
```

---

## 2. IPC コマンド一覧 & DTO 定義

| コマンド名                    | 引数                                      | 戻り値                       | 概要                                         |
| :---------------------------- | :---------------------------------------- | :--------------------------- | :------------------------------------------- |
| `detect_and_convert_to_utf8`  | `bytes: Vec<u8>`                          | `Result<ConvertedTextDto>`   | バイト配列の文字コード自動判別 & UTF-8 デコード |
| `convert_utf8_to_encoding`    | `text: String, target_encoding: String`   | `Result<Vec<u8>>`            | 指定エンコーディングへのエンコード保存バイト生成 |
| `read_file_chunk_native`      | `file_path: String, offset, chunk_size`  | `Result<ChunkResultDto>`     | 10MB+ 大容量ファイルのメモリ分割ストリーミング |
| `index_documents_native`      | `docs: Vec<DocSearchInput>`               | `Result<usize>`              | 転置インデックス検索エンジンへの一括登録     |
| `search_documents_native`     | `query: String`                           | `Result<Vec<SearchHitDto>>`  | 単語・行単位爆速全文検索                     |
| `batch_convert_files_native`  | `items: Vec<BatchConvertItem>`            | `Result<BatchConvertResult>` | `rayon` マルチスレッド一括文字コード変換     |
| `compute_text_diff_native`    | `old_text: String, new_text: String`      | `Result<Vec<DiffChangeDto>>` | `similar` クレートによる行単位差分算出       |
| `parse_markdown_native`       | `markdown: String`                        | `Result<String>`             | `pulldown-cmark` 高速 Markdown -> HTML 変換  |
| `generate_pdf_native`         | `title: String, content: String`          | `Result<Vec<u8>>`            | `printpdf` ネイティブ PDF バイナリ直接生成   |
| `highlight_code_native`       | `code: String, language: String`          | `Result<String>`             | `syntect` ネイティブ構文ハイライト HTML 生成 |

---

## 3. Capabilities & セキュリティパーミッション

Tauri v2 では、`src-tauri/capabilities/default.json` にてアプリがアクセス可能なシステム権限（ファイルアクセス、ダイアログ表示、HTTP 通信等）を厳格に定義・管理しています。

```json
{
  "$schema": "../node_modules/@tauri-apps/cli/config.schema.json",
  "identifier": "default",
  "description": "QuMaEditor default permissions",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "dialog:default",
    "fs:default",
    "http:default"
  ]
}
```

---

## 4. Tauri テストコード構築ガイド (Testing Guide)

Tauri アプリケーションのテストは、以下の 3 つのレイヤーで構築・実施されます：

### A. Rust バックエンド単体 & モック統合テスト (`cargo test`)
Tauri の `tauri::test::mock_builder()` を使用して、Tauri AppContext を仮想ビルドし、IPC コマンドのハンドラーが正常にアタッチされるか検証します。

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tauri_command_mock_invocation() {
        let app = tauri::test::mock_builder().build(tauri::generate_context!());
        assert!(app.is_ok());
    }
}
```

### B. フロントエンド Tauri IPC ブリッジテスト (Vitest / Jest)
`window.__TAURI_INTERNALS__` をモック化し、`src/utils/tauriNative.ts` 内の各関数の振る舞いを検証します。

### C. E2E UI 画面自動テスト (Playwright / WebdriverIO)
Tauri WebView2 ウィンドウを直接起動し、ボタンクリックやテキスト入力をグラフィカルに自動検証します。
