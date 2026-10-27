# Changelog (CHANGELOG)

**English Version** | [日本語版](../ja/CHANGELOG.md)

All notable changes and release history for QuMaEditor.

## [1.5.3] - 2026-10-27

### 📄 License Transition to GPL-3.0-or-later (v1.5.3)

- **Open Source License Update (`License / Legal`)**:
  - Changed the project license from `MIT License` to **`GNU General Public License v3.0 or later (GPL-3.0-or-later)`**.
  - Updated `LICENSE`, `package.json`, `src-tauri/Cargo.toml`, and EN/JA `README` badges and license sections to `GPL-3.0-or-later`.

## [1.5.2] - 2026-10-27

### 🛡️ Comprehensive Codebase Audit, Bug Fixes, XSS Hardening & Documentation Sync (v1.5.2)

- **Frontend Stability & Dual-Pane Fixes (`Frontend / Stability`)**:
  - Fixed target document ID matching in `updateDocContent` so single-pane edits, auto-formatting, and task checkbox toggles reliably update state.
  - Added data-loss guards preventing auto-save and in-place disk overwrite from truncating partially loaded chunked files (`isChunkedLoaded`).
  - Resolved React Rules of Hooks crash in `StatsModal` and `onCursorChange` undefined crash in dual-pane editing mode.
  - Fixed `currentDoc` prop forwarding to `TemplateModal`, binary image drag-and-drop Base64 encoding, scroll sync ratio math, and multibyte byte-offset tracking in chunked file loading.
- **Rust Backend Security & Robustness (`Backend / Rust`)**:
  - Hardened `html_renderer.rs` against XSS by escaping HTML entities in inline Obsidian parsing, document titles, and code block headers, and synchronized in-progress task (`- [/] `) indices.
  - Enhanced `mermaid_validator.rs` to support ER diagram crow's-foot notation (`||--o{`, etc.) and YAML frontmatter (44/44 unit tests passing).
  - Aligned non-EOF chunk slices to UTF-8 character boundaries in `file_io.rs` and `mmap_reader.rs`, ensured save-lock release on error paths, and built hierarchical directory trees in `workspace_scanner.rs`.
- **Full Documentation Synchronization & Table Alignment (`Docs`)**:
  - Synchronized all files across `docs/ja/`, `docs/en/`, and root `README*.md` / `RULES.md` with v1.5.2 specifications, fixing relative links and enforcing strict vertical alignment on all Markdown tables.

## [1.5.1] - 2026-10-22

### 📐 Complete Mermaid Preview Integration & Windows CI Manifest Fix (v1.5.1)

- **Complete Mermaid Preview Integration & Extended Utilities (SVG Download, Standalone HTML Export, Template Insertion) (`Preview / Mermaid`)**:
  - **Full Rust Preview Integration**: Automatically segments and extracts Mermaid blocks from Rust native Markdown HTML (`previewEngine === 'rust'`), seamlessly mounting the rich `MermaidRenderer` component. Retains native parsing speed while fully enabling interactive zoom (50%~600%, 100%↔200% toggle), fullscreen zoom modal, syntax error notifications, and SHA-256 caching.
  - **Typing Debounce Optimization**: Integrated 150ms debounce for preview rendering, eliminating flicker and CPU overhead during rapid typing.
  - **SVG Image Download & Save**: Added one-click `.svg` vector image export buttons directly in the diagram toolbar and fullscreen modal.
  - **Standalone HTML Export Support**: Embedded Mermaid CDN script and auto-initialization in `export_html_full_native`, allowing exported standalone HTML files to automatically render diagrams in any browser, accompanied by print CSS optimizations.
  - **Editor Toolbar Mermaid Template Dropdown**: Added a dedicated Mermaid dropdown menu in the editor toolbar offering one-click snippet insertion for 8 major diagram types (flowchart, sequenceDiagram, stateDiagram-v2, classDiagram, erDiagram, mindmap, gantt, gitGraph).
- **GitHub Actions CI/CD Windows ComCtl32 v6 Manifest Resolution (`CI / Build`)**:
  - Resolved `0xc0000139` (STATUS_ENTRYPOINT_NOT_FOUND) test crashes on Windows caused by missing Common Controls v6 manifests needed by `rfd` and native dialogs.
  - Configured `npm run test:rust` via `scripts/run_rust_tests.ps1` in CI workflows (`ci.yml`, `release.yml`) for 100% stable cloud test passes.

## [1.5.0] - 2026-09-29

