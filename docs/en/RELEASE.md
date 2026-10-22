# Release & Packaging Guide (RELEASE)

**English** | [日本語版](../ja/RELEASE.md)

## 1. Versioning Policy

This project strictly adheres to Semantic Versioning 2.0.0 (`MAJOR.MINOR.PATCH`, e.g., `1.5.1`).

- **MAJOR**: Incompatible API or structural changes.
- **MINOR**: Backward-compatible feature additions.
- **PATCH**: Backward-compatible bug fixes and minor improvements.

---

## 2. Release Preparation Checklist (Single Source Versioning)

When bumping the version, synchronize all relevant files according to the Single Source of Truth:

| Item                               | File / Location                                                         |
| :--------------------------------- | :---------------------------------------------------------------------- |
| Frontend Standard Version          | [`package.json`](../../package.json)                                    |
| Rust Crate Version                 | [`src-tauri/Cargo.toml`](../../src-tauri/Cargo.toml)                    |
| Project READMEs (EN / JA)          | [`README.md`](../../README.md) / [`README_JA.md`](../../README_JA.md)   |
| Technical Specifications (EN / JA) | docs/en/SPECIFICATION.md / docs/ja/SPECIFICATION.md                     |
| User Guides (EN / JA)              | docs/en/USER_GUIDE.md / docs/ja/USER_GUIDE.md                           |
| Release Notes (EN / JA)            | [`docs/en/CHANGELOG.md`](CHANGELOG.md) / docs/ja/CHANGELOG.md           |
| TODO Lists (EN / JA)               | [`docs/en/TODO.md`](TODO.md) / docs/ja/TODO.md                          |

---

## 3. CI / CD Workflows (GitHub Actions)

Continuous integration and automated release packaging workflows are configured in GitHub Actions:

### 3.1 CI Quality Check (`.github/workflows/ci.yml`)

- **Trigger**: `push` and `pull_request` on `main` branch
- **Tasks**:
  - TypeScript type check (`npm run lint`)
  - Rust unit tests (`npm run test:rust` with Windows ComCtl32 v6 manifest)
  - Tauri backend build verification (`cargo check`)

### 3.2 Release Workflow (`.github/workflows/release.yml`)

- **Trigger**: Pushing a `v*` tag (e.g. `git push origin v1.5.1`) or manual trigger via `workflow_dispatch`
- **Tasks**:
  - Full quality verification & all 43 unit tests
  - Automated building of Windows desktop installers (`.msi` / `.exe`)
  - Automated GitHub Releases creation with attached assets

---

## 4. Production Release Execution

```bash
# 1. Five Essential Pre-commit Verifications
cargo fmt --manifest-path src-tauri/Cargo.toml --check
cargo check --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
npm run test:rust
npm run lint

# 2. Tag and Push (Triggers GitHub Actions Release Workflow)
git tag -a v1.5.1 -m "QuMaEditor v1.5.1 Release"
git push origin v1.5.1
```
