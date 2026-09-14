# Test Execution Report (TEST_REPORT)

**English** | [日本語版](../ja/TEST_REPORT.md)

## 1. Test Overview

- **Date**: 2026-09-14
- **Target Version**: v1.4.5 (Release)
- **Environment**: Windows 11 / Node.js v22.18 / Rust 1.89 / Tauri v2

---

## 2. Pre-Commit Verifications Results

| #  | Verification Item             | Command                                                                          | Result             |
| :- | :---------------------------- | :------------------------------------------------------------------------------- | :----------------- |
| 1  | **Rust Code Formatting**      | `cargo fmt --manifest-path src-tauri/Cargo.toml --check`                         | ✅ PASS (0 diff)   |
| 2  | **Rust Compilation & Types**  | `cargo check --manifest-path src-tauri/Cargo.toml`                               | ✅ PASS (0 errors) |
| 3  | **Rust Clippy Strict Linter** | `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings` | ✅ PASS (0 warns)  |
| 4  | **Rust Unit Tests**           | `cargo test --manifest-path src-tauri/Cargo.toml`                                | ✅ PASS (39/39 ok) |
| 5  | **TypeScript Type Check**     | `npm run lint`                                                                   | ✅ PASS (0 errors) |

---

## 3. Rust Unit Test Details (All 39 Tests Passed)