### 🤖 AI Document Summary, Dual-Pane Workspace & Modular Refactoring (v1.5.0)
- **AI-Powered Document Summary & Hybrid Fallback Engine (`AI / Summary`)**:
  - Integrated Google Gemini API (`gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-2.0-flash`, etc.) with flexible user model selection and offline local text extraction fallback (`aiSummary.ts`).
  - **Settings Expansion**: Added dedicated "AI Settings" tab in Settings modal for API key configuration (with visibility mask), model selection, custom base URL, prompt tuning, and live connectivity testing.
  - **Front Matter Persistence**: Automatically stores and updates summaries in YAML Front Matter (`summary:`, `summary_type:`), backed by the Rust native YAML parser (`yaml.rs`).
  - **Interactive Cards**: Renders summary cards with model badges in both the editor Front Matter panel and the preview header, supporting inline editing, regeneration, and deletion.
- **Refined Status Bar Proofreading Tooltip (`Status / Proofreading`)**:
  - Updated the bottom-left proofreading tooltip to clear and friendly phrasing: "日本語校正＆記法Lint検出結果" (Japanese Proofreading & Syntax Lint Detection Results).
- **Comprehensive Modular Architecture Refactoring (>1,000 Lines Enforcement) (`Architecture / Refactoring`)**:
  - Enforced project's 1,000-line guideline by decomposing monolithic files into focused, maintainable modules.
  - `App.tsx` (1,104 ➔ 958 lines): extracted `useWindowDragDrop.ts` (232 lines) and `useEditorToolbarActions.ts` (126 lines).
  - `SettingsModal.tsx` (923 ➔ 286 lines, ~69% reduction): decomposed into `GeneralTab.tsx` (292 lines), `AiTab.tsx` (336 lines), and `StorageTab.tsx` (134 lines).
  - Achieved zero single-file handwritten sources over 1,000 lines across the entire codebase.
- **Dual-Pane Draggable Splitter (`Workspace / DualPane`)**:
  - Implemented a responsive draggable divider between the left and right panes allowing users to resize pane ratios (20% to 80%). Includes state persistence, double-click reset to 50:50, and text selection suppression during dragging.
- **Smart Paste (Auto URL Markdown Link) (`Editor / SmartPaste`)**:
  - Pasting a valid HTTP/HTTPS URL with text selected automatically wraps the selection into `[Selected Text](URL)` format using the native Undo stack. Configurable via Settings modal.
- **Interactive Table Editing Assistance (`Editor / Table`)**:
  - Enhanced Markdown table editing with Tab / Shift+Tab for navigation between cells, automatic new row creation at the final cell, and Enter key row insertion with blank-row exit detection.
