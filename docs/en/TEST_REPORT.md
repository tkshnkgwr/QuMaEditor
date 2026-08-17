# Test Execution Report (TEST_REPORT)

## 1. Test Summary

- **Date**: 2026-08-03
- **Version**: v1.4.0
- **Environment**: Cloud Run Container / Chrome 127.0 (Linux/x86_64)

## 2. Test Cases & Verification Results

| ID    | Test Item                 | Verification Procedure                        | Expected Outcome                      | Status   |
| :---- | :------------------------ | :-------------------------------------------- | :------------------------------------ | :------- |
| TC-01 | UTF-8 File Opening        | Open UTF-8 `.md` file                         | No garbled text, detected as UTF-8    | **Pass** |
| TC-02 | Shift_JIS File Opening    | Open SJIS `.txt` file                         | No garbled text, detected as Shift_JIS | **Pass** |
| TC-03 | EUC-JP File Opening       | Open EUC-JP `.md` file                        | No garbled text, detected as EUC-JP   | **Pass** |
| TC-04 | Shift_JIS Export          | Export with Shift_JIS selected                | Output line endings CRLF (`\r\n`)     | **Pass** |
| TC-05 | EUC-JP Export             | Export with EUC-JP selected                   | Output line endings LF (`\n`)         | **Pass** |
| TC-06 | SQL Syntax Highlight      | Write SQL code block                          | SELECT/FROM highlighted correctly     | **Pass** |
| TC-07 | Version Modal Display     | Click info icon / menu                        | Displays v1.4.0 About dialog          | **Pass** |
| TC-08 | Yama Front Matter Parsing | Load `.md` with Front Matter                  | Auto-extract title/tags/encoding      | **Pass** |
| TC-09 | Front Matter Editor Lock  | Check editor UI                               | Front Matter block read-only          | **Pass** |
| TC-10 | Tag Management UI         | Add/remove tags via UI                        | Badges update dynamically             | **Pass** |
| TC-11 | Yama Front Matter Export  | Export document as `.md`                      | Front Matter header generated         | **Pass** |
| TC-12 | Shortcuts Modal Display   | Click Help > Keyboard Shortcuts or press `F1` | Categorized hotkeys modal appears     | **Pass** |
| TC-13 | Global Hotkeys Trigger    | Press `Ctrl+N` / `Ctrl+S` / `Ctrl+P`          | New doc, save, print dialog triggered | **Pass** |
| TC-14 | TypeScript Compilation    | Execute `npm run lint`                        | Pass with 0 errors                    | **Pass** |
| TC-15 | Production Build          | Execute `npm run build`                       | Build succeeds, `dist/` created       | **Pass** |

