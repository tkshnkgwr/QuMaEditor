# QuMaEditor (v1.0.0)

[![Tauri v2](https://img.shields.io/badge/Tauri-v2-blue?logo=tauri)](https://tauri.app/)
[![Rust](https://img.shields.io/badge/Rust-1.80+-orange?logo=rust)](https://www.rust-lang.org/)
[![React](https://img.shields.io/badge/React-v18-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

QuMaEditor (Quick & Minimal Markdown Editor) は、Tauri v2 と Rust で構築された超軽量・高速なデスクトップ Markdown エディタです。

---

## 🚀 主な機能

- **⚡ 高速・超軽量**: Tauri v2 と Rust Native エンジンによる低メモリ/CPU消費 (RAM ~35 MB) と高速レスポンス。
- **✨ スタイリッシュ & 高コントラストカラーモード**: テーマ連動型スクロールバー、各種モーダル、高明度 Front Matter、`prism` 構文ハイライト。
- **🔍 爆速キーワードハイライト & タグ検索**: 入力キーワードの黄色バッジ (`<mark>`) ハイライト、Front Matter 内のタグ (`#ガイド`) 絞り込み検索。
- **📄 ダイレクト PDF ワンクリック保存**: 印刷ダイアログを起動することなく、プレビュー画面そのままに直ちに `.pdf` ファイルを出力保存。
- **🖨️ A4 100%フルサイズ印刷**: UIコンポーネントおよび編集画面を `print:hidden` で100%除外したプレビュー専用 A4 印刷。
- **⚡ Rust アクセラレーションエンジン**: 10MB+ チャンクストリーミング、`rayon` 並列マルチスレッド文字コード変換、`similar` ネイティブ Diff 比較。

---

## 📚 ドキュメント管理

- 📖 [日本語仕様書 (docs/ja/SPECIFICATION.md)](docs/ja/SPECIFICATION.md)
- 📖 [英語仕様書 (docs/en/SPECIFICATION.md)](docs/en/SPECIFICATION.md)
- 📋 [更新履歴 (CHANGELOG)](docs/ja/CHANGELOG.md)
