# QuMaEditor — High-Performance Native Markdown & CSV Desktop Editor

**English** | [日本語版 (Japanese)](README_JA.md)

[![Version](https://img.shields.io/badge/Version-v1.4.2-green)](package.json)
[![Tauri v2](https://img.shields.io/badge/Tauri-v2-blue?logo=tauri)](https://tauri.app/)
[![Rust](https://img.shields.io/badge/Rust-1.80+-orange?logo=rust)](https://www.rust-lang.org/)
[![React](https://img.shields.io/badge/React-v19-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

QuMaEditor (Quick & Minimal Markdown Editor) is an ultra-lightweight, high-performance desktop Markdown editor powered by **Tauri v2**, **Rust**, **React 19**, and **TypeScript**. Built with a "Performance First" philosophy, it delivers a smooth writing experience with minimal memory consumption (RAM ~35MB).

---

## ✨ Features & Highlights

### ⚡ Rust Native Acceleration

- **Fast Markdown Auto-Formatting (`Ctrl + Shift + F`)**: Instantly formats Markdown by aligning tables vertically, adding appropriate blank lines before/after headings, and collapsing excessive blank lines while protecting code blocks.
- **10MB+ Large File Streaming**: `read_file_chunk_native` reads files in memory-efficient chunks with on-demand expansion.
- **Zero-Copy Native CSV Fast Parsing**: Parses massive CSV files with zero JS overhead, providing interactive tables with type auto-alignment (numbers right, dates center, strings left), sorting, and search.
- **Inverted Index Full-Text Search**: Fast word-based in-memory inverted index search via Rust `LazyLock<Mutex<Vec<DocSearchInput>>>`.
- **Parallel Multi-File Encoding Conversion**: Multi-threaded UTF-8 / Shift_JIS conversion engine powered by `rayon`.
- **Native Text Diff**: Line-by-line diff calculation using Rust `similar` crate.
- **Native Windows Explorer Launcher**: Opens parent folders in Explorer with target files highlighted via `open_folder_native`.

### 🎨 Modern UI & High-Contrast Themes

- **Zero-Latency Typing**: Bypasses preview parsing in "Editor Only" mode and uses asynchronous debounced parsing in "Split View" mode for zero typing lag.
- **`Ctrl + E` Cursor Position & Focus Restoration**: Automatically restores cursor position and selection when switching between editor and preview.
- **Real-Time Mermaid Diagram Rendering & Zoom**: Visualizes flowcharts, sequence diagrams, and state diagrams with interactive zoom (50%~600%), fullscreen modal, and code copy.
- **Full Theme Synchronization**: Synchronizes dialog modals, scrollbars, and syntax highlighters with Light/Dark modes.
- **Comprehensive Document Statistics Dashboard (`StatsModal`)**: Displays character count, word count, line count, estimated reading time, heading count, and link count in real-time.

### 💾 Direct Disk Save & Crash-Proof Dual Persistence

- **Direct Disk Save (`Ctrl + S`)**: Keeps local file path and directly writes back to disk files via Rust native I/O.
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
|   - Multi-tab management & floating formatting toolbar            |
|   - Keyword highlight (<mark>) & #tag filter search               |
|   - Modularized: ModalGroup / useGlobalShortcuts / Renderers      |
+-------------------------------------------------------------------+
|                       Tauri v2 IPC Gateway                        |
+-------------------------------------------------------------------+
|  Backend (Rust Native Engine / Modularized text_processing/)      |
|   - Chunk streaming (10MB+) | Inverted index full-text search     |
|   - Rayon multi-threaded encoding conversion | Native Text Diff   |
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

# 4. Rust unit tests (23 tests)
cargo test --manifest-path src-tauri/Cargo.toml

# 5. TypeScript type verification
npm run lint
```

---

## 📄 License

This software is released under the [MIT License](LICENSE).
