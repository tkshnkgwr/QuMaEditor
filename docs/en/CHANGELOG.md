# Changelog (CHANGELOG)

All notable changes and release history for QuMaEditor.

## [1.4.2] - 2026-08-21

### 📑 Heading Outline Navigation, LocalStorage Disk Export, Tab Nesting, Pure Markdown (v1.4.2)

- **Heading Outline & TOC Navigation (`Sidebar / Navigation`)**:
  - Added dual-tab switcher in sidebar for "📁 Documents" and "📑 Outline".
  - Rust native fast extraction (`pulldown_cmark` offset + binary search) of H1~H6 headings with exact line numbers.
  - Hierarchical indentation, level badges (`H1`~`H6`), line number badges, and real-time search filtering.
  - Clicking any heading smoothly jumps both the editor cursor (scrolling into center view) and the preview heading.
- **Dedicated "💾 Save to PC File" Button for LocalStorage Documents (`File / Storage`)**:
  - Added one-click action button on StatusBar to easily export browser-cached documents to local `.md` files.
- **Editor Tab Indentation & Nested Bullet Lists (`Editor / List`)**:
  - Prevented Tab key from losing focus.
  - Full support for single-line list prefix increment (`- ` ➔ `  - `), multi-line block indent, and `Shift + Tab` unindent.
- **Fix Ordered List (<ol>) and Nested List Rendering Glitches (`Preview / Markdown`)**:
  - Fixed issue where `<ol>` numbers broke onto separate lines.
  - Optimized nested list bullet markers (disc ➔ circle ➔ square, 1. ➔ a.) and print styles.
- **Complete CSV Removal & Pure Markdown Focus (`Preview / CSV Drop`)**:
  - Purged all CSV native parsing and table preview components to optimize QuMaEditor as a lightweight Markdown editor.
- **Zen Mode Documentation & Help Guide Expansion (`Help / Docs`)**:
  - Added detailed Zen mode explanation, shortcut keys (`Ctrl+Shift+Z` / `Esc`), and benefits in both the app help modal and documentation.

## [1.4.1] - 2026-08-18

### 🖨️ Print Preview Overhaul, Mermaid Auto-Scaling, and Real-Time Layout Sync (v1.4.1)

- **Print Preview Overhaul & Multi-Page Pagination Optimization**:
  - Instant preview update upon paper size and orientation changes in print dialog.
  - Document file name printing in print header alongside QuMaEditor badge.
  - Crisp task list printing with clear checkboxes and strike-through support.
- **Mermaid Diagram Single-Page Auto-Scaling & Blank Page Elimination**:
  - Automatically scales oversized and tall diagrams to cleanly fit inside a single page.
  - Completely eradicated empty blank pages and orphan border outlines during print.
- **Instant Layout Switching & Settings Synchronization**:
  - Zero-latency view mode switching via CSS display control for `Preview`.
  - Full propagation of line-height and font family preferences into markdown preview.
- **Windows "SendTo" Setting Removal**:
  - Cleaned up unused SendTo registry stubs and settings modal checkbox.

## [1.4.0] - 2026-08-18

### 🚀 Rust Native Auto-Formatting, Zero-Latency Typing, Fast CSV, and Modularization (v1.4.0)

- **Markdown Auto-Formatting (`Ctrl + Shift + F`)**:
  - Automatically aligns GFM tables vertically, inserts blank lines around headings, and collapses excessive blank lines while protecting code blocks via Rust native engine.
- **Zero-Latency Typing**:
  - Complete unmounting of preview in "Editor Only" mode and debounced/deferred parsing in "Split View" mode for lag-free typing.
- **`Ctrl + E` Cursor Position & Focus Restoration**:
  - Automatically restores cursor position and line selection when switching between editor and preview modes.
- **Mermaid Diagram Real-Time Preview & Zoom**:
  - Dynamic SVG diagram rendering for ````mermaid ... ```` code blocks with interactive zoom (50%~600%), fullscreen modal, and copy button.
- **Zero-Copy Native CSV Fast Parsing & Interactive Table**:
  - Parses large CSV files natively with automatic column type alignment (numbers right, dates center, strings left), sorting, and search filtering.
- **Document Statistics Dashboard (`StatsModal`)**:
  - Real-time aggregation of characters, words, lines, reading time, headings, and links (accessible via status bar click).
- **External Process Modification Detection & Manual Reload (`F5`)**:
  - Detects external changes via `mtime` with toast alerts, plus manual reload shortcut (`F5` / `Ctrl + R`).
- **Status Bar Persistence Badge Integration**:
  - Consolidated all storage state displays into the status bar footer.
- **Extended Editor Settings**:
  - Added line height, font family (Monospace/Sans-serif), and tab size configuration.
- **Modular Refactoring (>1,000 Lines Enforcement)**:
  - Backend: Modularized `text_processing/` into `stats.rs`, `yaml.rs`, `structure.rs`, `csv.rs`, `formatter.rs`, `html_renderer.rs`.
  - Frontend: Separated `useGlobalShortcuts.ts`, `ModalGroup.tsx`, `MarkdownRenderers.tsx`.
  - All source files are now strictly under 1,000 lines.

---

## [1.3.3] - 2026-08-12

### ✨ Explorer Folder Opening with Target File Selection (v1.3.3)

- **Highlighted File Selection in Windows Explorer**:
  - Improved `open_folder_native` with Windows `explorer.exe /select,` option to highlight target files when opening parent directories.

---

## [1.3.2] - 2026-08-12

### 🐛 Editor Input Area & Full-Screen Drag & Drop Fixes (v1.3.2)

- **Tauri Native Window Drag & Drop Event Listening**:
  - Fixed HTML5 drop event cancellations by listening to Tauri native `onDragDropEvent`.
- **Full-Screen Visual Overlay**:
  - Improved guidance overlay when dragging files into the editor window.

---

## [1.3.0] - 2026-08-12

### 🚀 Rust Inverted Index Search, Chunk Streaming & Memory GC (v1.3.0)

- **10MB+ Large File Chunk Streaming (`read_file_chunk_native`)**:
  - Reads large Markdown files incrementally to reduce initial RAM consumption.
- **Inverted Index Full-Text Search (`search_documents_native`)**:
  - Real-time in-memory inverted index search engine.
- **Memory Slimming GC**:
  - Converts saved documents to placeholders in LocalStorage to prevent `QuotaExceededError`.
