# Development Plan & TODO List (TODO)

List of completed features and upcoming development tasks for QuMaEditor.

---

## 🎯 Completed Tasks

### v1.4.3 Release (2026-08-26)

- [x] **Fix PC Save Dialog Cancel State Inconsistency (`File / Storage`)**: Resolved issue where canceling the native save dialog incorrectly shifted document save status to "saved", causing the "Save to PC File" action button in the status bar to disappear and preventing re-saving. Document status is now accurately preserved (`saved_local` / `saved_file` / `unsaved`) with appropriate cancel logging.
- [x] **Documentation Modernization & Table Alignment (`Docs`)**: Fully synchronized DEVELOPMENT, ARCHITECTURE, SPECIFICATION, TEST_REPORT, README, and CHANGELOG to current v1.4.3 specifications with strict table alignment.

### v1.4.2 Release (2026-08-21)

- [x] **Heading Outline / TOC Navigation (`Sidebar / Navigation`)**: Added tab switcher for "📁 Documents" and "📑 Outline" in the sidebar. Provides instant native parsing of H1~H6 headings with accurate line numbers, hierarchical indentation, level badges, keyword filtering, and two-way jump scrolling to both the editor cursor and preview headings.
- [x] **Complete CSV Preview Removal & Pure Markdown Editor (`Preview / CSV Drop`)**: Removed all CSV native parsing (`csv.rs`), preview table renderers, and state logic to purify QuMaEditor as a dedicated, lightweight Markdown editor.
- [x] **Save LocalStorage Markdown to PC File Button (`File / Storage`)**: Added a dedicated "💾 Save to PC File" action button on the status bar for documents currently stored solely in browser LocalStorage.
- [x] **Fix Ordered List (<ol>) Multi-Line Preview Rendering Glitch (`Preview / Markdown`)**: Fixed paragraph wrapping issues causing number markers to break across lines by using `list-outside pl-6` and `[&>li>p]:inline [&>li>p]:my-0`.
- [x] **Fix Nested List Preview Rendering Glitch (`Preview / Markdown`)**: Perfectly configured child list margins, padding, hierarchical bullet styles (disc ➔ circle ➔ square, 1. ➔ a.), and print stylesheets.
- [x] **Editor Tab Indentation & Nested List Support (`Editor / List`)**: Prevented Tab key from losing focus, supporting single-line list prefix increment/decrement (`- ` ➔ `  - `), multi-line block indent/unindent (Shift+Tab).

### v1.4.1 Release (2026-08-18)

- [x] **Print Preview Overhaul & Multi-Page Pagination**: Real-time layout/paper size synchronization, document file name header, crisp task list printing.
- [x] **Mermaid Diagram Single-Page Auto-Scaling & Blank Page Elimination**: Auto-scales large diagrams to fit single page, zero orphan borders or empty pages.
- [x] **Instant Layout Switching & Settings Synchronization**: CSS display control for zero-latency Preview switching, line-height & font-family propagation.
- [x] **Windows "SendTo" Setting Removal**: Cleaned up unused registry stubs and settings modal checkbox.

### v1.4.0 Release (2026-08-18)

- [x] **Zero-Latency Typing & Asynchronous Preview Parsing**: Complete unmounting of preview in "Editor Only" mode and debounced/deferred parsing in "Split View" mode.
- [x] **`Ctrl + E` Cursor Position & Focus Restoration**: Seamlessly restores cursor position and selection when switching between editor and preview.
- [x] **Native Markdown Auto-Formatting (`Ctrl + Shift + F`)**: Formats tables vertically, inserts blank lines around headings, and collapses consecutive blank lines while protecting code blocks.
- [x] **Status Bar Persistence Badge Integration**: Consolidated all storage state displays into the status bar footer.
- [x] **External Process Modification Detection & Manual Reload (`F5`)**: Auto-detects external changes via `mtime` with toast alerts, plus manual reload shortcut (`F5` / `Ctrl + R`).
- [x] **Rust Native Syntax Highlighting Pre-rendering (`syntect`) & HTML Export**: Pre-highlights code blocks with syntect for fast rendering and standalone HTML export.
- [x] **CSV Table Preview with Auto-Alignment, Sorting, and Search**: Fast native parsing with automatic column type alignment (numbers right, dates center, strings left), sorting, and search filtering.
- [x] **Document Statistics Dashboard Modal (`StatsModal`)**: Real-time aggregation of characters, words, lines, reading time, headings, and links.
- [x] **Extended Editor Settings**: Added line height, font family (Monospace/Sans-serif), and tab size configuration.
- [x] **Modular Refactoring (>1,000 Lines Enforcement)**:
  - Backend: Modularized `text_processing/` into `stats.rs`, `yaml.rs`, `structure.rs`, `csv.rs`, `formatter.rs`, `html_renderer.rs`.
  - Frontend: Separated `useGlobalShortcuts.ts`, `ModalGroup.tsx`, `MarkdownRenderers.tsx`.
  - All source files are now strictly under 1,000 lines.
