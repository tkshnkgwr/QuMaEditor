# 詳細開発・運用指示書 (INSTRUCTIONS.md)

[English Version](../en/INSTRUCTIONS.md) | **日本語版**

本ドキュメントは、`.agents/AGENTS.md` から拡張された AI エージェント（「大賢者」）向けの詳細開発・運用ガイドラインです。

---

## 1. 対話・回答スタイル詳細

- **結論ファースト**: 冒頭で結論・解決策の概要を提示し、詳細ログや修正場所を箇条書きで整理します。
- **ハイパーリンクの原則**: ファイルや行範囲を参照する際は、常に `[表示名](file:///絶対パス)` 形式のリンクを生成します。
- **Git コミットメッセージの日本語統一**: Conventional Commits 規約 (`feat:`, `fix:` 等) を守りつつ、コミットメッセージは常に分かりやすい日本語表記（例: `feat: ...`, `fix: ...` + 日本語要約）を徹底します。
- **他言語経験者への解説補足**:
  - React Hooks (useState / useEffect 等): 状態変数とイベントライフタイムの監視ハンドラーとして説明します。
  - Rust 所有権・参照 (Move / Borrow): メモリ管理と参照の安全貸し出しとして説明します。

---

## 2. 自動バージョン管理ルール (Semantic Versioning)

- 今後の開発・修正内容に応じて、「大賢者」が変更規模に基づき自主的にバージョンを繰り上げて管理します：
  - **パッチ (`1.0.x`)**: 小規模なバグ修正、軽微なUI改善、CSS/スタイル調整等。
  - **マイナー (`1.x.0`)**: 新機能追加、新しいRustネイティブ機能、UI拡張等。
  - **メジャー (`x.0.0`)**: アーキテクチャの根本刷新、互換性を破る大規模変更。
- バージョン変更時は、`package.json`（Single Source of Truth）, `src-tauri/Cargo.toml`, `CHANGELOG.md`, `SPECIFICATION.md`, `TODO.md`, `README.md` 等へ連動反映を行います。

---

## 3. 品質管理・事前強制検証手順

- **コミット前事前強制検証コマンド（全必須）**:
  - `cargo fmt --manifest-path src-tauri/Cargo.toml --check`: コード自動整形の完全合格を確認。
  - `cargo check --manifest-path src-tauri/Cargo.toml`: Tauri バックエンド Rust のコンパイル正常性を確認。
  - `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings`: Clippy プロレベル品質警告ゼロを確認。
  - `cargo test --manifest-path src-tauri/Cargo.toml`: Rust ユニットテスト全件 PASS を確認。
  - `npm run lint`: TypeScript 型チェックエラーゼロを確認。
- **モジュール分割基準 (1,000行ルール)**: 単一ソースファイルが 1,000 行を超えた場合は、関心事の分離（Separation of Concerns）に基づき分割・抽出しリファクタリングを提示します。
- **Markdown例外**: Markdownファイル (`*.md`) のみの修正時は、`paths-ignore` により CI は起動しません。

---

## 4. ドキュメント自動同期ルール

- 以下の変更が発生した場合は、対象ドキュメントを同期更新します：

| ドキュメント       | 役割            | 更新タイミング                                 |
| :----------------- | :-------------- | :--------------------------------------------- |
| `CHANGELOG.md`     | 変更履歴        | 機能追加・修正・パフォーマンス改善・削除完了時 |
| `SPECIFICATION.md` | 機能仕様・UI    | 画面レイアウト・データ構造・ショートカット変更時 |
| `ARCHITECTURE.md`  | アーキテクチャ  | システム境界・IPC通信・プロセス構造の変更時     |
| `DEVELOPMENT.md`   | 開発ガイド      | ビルド手順・依存関係・開発コマンド変更時       |
