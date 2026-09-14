# QuMaEditor — High-Performance Native Markdown Desktop Editor

**English** | [日本語版 (Japanese)](README_JA.md)

[![Version](https://img.shields.io/badge/Version-v1.4.5-green)](package.json)
[![Tauri v2](https://img.shields.io/badge/Tauri-v2-blue?logo=tauri)](https://tauri.app/)
[![Rust](https://img.shields.io/badge/Rust-1.80+-orange?logo=rust)](https://www.rust-lang.org/)
[![React](https://img.shields.io/badge/React-v19-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

QuMaEditor (Quick & Minimal Markdown Editor) is an ultra-lightweight, high-performance desktop Markdown editor powered by **Tauri v2**, **Rust**, **React 19**, and **TypeScript**. Built with a "Performance First" philosophy, it delivers a smooth writing experience with minimal memory consumption (RAM ~35MB).

---

## ✨ Features & Highlights

### ⚡ Rust Native Acceleration

- **Heading Outline & TOC Navigation**: Instant extraction of H1~H6 headings in the sidebar with hierarchical tree view, indentation badges, keyword filter, and bi-directional jump scrolling to editor and preview.
- **Large Document Rope Buffer (`ropey`)**: B-tree Rope data structure handling hundreds of thousands of lines without memory lag or buffer copies during insertions and deletions.
- **Zero-Copy Instant File Opening (`memmap2`)**: Memory-mapped file I/O linking gigabyte-scale documents directly to OS virtual memory for instant chunk reading.
- **Atomic File Writes & mtime Preservation**: Crash-proof saving via temporary file write and atomic rename, eliminating corruption risk.
- **Bi-Directional File & LocalStorage Sync (`FileSyncManager`)**: Strict disk mtime tracking in Rust, orchestrating self-save locks and external changes without data collision.
- **Rust Native File Watching (`notify`)**: OS kernel events detect external modifications, deletions, and renames in real time.
- **Parallel Workspace Scanning (`ignore`)**: Multi-threaded file tree construction respecting `.gitignore` rules while skipping heavy folders (`node_modules`, `target`, etc.).
- **High-Speed Workspace Full-Text Search (`rayon`)**: Multi-threaded parallel traversal searching across all Markdown documents in a directory.
- **Detailed Text Diff Calculation (`similar`)**: Line-by-line Old/New comparisons and word-level inline changes (`inline_changes`).
- **Multi-Note Batch Export & ZIP Compression (`zip`)**: Bundles multiple notes and image assets into a Deflate ZIP archive in one operation.
- **Japanese Proofreading & Markdown Linting (`proofreading`)**: Asynchronous background detection of duplicate particles, spelling variants, and unclosed code blocks.
- **Mermaid Syntax Validation & SVG Diff Cache (`sha2`)**: Validates diagrams before rendering and caches SVG output by SHA-256 hash to eliminate redundant renders.
- **Fast Markdown Auto-Formatting (`Ctrl + Shift + F`)**: Formats Markdown by aligning tables vertically, adding appropriate blank lines, and collapsing excessive spacing.

### 🎨 Modern UI & High-Contrast Themes

- **Typewriter Scrolling**: Keeps the active cursor line vertically centered on the screen for fatigue-free long-form writing.
- **Zero-Latency Typing**: Bypasses preview parsing in "Editor Only" mode and uses asynchronous debounced parsing in "Split View" mode for zero typing lag.
- **Tab Indentation & Nested Lists**: Single-line list indentation (`- ` ➔ `  - `), multi-line block indent, and `Shift+Tab` unindent.
- **`Ctrl + E` Cursor Position & Focus Restoration**: Automatically restores cursor position and selection when switching between editor and preview.
- **Real-Time Mermaid Diagram Rendering & Zoom**: Visualizes flowcharts, sequence diagrams, and state diagrams with interactive zoom (50%~600%), fullscreen modal, and code copy.
- **Full Theme Synchronization**: Synchronizes dialog modals, scrollbars, and syntax highlighters with Light/Dark modes.
- **Comprehensive Document Statistics Dashboard (`StatsModal`)**: Displays character count, word count, line count, estimated reading time, heading count, and link count in real-time.

### 💾 Direct Disk Save & Crash-Proof Dual Persistence

- **Direct Disk Save (`Ctrl + S`)**: Keeps local file path and directly writes back to disk files via Rust native I/O.
- **Save to PC File Action Button**: One-click action button in status bar for notes stored in LocalStorage, with seamless status restoration upon dialog cancellation.
- **Crash-Proof LocalStorage Backup**: Saves inputs to LocalStorage in the background, recovering unsaved notes on next launch.
- **External File Modification Detection & Reload (`F5`)**: Detects external modifications via `mtime` with toast alerts, plus manual reload shortcut (`F5` / `Ctrl + R`).
- **Integrated Status Bar Badge**: Real-time status display in the status bar indicating "Saved to Disk" vs "Saved to LocalStorage".

---

## ⌨️ Keyboard Shortcuts

| Shortcut           | Action / Feature                               |
| :----------------- | :--------------------------------------------- |
| `Ctrl + N`         | Create new Markdown document                   |
| `Ctrl + O`         | Open local text file (.md, .txt)               |
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

---

## 🏗️ Architecture Overview

```
+-------------------------------------------------------------------+
|                        QuMaEditor Desktop                         |
+-------------------------------------------------------------------+
|  Frontend (React 19 + TypeScript + Tailwind CSS)                  |
|   - Zero-latency editor & Mermaid / GFM live preview              |
|   - Typewriter scrolling & floating formatting toolbar            |
|   - Multi-tab management, keyword highlight & #tag filter search  |
|   - Modularized: ModalGroup / useGlobalShortcuts / Renderers      |
+-------------------------------------------------------------------+
|                       Tauri v2 IPC Gateway                        |
+-------------------------------------------------------------------+
|  Backend (Rust Native Engine / High-Concurrency Architecture)     |
|   - Rope buffer (ropey) | mmap zero-copy large file reader        |
|   - Atomic disk write & FileSyncManager bi-directional sync       |
|   - notify file watcher | Rayon parallel workspace search         |
|   - similar detailed diff | zip batch export | proofreading lint  |
|   - Mermaid validator & SVG cache | ignore parallel tree scanner  |
|   - Markdown auto-formatter (formatter.rs) | syntect HTML export  |
|   - Windows Explorer launcher with highlight selection            |
+-------------------------------------------------------------------+
```

---

## 🚀 Quick Start & Local Setup

### Prerequisites

- [Rust](https://www.rust-lang.org/) (version 1.80+)
- [Node.js](https://nodejs.org/) (version 18+)
- [npm](https://www.npmjs.com/)

### Development

```bash
# Install dependencies
npm install

# Run development server and launch Tauri window
npm run tauri dev
```

### Pre-Commit Verifications

```bash
# 1. Rust code formatting check
cargo fmt --manifest-path src-tauri/Cargo.toml --check

# 2. Rust compilation & type check
cargo check --manifest-path src-tauri/Cargo.toml

# 3. Rust Clippy linter
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings

# 4. Rust unit tests (39 tests)
cargo test --manifest-path src-tauri/Cargo.toml

# 5. TypeScript type verification
npm run lint
```

---

## 📄 License

This software is released under the [MIT License](LICENSE).
