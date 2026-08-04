# QuMaEditor (Quick & Minimal Markdown Editor)

**English** | [日本語版 (Japanese)](README_JA.md)

[![Version](https://img.shields.io/badge/Version-v1.1.0-green)](package.json)
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

### 🎨 Modern UI & Color Themes
- **High-Contrast Themes**: Dynamic light/dark mode adaptation across all panels, modals, syntax highlighting, and scrollbars.
- **Ultra-Bright Front Matter**: Enhanced YAML Front Matter protection panel (`bg-amber-50/60`) in light mode.
- **Prism Code Highlighting**: Clean `prism` syntax highlighting style for multi-line code blocks in light mode.

### 🔍 Advanced Search & Tag System
- **Instant Keyword Highlighting**: Real-time query matching with amber badges (`<mark>`) in titles, body snippets, and search hits.
- **YAML Tag Filtering**: Search and filter documents by tag names (`#guide`, `#sample`, etc.) fully integrated into JS filtering and Rust search engines.
- **High-Contrast Search Titles**: High-visibility target document titles (`text-cyan-300` / `text-cyan-900`) in search result hits.

### 📄 Preview, Printing & Direct PDF
- **Direct Instant PDF Export**: One-click instant `.pdf` file saving from preview rendering without opening the print dialog.
- **A4 Full-Width Printing (`Ctrl + P`)**: Complete UI isolation (`print:hidden`) guaranteeing 100% page width printing of preview content.
- **GFM Table Text Alignment**: Full support for left `:---`, center `:---:`, and right `---:` Markdown table alignment.

---

## ⌨️ Keyboard Shortcuts

| Shortcut           | Action                                 |
| :----------------- | :------------------------------------- |
| `Ctrl + N`         | Create new Markdown document           |
| `Ctrl + O`         | Open local text file (.md, .txt)       |
| `Ctrl + S`         | Manually trigger document save         |
| `Ctrl + P`         | Open A4 Print / PDF dialog             |
| `Ctrl + B`         | Bold text formatting (`**text**`)      |
| `Ctrl + I`         | Italic text formatting (`*text*`)      |
| `Ctrl + Shift + Z` | Toggle Zen focus writing mode          |
| `F1`               | Open Keyboard Shortcuts Help Modal     |

---

## 🏗️ Architecture Overview

```
+-------------------------------------------------------------------+
|                        QuMaEditor Desktop                         |
+-------------------------------------------------------------------+
|  Frontend (React 18 + TypeScript + Tailwind CSS)                  |
|   - Real-time GFM Live Preview & Prism / VSC Syntax Highlighting  |
|   - Multi-tab management & Floating Input Toolbar                 |
|   - Keyword Highlighting (<mark>) & Tag Filtering                 |
+-------------------------------------------------------------------+
|                       Tauri v2 IPC Bridge                         |
+-------------------------------------------------------------------+
|  Backend (Rust Native Engine)                                     |
|   - Chunk Streaming (10MB+) | Inverted Index Full-Text Search       |
|   - Rayon Multi-threaded Batch Encoding | Native Text Diff        |
+-------------------------------------------------------------------+
```

---

## 🚀 Quick Start & Installation

### Prerequisites
- [Rust](https://www.rust-lang.org/) (1.80 or higher)
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)

### Build & Run Locally

```bash
# 1. Clone repository
git clone https://github.com/tkshnkgwr/QuMaEditor.git
cd QuMaEditor

# 2. Install dependencies
npm install

# 3. Launch in Tauri dev mode
npm run tauri dev
```

---

## 📁 Project Directory Structure

```
QuMaEditor/
├── .agents/               # AI Agent Guidelines & Persona (AGENTS.md)
├── docs/
│   ├── ja/                # Japanese Specifications & Documentation
│   └── en/                # English Specifications & Documentation
├── src/                   # React Frontend Source Code
│   ├── components/        # UI Components (Editor, Preview, Sidebar, Modals)
│   ├── utils/             # Tauri Native IPC & Storage Helpers
│   └── App.tsx            # Main Application Workspace
├── src-tauri/             # Rust Native Backend (Tauri v2 Engine)
│   ├── src/lib.rs         # Native Commands & Search Engines
│   └── Cargo.toml         # Rust Dependencies
├── package.json           # Single Source of Truth for Versioning (v1.0.0)
└── LICENSE                # MIT License
```

---

## 📄 License

This project is licensed under the **[MIT License](LICENSE)** - see the LICENSE file for details.
