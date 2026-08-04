# QuMaEditor (Quick & Minimal Markdown Editor)

**日本語版 (Japanese)** | [English](README.md)

[![Version](https://img.shields.io/badge/Version-v1.1.0-green)](package.json)
[![Tauri v2](https://img.shields.io/badge/Tauri-v2-blue?logo=tauri)](https://tauri.app/)
[![Rust](https://img.shields.io/badge/Rust-1.80+-orange?logo=rust)](https://www.rust-lang.org/)
[![React](https://img.shields.io/badge/React-v18-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

QuMaEditor (Quick & Minimal Markdown Editor) は、**Tauri v2**, **Rust**, **React 18**, **TypeScript** で構築された超軽量・超高速なデスクトップ Markdown エディタです。「Performance First」の設計思想のもと、メモリ消費量 (RAM ~35MB) を極限まで抑えながら、快適な執筆環境を提供します。

---

## ✨ 主な機能 & ハイライト

### ⚡ Rust ネイティブ・アクセラレーション
- **10MB+ 超大容量ファイルストリーミング**: `read_file_chunk_native` によりメモリを圧迫せず分割読み込み。
- **転置インデックス爆速全文検索**: Rust `LazyLock<Mutex<Vec<DocSearchInput>>>` を用いた単語単位インデックス検索。
- **マルチスレッドエンコーディング一括変換**: `rayon` 並列エンジンによる複数ファイルの UTF-8 / Shift_JIS 高速変換。
- **ネイティブ Text Diff 差分比較**: Rust `similar` クレートによる高速な行単位テキスト比較。

### 🎨 モダン UI & ハイコントラストテーマ
- **完全連動カラーモード**: モーダル群、スクロールバー、構文ハイライトがライト/ダークテーマに完全連動。
- **フロントマター超高明度化**: ライトモード時の Front Matter 領域 (`bg-amber-50/60`) の明度とコントラストを劇的向上。
- **Prism コードハイライト**: ライトモード選択時、複数行コードブロックに読みやすい `prism` 構文スタイルを適用。

### 🔍 検索強調表示 & タグ検索システム
- **キーワード即時ハイライト**: 検索単語に一致する箇所をタイトル・本文・抽出行で黄色バッジ (`<mark>`) 強調表示。
- **YAML Front Matter タグ検索**: ドキュメントタグ (`#ガイド`, `#サンプル` 等) による即時絞り込み検索。
- **対象ファイル名の高コントラスト化**: リアルタイム検索ヒット一覧におけるファイル名 (`hit.doc_title`) を太字で強調。

### 📄 プレビュー・印刷・ダイレクト PDF
- **ワンクリック・ダイレクト PDF 保存**: 印刷ダイアログを起動せず、プレビュー描画スタイリングそのままに `.pdf` を即座に保存。
- **A4 フルサイズ印刷対応 (`Ctrl + P`)**: UI要素や編集画面を `print:hidden` で完全に排除し、プレビュー文章のみを A4 100% で出力。
- **GFM 表組みアライメント対応**: Markdown 表組みの左寄せ `:---`、中央 `:---:`、右寄せ `---:` レンダリングに対応。

---

## ⌨️ 主要キーボードショートカット

| ショートカット     | アクション / 機能                      |
| :----------------- | :------------------------------------- |
| `Ctrl + N`         | 新規 Markdown ドキュメントの作成       |
| `Ctrl + O`         | ローカルテキストファイル (.md, .txt) を開く |
| `Ctrl + S`         | ドキュメントの手動保存                 |
| `Ctrl + P`         | A4 印刷 / PDF ダイアログの起動         |
| `Ctrl + B`         | 太字書式の挿入 (`**テキスト**`)        |
| `Ctrl + I`         | 斜体書式の挿入 (`*テキスト*`)          |
| `Ctrl + Shift + Z` | Zen 集中執筆モードの切り替え           |
| `F1`               | キーボードショートカット確認ヘルプ表示 |

---

## 🏗️ アーキテクチャ概要

```
+-------------------------------------------------------------------+
|                        QuMaEditor デスクトップ                    |
+-------------------------------------------------------------------+
|  フロントエンド (React 18 + TypeScript + Tailwind CSS)            |
|   - リアルタイム GFM ライブプレビュー & Prism/VSC 構文ハイライト   |
|   - マルチタブ管理 & 浮遊型入力補助ツールバー                     |
|   - キーワードハイライト (<mark>) & #タグ絞り込み検索              |
+-------------------------------------------------------------------+
|                       Tauri v2 IPC 通信                           |
+-------------------------------------------------------------------+
|  バックエンド (Rust ネイティブエンジン)                            |
|   - チャンクストリーミング (10MB+) | 転置インデックス爆速全文検索   |
|   - Rayon マルチスレッド一括エンコード判別 | ネイティブ Diff 比較 |
+-------------------------------------------------------------------+
```

---

## 🚀 クイックスタート & ローカル起動手順

### 必須環境
- [Rust](https://www.rust-lang.org/) (バージョン 1.80 以上)
- [Node.js](https://nodejs.org/) (バージョン 18 以上)
- [npm](https://www.npmjs.com/) または [bun](https://bun.sh/)

### ビルド & 実行手順

```bash
# 1. リポジトリのクローン
git clone https://github.com/tkshnkgwr/QuMaEditor.git
cd QuMaEditor

# 2. 依存関係のインストール
npm install

# 3. Tauri 開発モードでの起動
npm run tauri dev
```

---

## 📁 プロジェクトディレクトリ構成

```
QuMaEditor/
├── .agents/               # AI エージェント開発ガイドライン (AGENTS.md)
├── docs/
│   ├── ja/                # 日本語仕様書・運用ガイド
│   └── en/                # 英語仕様書・運用ガイド
├── src/                   # React フロントエンドソースコード
│   ├── components/        # UI コンポーネント (エディタ, プレビュー, モーダル群)
│   ├── utils/             # Tauri IPC & ストレージヘルパー
│   └── App.tsx            # メインアプリケーションワークスペース
├── src-tauri/             # Rust ネイティブバックエンド (Tauri v2 エンジン)
│   ├── src/lib.rs         # ネイティブコマンド & 検索エンジン
│   └── Cargo.toml         # Rust 依存関係定義
├── package.json           # バージョン一元管理 (Single Source of Truth: v1.0.0)
└── LICENSE                # MIT ライセンス
```

---

## 📄 ライセンス

本プロジェクトは **[MIT License](LICENSE)** のもとで公開されています。
