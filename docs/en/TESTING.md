# Testing Strategy & Policy (TESTING)

## 1. Quality Assurance Criteria
1. **Type Safety & Linting**: Pass TypeScript strict checks with 0 warnings/errors on `npm run lint`.
2. **Encoding Integrity**: Guarantee lossless round-trip conversions for `UTF-8`, `Shift_JIS`, and `EUC-JP`.
3. **Build Stability**: Clean Vite production bundle generation with zero runtime degradation.

## 2. Verification Steps

```bash
# Typecheck & Linter
npm run lint

# Production Build Test
npm run build
```