- [x] **Real-Time Mermaid Diagram Rendering & Zoom**: Visualizes diagrams with interactive zoom (50%~600%), fullscreen modal, and copy button.
- [x] **Large File Chunk Streaming & Lazy Loading**: Loads large CSV/text files in 1,500-line chunks for instant opening.
- [x] **Rust Native Unit Tests**: 23 unit tests with 100% pass rate.

---

## 🔮 Future Backlog & Development Roadmap (Roadmap)

### 📋 Overview Table

| #  | Component            | Task Description                                                                               | Priority | Status      |
| :- | :------------------- | :--------------------------------------------------------------------------------------------- | :------- | :---------- |
| 1  | `ZenMode / Editor`   | **Zen Mode Audio Mute** — Automatically mute sounds/alerts during Zen focus mode              | Medium   | 🔲 Proposed |
| 2  | `ZenMode / Editor`   | **Zen Mode Notification Suppression** — Suppress toasts/popups during Zen mode                | Medium   | 🔲 Proposed |
| 3  | `ZenMode / Editor`   | **Current Line Focus** — Dim non-active lines to emphasize the current cursor line            | Medium   | 🔲 Proposed |
| 4  | `ZenMode / Editor`   | **Typewriter Scrolling** — Keep the active cursor line vertically centered                    | Low      | 🔲 Proposed |
| 5  | `ZenMode / Editor`   | **Pomodoro / Focus Timer** — Integrated 25min focus + 5min break timer                        | Low      | 🔲 Proposed |
| 6  | `ZenMode / Editor`   | **Ambient Background Sounds** — Rain, white noise, cafe sounds for concentration              | Low      | 🔲 Proposed |
| 7  | `Plugin System`      | **Plugin & Extension Architecture Exploration**                                                | Low      | 🔲 Proposed |
| 8  | `Cloud Storage`      | **Cloud Sync Prototype (Google Drive / OneDrive)**                                             | Low      | 🔲 Proposed |
| 9  | `Multi Window`       | **Multi-Window / Tab Detachment Exploration**                                                  | Low      | 🔲 Proposed |
| 10 | `Performance / Rust` | **Full Rust Markdown Rendering (`pulldown-cmark`)** — Zero-latency rendering for 100k+ lines  | High     | 🔲 Proposed |
| 11 | `Performance / Rust` | **Rope Data Structure for Large Documents (`ropey`)** — Lag-free editing for 100MB+ files     | High     | 🔲 Proposed |
| 12 | `Performance / Rust` | **Native Rust File Watcher (`notify`)** — Zero CPU overhead OS-level event monitoring         | Medium   | 🔲 Proposed |
| 13 | `Performance / Rust` | **Native Document Diff (`similar`)** — Instant diff calculation for massive files             | Medium   | 🔲 Proposed |
| 14 | `Performance / Rust` | **Workspace-Wide Fast Full-Text Search (`rayon` + Trie)** — 0ms keystroke search across files | Medium   | 🔲 Proposed |
| 15 | `Performance / Rust` | **Mermaid AST Pre-validation & SVG Caching** — Eliminate lag in diagram-heavy documents       | Medium   | 🔲 Proposed |
| 16 | `Performance / Rust` | **Asynchronous Japanese Proofreading & Lint Engine** — Real-time spell/grammar checks         | Low      | 🔲 Proposed |
| 17 | `Performance / Rust` | **Batch Document & Asset ZIP Export via Rust** — Fast, memory-safe one-click backup archives  | Low      | 🔲 Proposed |

