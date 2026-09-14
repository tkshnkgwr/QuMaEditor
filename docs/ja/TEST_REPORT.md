# テスト実行結果報告書 (TEST_REPORT)

[English](docs/en/TEST_REPORT.md) | **日本語版**

## 1. テスト実施概要

- **実施日**: 2026-09-14
- **対象バージョン**: 次期リリース版 (v1.4.4 / Current Trunk)
- **実施環境**: Windows 11 / Node.js v22.18 / Rust 1.89 / Tauri v2

---

## 2. 5大事前強制検証 結果一覧

| #  | 検証項目                    | 実行コマンド                                                                     | 結果               |
| :- | :-------------------------- | :------------------------------------------------------------------------------- | :----------------- |
| 1  | **Rust コード整形検証**     | `cargo fmt --manifest-path src-tauri/Cargo.toml --check`                         | ✅ PASS (0 diff)   |
| 2  | **Rust コンパイル・型検証** | `cargo check --manifest-path src-tauri/Cargo.toml`                               | ✅ PASS (0 errors) |
| 3  | **Rust Clippy 品質検証**    | `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings` | ✅ PASS (0 warns)  |
| 4  | **Rust ユニットテスト検証** | `cargo test --manifest-path src-tauri/Cargo.toml`                                | ✅ PASS (36/36 ok) |
| 5  | **TypeScript 型検証**       | `npm run lint`                                                                   | ✅ PASS (0 errors) |

---

## 3. Rust ユニットテスト詳細結果 (全36件 PASS)

