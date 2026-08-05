# CHANGELOG

All notable changes to QuMaEditor will be documented in this file.

## [1.2.0] - 2026-08-05

### 💾 Native Direct File Overwrite, Storage Metrics & Build Optimization (v1.2.0)

- **Direct File Overwrite (`Ctrl + S`) & Save As (`Ctrl + Shift + S`)**: Integrated Tauri `dialog` / `fs` plugins and Rust native reader (`read_file_native`). Retains actual `.md` file path (`filePath`) and directly overwrites disk files during manual or auto-save.
- **Windows Explorer Right-Click Context Menu**: Automatically registers "Open with QuMaEditor" in Windows Explorer context menu on startup and installation.
- **Single Instance Enforcement**: Prevents duplicate app processes. Brings existing QuMaEditor window to focus and opens passed files as new tabs.
- **Preview Font Size Synchronization**: Real-time font size adjustment across both editor and preview panels.
- **Tab Bar Scrollbar Removal**: Clean CSS scrollbar hiding (`[scrollbar-width:none]`) for tab scroll area.
- **AppData Path & LocalStorage Usage Metrics**: Added AppData directory path display with copy-to-clipboard, real-time KB/doc metrics, and cache cleanup/reset actions in `SettingsModal`.
- **Zero-Warning Vite Build via Code Splitting**: Resolved 1.5MB bundle warning by introducing `manualChunks` in `vite.config.ts` (`vendor-react`, `vendor-icons`, `vendor-syntax`).
- **Binary Target Pinning**: Fixed installer packaging issue by explicitly declaring `[[bin]]` targets in `Cargo.toml` so `QuMaEditor.exe` is always picked over utility binaries.

---

## [1.1.0] - 2026-08-04

### 🛠️ Documentation, Specta TS Binding & Test Suite (v1.1.0)

- **Specta TypeScript Binding Export (`src/bindings.ts`)**: Integrated `specta` and `tauri-specta` for auto-generating type-safe TypeScript bindings from Rust DTOs (`npm run gen:specta`).
- **TypeDoc Frontend API Documentation (`docs/typedoc/`)**: Integrated `typedoc` to generate HTML API documentation for IPC wrappers and types (`npm run docs:frontend`).
- **RustDoc Backend HTML Documentation (`cargo doc`)**: Added comprehensive RustDoc comments to all Rust modules, DTOs, and functions.
- **Tauri v2 IPC Architecture Guide (`docs/en/TAURI_GUIDE.md`)**: Documented Tauri IPC protocols, capability security settings, and test suite guidelines.
- **Rust Core Unit Tests**: Added unit test suite covering full-text search, encoding detection, Markdown parsing, and Text Diff algorithms (5/5 tests passing).

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