- **Syntax Highlighting Language Expansion & Color Themes (`Preview / Syntax`)**:
  - Broadened programming language aliases (TS/TSX, Python, Rust, Go, C/C++, C#, Java, PowerShell, Bash, SQL, Dockerfile, etc.) across both Rust syntect and React Prism engines, adding customizable syntax color themes (VS Code Dark+, Dracula, Nord, Monokai, One Dark, Prism) in Settings modal.
- **Side-by-Side Dual-Pane Workspace for Comparative Editing & Preview (`Workspace / DualPane`)**:
  - Implemented a dual-pane workspace (`DualPaneWorkspace`) to compare and edit up to two Markdown files simultaneously.
  - **Launch & Layout**: Right-click any file in the sidebar or any tab on the tab bar and select "Open in Right Pane", or click the "2-Pane" toggle button on the right side of the tab bar.
  - **Synchronized View Modes & Split Suppression**: View modes (Editor ↔ Preview) stay synchronized across both panes. Switching to preview renders previews in both panes. Prevents confusing 4-way split layouts by disabling conventional split mode while 2-pane is active.
  - **Intelligent Focus Tracking**: Clicking either pane shifts document focus, allowing toolbar formatting, status bar stats, and save commands to naturally target the focused document.
  - **Safe Exit & Tab Cleanup**: Exit back to single-pane view at any time via the "✕" button in the right pane header, the tab bar toggle, or by closing the right pane's tab.
- **Native Undo/Redo Integration for Text Formatting (`Editor / Undo`)**:
  - Replaced direct textarea value assignments with `applyTextReplacementWithUndo` (`document.execCommand('insertText')`), properly registering formatting operations (Ctrl+B, Ctrl+I, Ctrl+U, and toolbar buttons) into the browser native Undo stack.
  - Supports instant undo via `Ctrl + Z` and redo via `Ctrl + Y`.
  - Added `onMouseDown` protection to toolbar buttons to prevent focus and selection loss from the textarea.
- **Enhanced PowerShell Syntax Highlighting & Aliases (`Preview / Syntax`)**:
  - Extended Prism grammar definitions for PowerShell to highlight parameters (`-Path`, `-Force` as attributes), comparison operators (`-eq`, `-gt`, `-like` as keywords), numeric literals (`1024`, `0`), and special variables (`$_`, `$env:PATH`).
  - Added official alias support for code blocks with ````ps```` and ````posh```` alongside ````powershell````, ````pwsh````, and ````ps1````.
- **Vite Build Warning Elimination & Chunk Optimization (`Build / Vite`)**:
  - Unified dynamic/static imports across frontend utilities to eradicate Rollup warnings.
  - Separated vendor chunks (`vendor-markdown`, `vendor-syntax`, `vendor-react`, `vendor-icons`, `vendor-tauri`) for clean and fast production bundles.

## [1.4.5] - 2026-09-14

### 💎 Markdown Preview Obsidian Full Compatibility (v1.4.5)

- **Single Enter Line Break Support (`Preview / LineBreak`)**:
  - Implemented Obsidian-compatible line break semantics where a single Enter creates `<br />` breaks without requiring two trailing spaces. Multi-line paragraph breaks remain intact.
- **Obsidian Callouts Card Rendering (`Preview / Callout`)**:
  - Full card rendering for Obsidian callouts (`> [!NOTE]`, `> [!WARNING]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!CAUTION]`, `> [!TODO]`, `> [!SUCCESS]`, `> [!BUG]`, etc.).
  - Includes colored left accent borders, custom icons, title text, and rounded background cards for dark, light, and print modes.
- **Highlight Syntax (`Preview / Highlight`)**:
  - Automatically transforms `==text==` into `<mark class="obsidian-highlight">` with translucent yellow background and rounded padding.
- **Internal Wikilink Syntax (`Preview / Wikilink`)**:
  - Transforms `[[Note]]` and `[[Note|Alias]]` into `<a class="internal-link">` with Obsidian-style purple underline.
- **List & Typography Restoration (`Preview / Typography`)**:
  - Completely restored nested list markers (`disc`, `circle`, `square`, `decimal`, etc.) and padding previously reset by Tailwind CSS v4 Preflight.

## [1.4.4] - 2026-09-14

### ⚡ Massive Native Core Modernization: 13 Rust Features & Parallel Architecture (v1.4.4)

- **Large Document Rope Buffer (`Rope / Editor`)**:
  - Implemented B-tree Rope buffer management via `ropey` (`rope_buffer.rs`).
  - Enables instant line-based insertions, deletions, and slicing for massive multi-megabyte / hundreds of thousands of lines Markdown files without buffer copy overhead.
- **Zero-Copy Instant File Opening via Memory-Mapped Files (`mmap / File I/O`)**:
  - Implemented zero-copy file reader via `memmap2` (`mmap_reader.rs`).
  - Maps multi-gigabyte files directly to OS virtual memory for instant chunk loading without memory exhaustion.
- **Atomic File Writing & Strict mtime Preservation (`File I/O / Atomic`)**:
  - Implemented robust atomic file replacement via temporary write and atomic rename.
  - Eliminates data corruption risks during power outages or unexpected crashes while guaranteeing exact `mtime` synchronization.
- **Bi-Directional Disk File & LocalStorage Synchronization (`SyncManager`)**:
  - Implemented `FileSyncManager` (`sync_manager.rs`) to centrally manage synchronization state between disk files and browser LocalStorage.
  - Strictly distinguishes internal save locks from external edits, eradicating false-positive "external modification" alerts after saving.
- **Rust Native File Watching (`FileWatcher / notify`)**:
  - Introduced kernel-level filesystem event watching using `notify` (`file_watcher.rs`).
  - Detects external edits, saves, renames, and deletions with near-zero latency and CPU overhead.
- **Parallel Workspace File Tree Scanning (`Workspace / ignore`)**:
  - Implemented multi-threaded directory scanner via `ignore` (`workspace_scanner.rs`).
  - Builds directory trees instantly while respecting `.gitignore` rules and ignoring heavy directories (`node_modules`, `target`, `.git`).
- **Parallel Multi-Threaded Workspace Full-Text Search (`Search / rayon`)**:
  - Implemented workspace-wide keyword search command (`search_workspace_dir_native`) via `rayon` parallel iterators.
  - Concurrently traverses and searches all Markdown files across directory hierarchies.
- **Rust Native Detailed Text Diff Engine (`Diff / similar`)**:
  - Implemented fine-grained text diff calculation (`compute_detailed_diff_native`) via `similar`.
  - Computes exact line-by-line differences with Old/New line numbers and inline word-level modification ranges (`inline_changes`).
- **Multi-Note Batch Export & Deflate ZIP Compression (`Export / zip`)**:
  - Implemented fast Deflate archive exporter via `zip` (`export_zip.rs`).
  - Bundles multiple notes and image assets into a single ZIP archive while preserving relative folder structures.
- **Asynchronous Japanese Proofreading & Markdown Linting (`Proofreading / Lint`)**:
  - Implemented background grammar and syntax linting engine (`proofreading.rs`).
  - Automatically identifies duplicate particles (e.g. "のの", "はは"), spelling variants (e.g. "サーバ" vs "サーバー"), and unclosed code blocks (```` ``` ````).
- **Mermaid Syntax Validation & SVG Diff Hash Caching (`Mermaid / Cache`)**:
  - Pre-validates Mermaid diagrams in Rust (`mermaid_validator.rs`) prior to frontend SVG rendering.
  - Avoids redundant re-rendering calculations by caching SVG results against SHA-256 hashes of diagram source code.
- **Rust Native Markdown Preview & Syntax-Highlighted HTML Generation (`Markdown / syntect`)**:
  - Integrated `pulldown-cmark` HTML parsing with `syntect` syntax-highlighted code block generation (`html_renderer.rs`).
  - Offloads heavy JavaScript highlighting computations to the Rust native backend.
- **Typewriter Scrolling Mode (`Editor / UI`)**:
  - Added typewriter scrolling functionality that automatically centers the active editing cursor line vertically.
  - Minimizes eye and neck strain during long-form typing sessions.

## [1.4.3] - 2026-08-26

### 🛠️ Save Dialog Cancel State Restoration, Documentation & Build Optimization (v1.4.3)

- **Fix PC Save Dialog Cancel State Inconsistency (`File / Storage`)**:
  - Resolved issue where canceling the native save dialog incorrectly shifted document save status to "saved", causing the "Save to PC File" action button in the status bar to disappear and preventing re-saving.
  - Document status is now accurately preserved (`saved_local` / `saved_file` / `unsaved`) with appropriate cancel logging.
- **Documentation Modernization & Table Alignment (`Docs`)**:
  - Fully synchronized DEVELOPMENT, ARCHITECTURE, SPECIFICATION, TEST_REPORT, README, and CHANGELOG to current v1.4.3 specifications.
  - Strictly aligned all Markdown tables.
- **Stale Cache & Artifact Cleanup (`Build / Refactor`)**:
  - Cleaned up build artifacts and temporary generation caches.

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
- **Fix PC Save Dialog Cancel State Inconsistency (`File / Storage`)**:
  - Resolved issue where canceling the native save dialog incorrectly shifted document save status to "saved", causing the "Save to PC File" action button in the status bar to disappear and preventing re-saving.
  - Document status is now accurately preserved (`saved_local` / `saved_file` / `unsaved`) with appropriate cancel logging.
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

## [1.3.1] - 2026-08-12

### 🚀 Direct File Open via Explorer Drag & Drop (v1.3.1)

- **Direct Drag & Drop File Open from Windows Explorer**:
  - Added support for dragging `.md` and `.txt` files from Explorer directly onto the editor window to open them in a new tab.
  - Dropping image files (`.png`, `.jpg`, etc.) automatically converts them to Data URLs and inserts Markdown image syntax at the cursor position.

---

## [1.3.0] - 2026-08-12

### 🚀 Rust Inverted Index Search, Chunk Streaming & Memory GC (v1.3.0)

- **10MB+ Large File Chunk Streaming (`read_file_chunk_native`)**:
  - Reads large Markdown files incrementally to reduce initial RAM consumption.
- **Inverted Index Full-Text Search (`search_documents_native`)**:
  - Real-time in-memory inverted index search engine.
- **Memory Slimming GC**:
  - Converts saved documents to placeholders in LocalStorage to prevent `QuotaExceededError`.

---

## [1.2.0] - 2026-08-05

### 💾 Direct In-Place File Save & Windows Context Menu (v1.2.0)

- **Direct In-Place Save (`Ctrl + S`) & Save As (`Ctrl + Shift + S`)**:
  - Retains the actual local `.md` file path on disk for direct overwrite saving.
- **Windows Explorer "Open with QuMaEditor" Context Menu Registration**:
  - Automatically registers the right-click context menu entry on startup and installation.
- **Single Instance Enforcement**:
  - Focuses the existing QuMaEditor window and opens the incoming file path in a new tab.

---

## [1.1.0] - 2026-08-04

### 🛠️ Automated Specta TypeScript Bindings & Quality Foundation (v1.1.0)

- **Automated TypeScript Type Generation via Specta**:
  - Automatically synchronizes TypeScript bindings (`src/bindings.ts`) from all Rust DTOs and Tauri IPC commands.
- **TypeDoc & RustDoc Documentation Setup**:
  - Established automated API documentation generation for both frontend and backend.
