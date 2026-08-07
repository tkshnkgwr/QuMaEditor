# QuMaEditor (Quick & Minimal Markdown Editor)

**日本語版 (Japanese)** | [English](README.md)

[![Version](https://img.shields.io/badge/Version-v1.2.3-green)](package.json)
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
- **ネイティブエクスプローラー起動**: `open_folder_native` コマンドによりPC実ファイルの親フォルダをエクスプローラーで安全にオープン。

### 🎨 モダン UI & ハイコントラストテーマ
- **完全連動カラーモード**: モーダル群、スクロールバー、構文ハイライトがライト/ダークテーマに完全連動。
- **プレビュー画面の Ctrl + ホイールズーム**: プレビューを `Ctrl + スクロールホイール` で 50% 〜 300% の範囲で自在に拡大縮小（リセットバッジ付き）。
- **選択範囲対応 ＆ 行頭見出しツールバー**: 太字・斜体等は選択テキストをラッピング、H1~H3 ボタンはカーソル行の行頭に `# ` マーカーをスマート挿入。
- **Prism コードハイライト**: ライトモード選択時、複数行コードブロックに読みやすい `prism` 構文スタイルを適用。

### 🔍 検索強調表示 & タグ検索システム
- **キーワード即時ハイライト**: 検索単語に一致する箇所をタイトル・本文・抽出行で黄色バッジ (`<mark>`) 強調表示。
- **YAML Front Matter タグ検索**: ドキュメントタグ (`#ガイド`, `#サンプル` 等) による即時絞り込み検索。
- **対象ファイル名の高コントラスト化**: リアルタイム検索ヒット一覧におけるファイル名 (`hit.doc_title`) を太字で強調。

### 📄 プレビュー・印刷・ダイレクト PDF
- **ワンクリック・ダイレクト PDF 保存**: 印刷ダイアログを起動せず、プレビュー描画スタイリングそのままに `.pdf` を即座に保存。
- **A4 フルサイズ印刷対応 (`Ctrl + P`)**: UI要素や編集画面を `print:hidden` で完全に排除し、プレビュー文章のみを A4 100% で出力。
- **GFM 表組みアライメント対応**: Markdown 表組みの左寄せ `:---`、中央 `:---:`、右寄せ `---:` レンダリングに対応。

### 💾 実ファイル保存 & クラッシュ消失防止・二重保護アーキテクチャ (v1.2.2)
- **実ファイル直上書き保存 (`Ctrl + S`)**: 開いたローカル `.md` ファイルのパスを保持し、手動保存および打鍵後の自動保存で **PC 上の実ファイルへ Rust ネイティブ直書き保存** (`💾 実ファイルに保存`)。
- **クラッシュ消失防止 (LocalStorage 保護保存)**: 万が一の PC 突然停止やアプリ異常終了（クラッシュ）に備え、入力・編集中のデータは常に LocalStorage へバックグラウンド保護保存 (`📦 アプリ内(LocalStorage)に保存`)。未保存ノートであっても次回起動時に 100% 確実に復元。
- **直感的な保存状態バッジ表示**: タイトルバーおよびステータスバーに、現在「PC上の実ファイルに保存」されたか「アプリ内(LocalStorage)に保存」されたかをリアルタイムに識別表示。
- **名前を付けて保存 (`Ctrl + Shift + S`)**: 保存ダイアログを開き、好きな場所に `.md` ファイルとして直接出力。
- **右クリックメニュー「QuMaEditorで開く」**: Windows エクスプローラーのコンテキストメニューに即座に自動登録。
- **二重起動防止 (Single Instance)**: 複数プロセス起動を防ぎ、起動中の QuMaEditor にファイルを新規タブとして自動集約。

---

## ⌨️ 主要キーボードショートカット

| ショートカット     | アクション / 機能                           |
| :----------------- | :------------------------------------------ |
| `Ctrl + N`         | 新規 Markdown ドキュメントの作成            |
| `Ctrl + O`         | ローカルテキストファイル (.md, .txt) を開く |
| `Ctrl + S`         | 元ファイルへの直上書き保存                  |
| `Ctrl + Shift + S` | 名前を付けて保存 (ローカルファイル保存)     |
| `Ctrl + P`         | A4 印刷 / PDF ダイアログの起動              |
| `Ctrl + B`         | 太字書式の挿入 / 選択文字ラッピング         |
| `Ctrl + I`         | 斜体書式の挿入 / 選択文字ラッピング         |
| `Ctrl + Shift + Z` | Zen 集中執筆モードの切り替え                |
| `F1`               | キーボードショートカット確認ヘルプ表示      |

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
|   - open_folder_native による親フォルダエクスプローラー起動        |
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
├── package.json           # バージョン一元管理 (Single Source of Truth: v1.2.2)
└── LICENSE                # MIT ライセンス
```

---

## 📄 ライセンス

本プロジェクトは **[MIT License](LICENSE)** のもとで公開されています。
