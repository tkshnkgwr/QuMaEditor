# リリース・パッケージングガイド (RELEASE)

## 1. バージョン管理規約

本プロジェクトは セマンティック バージョニング (Semantic Versioning 2.0.0) に準拠します。
`MAJOR.MINOR.PATCH` (例: `1.2.2`)

- **MAJOR**: 互換性のないUI/データ構造の変更
- **MINOR**: 後方互換性のある新機能追加
- **PATCH**: 後方互換性のあるバグ修正・軽微な改善

---

## 2. リリース準備チェックリスト (Single Source Versioning)

バージョン更新時は、以下の Single Source of Truth に基づき更新を行います。

| 項目                    | ファイル / 場所                                                                                   |
| :---------------------- | :------------------------------------------------------------------------------------------------ |
| フロントエンド標準バージョン | [`package.json`](file:///c:/Users/632792/Documents/自作/QuMaEditor/package.json)                   |
| Rust クレートバージョン | [`src-tauri/Cargo.toml`](file:///c:/Users/632792/Documents/自作/QuMaEditor/src-tauri/Cargo.toml)  |
| 日本語更新履歴           | [`docs/ja/CHANGELOG.md`](file:///c:/Users/632792/Documents/自作/QuMaEditor/docs/ja/CHANGELOG.md)   |
| 英語更新履歴             | [`docs/en/CHANGELOG.md`](file:///c:/Users/632792/Documents/自作/QuMaEditor/docs/en/CHANGELOG.md)   |
| 日本語 TODO リスト       | [`docs/ja/TODO.md`](file:///c:/Users/632792/Documents/自作/QuMaEditor/docs/ja/TODO.md)             |
| 英語 TODO リスト         | [`docs/en/TODO.md`](file:///c:/Users/632792/Documents/自作/QuMaEditor/docs/en/TODO.md)             |

---

## 3. CI / CD 自動化ワークフロー (GitHub Actions)

SnippetFlow スタイルの GitHub Actions ワークフローが設定済みです。

### 3.1 CI ワークフロー (`.github/workflows/ci.yml`)

- **トリガー**: `main` / `master` ブランチへの `push` および `pull_request`
- **処理内容**:
  - TypeScript の型チェック (`npm run lint`)
  - Rust ユニットテストの実行 (`cargo test`)
  - Tauri バックエンドビルド検証 (`cargo check`)

### 3.2 リリリース自動化ワークフロー (`.github/workflows/release.yml`)

- **トリガー**: `v*` タグのプッシュ（例: `git push origin v1.2.2`）または GitHub 上での手動トリガー (`workflow_dispatch`)
- **処理内容**:
  - Windows デスクトップアプリバイナリ (`.msi` / `.exe` インストーラー) の全自動ビルド
  - GitHub Releases ページの自動生成とバイナリアタッチ

---

## 4. リリリース実行コマンド (ボス用手順)

```bash
# 1. ローカルでの最終検証
npm run lint
cargo check --manifest-path src-tauri/Cargo.toml

# 2. リリースタグの付与とプッシュ (自動リリース発動)
git tag v1.2.2
git push origin v1.2.2
```
