# QuMaEditor (Quick & Minimal Markdown Editor)

**English** | [日本語版 (Japanese)](README_JA.md)

[![Version](https://img.shields.io/badge/Version-v1.3.2-green)](package.json)
[![Tauri v2](https://img.shields.io/badge/Tauri-v2-blue?logo=tauri)](https://tauri.app/)
[![Rust](https://img.shields.io/badge/Rust-1.80+-orange?logo=rust)](https://www.rust-lang.org/)
[![React](https://img.shields.io/badge/React-v18-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

QuMaEditor is an ultra-lightweight, high-performance desktop Markdown editor built with **Tauri v2**, **Rust**, **React 18**, and **TypeScript**. Designed with a performance-first philosophy, it provides a seamless writing experience with near-zero resource consumption and instant native capabilities.

---

## ✨ Highlights & Key Features

### ⚡ Rust Native Acceleration
- **Chunked File Streaming**: Effortlessly loads 10MB+ large files in small chunks (`read_file_chunk_native`) without memory spikes.
- **Inverted Index Full-Text Search**: Fast word-based inverted index search using Rust `LazyLock<Mutex<Vec<DocSearchInput>>>`.
- **Parallel Multi-Threaded Encoding**: Multi-file batch encoding conversion (`rayon`) to UTF-8 and Shift_JIS.
- **Native Text Diff**: Ultra-fast line-by-line diff calculation powered by the Rust `similar` crate.
- **Native Explorer Opening**: Open active file parent directories directly in Windows Explorer via `open_folder_native`.

### 🎨 Modern UI & Color Themes
- **High-Contrast Themes**: Dynamic light/dark mode adaptation across all panels, modals, syntax highlighting, and scrollbars.
- **Drag & Drop File Opening**: Drag `.md` or `.txt` files directly from Windows File Explorer onto the workspace to open them as new tabs, or drop image files (`.png`, `.jpg`, etc.) to embed as Data URL Markdown image tags.
- **Ctrl + Scroll Wheel Preview Zoom**: Zoom preview rendering between 50% ~ 300% via `Ctrl + Scroll Wheel` with a one-click reset badge.
- **Selection-Aware & Line-Heading Toolbar**: Wrap highlighted text selections for bold/italic and insert `# ` heading markers at the beginning of the cursor line.
- **Prism Code Highlighting**: Clean `prism` syntax highlighting style for multi-line code blocks in light mode.

### 🔍 Advanced Search & Tag System
- **Instant Keyword Highlighting**: Real-time query matching with amber badges (`<mark>`) in titles, body snippets, and search hits.
- **YAML Tag Filtering**: Search and filter documents by tag names (`#guide`, `#sample`, etc.) fully integrated into JS filtering and Rust search engines.
- **High-Contrast Search Titles**: High-visibility target document titles (`text-cyan-300` / `text-cyan-900`) in search result hits.

### 📄 Preview, Printing & Direct PDF
- **Direct Instant PDF Export**: One-click instant `.pdf` file saving from preview rendering without opening the print dialog.
- **A4 Full-Width Printing (`Ctrl + P`)**: Complete UI isolation (`print:hidden`) guaranteeing 100% page width printing of preview content.
- **GFM Table Text Alignment**: Full support for left `:---`, center `:---:`, and right `---:` Markdown table alignment.

### 💾 Native File Saving & Dual Protection Architecture (v1.2.2)
- **Direct File Overwrite (`Ctrl + S`)**: Directly overwrites disk `.md` files via Rust native commands (`💾 Saved to file`).
- **Crash Prevention (LocalStorage Safety)**: Automatically persists transient editing data into LocalStorage (`📦 Saved in-app (LocalStorage)`) to prevent data loss in case of unexpected OS shutdowns or crashes.
- **Intuitive Status Badging**: TitleBar and StatusBar clearly distinguish between real disk saves (`💾 Saved to file`) and transient memory saves (`📦 Saved in-app`).
- **Save As (`Ctrl + Shift + S`)**: Native dialog to export Markdown documents anywhere on disk.
- **Explorer Context Menu**: Auto-registers "Open with QuMaEditor" in Windows Explorer context menu.
- **Single Instance Enforcement**: Aggregates opened files into new tabs in the running instance.

---

## ⌨️ Keyboard Shortcuts

| Shortcut           | Action                                  |
| :----------------- | :-------------------------------------- |
| `Ctrl + N`         | Create new Markdown document            |
| `Ctrl + O`         | Open local text file (.md, .txt)        |
| `Ctrl + S`         | Direct file overwrite save              |
| `Ctrl + Shift + S` | Save As (save to disk file)             |
| `Ctrl + P`         | Open A4 Print / PDF dialog              |
| `Ctrl + B`         | Bold text formatting / Wrap selection   |
| `Ctrl + I`         | Italic text formatting / Wrap selection |
| `Ctrl + Shift + Z` | Toggle Zen focus writing mode           |
| `F1`               | Show keyboard shortcuts help modal      |

---

## 🏗️ Architecture Overview

```
+-------------------------------------------------------------------+
|                       QuMaEditor Desktop                          |
+-------------------------------------------------------------------+
|  Frontend (React 18 + TypeScript + Tailwind CSS)                  |
|   - Real-time GFM preview & Prism/VSC syntax highlighting         |
|   - Multi-tab management & floating formatting toolbar            |
|   - Keyword highlighting (<mark>) & #tag search                   |
+-------------------------------------------------------------------+
|                      Tauri v2 IPC Protocol                        |
+-------------------------------------------------------------------+
|  Backend (Rust Native Engine)                                     |
|   - Chunked streaming (10MB+) | Inverted index full-text search   |
|   - Rayon multi-threaded batch conversion | Native diff engine    |
|   - Native open_folder_native command for Windows Explorer        |
+-------------------------------------------------------------------+
```

---

## 🚀 Quick Start & Local Setup

### Requirements
- [Rust](https://www.rust-lang.org/) (v1.80+)
- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)

### Build & Execution

```bash
# 1. Clone the repository
git clone https://github.com/tkshnkgwr/QuMaEditor.git
cd QuMaEditor

# 2. Install dependencies
npm install

# 3. Launch Tauri dev mode
npm run tauri dev
```

---

## 📁 Directory Structure

```
QuMaEditor/
├── .agents/               # AI Agent Development Guidelines (AGENTS.md)
├── docs/
│   ├── ja/                # Japanese Specifications & Operating Guides
│   └── en/                # English Specifications & Operating Guides
├── src/                   # React Frontend Source Code
│   ├── components/        # UI Components (Editor, Preview, Modals)
│   ├── utils/             # Tauri IPC & Storage Helpers
│   └── App.tsx            # Main Application Workspace
├── src-tauri/             # Rust Native Backend (Tauri v2 Engine)
│   ├── src/lib.rs         # Native Commands & Search Engine
│   └── Cargo.toml         # Rust Dependency Definitions
├── package.json           # Single Source of Truth Versioning (v1.2.2)
└── LICENSE                # MIT License
```

---

## 📄 License

This project is licensed under the **[MIT License](LICENSE)**.
