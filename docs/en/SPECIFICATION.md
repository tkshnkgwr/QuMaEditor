# Specification & Technical Design (SPECIFICATION)

**English** | [日本語版](docs/ja/SPECIFICATION.md)

## 1. Overview

QuMaEditor is a performance-first desktop Markdown editor built with **Tauri v2**, **Rust**, **React 19**, and **TypeScript**.

---

## 2. Core Features & Specifications

| Category           | Feature Name                                  | Implementation / Technical Details                                                                 |
| :----------------- | :-------------------------------------------- | :------------------------------------------------------------------------------------------------- |
| **Editing**        | Zero-Latency Typing                           | Complete preview unmounting in Editor Only mode, `useDeferredValue` async parsing in Split view    |
| **Editing**        | `Ctrl + E` Focus Restoration                  | Preserves caret position/selection when toggling view modes, instantly refocused                   |
| **Editing**        | Native Markdown Auto-Formatting               | Rust `formatter.rs` table vertical alignment, heading spacing, blank line collapsing               |
| **Preview**        | Mermaid Diagram Live Rendering                | Dynamic SVG diagram rendering with zoom (50%~600%) and fullscreen modal                             |
| **Preview**        | CSV Interactive Table                         | Fast Rust `parse_csv_preview_native`, type auto-alignment (num:R/date:C/str:L), sorting, search     |
| **File I/O**       | Direct Disk Save (`Ctrl + S`)                 | Rust native I/O (`write_file_native`, `write_file_bytes_native`)                                   |
| **File I/O**       | Large File Streaming                          | `read_file_chunk_native` 1,500-line chunk on-demand lazy loading                                   |
| **Data Safety**    | LocalStorage Dual Persistence                 | 3-second debounce auto-save, 100% crash recovery                                                   |
| **Sync**           | External Modification Detection & Reload (F5) | OS `mtime` polling / focus detection, toast notifications, manual `F5` / `Ctrl+R` reload           |
| **Search**         | Inverted Index Full-Text Search               | Rust `LazyLock<Mutex<Vec<DocSearchInput>>>` word index, `<mark>` keyword highlighting              |
| **Encoding**       | Multi-Encoding Support (UTF-8, SJIS, EUC-JP)   | `encoding_rs` native engine, automatic EOL (CRLF / LF) synchronization                             |
| **Statistics**     | Statistics Dashboard (`StatsModal`)           | Real-time character, word, line, reading time, heading, and link aggregation                       |
| **Diff**           | Native Text Diff                              | Rust `similar` crate line-by-line visual comparison (`DiffModal`)                                  |

---

## 3. System Requirements

| Item       | Details                                  |
| :--------- | :--------------------------------------- |
| Version    | v1.4.2                                   |
| OS         | Windows 10 / 11 (Tauri v2 Native Window) |
| Runtime    | Rust Native Engine + WebView2            |
| Frontend   | React 19 + TypeScript 5.8                |
