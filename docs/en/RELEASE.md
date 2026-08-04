# Release & Packaging Guide (RELEASE)

## 1. Versioning Policy

This project strictly adheres to Semantic Versioning 2.0.0 (`MAJOR.MINOR.PATCH`).

- **MAJOR**: Incompatible API or structural changes.
- **MINOR**: Backward-compatible feature additions (e.g. Multi-encoding support in v1.2.0).
- **PATCH**: Backward-compatible bug fixes.

## 2. Release Steps

1. **Update `package.json`**:
   ```json
   "version": "1.2.0"
   ```
2. **Update version in `AboutModal.tsx`**:
   ```typescript
   const version = '1.2.0';
   ```
3. **Update `docs/ja/CHANGELOG.md` and `docs/en/CHANGELOG.md`**.

## 3. Production Verification

```bash
# Type check and lint
npm run lint

# Build production bundle
npm run build
```
Verify that optimized static assets are created inside `dist/`.
