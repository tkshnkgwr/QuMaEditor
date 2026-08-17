# Development Roadmap & TODO (TODO)

Tracked tasks and completed features for QuMaEditor.

---

## 🎯 Completed Tasks

### v1.4.0 Release (2026-08-17)

- [x] **Mermaid Diagram Real-Time Preview with Zoom & Fullscreen Modal (`MermaidRenderer`)**: Implemented dynamic SVG diagram rendering for ````mermaid ... ```` code blocks in the preview pane. Optimized font sizes (15px) for clear readability, interactive zoom controls (50% ~ 300%), fullscreen expand modal, dark/light theme synchronization, and code copying.
- [x] **CSV Status Bar Metric Optimization**: Automatically hid "読了目安 (Reading Time)" and "単語数 (Word Count)" when opening CSV documents, streamlining status bar metrics to line count, character count, cursor position, and encoding.
- [x] **Large File (47,000+ Lines) On-Demand Chunked Lazy Loading**: Implemented instant 0.01s initial opening for 500KB+/CSV files by loading only the initial 1,500 lines (150KB) instead of the entire file. Added an interactive bottom bar with "さらに読み込む (Load More)" and "全文を一括読み込み (Load Full File)" actions, with automatic full loading when enabling edit mode.
- [x] **Rust Native CSV Ultra-Fast Preview (`parse_csv_preview_native`)**: Eliminated UI thread blocking by replacing synchronous JS `split('\n')` parsing with zero-copy Rust native line counting and quoted cell extraction. Bypassed YAML Front Matter regex parsing on CSV files to achieve instant, zero-lag preview rendering.
- [x] **Large File (3MB+ CSV/Text) Ultra-Fast Rendering**: Replaced individual `<div>` line number rendering (100,000 DOM nodes) with a single `<pre>` text block (99.99% DOM overhead reduction). Implemented zero-allocation newline scanning and lightweight CSV summary table preview to eliminate UI freezing completely.
- [x] **CSV Storage Exclusion, Auto-Save Disable, & ReadOnly Control**: CSV files (`.csv`) are completely excluded from LocalStorage persistence and typing auto-save is fully stopped. CSV files open in ReadOnly mode by default with an informational banner, requiring an explicit click on "編集を有効化 (Enable Editing)" for manual editing and `Ctrl+S` disk saving.
- [x] **External Process File Change Detection & Auto-Reload**: Ultra-lightweight file metadata polling (`get_file_metadata_native` via `mtime`) to detect modifications by external editors/processes. Automatically reloads the document upon window focus or background interval (2.5s) and displays a floating toast notification: "別プロセスから更新されました。再読み込みします。".
- [x] **Rust Native Core Acceleration**: Migrated real-time text statistics (`calculate_text_stats_native`), YAML Front Matter parsing (`parse_yaml_front_matter_native`), heading outline extraction (`extract_headings_native`), task status cycling (`toggle_task_native`), and full standalone HTML export (`export_html_full_native`) to high-speed Rust native backend with 20 unit tests.
- [x] **Multi-Byte Safe Full-Text Search**: Fixed UTF-8 character boundary slice issues during search snippet generation with `chars().take()`, ensuring zero panic on multi-byte Japanese documents.
- [x] **Print Preview Render Retention in "Editor Only" Mode**: Retained preview DOM hierarchy while hidden in editor mode, enabling seamless full print preview rendering without blank pages.
- [x] **`Ctrl+E` Keyboard Shortcut Mode Switcher**: Quick toggle between "Editor Only" and "Preview Only" modes via `Ctrl+E` (disabled in split view).
- [x] **Heading Color Theme Customization**: Added 4 customizable preview heading color palettes (Muted, Vivid, High Contrast, Monotone) in Settings with instant dynamic preview styling.
- [x] **Light Mode Scrollbar & Print Dialog Synchronization**: Synchronized `color-scheme` meta tags, CSS properties, and root `<html>` classes to resolve dark-scrollbar and dark print dialog glitches in light theme.
- [x] **One-Click Format Insertion Toolbar**: Implemented quick insertion buttons for table modal, code block, quote (`> `), and task checkboxes (`- [ ] `).

### v1.3.3 Release (2026-08-12)

- [x] **Explorer Target File Selection Focus**: Enhanced `open_folder_native` with `explorer.exe /select,` to open Windows Explorer with the active file highlighted and selected.
- [x] **Ctrl + Scroll Wheel Preview Zoom**: Added interactive preview zooming (50%~300%) with reset badge in `Preview.tsx`.
- [x] **Selection-Aware Toolbar Formatting**: Updated Bold, Italic, Underline, and Strikethrough buttons to wrap text selections or insert at cursor with focus restoration.
- [x] **Cursor-Line Heading Insertion**: Modified H1/H2/H3 buttons to insert/replace `# ` markers at the start of the current line instead of appending at EOF.
- [x] **Open Parent Folder in Explorer**: Added native command `open_folder_native` and File menu action to open disk file directories in Explorer.
- [x] **LocalStorage Safety Explanation**: Added detailed LocalStorage dual-protection guide and comparison matrix in `AboutModal`.

