# CHANGELOG

All notable changes to QuMaEditor will be documented in this file.

---

## [1.0.0] - 2026-08-04

### 🚀 Initial Formal Release v1.0.0

#### 🌟 Core Features & Rust Acceleration
- **Tauri v2 + Rust High-Performance Architecture**: Extremely low RAM usage (~35 MB) and fast response.
- **10MB+ File Chunk Streaming**: Native chunk streaming (`read_file_chunk_native`) preventing memory overflow.
- **Inverted Index Full-Text Search**: Fast word index search using `LazyLock<Mutex<Vec<DocSearchInput>>>`.
- **Parallel Multi-File Encoding Conversion**: Rayon-powered batch conversion to UTF-8.
- **Native Text Diff**: Line-by-line diff calculation using `similar`.
- **Auto Encoding & Line Ending Detection**: `encoding_rs` detection for UTF-8 / Shift_JIS / EUC-JP with CRLF/LF line ending preservation.

#### 🔍 Advanced Search & Highlighting
- **Search Keyword Highlighting**: Highlight matching query text in document titles, body snippets, and search hit lines using amber badges (`<mark>`).
- **YAML Front Matter Tag Search**: Filter and search documents by tag names (`doc.tags`, `#guide`, etc.) integrated into JS filtering and Rust inverted index search.
- **High-Contrast Search Hit Titles**: Bold high-contrast document title rendering (`text-cyan-300` / `text-cyan-900`) in search results.

#### 📄 Preview, Printing & Direct PDF
- **Direct Instant PDF Export**: One-click instant `.pdf` file saving from preview rendering without opening the print dialog.
- **A4 Full-Width Printing (`Ctrl + P`)**: Complete isolation of UI elements (`print:hidden`) ensuring 100% A4 page width printing of preview content.
- **GFM Table Text Alignment**: Full support for left `:---`, center `:---:`, and right `---:` table alignment.

#### 🎨 Design & Color Themes
- **Full Theme Adaptation**: High-contrast light and dark mode adaptation for modals (Shortcuts `F1`, About, Settings, Diff), scrollbars, Front Matter cards (`bg-amber-50/60`), and `prism` code syntax highlighting.
- **Default Titlebar Cursor**: Fixed default mouse cursor on titlebar hover.
