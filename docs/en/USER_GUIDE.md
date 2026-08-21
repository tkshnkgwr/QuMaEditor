# User Guide (USER_GUIDE)

**English** | [日本語版](docs/ja/USER_GUIDE.md)

## 1. UI Components Overview (v1.4.2)

QuMaEditor features an intuitive Windows desktop-native layout:

1. **Title Bar (Header)**:
   - Left: Sidebar toggle, editable document title, encoding badge (`UTF-8`, `Shift_JIS`, `EUC-JP`), line-ending badge (`LF`, `CRLF`), character and line counters.
   - Right: Theme toggle (Light/Dark/System), version info (`v1.4.2`), settings button, native window controls.
   - Sub-bar: File / Template / Help dropdown menus, view mode switcher (Split / Editor Only / Preview Only), Zen Mode toggle.
2. **Left Sidebar (Sidebar & Outline)**:
   - **📁 Documents Tab**: Switch, search, tag-filter, favorite, and manage active/stored documents.
   - **📑 Outline / TOC Tab**: Instantly extracts H1~H6 headings into a hierarchical tree. Clicking any heading jumps both the editor cursor (scrolling into center view) and the preview smoothly.
3. **Formatting Toolbar**:
   - Headings (H1~H3), Bold, Italic, Underline, Strikethrough, List, Task, Table, Code, Quote, Link, Image upload, Horizontal Rule, Timestamp.
   - **✨ Markdown Auto-Formatting (`Ctrl+Shift+F`)**: Instantly aligns GFM tables vertically, adds blank lines around headings, and collapses consecutive blank lines.
   - **Selection Wrapping**: Wraps selected text when pressing formatting buttons.
   - **Heading Insertion**: Inserts `# ` markers at the beginning of the active cursor line.
4. **Workspace (Editor & Preview)**:
   - **Editor Tab Indentation & Nested Lists**: Tab key stays focused, supporting nested bullet level increment (`- ` ➔ `  - `), multi-line block indent, and `Shift + Tab` unindent.
   - **Zero-Latency Typing**: Bypasses preview parsing in "Editor Only" mode for lag-free typing.
   - **`Ctrl + E` Focus Restoration**: Restores cursor position when toggling between editor and preview.
   - **Mermaid Diagrams**: Dynamic SVG diagram rendering with zoom (50%~600%) and fullscreen modal.
5. **Status Bar (Footer)**:
   - Persistence status badge (💾 Saved to Disk / 📦 Saved in App).
   - **"💾 Save to PC File" Button**: Dedicated one-click button for documents stored solely in browser LocalStorage.
   - Cursor line/col, character/word count, reading time, encoding selector.
   - **Statistics Dashboard**: Click the character/word counter to open the detailed `StatsModal`.

---

## 2. 🧘 Zen Focus Writing Mode (Zen Mode)

A distraction-free, full-screen writing sanctuary.

### Highlights
- **Hidden UI Chrome**: Conceals title bar, toolbar, sidebar, and status bar for 100% writing focus.
- **Centered Typography**: Centers the editor area to minimize eye and neck fatigue on wide monitors.
- **Instant Escape**: Resume full UI immediately with a single keystroke.

### How to Use
- **Activate**: Press <kbd>Ctrl + Shift + Z</kbd> or click "Focus Mode" in the top menu.
- **Exit**: Press <kbd>Esc</kbd> or click the floating "Exit Zen Mode (Esc)" button on the top right.

---

## 3. Character Encodings & Line Breaks

### Opening Files

- Open files via "File > Open (Ctrl+O)", **Drag & Drop from Explorer**, or right-click "Open with QuMaEditor".
- Character encoding is auto-detected (UTF-8, Shift_JIS, EUC-JP) with zero garbled text.
- Drag & drop text files (`.md`, `.txt`) to open as new tabs; drop images to insert Data URLs.

### Saving & Exporting

- Select target encoding from the status bar dropdown.
- Shift_JIS automatically standardizes line breaks to **CRLF**; EUC-JP / UTF-8 to **LF**.
- `Ctrl + S` directly saves back to disk; `Ctrl + Shift + S` opens the Save As dialog.

---

## 4. Crash-Proof Dual Persistence

- Text is auto-saved to **LocalStorage** within 3 seconds of typing.
- Use `Ctrl + S` or the status bar's "💾 Save to PC File" button to save directly to local `.md` files on disk.
- External file modifications are detected via `mtime` with toast alerts and manual reload (`F5` / `Ctrl+R`).

---

## 5. Keyboard Shortcuts

| Shortcut           | Action / Feature                               |
| :----------------- | :--------------------------------------------- |
| `Ctrl + N`         | Create new Markdown document                   |
| `Ctrl + O`         | Open local text file (.md, .txt)               |
| `Ctrl + S`         | Direct save to disk                            |
| `Ctrl + Shift + S` | Save As (choose file location)                 |
| `Ctrl + Shift + F` | Markdown auto-formatting (align tables, lines) |
| `Ctrl + E`         | Toggle View Mode (Editor Only ↔ Preview Only)  |
| `Tab`              | Indent line / nest bullet item                 |
| `Shift + Tab`      | Unindent line / promote bullet item            |
| `F5` / `Ctrl + R`  | Force reload file from disk                    |
| `Ctrl + P`         | A4 Print / PDF Export dialog                   |
| `Ctrl + B`         | Bold formatting / wrap selection               |
| `Ctrl + I`         | Italic formatting / wrap selection             |
| `Ctrl + Shift + Z` | Toggle Zen Focus Mode (Exit with `Esc`)        |
| `F1`               | Open Keyboard Shortcuts Help                   |
