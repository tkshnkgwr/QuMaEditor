# アーキテクチャ設計書 (ARCHITECTURE)

[English Version](../en/ARCHITECTURE.md) | **日本語版**

## 1. 全体プロセスモデル (Tauri Process Architecture)

本アプリケーションは、Tauri v2 フレームワークを採用したマルチプロセス型のデスクトップアプリケーションです。Rustで構築されたバックエンドコアプロセスと、Webview2 (React 19) で構築されたレンダラープロセスが安全かつ高速なIPC通信を行って連携します。

```
+-------------------------------------------------------------------------------+
|                             Tauri v2 Desktop App                              |
|                                                                               |
|  +-------------------------------------------------------------------------+  |
|  |                 Core Process (Rust / src-tauri)                         |  |
|  |  - Native Window Management (Decorations, Transparency)                 |  |
|  |  - Tauri Plugins (fs, dialog, http)                                     |  |
|  |  - Native IPC Command Handlers (read_file, write_file, open_folder)     |  |
|  +-------------------------------------------------------------------------+  |
|                                     |                                         |
|                             Tauri IPC Boundary                                |
|                                     |                                         |
|  +-------------------------------------------------------------------------+  |
|  |                 Renderer Process (Webview2 / React 19)                  |  |
|  |  +------------------+   +-------------------+   +--------------------+  |  |
|  |  |    TitleBar      |   |      Sidebar      |   |      Toolbar       |  |  |
|  |  +------------------+   +-------------------+   +--------------------+  |  |
|  |           |                       |                       |             |  |
|  |           +-----------------------+-----------------------+             |  |
|  |                                   v                                     |  |
|  |                     +---------------------------+                       |  |
|  |                     |   App Component (State)   |                       |  |
|  |                     +---------------------------+                       |  |
|  |                       /           |           \                         |  |
|  |                      v            v            v                        |  |
|  |             +------------+ +--------------+ +---------------+           |  |
|  |             | Editor.tsx | | Preview.tsx  | | StatusBar.tsx |           |  |
|  |             +------------+ +--------------+ +---------------+           |  |
|  |                   |               |                 |                   |  |
|  |                   v               v                 v                   |  |
|  |           +---------------+ +--------------+ +---------------+          |  |
|  |           | markdownUtils | |react-markdown| | encodingUtils |          |  |
|  |           +---------------+ +--------------+ +---------------+          |  |
|  |                                                     |                   |  |
|  |                                                     v                   |  |
|  |                                             +---------------+           |  |
|  |                                             | LocalStorage  |           |  |
|  |                                             +---------------+           |  |
|  +-------------------------------------------------------------------------+  |
+-------------------------------------------------------------------------------+
```

## 2. 文字コード判別＆データフロー

ファイルインポート・エクスポート時のデータ処理フローは以下の通りです。

```
[ファイル選択 (.md / .txt)]
         |
         v (FileReader / Tauri FS Plugin / read_file_native)
[Uint8Array バイナリデータ]
         |
         v (encoding_rs / detect_and_convert_to_utf8)
[文字コード判定: UTF-8 / Shift_JIS / EUC-JP]
         |
         v (Rust Native / UNICODE string)
[JavaScript 内部標準UTF-8文字列 (App State)]
         |
    +----+----+
    |         |
    v         v
[Editor]  [Preview (ReactMarkdown + RehypeHighlight)]
    |
    v (エクスポート実行)
[prepareEncodedBlob() / write_file_native()]
    |-- Shift_JIS -> 改行コードを CRLF (\r\n) に置換 -> SJISエンコード
    |-- EUC-JP    -> 改行コードを LF (\n) に置換   -> EUCJPエンコード
    |-- UTF-8     -> 改行コードを LF (\n) に置換   -> UTF8エンコード
         |
         v
[Blob -> ローカルファイル保存 / Tauri Dialog / FS Plugin / Native Direct Write]
```

## 3. 永続化設計 (Persistence Architecture)

- **主ストレージ**: ブラウザの `LocalStorage` キー `markdown_editor_docs_v1` および Tauri ネイティブファイルシステム連携
- **デバウンス制御**: タイプ毎にLocalStorageに即時書き込みを行うとパフォーマンスが低下するため、`autoSaveIntervalMs`（標準値 3000ms）のタイマー制御により遅延書き込みを適用。
- **自動ストレージスリム化 (Memory Slimming GC)**: PC 上の実ファイルに保存済みのドキュメントは LocalStorage 保存時に軽量プレースホルダー (`<!-- [STORAGE_SLIMMED_LOAD_FROM_DISK] -->`) へ自動圧縮し、LocalStorage の容量オーバー (`QuotaExceededError`) を永久に防止。
- **データ互換性**: ドキュメントデータ構造に `encoding` プロパティを持たせることで、ドキュメントごとの選択文字コード設定を永続化。

## 4. Rust ネイティブコマンド拡張 (Native Commands)

| コマンド名 | 概要 |
| :--- | :--- |
| `read_file_native` | 権限制限を受けずに高速・確実にローカルディスクからファイルを直読み込み |
| `write_file_native` | ダイアログ許可範囲外の元ファイルパスへの直接上書き保存を実行 |
| `open_folder_native` | 対象ファイルの親フォルダを Windows エクスプローラー (`explorer.exe`) で直接オープン |
| `search_documents_native` | メモリ上転置インデックスを用いた Rust 高速全文検索 |
