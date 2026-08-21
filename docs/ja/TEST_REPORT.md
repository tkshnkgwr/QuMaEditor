# テスト実行結果報告書 (TEST_REPORT)

[English](docs/en/TEST_REPORT.md) | **日本語版**

## 1. テスト実施概要

- **実施日**: 2026-08-21
- **対象バージョン**: v1.4.2
- **実施環境**: Windows 11 / Node.js v22.18 / Rust 1.89 / Tauri v2

---

## 2. 5大事前強制検証 結果一覧

| #  | 検証項目                    | 実行コマンド                                                      | 結果               |
| :- | :-------------------------- | :---------------------------------------------------------------- | :----------------- |
| 1  | **Rust コード整形検証**     | `cargo fmt --manifest-path src-tauri/Cargo.toml --check`          | ✅ PASS (0 diff)   |
| 2  | **Rust コンパイル・型検証** | `cargo check --manifest-path src-tauri/Cargo.toml`                | ✅ PASS (0 errors) |
| 3  | **Rust Clippy 品質検証**    | `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets` | ✅ PASS (0 warns)  |
| 4  | **Rust ユニットテスト検証** | `cargo test --manifest-path src-tauri/Cargo.toml`                 | ✅ PASS (22/22 ok) |
| 5  | **TypeScript 型検証**       | `npm run lint`                                                    | ✅ PASS (0 errors) |

---

## 3. Rust ユニットテスト詳細結果 (全22件 PASS)

| ID    | テスト関数名                                                 | モジュール                  | 検証内容                                                             | 結果     |
| :---- | :----------------------------------------------------------- | :-------------------------- | :------------------------------------------------------------------- | :------- |
| UT-01 | `test_detect_and_convert_to_utf8_utf8`                       | `encoding`                  | UTF-8 バイト配列の正常判定と変換                                     | **Pass** |
| UT-02 | `test_detect_and_convert_to_utf8_shift_jis`                  | `encoding`                  | Shift_JIS バイト配列の正常判定と UTF-8 変換                          | **Pass** |
| UT-03 | `test_convert_utf8_to_encoding_sjis`                         | `encoding`                  | UTF-8 文字列から Shift_JIS バイト列への正常エンコード                | **Pass** |
| UT-04 | `test_convert_utf8_to_encoding_euc_jp`                       | `encoding`                  | UTF-8 文字列から EUC-JP バイト列への正常エンコード                  | **Pass** |
| UT-05 | `test_read_file_native_valid_file`                           | `file_io`                   | 実ローカルファイルの正常読込とエンコード判定                         | **Pass** |
| UT-06 | `test_read_file_native_not_found`                            | `file_io`                   | 存在しないファイルパス指定時の安全なエラーハンドリング               | **Pass** |
| UT-07 | `test_write_file_native`                                     | `file_io`                   | UTF-8 テキストの正常ファイル書き込み                                 | **Pass** |
| UT-08 | `test_write_file_bytes_native`                               | `file_io`                   | 生バイト配列の正常ファイル直接書き込み                               | **Pass** |
| UT-09 | `test_get_file_metadata_native`                              | `file_io`                   | ファイルの存在・更新日時 (mtime)・サイズ取得                         | **Pass** |
| UT-10 | `test_open_folder_native`                                    | `file_io`                   | エクスプローラーの安全起動とハイライト指定                           | **Pass** |
| UT-11 | `test_index_and_search_documents`                            | `search`                    | 転置インデックスへのドキュメント登録とキーワード全文検索             | **Pass** |
| UT-12 | `test_search_japanese_multibyte_slice_no_panic`              | `search`                    | 日本語マルチバイト境界でのスライス安全検証（panic 防止）              | **Pass** |
| UT-13 | `test_compute_text_diff_native`                              | `diff`                      | 2つのテキスト間の行単位差分計算 (`similar`)                          | **Pass** |
| UT-14 | `test_parse_markdown_native`                                 | `diff`                      | `pulldown-cmark` による Markdown -> HTML 高速変換                    | **Pass** |
| UT-15 | `test_calculate_text_stats_native`                           | `text_processing/stats`     | リアルタイム文字数、単語数、行数、読了時間算出                       | **Pass** |
| UT-16 | `test_parse_yaml_front_matter_native`                        | `text_processing/yaml`      | YAML Front Matter のメタデータ・タグ抽出                             | **Pass** |
| UT-17 | `test_extract_headings_native`                               | `text_processing/structure` | H1〜H6 見出し目次ツリーの正確な抽出                                  | **Pass** |
| UT-18 | `test_toggle_task_native`                                    | `text_processing/structure` | タスクチェックボックス (`- [ ]` ↔ `- [x]`) の高速状態トグル          | **Pass** |
| UT-19 | `test_parse_csv_preview_native`                              | `text_processing/csv`       | CSV のゼロコピー行カウント・クォート考慮セル抽出                     | **Pass** |
| UT-20 | `test_format_markdown_native`                                | `text_processing/formatter` | 表組み垂直整列、見出し空行自動挿入、連続空行圧縮                     | **Pass** |
| UT-21 | `test_format_markdown_native_front_matter_and_code_block...` | `text_processing/formatter` | フロントマター・コードブロック内空行の完全保護                       | **Pass** |
| UT-22 | `test_render_markdown_html_native`                           | `text_processing/html`      | `syntect` 構文ハイライト付き HTML 事前生成                           | **Pass** |
| UT-23 | `test_export_html_full_native`                               | `text_processing/html`      | 完全スタンドアロン HTML エクスポートドキュメント生成                 | **Pass** |
