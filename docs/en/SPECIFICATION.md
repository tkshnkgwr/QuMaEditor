# Product Specification (SPECIFICATION)

Feature specifications and architecture overview for QuMaEditor.

---

## 1. Overview
QuMaEditor is an ultra-lightweight and high-performance desktop Markdown editor built with Tauri v2, Rust backend, React, and TypeScript.

---

## 2. Core Feature Specifications

### 2.1 Editor & Preview
- **Real-Time GFM Live Preview**: Full GFM support including GFM table alignments (left `:---`, center `:---:`, right `---:`), task lists, emojis, and code block syntax highlighting (`vscDarkPlus` / `prism`).
- **Protected YAML Front Matter**: Title, creation date, and encoding are auto-protected, while tags (`doc.tags`) can be interactively edited.
- **High-Contrast Theme System**: Seamless light/dark mode adaptation across all UI components, modals, scrollbars, and syntax highlighting.

### 2.2 Fast Search & Tag Search
- **Keyword Highlighting**: Matches in titles, body snippets, and search result lines are highlighted using vibrant amber badges (`<mark>`).
- **Front Matter Tag Search**: Instant document filtering by tag names (`#guide`, etc.) integrated into both JS filtering and Rust inverted index search.
- **Rust Inverted Index Search**: Native high-speed word index search for large document sets.

### 2.3 Printing & Direct PDF Export
- **Direct PDF Export**: One-click instant `.pdf` file generation and saving from preview rendering without invoking the browser print dialog.
- **A4 Full-Width Printing (`Ctrl + P`)**: All UI elements and editor panels are isolated using `print:hidden`, guaranteeing 100% page width printing of the rendered preview content.

### 2.4 Rust Native Acceleration
- **Chunked File Streaming**: Native streaming for 10MB+ files to prevent memory overload.
- **Multi-Threaded Encoding Batch Conversion**: Rayon-powered batch conversion to UTF-8 / Shift_JIS.
- **Text Diff Calculation**: Native line-by-line diff processing via `similar`.

---

## 3. System Requirements
- **OS**: Windows 10 / 11 (Tauri v2 Native Window)
- **Runtime**: Rust Native Engine + WebKit / WebView2
