# 開発ガイド (DEVELOPMENT)

[English Version](../en/DEVELOPMENT.md) | **日本語版**

## 1. ディレクトリ構成

```
├── .agents/                        # AIエージェント開発ガイドライン (AGENTS.md / skills/)
├── docs/                           # プロジェクトドキュメント
│   ├── ja/                         # 日本語ドキュメント (14ファイル)
│   └── en/                         # 英語版ドキュメント (14ファイル)
├── scripts/                        # 開発・テスト補助スクリプト
│   └── run_rust_tests.ps1          # Rust単体テスト実行＆ComCtl32 v6マニフェスト自動解決スクリプト
├── src/                            # フロントエンドソースコード (React 19 / TypeScript)
│   ├── components/                 # UIコンポーネント群
│   │   ├── settings/               # 設定タブコンポーネント群
│   │   │   ├── AiTab.tsx           # Gemini API 要約設定タブ
│   │   │   ├── GeneralTab.tsx      # 外観・フォント・自動保存設定タブ
│   │   │   └── StorageTab.tsx      # ストレージ管理・ZIP出力タブ
│   │   ├── AboutModal.tsx          # バージョン情報モーダル
│   │   ├── BatchConvertModal.tsx   # 一括文字コード変換ダイアログ
│   │   ├── DiffModal.tsx           # Text Diff 比較ダイアログ
│   │   ├── DualPaneWorkspace.tsx   # 2画面並列比較・編集・プレビューワークスペース
│   │   ├── Editor.tsx              # テキストエディタコンポーネント
│   │   ├── HelpGuideModal.tsx      # ヘルプガイドダイアログ
│   │   ├── LogModal.tsx            # ログ表示モーダル
│   │   ├── MarkdownRenderers.tsx   # ReactMarkdown カスタム要素レンダラー
│   │   ├── MermaidRenderer.tsx     # Mermaid SVG レンダラー（ズーム・全画面・SVG保存）
│   │   ├── ModalGroup.tsx          # 10個の各種モーダル集約コンポーネント
│   │   ├── Preview.tsx             # Markdown リアルタイムプレビュー & Mermaid 描画
│   │   ├── SettingsModal.tsx       # エディタ設定変更モーダル親枠
│   │   ├── ShortcutsModal.tsx      # キーボードショートカット一覧ダイアログ
│   │   ├── Sidebar.tsx             # ドキュメント管理＆見出しアウトラインサイドバー
│   │   ├── StatsModal.tsx          # 詳細テキスト統計ダッシュボード
│   │   ├── StatusBar.tsx           # ステータスバー（文字コード/校正Lint/保存状態表示）
│   │   ├── TableModal.tsx          # 表組生成ダイアログ
│   │   ├── TabBar.tsx              # タブバーコンポーネント
│   │   ├── TemplateModal.tsx       # テンプレート選択ダイアログ
│   │   ├── TitleBar.tsx            # ウィンドウタイトルバー＆メニュー
│   │   ├── Toast.tsx               # トースト通知コンポーネント
│   │   └── Toolbar.tsx             # 入力補助ツールバー
│   ├── hooks/                      # カスタムフック群
│   │   ├── useDocumentManager.ts   # ドキュメント一覧・タブ管理フック
│   │   ├── useDualPane.ts          # 2画面デュアルペインスプリッター・フォーカス管理フック
│   │   ├── useEditorToolbarActions.ts # ツールバー書式挿入・表・見出しジャンプフック
│   │   ├── useFileOperations.ts    # ファイルオープン・保存・エクスポートフック
│   │   ├── useFileWatcher.ts       # 外部ファイル更新検知フック
│   │   ├── useGlobalShortcuts.ts   # グローバルキーボードショートカット制御フック
│   │   ├── useModalState.ts        # 全モーダル表示状態管理フック
│   │   └── useWindowDragDrop.ts    # ウィンドウドラッグ＆ドロップハンドリングフック
│   ├── utils/                      # ユーティリティモジュール
│   │   ├── aiSummary.ts            # Gemini API & ローカル要約ハイブリッドエンジン
│   │   ├── encodingUtils.ts        # 文字コード判別・エンコード・改行コード変換
│   │   ├── fileSystem.ts           # ファイルシステム・チャンク読込
│   │   ├── logger.ts               # ロガーユーティリティ
│   │   ├── markdownUtils.ts        # フォーマット挿入・テキスト操作
│   │   ├── storage.ts              # LocalStorage 入出力・GC
│   │   ├── tableUtils.ts           # Markdown 表自動移動・行追加ロジック
│   │   ├── tauriNative.ts          # Tauri ネイティブ IPC ラッパー
│   │   └── yamlUtils.ts            # YAML Front Matter 構文解析・生成
│   ├── App.tsx                     # メインアプリケーションコンポーネント
│   ├── bindings.ts                 # Specta 自動生成 TypeScript 型バインディング
│   ├── main.tsx                    # Reactエントリーポイント
│   ├── index.css                   # Tailwind CSSスタイル定義
│   └── types.ts                    # TypeScript型定義
├── src-tauri/                      # Tauri バックエンドソースコード (Rust)
│   ├── capabilities/               # パーミッション設定
│   ├── src/                        # Rustソースコード
│   │   ├── bin/                    # 補助バイナリ
│   │   │   └── gen_specta.rs       # Specta TypeScript 型バインディング生成バイナリ
│   │   ├── text_processing/        # テキスト処理サブモジュール群
│   │   │   ├── mod.rs              # サブモジュール統合 & re-export
│   │   │   ├── stats.rs            # テキスト統計計算 (文字数・単語数・読了時間)
│   │   │   ├── yaml.rs             # YAML Front Matter パース
│   │   │   ├── structure.rs        # 見出し抽出・タスク状態トグル
│   │   │   ├── formatter.rs        # GFM 表組み整列・空行整理自動整形
│   │   │   └── html_renderer.rs    # syntect 構文ハイライト付き HTML 出力
│   │   ├── commands.rs             # IPC コマンドハンドラー
│   │   ├── diff.rs                 # Text Diff 計算（行単位＆単語インライン詳細）
│   │   ├── encoding.rs             # 文字コード自動判別・変換
│   │   ├── export_zip.rs           # 複数ノート＆アセット一括 ZIP 圧縮エクスポート
│   │   ├── file_io.rs              # ネイティブファイル I/O・チャンク読込・アトミック保存
│   │   ├── file_watcher.rs         # notify による外部ファイル変更監視
│   │   ├── lib.rs                  # ライブラリ初期化・State 管理
│   │   ├── main.rs                 # バイナリエントリーポイント
│   │   ├── mermaid_validator.rs    # Mermaid 構文検証＆SVG 差分ハッシュキャッシュ
│   │   ├── mmap_reader.rs          # memmap2 によるゼロコピー巨大ファイル読み込み
│   │   ├── proofreading.rs         # 日本語校正（助詞重複・表記ゆれ）＆Markdown lint
│   │   ├── rope_buffer.rs          # ropey による大容量 Rope 編集バッファ管理
│   │   ├── search.rs               # 転置インデックス＆rayon 並列ワークスペース検索
│   │   ├── sync_manager.rs         # 実ファイル・LocalStorage 双方向同期＆mtime 管理
│   │   └── workspace_scanner.rs    # ignore による .gitignore 準拠並列ツリー走査
│   ├── Cargo.toml                  # Rust依存関係・ビルドプロファイル定義
│   ├── common_controls_v6.manifest # Windows Common Controls v6 マニフェスト
│   └── tauri.conf.json             # Tauriアプリケーション設定
├── CHANGELOG.md                    # 更新履歴インデックス (日英リンク)
├── CLAUDE.md                       # Claude Code 向け最優先ルール定義
├── GEMINI.md                       # Gemini (大賢者) 向け最優先ルール定義
├── README.md                       # プロジェクト概要 (英語版)
├── README_JA.md                    # プロジェクト概要 (日本語版)
├── RULES.md                        # 全AIエージェント共通絶対遵守ルール
├── index.html                      # HTMLエントリーポイント
├── package.json                    # 依存関係・スクリプト定義
└── vite.config.ts                  # Vite設定ファイル
```

---

## 2. 5大事前強制検証（品質検証ルール）

コミットおよびリリース前に、以下の 5 つの検証コマンドを必ずローカルで実行し、エラー・警告ゼロを確認します。

```bash
# 1. Rust コード整形検証
cargo fmt --manifest-path src-tauri/Cargo.toml --check

# 2. Rust コンパイル・型検証
cargo check --manifest-path src-tauri/Cargo.toml

# 3. Rust Clippy 厳格品質検証
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings

# 4. Rust ユニットテスト検証 (全44件 PASS / Windows ComCtl32 v6 マニフェスト自動解決)
npm run test:rust

# 5. TypeScript 型検証
npm run lint
```
