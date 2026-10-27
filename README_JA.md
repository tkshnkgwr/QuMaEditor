# QuMaEditor (熊エディタ) — プロ仕様デスクトップ Markdown エディタ

[![Tauri v2](https://img.shields.io/badge/Tauri-v2-blue)](https://v2.tauri.app/)
[![React 19](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)
[![Version](https://img.shields.io/badge/Version-v1.5.3-green)](package.json)
[![License: GPL-3.0-or-later](https://img.shields.io/badge/License-GPL--3.0--or--later-blue.svg)](LICENSE)

[English Version](README.md) | **日本語版**

QuMaEditor (Quick & Minimal Markdown Editor) は、**Tauri v2**, **Rust**, **React 19**, **TypeScript** で構築された超軽量・超高速なデスクトップ Markdown エディタです。「Performance First」の設計思想のもと、メモリ消費量 (RAM ~35MB) を極限まで抑えながら、プロの開発者・ライター向けの強力な執筆環境を提供します。

---

## 🚀 主な特徴・機能

- **⚡ ゼロレイテンシ＆爆速 Rust ネイティブ Markdown 描画**: `pulldown-cmark` と `syntect` による Rust ネイティブ HTML レンダリングエンジンを搭載。入力遅延ゼロ・秒間 60fps の軽快なリアルタイムプレビューを実現。
- **📊 Mermaid ダイアグラム完全統合 ＆ 拡張機能**:
  - フローチャート、シーケンス、ガント、状態遷移図、クラス図、ER図、Gitグラフ、マインドマップをリアルタイムプレビュー。
  - マウスホイールによるインタラクティブズーム（50%〜600% / 100%↔200% トグル）＆全画面拡大表示モーダル。
  - プレビュー画面から SVG ベクター画像としてワンクリック保存・ダウンロード。
  - スタンドアロン HTML 出力時の自動描画スクリプト埋め込み、およびツールバーからの 8 大ダイアグラム雛形ワンクリック挿入。
- **🤖 AI 自動要約 (Google Gemini API & ハイブリッド方式)**:
  - Gemini API (`gemini-2.5-flash`, `gemini-2.5-pro` 等の自由指定) による高品質な要約自動生成。
  - API 未設定・オフライン環境でも動作するローカルテキスト抽出要約エンジンを完備。
- **🪟 デュアルペイン 2 画面並列比較・編集**:
  - 最大 2 つのドキュメントを左右に並べて同時に比較・編集・プレビュー。20%〜80% の自在なスプリッターリサイズ対応。
- **💎 Obsidian 完全互換プレビュー**:
  - Enter 1 回での改行（Soft Break ➔ Hard Break）、Obsidian コールアウト記法（`[!NOTE]`, `[!TIP]`, `[!WARNING]` 等）、蛍光ペン記法（`==text==`）、Wiki リンク（`[[note]]`）に完全対応。
- **🔍 日本語校正 ＆ 記法 Lint エンジン**:
  - Rust による非同期バックグラウンド解析で、助詞の連続重複（「のの」「はは」等）、表記ゆれ（「サーバ」と「サーバー」等）、未閉じ括弧やコードブロックをリアルタイム検出。
- **🌐 多言語文字コード完全対応**:
  - `encoding_rs` による UTF-8, Shift_JIS, EUC-JP の自動判別、相互変換、改行コード（CRLF / LF）自動正規化。
- **🛡️ 堅牢なファイル管理 & パフォーマンス**:
  - `ropey` による大容量テキスト Bツリー Rope 構造、`memmap2` による巨大ログファイルゼロコピー参照。
  - `atomic_write` による 0 バイトファイル破損防止、OS カーネル直結 (`notify`) の外部ファイル変更監視。

---

## 💻 動作要件・技術スタック

| 区分               | 採用技術                                                     |
| :----------------- | :----------------------------------------------------------- |
| **OS**             | Windows 10 / 11 (x64)                                        |
| **フレームワーク** | Tauri v2 (Rust 1.80+)                                        |
| **フロントエンド** | React 19, TypeScript 5, Vite, Tailwind CSS v4, Lucide Icons  |
| **バックエンド**   | Rust, pulldown-cmark, syntect, ropey, similar, notify, zip   |

---

## 🛠️ クイックスタート (開発・ビルド)

```bash
# 依存関係のインストール
npm install

# 開発サーバーおよびデスクトップアプリの起動
npm run tauri dev

# リリースビルド（インストーラー生成）
npm run tauri build
```

---

## 📚 ドキュメント一覧

- **[操作マニュアル (USER_GUIDE)](docs/ja/USER_GUIDE.md)**: 基本操作、Mermaid、AI要約、デュアルペイン、設定、ショートカット一覧
- **[機能・技術仕様書 (SPECIFICATION)](docs/ja/SPECIFICATION.md)**: コア機能一覧、ライフサイクル、システム要件
- **[アーキテクチャ設計書 (ARCHITECTURE)](docs/ja/ARCHITECTURE.md)**: Rust/React マルチプロセス構成、データフロー、モジュール構造
- **[開発ガイド (DEVELOPMENT)](docs/ja/DEVELOPMENT.md)**: ディレクトリ構成、モジュール分割基準、事前検証手順
- **[テスト実行報告書 (TEST_REPORT)](docs/ja/TEST_REPORT.md)**: ユニットテストおよび事前検証結果
- **[リリース手順書 (RELEASE)](docs/ja/RELEASE.md)**: バージョンアップ・タグ付け・CI/CD 自動リリース手順
- **[開発計画・TODO リスト (TODO)](docs/ja/TODO.md)**: 完了済み機能および開発ロードマップ
- **[更新履歴 (CHANGELOG)](docs/ja/CHANGELOG.md)**: バージョン別変更履歴

---

## 📄 ライセンス

本プロジェクトは GNU General Public License v3.0 or later (GPL-3.0-or-later) のもとで公開されています - Copyright (c) 2026 tkshnkgwr。詳細は [LICENSE](LICENSE) をご覧ください。
