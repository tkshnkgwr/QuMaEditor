# QuMaEditor — High-Performance Native Markdown Desktop Editor

[![Version](https://img.shields.io/badge/Version-v1.5.3-green)](package.json)
[![Tauri v2](https://img.shields.io/badge/Tauri-v2-blue?logo=tauri)](https://tauri.app/)
[![Rust](https://img.shields.io/badge/Rust-1.80+-orange?logo=rust)](https://www.rust-lang.org/)
[![React](https://img.shields.io/badge/React-v19-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![License: GPL-3.0-or-later](https://img.shields.io/badge/License-GPL--3.0--or--later-blue.svg)](LICENSE)

**English** | [日本語版 (Japanese)](README_JA.md)

QuMaEditor (Quick & Minimal Markdown Editor) is an ultra-lightweight, high-performance desktop Markdown editor powered by **Tauri v2**, **Rust**, **React 19**, and **TypeScript**. Built with a "Performance First" philosophy, it delivers a smooth writing experience with minimal memory consumption (RAM ~35MB) while providing professional-grade features for developers and writers.

---

## 🚀 Key Features

- **⚡ Zero Latency & High-Speed Rust Native Markdown Rendering**: Built-in HTML rendering engine powered by `pulldown-cmark` and `syntect`. Achieves zero typing latency and consistent 60fps real-time previewing.
- **📊 Full Mermaid Diagram Preview & Extended Utilities**:
  - Real-time diagram rendering for Flowcharts, Sequence diagrams, Gantt charts, State diagrams, Class diagrams, ER diagrams, Git graphs, and Mindmaps.
  - Interactive mouse wheel zoom (50%~600%, 100%↔200% toggle) and fullscreen zoom modal.
  - One-click SVG vector download/save directly from preview cards.
  - Automatic rendering scripts embedded into standalone HTML exports, plus 8-diagram template insertion from the toolbar.
- **🤖 AI Document Summarization (Google Gemini API & Hybrid Fallback)**:
  - High-quality automatic summaries via Google Gemini API (`gemini-2.5-flash`, `gemini-2.5-pro`, etc.).
  - Built-in local offline text summarization fallback when unconfigured or offline.
- **🪟 Side-by-Side Dual-Pane Workspace**:
  - Open, edit, and compare up to two Markdown files simultaneously side-by-side with a 20%~80% responsive draggable splitter.
- **💎 Obsidian Full Compatibility Preview**:
  - Single-enter line breaks (Soft Break to Hard Break), standard Obsidian callout cards (`[!NOTE]`, `[!TIP]`, `[!WARNING]`, etc.), highlighter syntax (`==text==`), and wikilinks (`[[note]]`).
- **🔍 Asynchronous Japanese Proofreading & Syntax Lint Engine**:
  - Real-time background detection of duplicated particles, orthographical variations, unmatched brackets, and unclosed code blocks.
- **🌐 Comprehensive Multi-Encoding Support**:
  - Automatic detection and conversion between UTF-8, Shift_JIS, and EUC-JP via `encoding_rs`, with automatic line-ending normalization (CRLF / LF).
- **🛡️ Robust File Persistence & Scalability**:
  - B-tree Rope data structure via `ropey` for lag-free 100MB+ document editing, zero-copy memory-mapped file viewing via `memmap2`.
  - Atomic temporary-file write preventing 0-byte file corruption, with OS kernel file watching via `notify`.

---

## 💻 System Requirements & Tech Stack

| Category      | Technology                                                   |
| :------------ | :----------------------------------------------------------- |
| **OS**        | Windows 10 / 11 (x64)                                        |
| **Framework** | Tauri v2 (Rust 1.80+)                                        |
| **Frontend**  | React 19, TypeScript 5, Vite, Tailwind CSS v4, Lucide Icons  |
| **Backend**   | Rust, pulldown-cmark, syntect, ropey, similar, notify, zip   |

---

## 🛠️ Quick Start (Development & Build)

```bash
# Install frontend dependencies
npm install

# Start local dev server and desktop app
npm run tauri dev

# Build production installer
npm run tauri build
```

---

## 📚 Documentation

- **[User Guide (USER_GUIDE)](docs/en/USER_GUIDE.md)**: UI controls, Mermaid diagrams, AI summaries, dual-pane workspace, settings, and shortcuts
- **[Technical Specifications (SPECIFICATION)](docs/en/SPECIFICATION.md)**: Core features, lifecycle, and system requirements
- **[Architecture (ARCHITECTURE)](docs/en/ARCHITECTURE.md)**: Rust/React multi-process model, data flows, and module layouts
- **[Development Guide (DEVELOPMENT)](docs/en/DEVELOPMENT.md)**: Directory layout, modularization guidelines, and verification commands
- **[Test Report (TEST_REPORT)](docs/en/TEST_REPORT.md)**: Unit test results and pre-commit verification log
- **[Release Guide (RELEASE)](docs/en/RELEASE.md)**: Version bump, tagging, and automated GitHub Actions release workflow
- **[Development Plan & TODO (TODO)](docs/en/TODO.md)**: Completed features and future roadmap
- **[Changelog (CHANGELOG)](docs/en/CHANGELOG.md)**: Version release notes

---

## 📄 License

This project is licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later) - Copyright (c) 2026 tkshnkgwr. See the [LICENSE](LICENSE) file for details.