---

### 🚀 Performance & Native Rust Optimization Roadmap (Detailed Specifications)

#### 1. Full Native Markdown Rendering & Differential DOM Patching (`pulldown-cmark`)
- **Current Bottleneck**: Real-time preview relies on client-side `react-markdown` and associated plugins, reconstructing entire virtual DOM trees upon typing in large documents (>10,000 lines), causing frame drops.
- **Rust Approach**: Execute the ultrafast `pulldown-cmark` parser in the Rust backend to compile pre-rendered HTML fragments or ASTs. Stream differential updates via IPC to eliminate unnecessary full-page DOM re-renders.
- **Impact**: True zero-latency real-time preview maintaining steady 60fps even with 100,000+ line documents.

#### 2. Backend Rope Data Structure for Massive Text Editing (`ropey` Crate)
- **Current Bottleneck**: Storing document text as a single JavaScript `String` causes full re-allocation and memory copying on each insertion or deletion in large files (>10MB), leading to garbage collection stutter.
- **Rust Approach**: Maintain a B-tree-based `Rope` buffer (`ropey` crate) in the native backend. Process text mutations at $O(\log N)$ and virtualize visible editor viewports on demand.
- **Impact**: Instantly open and edit 100MB+ files within 0.01 seconds, using only a few megabytes of memory without input lag.

#### 3. Native OS-Level File Watching (`notify` Crate)
- **Current Bottleneck**: Frontend timer checks and polling introduce race conditions and minor CPU overhead when discerning self-saves from external edits.
- **Rust Approach**: Utilize Windows `ReadDirectoryChangesW` (IOCP) via the `notify` crate, comparing atomic save timestamps natively.
- **Impact**: 100% elimination of false-positive "file modified externally" alerts with 0% idle CPU utilization.

#### 4. Native Document Diff Calculation (`similar` Crate)
- **Current Bottleneck**: Comparing document history in `DiffModal` is computed in JavaScript, causing UI freezes when comparing extensive texts.
- **Rust Approach**: Implement Myers / Patience diff algorithms using Rust's `similar` crate with multithreaded calculation.
- **Impact**: Compute word-level and character-level diffs in under 0.005 seconds without blocking the UI thread.

#### 5. Workspace-Wide In-Memory Trie & Parallel Search (`rayon`)
- **Current Bottleneck**: Searching across many opened tabs or disk folders lags as document count grows.
- **Rust Approach**: Scan files in parallel using `rayon` and maintain an in-memory Trie/N-gram search cache.
- **Impact**: Sub-millisecond keystroke-synchronized search filtering across tens of thousands of notes.

#### 6. Mermaid AST Pre-validation & SVG Caching
- **Current Bottleneck**: `mermaid.js` recalculates diagram layouts repeatedly during preview updates, bogging down documents with many charts.
- **Rust Approach**: Hash Mermaid blocks (SHA-256) and reuse cached SVGs when diagram text has not changed, while pre-validating syntax on the backend.
- **Impact**: Over 90% reduction in preview rendering overhead for diagram-heavy technical documentation.

#### 7. Asynchronous Japanese Proofreading & Lint Engine
- **Current Bottleneck**: Real-time grammatical inspection, spell-checking, and syntax linting are absent due to client-side CPU constraints.
- **Rust Approach**: Run a non-blocking morphological analyzer and lint engine in a native background worker thread.
- **Impact**: Provide real-time wavy underline suggestions without adding a single nanosecond of typing latency.

#### 8. Batch Document & Asset ZIP Export
- **Current Bottleneck**: Exporting multiple notes along with embedded local images requires tedious manual handling.
- **Rust Approach**: Compress selected notes, markdown files, and linked assets into a single zip archive in-memory using the native `zip` crate.
- **Impact**: Fast, memory-safe one-click backup of entire workspaces.
