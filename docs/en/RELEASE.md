# Release & Packaging Guide (RELEASE)

## 1. Versioning Policy

This project strictly adheres to Semantic Versioning 2.0.0 (`MAJOR.MINOR.PATCH`).

- **MAJOR**: Incompatible API or structural changes.
- **MINOR**: Backward-compatible feature additions.
- **PATCH**: Backward-compatible bug fixes.

## 2. Release Steps (Single Source of Truth)

1. **Update version in `package.json` & `src-tauri/Cargo.toml`**:
   `AboutModal.tsx`, `TitleBar.tsx`, and `tauri.conf.json` automatically import and synchronize the version from `package.json`.
2. **Update `docs/ja/CHANGELOG.md` and `docs/en/CHANGELOG.md`**.
3. **Update `docs/ja/TODO.md` and `docs/en/TODO.md`**.

## 3. Production Verification & Tag Release

```bash
# 1. Verification
npm run lint
cargo check --manifest-path src-tauri/Cargo.toml

# 2. Tag and Push (Triggers GitHub Actions Release Workflow)
git tag v1.4.3
git push origin v1.4.3
```