| ID    | テスト関数名                                                           | モジュール                  | 検証内容                                                                   | 結果     |
| :---- | :--------------------------------------------------------------------- | :-------------------------- | :------------------------------------------------------------------------- | :------- |
| UT-01 | `test_detect_and_convert_to_utf8_utf8`                                 | `encoding`                  | UTF-8 バイト配列の正常判定と変換                                           | **Pass** |
| UT-02 | `test_detect_and_convert_to_utf8_shift_jis`                            | `encoding`                  | Shift_JIS バイト配列の正常判定と UTF-8 変換                                | **Pass** |
| UT-03 | `test_convert_utf8_to_encoding_sjis`                                   | `encoding`                  | UTF-8 文字列から Shift_JIS バイト列への正常エンコード                      | **Pass** |
| UT-04 | `test_convert_utf8_to_encoding_euc_jp`                                 | `encoding`                  | UTF-8 文字列から EUC-JP バイト列への正常エンコード                        | **Pass** |
| UT-05 | `test_read_file_native_valid_file`                                     | `file_io`                   | 実ローカルファイルの正常読込とエンコード判定                               | **Pass** |
| UT-06 | `test_read_file_native_not_found`                                      | `file_io`                   | 存在しないファイルパス指定時の安全なエラーハンドリング                     | **Pass** |
| UT-07 | `test_write_file_native`                                               | `file_io`                   | UTF-8 テキストの正常ファイル書き込み                                       | **Pass** |
| UT-08 | `test_write_file_bytes_native`                                         | `file_io`                   | 生バイト配列の正常ファイル直接書き込み                                     | **Pass** |
| UT-09 | `test_atomic_write_file_native`                                        | `file_io`                   | アトミック書き込み・ファイル破損防止・mtime 保証                           | **Pass** |
| UT-10 | `test_get_file_metadata_native`                                        | `file_io`                   | ファイルの存在・更新日時 (mtime)・サイズ取得                               | **Pass** |
| UT-11 | `test_open_folder_native`                                              | `file_io`                   | エクスプローラーの安全起動とハイライト指定                                 | **Pass** |
| UT-12 | `test_index_and_search_documents`                                      | `search`                    | 転置インデックスへのドキュメント登録とキーワード全文検索                   | **Pass** |
| UT-13 | `test_search_japanese_multibyte_slice_no_panic`                        | `search`                    | 日本語マルチバイト境界でのスライス安全検証（panic 防止）                    | **Pass** |
| UT-14 | `test_search_workspace_dir_native`                                     | `search`                    | `rayon` マルチスレッド並列処理によるワークスペースフォルダ内全文検索       | **Pass** |
| UT-15 | `test_compute_text_diff_native`                                        | `diff`                      | 2つのテキスト間の行単位差分計算 (`similar`)                                | **Pass** |
| UT-16 | `test_compute_detailed_diff_native`                                    | `diff`                      | 行番号 Old/New および単語単位インライン差分（`inline_changes`）詳細計算      | **Pass** |
| UT-17 | `test_parse_markdown_native`                                           | `diff`                      | `pulldown-cmark` による Markdown -> HTML 高速変換                          | **Pass** |
| UT-18 | `test_calculate_text_stats_native`                                     | `text_processing/stats`     | リアルタイム文字数、単語数、行数、読了時間算出                             | **Pass** |
| UT-19 | `test_parse_yaml_front_matter_native`                                  | `text_processing/yaml`      | YAML Front Matter のメタデータ・タグ抽出                                   | **Pass** |
| UT-20 | `test_extract_headings_native`                                         | `text_processing/structure` | H1〜H6 見出し目次ツリーの正確な抽出                                        | **Pass** |
| UT-21 | `test_toggle_task_native`                                              | `text_processing/structure` | タスクチェックボックス (`- [ ]` ↔ `- [x]`) の高速状態トグル                | **Pass** |
| UT-22 | `test_format_markdown_native`                                          | `text_processing/formatter` | 表組み垂直整列、見出し空行自動挿入、連続空行圧縮                           | **Pass** |
| UT-23 | `test_format_markdown_native_front_matter_and_code_block_protection`   | `text_processing/formatter` | フロントマター・コードブロック内空行の完全保護                             | **Pass** |
| UT-24 | `test_render_markdown_html_native`                                     | `text_processing/html`      | `syntect` 構文ハイライト付き HTML 事前生成                                 | **Pass** |
| UT-25 | `test_export_html_full_native`                                         | `text_processing/html`      | 完全スタンドアロン HTML エクスポートドキュメント生成                       | **Pass** |
| UT-26 | `test_rope_manager_operations`                                         | `rope_buffer`               | `ropey` による Rope バッファ挿入・削除・行スライス・破棄ライフサイクル     | **Pass** |
| UT-27 | `test_sync_manager_lifecycle`                                          | `sync_manager`              | `FileSyncManager` の mtime 追跡、自プロセス保存ロック・解除判定             | **Pass** |
| UT-28 | `test_export_notes_to_zip_native`                                      | `export_zip`                | `zip` クレートによる複数ノート・画像アセットの一括 Deflate 圧縮 ZIP 出力   | **Pass** |
| UT-29 | `test_lint_duplicate_particles`                                        | `proofreading`              | 連続助詞（「のの」「はは」等）の自動検出                                   | **Pass** |
| UT-30 | `test_lint_variant_pairs`                                              | `proofreading`              | 表記ゆれ（「サーバ」と「サーバー」等）の混在検出                           | **Pass** |
| UT-31 | `test_lint_unclosed_code_block`                                        | `proofreading`              | 未閉じコードブロック（```` ``` ````）の自動検出                            | **Pass** |
| UT-32 | `test_validate_valid_flowchart`                                        | `mermaid_validator`         | 有効な Mermaid フローチャート構文判定および SHA-256 ハッシュ生成           | **Pass** |
| UT-33 | `test_validate_unknown_header`                                         | `mermaid_validator`         | 未知のダイアグラム宣言ヘッダーに対する構文エラー判定                       | **Pass** |
| UT-34 | `test_validate_unbalanced_brackets`                                    | `mermaid_validator`         | 未閉じ括弧を含む不正 Mermaid 構文の事前検出                                | **Pass** |
| UT-35 | `test_mmap_read_file_chunk_native`                                     | `mmap_reader`               | `memmap2` によるメモリマップドファイル部分チャンクゼロコピー読み出し       | **Pass** |
| UT-36 | `test_scan_workspace_tree_native`                                      | `workspace_scanner`         | `ignore` による .gitignore 準拠・隠しフォルダ除外並列ファイルツリー構築    | **Pass** |