| ID    | Test Function Name                                                     | Module                        | Verification Summary                                                   | Result   |
| :---- | :--------------------------------------------------------------------- | :---------------------------- | :--------------------------------------------------------------------- | :------- |
| UT-01 | `test_detect_and_convert_to_utf8_utf8`                                 | `encoding`                    | UTF-8 byte array detection and conversion                              | **Pass** |
| UT-02 | `test_detect_and_convert_to_utf8_shift_jis`                            | `encoding`                    | Shift_JIS byte array detection and UTF-8 conversion                    | **Pass** |
| UT-03 | `test_convert_utf8_to_encoding_sjis`                                   | `encoding`                    | UTF-8 string encoding to Shift_JIS bytes                               | **Pass** |
| UT-04 | `test_convert_utf8_to_encoding_euc_jp`                                 | `encoding`                    | UTF-8 string encoding to EUC-JP bytes                                 | **Pass** |
| UT-05 | `test_read_file_native_valid_file`                                     | `file_io`                     | Real local file reading and encoding check                             | **Pass** |
| UT-06 | `test_read_file_native_not_found`                                      | `file_io`                     | Non-existent file path safe error handling                             | **Pass** |
| UT-07 | `test_write_file_native`                                               | `file_io`                     | Direct UTF-8 string file write                                         | **Pass** |
| UT-08 | `test_write_file_bytes_native`                                         | `file_io`                     | Direct raw byte array file write                                       | **Pass** |
| UT-09 | `test_atomic_write_file_native`                                        | `file_io`                     | Atomic write, corruption prevention, and mtime preservation            | **Pass** |
| UT-10 | `test_get_file_metadata_native`                                        | `file_io`                     | File existence, `mtime`, and size retrieval                            | **Pass** |
| UT-11 | `test_open_folder_native`                                              | `file_io`                     | Windows Explorer opening with highlighted target file                  | **Pass** |
| UT-12 | `test_index_and_search_documents`                                      | `search`                      | Inverted index insertion and keyword full-text search                  | **Pass** |
| UT-13 | `test_search_japanese_multibyte_slice_no_panic`                        | `search`                      | Multibyte boundary safe slicing without panic                          | **Pass** |
| UT-14 | `test_search_workspace_dir_native`                                     | `search`                      | Parallel multi-threaded workspace full-text search (`rayon`)           | **Pass** |
| UT-15 | `test_compute_text_diff_native`                                        | `diff`                        | Line-by-line diff calculation (`similar`)                              | **Pass** |
| UT-16 | `test_compute_detailed_diff_native`                                    | `diff`                        | Detailed diff with line numbers and inline word-level changes          | **Pass** |
| UT-17 | `test_parse_markdown_native`                                           | `diff`                        | Fast Markdown to HTML conversion via `pulldown-cmark`                  | **Pass** |
| UT-18 | `test_calculate_text_stats_native`                                     | `text_processing/stats`       | Real-time character, word, line, reading time calculation              | **Pass** |
| UT-19 | `test_parse_yaml_front_matter_native`                                  | `text_processing/yaml`        | YAML Front Matter metadata parsing and tag extraction                  | **Pass** |
| UT-20 | `test_extract_headings_native`                                         | `text_processing/structure`   | H1~H6 outline tree extraction                                          | **Pass** |
| UT-21 | `test_toggle_task_native`                                              | `text_processing/structure`   | Task checkbox toggle (`- [ ]` ↔ `- [x]`)                               | **Pass** |
| UT-22 | `test_format_markdown_native`                                          | `text_processing/formatter`   | GFM table alignment, heading spacing, blank line collapsing            | **Pass** |
| UT-23 | `test_format_markdown_native_front_matter_and_code_block_protection`   | `text_processing/formatter`   | Code block and front matter preservation                               | **Pass** |
| UT-24 | `test_render_markdown_html_native`                                     | `text_processing/html`        | Pre-rendering HTML with syntect syntax highlighting                    | **Pass** |
| UT-25 | `test_export_html_full_native`                                         | `text_processing/html`        | Standalone HTML document export generation                             | **Pass** |
| UT-26 | `test_rope_manager_operations`                                         | `rope_buffer`                 | `ropey` buffer insert, delete, slice, and lifecycle management         | **Pass** |
| UT-27 | `test_sync_manager_lifecycle`                                          | `sync_manager`                | `FileSyncManager` mtime tracking and self-save lock management         | **Pass** |
| UT-28 | `test_export_notes_to_zip_native`                                      | `export_zip`                  | Multi-note and asset Deflate ZIP archive export via `zip` crate        | **Pass** |
| UT-29 | `test_lint_duplicate_particles`                                        | `proofreading`                | Duplicate particle detection in Japanese text                          | **Pass** |
| UT-30 | `test_lint_variant_pairs`                                              | `proofreading`                | Spelling variant detection in Japanese text                            | **Pass** |
| UT-31 | `test_lint_unclosed_code_block`                                        | `proofreading`                | Unclosed code block detection (lint)                                   | **Pass** |
| UT-32 | `test_validate_valid_flowchart`                                        | `mermaid_validator`           | Valid Mermaid flowchart validation and SHA-256 hash generation         | **Pass** |
| UT-33 | `test_validate_unknown_header`                                         | `mermaid_validator`           | Unknown diagram header validation error handling                       | **Pass** |
| UT-34 | `test_validate_unbalanced_brackets`                                    | `mermaid_validator`           | Unbalanced bracket detection in Mermaid syntax                         | **Pass** |
| UT-35 | `test_mmap_read_file_chunk_native`                                     | `mmap_reader`                 | Memory-mapped zero-copy file chunk reading via `memmap2`               | **Pass** |
| UT-36 | `test_scan_workspace_tree_native`                                      | `workspace_scanner`           | Parallel workspace file tree scanning respecting `.gitignore`          | **Pass** |
| UT-37 | `test_obsidian_soft_break_to_hard_break`                               | `text_processing/html`        | Obsidian single Enter line break (<br /> generation) test              | **Pass** |
| UT-38 | `test_obsidian_highlight_and_wikilink`                                 | `text_processing/html`        | Highlight ==text== and wikilink [[note]] conversion test               | **Pass** |
| UT-39 | `test_obsidian_callout_rendering`                                      | `text_processing/html`        | Obsidian callouts ([!NOTE] etc.) card HTML conversion test             | **Pass** |

