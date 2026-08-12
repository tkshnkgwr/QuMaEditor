# AI Agent Development Guidelines for QuMaEditor (AGENTS.md)

本プロジェクトにおける大賢者の開発指示書です。
最優先ルール（コミット禁止・テーブル整列等）は [[GEMINI.md]] を参照してください。

## 🎯 開発・品質ルール

- **技術解説への配慮**:
  - ボスの他言語経験を尊重し、Rust/React/TypeScript 固有概念（所有権、ライフタイム、フック等）は一般的なプログラミング概念に置き換えて分かりやすく補足解説を添えること。
- **事前検証とドキュメント同期**:
  - 開発およびドキュメント更新の際は、コミット前の段階で以下の **「5大事前強制検証」を必ずローカルで全自動実行** し、1件の警告・エラーも残さないこと：
    1. `cargo fmt --manifest-path src-tauri/Cargo.toml --check` （コード整形検証）
    2. `cargo check --manifest-path src-tauri/Cargo.toml` （コンパイル・型検証）
    3. `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings` （Clippy 厳格品質検証）
    4. `cargo test --manifest-path src-tauri/Cargo.toml` （Rust ユニットテスト検証）
    5. `npm run lint` （TypeScript 型検証）
- **コード規模とリファクタリング**:
  - 単一ソース (`*.ts`, `*.tsx`, `*.rs`) が 1,000 行を超えた場合はモジュール分割リファクタリングを積極的に提案・推進すること。
