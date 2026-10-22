# リリース・パッケージングガイド (RELEASE)

[English Version](../en/RELEASE.md) | **日本語版**

## 1. バージョン管理規約

本プロジェクトは セマンティック バージョニング (Semantic Versioning 2.0.0) に準拠します。
`MAJOR.MINOR.PATCH` (例: `1.5.1`)

- **MAJOR**: 互換性のないUI/データ構造の変更
- **MINOR**: 後方互換性のある新機能追加
- **PATCH**: 後方互換性のあるバグ修正・軽微な改善

---

## 2. リリース準備チェックリスト (Single Source Versioning)

バージョン更新時は、以下の Single Source of Truth に基づき更新を行います。

| 項目                               | ファイル / 場所                                                         |
| :--------------------------------- | :---------------------------------------------------------------------- |
| フロントエンド標準バージョン       | [`package.json`](../../package.json)                                    |
| Rust クレートバージョン            | [`src-tauri/Cargo.toml`](../../src-tauri/Cargo.toml)                    |
| プロジェクト README (日・英)       | [`README_JA.md`](../../README_JA.md) / [`README.md`](../../README.md)   |
| 機能仕様書 (日・英)                | docs/ja/SPECIFICATION.md / docs/en/SPECIFICATION.md                     |
| ユーザーガイド (日・英)            | docs/ja/USER_GUIDE.md / docs/en/USER_GUIDE.md                           |
| 更新履歴 (日・英)                  | [`docs/ja/CHANGELOG.md`](CHANGELOG.md) / docs/en/CHANGELOG.md           |
| TODO リスト (日・英)               | [`docs/ja/TODO.md`](TODO.md) / docs/en/TODO.md                          |

---

## 3. CI / CD 自動化ワークフロー (GitHub Actions)

GitHub Actions による品質検証・自動リリースワークフローが設定済みです。

### 3.1 CI ワークフロー (`.github/workflows/ci.yml`)

- **トリガー**: `main` ブランチへの `push` および `pull_request`
- **処理内容**:
  - TypeScript 型チェック (`npm run lint`)
  - Rust ユニットテスト (`npm run test:rust` / Windows ComCtl32 v6 マニフェスト解決)
  - Tauri バックエンドビルド検証 (`cargo check`)

### 3.2 リリース自動化ワークフロー (`.github/workflows/release.yml`)

- **トリガー**: `v*` タグのプッシュ（例: `git push origin v1.5.1`）または GitHub 上での手動トリガー (`workflow_dispatch`)
- **処理内容**:
  - CI 品質検証 & 全43件ユニットテスト通過の事前確認
  - Windows デスクトップアプリバイナリ (`.msi` / `.exe` インストーラー) の全自動ビルド
  - GitHub Releases ページの自動生成とバイナリアタッチ

---

## 4. リリース実行手順 (ボス用手順)

```bash
# 1. 5大事前強制検証（全項目エラー・警告ゼロを確認）
cargo fmt --manifest-path src-tauri/Cargo.toml --check
cargo check --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
npm run test:rust
npm run lint

# 2. リリースタグの付与とプッシュ (GitHub Actions 自動リリース発動)
git tag -a v1.5.1 -m "QuMaEditor v1.5.1 Release"
git push origin v1.5.1
```
