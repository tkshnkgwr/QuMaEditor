# QuMaEditor (熊エディタ) — プロ仕様デスクトップ Markdown / CSV エディタ

[![Tauri v2](https://img.shields.io/badge/Tauri-v2-blue)](https://v2.tauri.app/)
[![React 19](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)
[![Version](https://img.shields.io/badge/Version-v1.4.1-green)](package.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

QuMaEditor (Quick & Minimal Markdown Editor) は、**Tauri v2**, **Rust**, **React 19**, **TypeScript** で構築された超軽量・超高速なデスクトップ Markdown エディタです。「Performance First」の設計思想のもと、メモリ消費量 (RAM ~35MB) を極限まで抑えながら、快適な執筆環境を提供します。

---

## ✨ 主な機能 & ハイライト

### ⚡ Rust ネイティブ・アクセラレーション

- **Markdown 高速自動整形 (`Ctrl + Shift + F`)**: Rust ネイティブエンジンにより、表組みの垂直整列、見出し前後の空行自動挿入、過剰連続空行の圧縮（コードブロック内は完全保護）を一瞬で実行。
- **10MB+ 超大容量ファイルストリーミング**: `read_file_chunk_native` によりメモリを圧迫せず分割読み込み。
- **大容量 CSV ゼロコピー高速解析**: 数万行の CSV も Rust 側で瞬時に行カウント・セル抽出を行い、型自動判別（数値は右寄せ、日付は中央、文字は左寄せ）＆ソート・検索テーブルを描画。
- **転置インデックス爆速全文検索**: Rust `LazyLock<Mutex<Vec<DocSearchInput>>>` を用いた単語単位インデックス検索。
- **マルチスレッドエンコーディング一括変換**: `rayon` 並列エンジンによる複数ファイルの UTF-8 / Shift_JIS 高速変換。
- **ネイティブ Text Diff 差分比較**: Rust `similar` クレートによる高速な行単位テキスト比較。
- **ネイティブエクスプローラー起動**: `open_folder_native` コマンドによりPC実ファイルの親フォルダをエクスプローラーでハイライト選択状態で安全にオープン。

### 🎨 モダン UI & ハイコントラストテーマ

- **ゼロレイテンシ・タイピング**: 「編集のみ」モード時のプレビュー完全バイパス、および「分割表示」時の非同期ディバウンス処理により、打鍵遅延ゼロの快適なタイピングを実現。
- **`Ctrl + E` カーソル自動復元**: プレビューからエディタへ戻った際、直前のカーソル位置・行選択を完全復元しエディタへ即座にフォーカス。
- **Mermaid ダイアグラム・リアルタイム描画 & ズーム**: フローチャート・シーケンス図・状態遷移図を美麗な SVG で描画。ズームコントローラー (50%〜600%)、フルスクリーン拡大、コードコピーを完備。
- **完全連動カラーモード**: モーダル群、スクロールバー、構文ハイライトがライト/ダークテーマに完全連動。
- **詳細統計ダッシュボード (`StatsModal`)**: 文字数、単語数、行数、読了予想時間、見出し数、リンク数等をリアルタイム集計。

### 💾 実ファイル保存 & クラッシュ消失防止・二重保護アーキテクチャ

- **実ファイル直上書き保存 (`Ctrl + S`)**: 開いたローカル `.md` ファイルのパスを保持し、手動保存および打鍵後の自動保存で **PC 上の実ファイルへ Rust ネイティブ直書き保存** (`💾 実ファイルに保存`)。
- **クラッシュ消失防止 (LocalStorage 保護保存)**: 入力・編集中のデータは常に LocalStorage へバックグラウンド保護保存 (`📦 アプリ内(LocalStorage)に保存`)。未保存ノートであっても次回起動時に 100% 確実に復元。
- **外部プロセス更新検知＆手動再読込 (`F5`)**: 外部エディタでのファイル変更を `mtime` で自動検知しトースト通知・自動更新。手動でのディスク再読込 (`F5` / `Ctrl + R`) も完備。
- **直感的な保存状態バッジ表示**: ステータスバー（フッター）に、現在「実ファイルに保存」されたか「アプリ内(LocalStorage)に保存」されたかをリアルタイムに集約表示。

---

## ⌨️ 主要キーボードショートカット

| ショートカット     | アクション / 機能                           |
| :----------------- | :------------------------------------------ |
| `Ctrl + N`         | 新規 Markdown ドキュメントの作成            |
| `Ctrl + O`         | ローカルテキストファイル (.md, .txt) を開く |
| `Ctrl + S`         | 元ファイルへの直上書き保存                  |
| `Ctrl + Shift + S` | 名前を付けて保存 (ローカルファイル保存)     |
| `Ctrl + Shift + F` | Markdown 自動整形 (表組み整列・空行整理)    |
| `Ctrl + E`         | 表示モード切替 (編集のみ ↔ プレビューのみ)  |
| `F5` / `Ctrl + R`  | ディスクからファイルを強制再読み込み        |
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
|  フロントエンド (React 19 + TypeScript + Tailwind CSS)            |
|   - ゼロレイテンシ・エディタ & Mermaid / GFM プレビュー           |
|   - マルチタブ管理 & 浮遊型入力補助ツールバー                     |
|   - キーワードハイライト (<mark>) & #タグ絞り込み検索              |
|   - ModalGroup / useGlobalShortcuts / MarkdownRenderers 分割構成  |
+-------------------------------------------------------------------+
|                       Tauri v2 IPC 通信                           |
+-------------------------------------------------------------------+
|  バックエンド (Rust ネイティブエンジン / text_processing/ 分割)  |
|   - チャンクストリーミング (10MB+) | 転置インデックス爆速全文検索   |
|   - Rayon マルチスレッド一括エンコード判別 | ネイティブ Diff 比較 |
|   - Markdown 自動整形 (formatter.rs) | syntect 高速 HTML 出力      |
|   - open_folder_native による親フォルダエクスプローラー起動        |
+-------------------------------------------------------------------+
```

---

## 🚀 クイックスタート & ローカル起動手順

### 必須環境

- [Rust](https://www.rust-lang.org/) (バージョン 1.80 以上)
- [Node.js](https://nodejs.org/) (バージョン 18 以上)
- [npm](https://www.npmjs.com/)

### 開発モードの起動

```bash
# 依存パッケージのインストール
npm install

# 開発サーバーおよび Tauri ウィンドウの起動
npm run tauri dev
```

### 5大事前強制検証（ローカル品質検証）

```bash
# 1. コード整形検証
cargo fmt --manifest-path src-tauri/Cargo.toml --check

# 2. コンパイル・型検証
cargo check --manifest-path src-tauri/Cargo.toml

# 3. Clippy 厳格品質検証
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings

# 4. Rust ユニットテスト (全23件)
cargo test --manifest-path src-tauri/Cargo.toml

# 5. TypeScript 型検証
npm run lint
```

---

## 📄 ライセンス

本ソフトウェアは [MIT License](LICENSE) の下で公開されています。