### v1.2.3 Release (2026-08-07)

- [x] **Complete Suppression of PowerShell Console Window**: Added `CREATE_NO_WINDOW` (`0x08000000`) flag to Windows PowerShell command invocations for "Open with QuMaEditor" context menu registration, preventing black console windows from popping up at app startup.
- [x] **Separated Help Guide & About Modals**: Introduced a dedicated `HelpGuideModal` accessible from the top bar for quick-start instructions, while slimming down `AboutModal` to version, status badge, and troubleshooting tips.
- [x] **"Open Folder in Explorer" in Sidebar Items**: Extended "Open Containing Folder in Explorer" button to individual file items in the left sidebar.
- [x] **CI-Guarded GitHub Actions Release Pipeline**: Established CI workflow (`ci.yml`) covering TypeScript type checking, `cargo fmt` verification, and Rust unit tests (9/9 passing), linked to a Release workflow (`release.yml`) that safely builds and publishes NSIS installers (`.exe`) only upon CI green pass.

### v1.2.2 Release (2026-08-07)

- [x] **Settings Modal Reset Button Relocation**: Moved dangerous "Full Data Reset" button to the bottom-left footer row in `SettingsModal`.
- [x] **Ctrl + Scroll Wheel Preview Zoom**: Added interactive preview zooming (50%~300%) with reset badge in `Preview.tsx`.
- [x] **Selection-Aware Toolbar Formatting**: Updated Bold, Italic, Underline, and Strikethrough buttons to wrap text selections or insert at cursor with focus restoration.
- [x] **Cursor-Line Heading Insertion**: Modified H1/H2/H3 buttons to insert/replace `# ` markers at the start of the current line instead of appending at EOF.
- [x] **Open Parent Folder in Explorer**: Added native command `open_folder_native` and File menu action to open disk file directories in Explorer.
- [x] **LocalStorage Safety Explanation**: Added detailed LocalStorage dual-protection guide and comparison matrix in `AboutModal`.

### v1.2.1 Release (2026-08-06)

- [x] **Default Editor View on Startup**: Changed initial default view mode from `split` to `editor`.
- [x] **Type-Safe File Opening**: Refactored native file loading using `tauri-specta` bindings (`commands.readFileNative`).
- [x] **Windows Async Startup**: Offloaded PowerShell context menu registration to `spawn_blocking` threads to prevent freezes.
- [x] **Code Base Cleanup & Doc Completeness**: Added complete RustDoc comments and TypeScript JSDoc documentation across codebase.
- [x] **Rust Unit Test Suite Expansion**: Added unit tests covering file reading, diffing, index search, and encoding conversion (9/9 passed).

### v1.2.0 Release (2026-08-05)

- [x] **Direct File Overwrite (`Ctrl + S`) & Save As (`Ctrl + Shift + S`)**: Integrated Tauri `dialog` / `fs` plugins and Rust native reader (`read_file_native`). Retains actual `.md` file path (`filePath`) and directly overwrites disk files during manual or auto-save.
- [x] **Windows Explorer Context Menu**: Automatically registers "Open with QuMaEditor" in Windows Explorer context menu on startup and installation.
- [x] **Single Instance Enforcement**: Prevents duplicate app processes. Brings existing QuMaEditor window to focus and opens passed files as new tabs.
- [x] **Preview Font Size Synchronization**: Real-time font size adjustment across both editor and preview panels.
- [x] **Tab Bar Scrollbar Removal**: Clean CSS scrollbar hiding (`[scrollbar-width:none]`) for tab scroll area.
- [x] **AppData Path & LocalStorage Metrics in Settings**: Path display with copy-to-clipboard, real-time KB/doc metrics, and cache cleanup/reset actions in `SettingsModal`.
- [x] **Zero-Warning Vite Build via Code Splitting**: `manualChunks` in `vite.config.ts` (`vendor-react`, `vendor-icons`, `vendor-syntax`).
- [x] **Installer Binary Packaging Fix**: Declared `[[bin]]` targets in `Cargo.toml` to ensure `QuMaEditor.exe` is bundled.

### v1.1.0 Release (2026-08-04)

