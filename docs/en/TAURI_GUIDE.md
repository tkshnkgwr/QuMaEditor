# Tauri v2 Development, IPC & Testing Guide (TAURI_GUIDE)

**English Version** | [日本語版](../ja/TAURI_GUIDE.md)

This document describes the **Tauri v2** native backend architecture, IPC communication protocols, capability security settings, and test suite guidelines for QuMaEditor.

---

## 1. Tauri v2 IPC Communication Architecture

QuMaEditor uses a high-performance **IPC (Inter-Process Communication)** bridge between the frontend (React 18 + TypeScript) and native Rust engine.

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

## 2. Native IPC Commands Summary

| Command                      | Arguments                                 | Return Type                  | Description                                 |
| :--------------------------- | :---------------------------------------- | :--------------------------- | :------------------------------------------ |
| `detect_and_convert_to_utf8` | `bytes: Vec<u8>`                          | `Result<ConvertedTextDto>`   | Auto encoding detection & UTF-8 decoding    |
| `convert_utf8_to_encoding`   | `text: String, target_encoding: String`   | `Result<Vec<u8>>`            | Encodes text to Shift_JIS / EUC-JP bytes    |
| `read_file_chunk_native`     | `file_path: String, offset, chunk_size`  | `Result<ChunkResultDto>`     | 10MB+ large file chunk streaming            |
| `index_documents_native`     | `docs: Vec<DocSearchInput>`               | `Result<usize>`              | Batch registration for inverted index search |
| `search_documents_native`    | `query: String`                           | `Result<Vec<SearchHitDto>>`  | Ultra-fast word & line inverted index search |
| `batch_convert_files_native` | `items: Vec<BatchConvertItem>`            | `Result<BatchConvertResult>` | Rayon multi-threaded batch conversion       |
| `compute_text_diff_native`   | `old_text: String, new_text: String`      | `Result<Vec<DiffChangeDto>>` | Line-by-line diff using `similar` crate     |
| `parse_markdown_native`      | `markdown: String`                        | `Result<String>`             | Fast Markdown -> HTML via `pulldown-cmark`  |
| `generate_pdf_native`        | `title: String, content: String`          | `Result<Vec<u8>>`            | Direct PDF generation via `printpdf`        |
| `highlight_code_native`      | `code: String, language: String`          | `Result<String>`             | Syntax highlighted HTML via `syntect`       |

---

## 3. Capabilities & Permissions

Tauri v2 manages system capabilities strictly via `src-tauri/capabilities/default.json`:

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

## 4. Tauri Testing Guide

Testing Tauri desktop applications involves three layers:

1. **Rust Backend Unit Tests (`cargo test`)**: Verify core functions and DTO serialization.
2. **Frontend Tauri IPC Bridge Mocks (Vitest / Jest)**: Mock `window.__TAURI_INTERNALS__` to test wrapper functions in `src/utils/tauriNative.ts`.
3. **E2E Graphical UI Tests (Playwright / WebdriverIO)**: Automate WebView2 window interactions and user flows.
