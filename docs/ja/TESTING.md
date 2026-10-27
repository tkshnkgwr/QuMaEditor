# テスト方針・検証基準 (TESTING)

[English Version](../en/TESTING.md) | **日本語版**

## 1. テスト方針

本プロジェクトでは、すべてのコード変更に対して以下の品質基準を満たす必要があります。

1. **Rust バックエンド品質・安全性**:
   - `cargo fmt --check` によるフォーマット統一、`cargo clippy -- -D warnings` による静的解析警告ゼロ、および全単体テスト（`npm run test:rust`：全 44 件）の 100% パス。
2. **フロントエンド静的解析・型安全性**:
   - TypeScript の Strict チェックを通過し、`npm run lint`（`tsc --noEmit`）がエラーゼロであること。
3. **文字コード・改行コード相互検証**:
   - `UTF-8`, `Shift_JIS`, `EUC-JP` のそれぞれの相互変換で文字欠損・破壊・文字化けが発生しないこと。
4. **描画・UI安定性**:
   - Vite によるプロダクションビルド（`npm run build`）が正常完了し、リアルタイムプレビュー・Mermaid 描画・自動保存が遅延なく動作すること。

## 2. 5大事前強制検証プロセス

プログラムコード（`*.rs`, `*.ts`, `*.tsx` 等）を変更した際は、以下の検証コマンドを順次実行します（Markdown ドキュメントのみの変更時は省略可能）。

```powershell
# 1. フロントエンド TypeScript 型チェック
npm run lint

# 2. Rust コードフォーマット検証
cargo fmt --manifest-path src-tauri/Cargo.toml --check

# 3. Rust コンパイル・型検証
cargo check --manifest-path src-tauri/Cargo.toml

# 4. Rust Clippy リンター検証 (警告をエラー扱い)
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings

# 5. Rust ユニットテスト全件実行 (Windows ComCtl32 v6 マニフェスト自動解決)
npm run test:rust
```
