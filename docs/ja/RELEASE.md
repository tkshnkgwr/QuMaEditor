# リリース・パッケージングガイド (RELEASE)

## 1. バージョン管理規約

本プロジェクトは セマンティック バージョニング (Semantic Versioning 2.0.0) に準拠します。
`MAJOR.MINOR.PATCH` (例: `1.2.0`)

- **MAJOR**: 互換性のないUI/データ構造の変更
- **MINOR**: 後方互換性のある新機能追加 (例: v1.2.0 での文字コード対応・Aboutモーダル追加)
- **PATCH**: 後方互換性のあるバグ修正・軽微な改善

## 2. バージョンバンプ手順

1. **`package.json` のバージョン変更**:
   ```json
   "version": "1.2.0"
   ```
2. **`AboutModal.tsx` 内の表示バージョン文字列の更新**:
   ```typescript
   const version = '1.2.0';
   ```
3. **`docs/ja/CHANGELOG.md` および `docs/en/CHANGELOG.md` の更新**:
   リリース日と変更内容を明記。

## 3. プロダクションビルド検証

```bash
# 型チェックとリントの実行
npm run lint

# ビルド実行
npm run build
```

`dist/` ディレクトリ配下に静的HTML/CSS/JSファイルが最適化されて生成されることを確認します。
