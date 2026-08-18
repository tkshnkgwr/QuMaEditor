# User Guide (USER_GUIDE)

**English** | [日本語版](docs/ja/USER_GUIDE.md)

## 1. UI Components Overview (v1.4.0)

QuMaEditor features an intuitive, modern desktop UI.

1. **Title Bar (Header)**:
   - Left: Sidebar toggle, editable document title, encoding badge (`UTF-8`, `Shift_JIS`, `EUC-JP`), EOL badge (`LF`, `CRLF`), character & line counter.
   - Right: Theme toggle (Light/Dark/System), version info (`v1.4.0`), settings button, native window controls.
   - Sub-bar: File / Template / Help dropdown menus, view mode switcher (Split / Editor Only / Preview Only), Zen Mode toggle.
2. **Formatting Toolbar**:
   - Headings (H1~H3), Bold, Italic, Underline, Strikethrough, List, Task, Table, Code, Quote, Link, Image upload, Horizontal Rule, Timestamp.
   - **✨ Markdown Auto-Formatting (`Ctrl+Shift+F`)**: Instantly aligns GFM tables, adds blank lines around headings, and collapses consecutive blank lines.
   - **Selection Wrapping**: Wraps selected text when pressing formatting buttons.
   - **Heading Insertion**: Inserts `# ` markers at the beginning of the active cursor line.
3. **Workspace (Editor & Preview)**:
   - **Zero-Latency Typing**: Bypasses preview parsing in "Editor Only" mode for lag-free typing.
   - **`Ctrl + E` Focus Restoration**: Restores cursor position when toggling between editor and preview.
   - **Mermaid Diagrams**: Dynamic SVG diagram rendering with zoom (50%~600%) and fullscreen modal.
   - **CSV Table Preview**: Type auto-alignment (numbers right, dates center, strings left), sorting, and search filtering.
4. **Status Bar (Footer)**:
   - Persistence status badge (💾 Saved to Disk / 📦 Saved in App), cursor line/col, character/word count, reading time, encoding selector.
   - **Statistics Dashboard**: Click the character/word counter to open the detailed `StatsModal`.

---

## 2. Character Encodings & Line Breaks

### Opening Files

- Open files via "File > Open (Ctrl+O)", **Drag & Drop from Explorer**, or right-click "Open with QuMaEditor".
- Character encoding is auto-detected (UTF-8, Shift_JIS, EUC-JP) with zero garbled text.
- Drag & drop text files (`.md`, `.txt`, `.csv`) to open as new tabs; drop images to insert Data URLs.

### Saving & Exporting

- Select target encoding from the status bar dropdown.
- Shift_JIS automatically standardizes line breaks to **CRLF**; EUC-JP / UTF-8 to **LF**.
- `Ctrl + S` directly saves back to disk; `Ctrl + Shift + S` opens the Save As dialog.

---

## 3. Crash-Proof Dual Persistence

- Text is auto-saved to **LocalStorage** within 3 seconds of typing.
- Use `Ctrl + S` to save directly to local `.md` files on disk.
- External file modifications are detected via `mtime` with toast alerts and manual reload (`F5` / `Ctrl+R`).

---

## 4. Keyboard Shortcuts

| Shortcut           | Action / Feature                               |
| :----------------- | :--------------------------------------------- |
| `Ctrl + N`         | Create new Markdown document                   |
| `Ctrl + O`         | Open local text file (.md, .txt, .csv)         |
| `Ctrl + S`         | Direct save to disk                            |
| `Ctrl + Shift + S` | Save As (choose file location)                 |
| `Ctrl + Shift + F` | Markdown auto-formatting (align tables, lines) |
| `Ctrl + E`         | Toggle View Mode (Editor Only ↔ Preview Only)  |
| `F5` / `Ctrl + R`  | Force reload file from disk                    |
| `Ctrl + P`         | A4 Print / PDF Export dialog                   |
| `Ctrl + B`         | Bold formatting / wrap selection               |
| `Ctrl + I`         | Italic formatting / wrap selection             |
| `Ctrl + Shift + Z` | Toggle Zen Focus Mode                          |
| `F1`               | Open Keyboard Shortcuts Help                   |
