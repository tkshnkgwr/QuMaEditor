# Test Execution Report (TEST_REPORT)

**English** | [日本語版](docs/ja/TEST_REPORT.md)

## 1. Test Overview

- **Date**: 2026-08-21
- **Version**: v1.4.2
- **Environment**: Windows 11 / Node.js v22.18 / Rust 1.89 / Tauri v2

---

## 2. Pre-Commit Verifications Results

| #  | Verification Item             | Command                                                           | Result             |
| :- | :---------------------------- | :---------------------------------------------------------------- | :----------------- |
| 1  | **Rust Code Formatting**      | `cargo fmt --manifest-path src-tauri/Cargo.toml --check`          | ✅ PASS (0 diff)   |
| 2  | **Rust Compilation & Types**  | `cargo check --manifest-path src-tauri/Cargo.toml`                | ✅ PASS (0 errors) |
| 3  | **Rust Clippy Strict Linter** | `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets` | ✅ PASS (0 warns)  |
| 4  | **Rust Unit Tests**           | `cargo test --manifest-path src-tauri/Cargo.toml`                 | ✅ PASS (22/22 ok) |
| 5  | **TypeScript Type Check**     | `npm run lint`                                                    | ✅ PASS (0 errors) |

---

## 3. Rust Unit Test Details (22 Tests Passed)

| ID    | Test Function Name                                           | Module                      | Verification Summary                                                 | Result   |
| :---- | :----------------------------------------------------------- | :-------------------------- | :------------------------------------------------------------------- | :------- |
| UT-01 | `test_detect_and_convert_to_utf8_utf8`                       | `encoding`                  | UTF-8 byte array detection and conversion                            | **Pass** |
| UT-02 | `test_detect_and_convert_to_utf8_shift_jis`                  | `encoding`                  | Shift_JIS byte array detection and UTF-8 conversion                  | **Pass** |
| UT-03 | `test_convert_utf8_to_encoding_sjis`                         | `encoding`                  | UTF-8 string encoding to Shift_JIS bytes                             | **Pass** |
| UT-04 | `test_convert_utf8_to_encoding_euc_jp`                       | `encoding`                  | UTF-8 string encoding to EUC-JP bytes                               | **Pass** |
| UT-05 | `test_read_file_native_valid_file`                           | `file_io`                   | Real local file reading and encoding check                           | **Pass** |
| UT-06 | `test_read_file_native_not_found`                            | `file_io`                   | Non-existent file path error handling                                | **Pass** |
| UT-07 | `test_write_file_native`                                     | `file_io`                   | Direct UTF-8 string file write                                       | **Pass** |
| UT-08 | `test_write_file_bytes_native`                               | `file_io`                   | Direct raw byte array file write                                     | **Pass** |
| UT-09 | `test_get_file_metadata_native`                              | `file_io`                   | File existence, `mtime`, and size retrieval                          | **Pass** |
| UT-10 | `test_open_folder_native`                                    | `file_io`                   | Windows Explorer opening with highlighted file                       | **Pass** |
| UT-11 | `test_index_and_search_documents`                            | `search`                    | Inverted index insertion and keyword full-text search                | **Pass** |
| UT-12 | `test_search_japanese_multibyte_slice_no_panic`              | `search`                    | Multibyte boundary safe slicing without panic                        | **Pass** |
| UT-13 | `test_compute_text_diff_native`                              | `diff`                      | Line-by-line diff calculation (`similar`)                            | **Pass** |
| UT-14 | `test_parse_markdown_native`                                 | `diff`                      | Fast Markdown to HTML conversion via `pulldown-cmark`                | **Pass** |
| UT-15 | `test_calculate_text_stats_native`                           | `text_processing/stats`     | Real-time character, word, line, reading time calculation            | **Pass** |
| UT-16 | `test_parse_yaml_front_matter_native`                        | `text_processing/yaml`      | YAML Front Matter metadata parsing                                   | **Pass** |
| UT-17 | `test_extract_headings_native`                               | `text_processing/structure` | H1~H6 outline tree extraction                                        | **Pass** |
| UT-18 | `test_toggle_task_native`                                    | `text_processing/structure` | Task checkbox toggle (`- [ ]` ↔ `- [x]`)                             | **Pass** |
| UT-19 | `test_parse_csv_preview_native`                              | `text_processing/csv`       | Zero-copy CSV line counting and cell extraction                      | **Pass** |
| UT-20 | `test_format_markdown_native`                                | `text_processing/formatter` | GFM table alignment, heading spacing, blank line collapsing          | **Pass** |
| UT-21 | `test_format_markdown_native_front_matter_and_code_block...` | `text_processing/formatter` | Code block and front matter preservation                             | **Pass** |
| UT-22 | `test_render_markdown_html_native`                           | `text_processing/html`      | Pre-rendering HTML with syntect syntax highlighting                  | **Pass** |
| UT-23 | `test_export_html_full_native`                               | `text_processing/html`      | Standalone HTML document export generation                           | **Pass** |