- [x] **Specta Auto TS Binding Export**: Auto-export type-safe TypeScript bindings (`src/bindings.ts`) from Rust DTOs.
- [x] **TypeDoc Frontend API Docs**: Generated HTML API documentation for frontend IPC wrappers (`docs/typedoc/`).
- [x] **RustDoc Backend HTML Docs**: Generated HTML documentation for native Rust core library (`cargo doc`).
- [x] **Tauri v2 IPC Architecture Guide**: Complete IPC protocol, permission, and test suite documentation (`TAURI_GUIDE.md`).
- [x] **Rust Core Unit Test Suite**: Created unit test suite covering key native modules (5/5 passed).

### v1.0.0 Formal Release (2026-08-04)

- [x] **Tauri v2 + Rust Architecture**: High performance native desktop architecture.
- [x] **Titlebar Controls & Cursor**: Frameless drag (`data-tauri-drag-region`), window actions, fixed default cursor.
- [x] **Enhanced Auto-Save Debounce**: Cancel save while typing and trigger save 3,000ms after typing stops.
- [x] **GFM Table Alignment**: Left `:---`, center `:---:`, right `---:` table alignment support.
- [x] **Light Mode Overhaul**: Ultra-bright Front Matter card (`bg-amber-50/60`), `prism` code syntax style, modal theme adaptation (`isDark`), global scrollbar theme syncing.
- [x] **Search Enhancements**: Keyword highlighting with amber badges (`<mark>`), YAML tag search (`#tag`), high-contrast search hit titles.
- [x] **PDF & Print Isolation**: A4 100% full-width page printing, `print:hidden` UI isolation, instant direct PDF file saving.
- [x] **Rust Acceleration**: 10MB+ chunk streaming, inverted index search (`search_documents_native`), Rayon multi-threaded batch conversion, `similar` text diff.
- [x] **Single Source Versioning**: Removed all version hardcoding from source code, dynamically referencing `package.json`.

---

## 🔥 Next Priority Roadmap & Feature Candidates

The following table tracks proposed features and enhancements for future QuMaEditor releases.

| #  | Target Component       | Feature & Task Description                                                                                                                                                                                                                                           | Priority | Status      |
| :- | :--------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------- | :---------- |
| 1  | `Editor / Preview`     | **Eliminate Typing Lag & Decouple Preview Rendering (Zero Latency)** — Unmount/bypass preview fully in "Editor Only" mode, and apply asynchronous rendering debounce (`useDeferredValue` / 120ms debounce) in "Split View" to achieve zero-lag fluid keystroke response | Highest  | 📋 Planned  |
| 2  | `Editor / Keyboard`    | **Automatic Cursor Position & Focus Restoration on `Ctrl+E`** — Retain cursor selection ranges when switching to preview and restore exact cursor line/offset and textarea focus when returning to editor view                                                     | Highest  | 📋 Planned  |
| 3  | `Toolbar / Formatter`  | **Markdown Auto-Formatter Feature** — Non-AI Rust native formatter to auto-insert blank lines around headings/lists, vertically align Markdown tables, and compress redundant blank lines via "✨ Format" button & `Ctrl+Shift+F` hotkey                              | Highest  | 📋 Planned  |
| 4  | `TitleBar / StatusBar` | **Relocate Save Status Display to StatusBar** — Move save status badges ("実ファイルに保存", editing, saving, saved) from TitleBar header to bottom StatusBar footer for streamlined UI hierarchy                                                                   | High     | 📋 Planned  |
| 5  | `FileWatcher / FileIO` | **Fix External Process Modification Detection & Auto-Sync on Tab Switch** — Check and reload fresh disk file contents upon sidebar/tab selection, monitor background open tabs, prevent typing auto-save conflicts, and add manual reload (`Ctrl+R` / `F5`)   | High     | 📋 Planned  |
| 6  | `Preview / Syntax`     | **Pre-rendered Code Syntax Highlighting in Rust (`syntect`)** — Offload code block syntax color parsing from JS (Prism) to Rust (`syntect`), achieving zero lag on documents with extensive code blocks                                                             | Medium   | 📋 Planned  |
| 7  | `Preview / Core`       | **Native Markdown HTML Direct Generation & DOM Patching (`pulldown-cmark`)** — Bypass `ReactMarkdown` virtual DOM overhead, batch rendering HTML in Rust with DOM patching for 10x–20x preview speedup on large docs                                                | Medium   | 📋 Planned  |
| 8  | `Preview / CSV`        | **CSV Data Table Preview with Auto-Alignment** — Render CSV text blocks/files into elegant interactive tables, automatically aligning text columns to left and numeric values to right                                                                              | High     | 🔲 Proposed |
| 9  | `StatsModal / Editor`  | **Document Statistics Dashboard Modal** — Dedicated modal rendering real-time character count, word count, line count, estimated reading time, heading count, and links                                                                                           | Medium   | 🔲 Proposed |
| 10 | `Sidebar / Navigation` | **Heading Outline (Table of Contents) Navigation Tree** — Auto-extract `# H1` ~ `### H3` headings from active document for instant smart jumping                                                                                                                  | Medium   | 🔲 Proposed |
| 11 | `ZenMode / Editor`     | **Zen Mode Audio Mute Feature** — Automatically mute all system and application sound notifications when entering Zen mode                                                                                                                                          | Medium   | 🔲 Proposed |
| 12 | `ZenMode / Editor`     | **Zen Mode Notification Silencer** — Completely disable all in-app toasts and non-essential popups during Zen writing sessions                                                                                                                                      | Medium   | 🔲 Proposed |
| 13 | `ZenMode / Editor`     | **Current Line Focus Mode** — Dim all text lines except the currently active cursor line for maximum concentration                                                                                                                                                  | Medium   | 🔲 Proposed |
| 14 | `ZenMode / Editor`     | **Typewriter Scrolling** — Keep active typing line locked at vertical center of screen to minimize eye and neck movement                                                                                                                                             | Low      | 🔲 Proposed |
| 15 | `ZenMode / Editor`     | **Pomodoro Focus Timer** — Subtle, minimal 25min work + 5min break timer displayed inside Zen mode                                                                                                                                                                  | Low      | 🔲 Proposed |
| 16 | `ZenMode / Editor`     | **Ambient BGM / White Noise Player** — Optional ambient sound generator (rain, cafe, white noise) for deep focus                                                                                                                                                    | Low      | 🔲 Proposed |
| 17 | `SettingsModal / UI`   | **Enhanced Editor Typography Controls** — Configurable line-height, editor font family (Monospace vs Sans-serif), and tab size options in settings                                                                                                                  | Low      | 🔲 Proposed |

