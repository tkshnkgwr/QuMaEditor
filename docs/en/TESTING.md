# Testing Strategy & Policy (TESTING)

**English Version** | [日本語版](../ja/TESTING.md)

## 1. Quality Assurance Criteria

1. **Rust Backend Quality & Safety**:
   - Pass `cargo fmt --check`, pass `cargo clippy -- -D warnings` with 0 warnings, and pass 100% of unit tests (`npm run test:rust`, 44 unit tests).
2. **Frontend Type Safety & Linting**:
   - Pass TypeScript strict checks with 0 warnings/errors on `npm run lint` (`tsc --noEmit`).
3. **Encoding Integrity**:
   - Guarantee lossless round-trip conversions for `UTF-8`, `Shift_JIS`, and `EUC-JP`.
4. **Build & Rendering Stability**:
   - Clean Vite production bundle generation (`npm run build`) with zero runtime degradation across real-time preview, Mermaid diagrams, and auto-save.

## 2. 5 Mandatory Pre-Verification Steps

Whenever source code (`*.rs`, `*.ts`, `*.tsx`, etc.) is modified, run the following verification suite (skipped for Markdown-only `*.md` changes):

```powershell
# 1. Frontend TypeScript Type Check
npm run lint

# 2. Rust Code Formatting Check
cargo fmt --manifest-path src-tauri/Cargo.toml --check

# 3. Rust Compilation & Type Check
cargo check --manifest-path src-tauri/Cargo.toml

# 4. Rust Clippy Static Analysis (Disallow warnings)
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings

# 5. Rust Unit Test Suite (Auto-resolves Windows ComCtl32 v6 manifest)
npm run test:rust
```
