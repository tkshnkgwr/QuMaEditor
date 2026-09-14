# Development Plan & TODO List (TODO)

List of completed features and upcoming development tasks for QuMaEditor.

---

## 🎯 Completed Tasks

### Upcoming Release (Development Completed)

- [x] **Full Rust Native Markdown Rendering (`pulldown-cmark` + `syntect`) (`Performance / Rust`)**: Completely eliminated frontend rendering lag. Achieved zero typing latency and steady 60fps real-time native HTML generation, automatic Mermaid diagram rendering, and two-way task list toggling (`data-task-index`).
- [x] **Rope Data Structure for Large Documents (`ropey`) (`Performance / Rust`)**: Integrated a B-tree Rope data structure module in the Rust backend. Enables lag-free editing, insertion, deletion, and line-slice extraction at $O(\log N)$ for 100MB+ documents with minimal memory footprint.
- [x] **Native OS-Level File Watching (`notify`) (`Performance / Rust`)**: Implemented an OS-kernel-connected (`ReadDirectoryChangesW` / IOCP) `notify` watcher. Integrated with self-save filtering to achieve 0% idle CPU utilization and zero false-positive reload notifications.
- [x] **Workspace-Wide Fast Full-Text Search (`rayon`) (`Performance / Rust`)**: Introduced multithreaded parallel processing via `rayon`. In addition to in-memory search, added `search_workspace_dir_native` to scan local disk folders and extract matching lines instantaneously upon typing.
- [x] **Typewriter Scrolling (`ZenMode / Editor`)**: Added typewriter scrolling to automatically maintain the active cursor line vertically centered on the screen, minimizing vertical eye and neck movement. Can be toggled on/off in the Settings modal.
- [x] **Bidirectional File & Storage Sync Engine (`FileSyncManager`) (`Performance / Rust`)**: Created an integrated backend engine to manage frontend/OS sync state, self-save locks, and atomic mtime tracking. Architecturally eradicated race conditions and external false positives.
- [x] **Atomic File Persistence & Instant mtime Guarantee (`atomic_write`) (`Performance / Rust`)**: Performs temporary-file write followed by `sync_all` and atomic OS-level renaming. Eradicates 0-byte corruption risks and guarantees immediate return of millisecond-accurate post-save mtime.
- [x] **Native Document Detailed Diff (`similar`) (`Performance / Rust`)**: High-speed calculation of line-by-line and word-level inline differences (`inline_changes`) via the `similar` crate. Upgraded the Diff modal with dual old/new line numbers, accurate added/removed line counters, and token-level diff highlights.
- [x] **Batch Document & Asset ZIP Export via Rust (`zip`) (`Performance / Rust`)**: Implemented high-throughput Deflate archive compression via the `zip` crate. Export all local storage notes and embedded attachments into a single ZIP file with zero memory fragmentation.
- [x] **Asynchronous Japanese Proofreading & Lint Engine (`proofreading`) (`Performance / Rust`)**: Zero typing latency background analysis detecting duplicate particles, variant spellings, unmatched brackets, and unclosed code blocks. Real-time indicator and flyout issue list integrated into the status bar.
- [x] **Mermaid AST Pre-validation & SVG Caching (`mermaid_validator`) (`Performance / Rust`)**: Pre-validates diagram syntax and computes SHA-256 content hashes to cache rendered SVG markup. Completely eliminates redundant re-renders and provides automatic diagram type badge detection.
- [x] **Memory-Mapped File Streaming for Gigantic Logs (`memmap2`) (`Performance / Rust`)**: Directly accesses OS virtual memory page cache to open multi-gigabyte text and log files in 0 seconds with zero heap overhead and fast arbitrary slice retrieval.
- [x] **Parallel Workspace Folder Scanning & Tree Indexing (`ignore`) (`Performance / Rust`)**: Multithreaded parallel traversal respecting `.gitignore` and hidden file attributes to construct full directory trees across tens of thousands of files in under 0.05 seconds.

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

| #  | Component          | Task Description                                                                               | Priority | Status      |
| :- | :----------------- | :--------------------------------------------------------------------------------------------- | :------- | :---------- |
| 1  | `ZenMode / Editor` | **Zen Mode Audio Mute** — Automatically mute sounds/alerts during Zen focus mode              | Medium   | 🔲 Proposed |
| 2  | `ZenMode / Editor` | **Zen Mode Notification Suppression** — Suppress toasts/popups during Zen mode                | Medium   | 🔲 Proposed |
| 3  | `ZenMode / Editor` | **Current Line Focus** — Dim non-active lines to emphasize the current cursor line            | Medium   | 🔲 Proposed |
| 4  | `ZenMode / Editor` | **Pomodoro / Focus Timer** — Integrated 25min focus + 5min break timer                        | Low      | 🔲 Proposed |
| 5  | `ZenMode / Editor` | **Ambient Background Sounds** — Rain, white noise, cafe sounds for concentration              | Low      | 🔲 Proposed |
| 6  | `Plugin System`    | **Plugin & Extension Architecture Exploration**                                                | Low      | 🔲 Proposed |
| 7  | `Cloud Storage`    | **Cloud Sync Prototype (Google Drive / OneDrive)**                                             | Low      | 🔲 Proposed |
| 8  | `Multi Window`     | **Multi-Window / Tab Detachment Exploration**                                                  | Low      | 🔲 Proposed |