---

## 🦀 Rust Native Acceleration Candidates (Performance & Lightweighting)

The following TypeScript/frontend operations are prime candidates for Rust backend migration to drastically reduce memory allocations, eliminate GC pauses, and boost execution speed.

| #  | Target Feature / Operation                    | Current / Native Method                      | Rust Migration Strategy & Crates              | Expected Performance Gains & Benefits                                  | Status      |
| :- | :-------------------------------------------- | :------------------------------------------- | :-------------------------------------------- | :--------------------------------------------------------------------- | :---------- |
| 1  | **Real-Time Text & Word Statistics**          | `calculateTextStatsNative`                   | `unicode-segmentation` + SIMD zero-allocation | Zero typing lag and zero GC pressure even on 100K+ character documents | ✅ Done     |
| 2  | **Fast YAML Front Matter Parsing**            | `parseYamlFrontMatterNative`                 | `serde_yaml` native struct deserialization    | Drastically lower CPU overhead on file load, save, and preview toggle  | ✅ Done     |
| 3  | **Heading Outline / TOC Extraction**          | `extractHeadingsNative`                      | `pulldown-cmark` AST event stream parsing     | Sub-millisecond (0.1ms) instant H1–H6 table of contents generation     | ✅ Done     |
| 4  | **Batch HTML Export & Conversion**            | `exportHtmlFullNative`                       | `pulldown-cmark` + embedded CSS templates     | Non-blocking instant bulk conversion without freezing the UI thread    | ✅ Done     |
| 5  | **Fast Task Checkbox Status Toggle**          | `toggleTaskNative`                           | Rust byte slice replacement                   | Instant document update on preview checkbox click                      | ✅ Done     |
| 6  | **Native Code Syntax Pre-Rendering**          | `react-syntax-highlighter` (Prism JS)        | `syntect` native HTML pre-rendering           | Zero preview lag on docs containing extensive code blocks              | 📋 Planned  |
| 7  | **Native Markdown HTML Generation & Patching** | Dynamic Virtual DOM via ReactMarkdown        | `pulldown-cmark` + DOM diff patching          | 10x–20x faster preview rendering on large docs (>100K chars)           | 📋 Planned  |

---

## 🔮 Long-Term Roadmap

- [x] **Native Text & Word Statistics Calculation in Rust (`unicode-segmentation`)**
- [x] **Rust Native YAML Front Matter Parsing & Validation (`serde_yaml`)**
- [x] **Heading Outline Extraction, Task Toggle, and Full HTML Export in Rust (`pulldown-cmark`)**
- [ ] **Large-Scale CSV Preview Acceleration & Handling Beyond Initial 100 Rows (Virtual Scrolling / On-Demand Pagination)**
- [ ] **Pre-rendered Code Block Syntax Highlighting in Rust (`syntect`)**
- [ ] **Plugin & Extension Architecture Research**
- [ ] **Cloud Storage Sync Prototype (Google Drive / OneDrive)**
- [ ] **Multi-Window & Detachable Tab Exploration**


