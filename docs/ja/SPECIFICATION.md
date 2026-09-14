# 機能・技術仕様書 (SPECIFICATION)

[English](docs/en/SPECIFICATION.md) | **日本語版**

## 1. 概要 (Overview)

QuMaEditor は、**Tauri v2**, **Rust**, **React 19**, **TypeScript** で構築された、パフォーマンス最優先のデスクトップ Markdown エディタです。

---

## 2. コア機能一覧 (Core Features)

| 機能分類                 | 機能名                                          | 実装方式 / 技術詳細                                                                                    |
| :----------------------- | :---------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **テキスト編集**         | ゼロレイテンシ・タイピング                      | 編集専用モード時のプレビュー完全アンマウント、分割表示時の `useDeferredValue` 非同期解析                |
| **テキスト編集**         | `Ctrl+E` カーソル・フォーカス自動復元           | プレビュー切替時の選択範囲・キャレット位置保持とエディタ即時フォーカス                                  |
| **テキスト編集**         | Markdown 高速自動整形 (`Ctrl+Shift+F`)          | Rust `formatter.rs` による GFM 表組み垂直整列、見出し空行自動挿入、連続空行圧縮（コードブロック保護）  |
| **テキスト編集**         | Tabキーインデント & リスト階層化                | Tab による箇条書きネスト (`- ` ➔ `  - `)、複数行選択インデント、`Shift+Tab` アンインデント             |
| **テキスト編集**         | 大容量編集用 Rope データ構造                    | Rust `ropey` による Bツリー Rope バッファ管理、100MB 級ファイルでも $O(\log N)$ で高速挿入・削除       |
| **テキスト編集**         | タイプライター・スクロール                      | カーソル行を画面中央高さに自動固定し、視線移動を最小化（設定でトグル可能）                              |
| **校正・Lint**           | 日本語校正 ＆ 構文 lint 非同期解析              | Rust `proofreading.rs` による連続助詞・表記ゆれ・未閉じ括弧/ブロックの非同期高速検出 ＆ StatusBar 表示  |
| **ナビゲーション**       | 見出しアウトライン / 目次ツリー                 | Rust ネイティブ H1〜H6 高速抽出、階層インデントバッジ、キーワード絞り込み、エディタ＆プレビュー双方向ジャンプ |
| **プレビュー**           | 完全 Rust ネイティブ HTML レンダリング          | `pulldown-cmark` + `syntect` によるゼロ遅延・60fps ネイティブ HTML レンダリング ＆ 双方向タスク操作    |
| **プレビュー**           | Mermaid 構文事前検証 ＆ SVG 差分キャッシュ     | `mermaid_validator.rs` による SHA-256 キャッシュ・事前構文判定で未変更ダイアグラムの再描画負荷を根絶   |
| **ファイル I/O**         | アトミックファイル書き込み ＆ mtime 完全保証    | 一時ファイル先行書込・OS レベルリネームによる破損防止 0% 化、保存直後のミリ秒精度 mtime 即時返却       |
| **ファイル I/O**         | 複数ノート一括エクスポート ＆ ZIP 圧縮          | `zip` クレート（Deflate 圧縮）による全ノート・画像アセットの一括アーカイブ出力                          |
| **ファイル I/O**         | メモリマップドファイル (mmap) ゼロコピー読込    | `memmap2` による OS 仮想メモリ直結、数GB 級ログファイルでもヒープ消費 0・0 秒瞬時オープン              |
| **ファイル I/O**         | 大容量チャンク遅延読込 (Streaming)              | `read_file_chunk_native` による 1,500 行単位の分割オンデマンド読み込み                                 |
| **データ保護**           | LocalStorage 二重保護・自動保存                 | 3 秒ディバウンス自動保存、アプリ再起動時の 100% 復元                                                    |
| **外部同期**             | 実ファイル・ストレージ双方向同期の Rust 統合管理 | `FileSyncManager` による排他ロック、mtime 管理、自プロセス保存状態の一元調停で競合を構造的根絶          |
| **外部同期**             | 外部変更監視の Rust ネイティブ化 (`notify`)     | Windows カーネル直結イベント (`ReadDirectoryChangesW`) による CPU 負荷 0% 外部変更検知                 |
| **検索**                 | ワークスペース横断並列全文検索                  | `rayon` マルチスレッド並列処理によるディレクトリ内全ファイル高速走査 ＆ インメモリ転置インデックス検索  |
| **検索**                 | ワークスペース並列ツリー走査                    | `ignore` クレートによる .gitignore 準拠・数万ファイル規模の 0.05 秒マルチスレッド並列走査              |
| **多言語文字コード**     | UTF-8 / Shift_JIS / EUC-JP 自動判別・相互変換   | `encoding_rs` ネイティブエンジン、改行コード (CRLF / LF) 自動同期                                      |
| **統計・ダッシュボード** | 詳細統計モーダル (`StatsModal`)                 | 文字数、単語数、行数、読了時間、見出し数、リンク数のリアルタイム集計                                    |
| **差分比較**             | ネイティブ詳細 Text Diff                        | Rust `similar` による行番号 Old/New・インライン単語レベル差分ハイライト表示 (`DiffModal`)               |


---

## 3. ドキュメント状態遷移＆ライフサイクル (Lifecycle Architecture)

```mermaid
stateDiagram-v2
    [*] --> UnsavedNew: 新規ノート作成
    [*] --> DiskLoaded: ローカルファイルオープン (.md / .txt)
    
    state DiskLoaded {
        [*] --> ChunkedMode: 大容量 (500KB超) 冒頭1,500行ロード
        [*] --> FullLoaded: 通常ファイル 全文ロード
        ChunkedMode --> FullLoaded: 「全文読込」または「編集有効化」
    }

    UnsavedNew --> Editing: テキスト入力・編集
    FullLoaded --> Editing: テキスト入力・編集
    
    state Editing {
        [*] --> Typing: 変更検知 (Dirty)
        Typing --> LocalStorageSave: 3000ms ディバウンス自動保存
        LocalStorageSave --> Typing
    }

    Editing --> DiskSaved: 手動保存 (Ctrl+S) / 実ファイル自動上書き
    DiskSaved --> ExternalDetected: 外部プロセスでの変更検知 (mtime)
    ExternalDetected --> DiskLoaded: 自動再読み込み (通知トースト)
    
    DiskSaved --> [*]: タブを閉じる
```

---

## 4. システム動作環境

| 項目       | 詳細                                     |
| :--------- | :--------------------------------------- |
| バージョン | v1.4.4                                   |
| OS         | Windows 10 / 11 (Tauri v2 Native Window) |
| ランタイム | Rust Native Engine + WebView2            |
| フロント   | React 19 + TypeScript 5.8                |
