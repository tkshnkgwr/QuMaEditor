# 開発ガイド (DEVELOPMENT)

[English Version](../en/DEVELOPMENT.md) | **日本語版**

## 1. ディレクトリ構成

```
├── .agents/                  # AIエージェント開発ガイドライン (AGENTS.md)
├── docs/                     # プロジェクトドキュメント
│   ├── ja/                   # 日本語ドキュメント
│   └── en/                   # 英語版ドキュメント
├── src/                      # フロントエンドソースコード (React 19 / TypeScript)
│   ├── components/           # UIコンポーネント群
│   │   ├── AboutModal.tsx    # バージョン情報モーダル
│   │   ├── Editor.tsx        # テキストエディタコンポーネント
│   │   ├── Preview.tsx       # Markdownリアルタイムプレビュー
│   │   ├── SettingsModal.tsx # 設定変更モーダル
│   │   ├── Sidebar.tsx       # ドキュメント管理サイドバー
│   │   ├── StatusBar.tsx     # ステータスバー（文字コード/改行表示）
│   │   ├── TableModal.tsx    # 表組生成ダイアログ
│   │   ├── TemplateModal.tsx # テンプレート選択ダイアログ
│   │   ├── TitleBar.tsx      # ウィンドウタイトルバー＆メニュー
│   │   └── Toolbar.tsx       # 入力補助ツールバー
│   ├── utils/                # ユーティリティモジュール
│   │   ├── encodingUtils.ts  # 文字コード判別・エンコード・改行コード変換
│   │   ├── markdownUtils.ts  # フォーマット挿入・統計計算
│   │   ├── storage.ts        # LocalStorage 入出力
│   │   └── yamlUtils.ts       # YAML Front Matter 構文解析・生成
│   ├── App.tsx               # メインアプリケーションコンポーネント
│   ├── main.tsx              # Reactエントリーポイント
│   ├── index.css             # Tailwind CSSスタイル定義
│   └── types.ts              # TypeScript型定義
├── src-tauri/                # Tauri バックエンドソースコード (Rust)
│   ├── capabilities/         # パーミッション設定
│   ├── src/                  # Rustエントリーポイント (main.rs, lib.rs)
│   ├── Cargo.toml            # Rust依存関係・ビルドプロファイル定義
│   └── tauri.conf.json       # Tauriアプリケーション設定
├── index.html                # HTMLエントリーポイント
├── package.json              # 依存関係・スクリプト定義
└── vite.config.ts            # Vite設定ファイル
```

## 2. 依存パッケージ・ツールチェーン

- **Tauri v2**: クロスプラットフォームデスクトップアプリケーションフレームワーク
- **Rust (v1.80+)**: Tauri バックエンドコアエンジン
- **React 19 & Vite 6**: フロントエンドUIおよび開発サーバー
- **TypeScript (v5.8+)**: 型安全フロントエンド開発
- **Tailwind CSS & Lucide React**: スタイリングおよびアイコン
- **encoding-japanese**: 文字コードの自動判別 (`detect`) および相互変換 (`convert`)
- **react-markdown, remark-gfm, rehype-raw, react-syntax-highlighter**: Markdown描画・GFM・構文ハイライト

## 3. ローカル開発・検証手順

```bash
# 1. 依存関係のインストール
npm install

# 2. フロントエンド単体開発サーバーの起動 (ポート 3000)
npm run dev

# 3. Tauri デスクトップアプリケーションの開発起動
npx tauri dev

# 4. TypeScript 型チェック
npm run lint

# 5. Rust バックエンドの型チェック
cargo check --manifest-path src-tauri/Cargo.toml

# 6. プロダクション用ビルド
npx tauri build
```
