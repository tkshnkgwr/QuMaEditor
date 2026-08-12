# Development Roadmap & TODO (TODO)

Tracked tasks and completed features for QuMaEditor.

---

## 🎯 Completed Tasks

### v1.3.2 Release (2026-08-12)
- [x] **Editor Area & Window-Wide Drag & Drop Fix**: Integrated `getCurrentWebviewWindow().onDragDropEvent` to resolve WebView2 drop event suppression and guaranteed 100% reliable file opening/embedding across the entire window.
- [x] **Ctrl + Scroll Wheel Preview Zoom**: Added interactive preview zooming (50%~300%) with reset badge in `Preview.tsx`.
- [x] **Selection-Aware Toolbar Formatting**: Updated Bold, Italic, Underline, and Strikethrough buttons to wrap text selections or insert at cursor with focus restoration.
- [x] **Cursor-Line Heading Insertion**: Modified H1/H2/H3 buttons to insert/replace `# ` markers at the start of the current line instead of appending at EOF.
- [x] **Open Parent Folder in Explorer**: Added native command `open_folder_native` and File menu action to open disk file directories in Explorer.
- [x] **LocalStorage Safety Explanation**: Added detailed LocalStorage dual-protection guide and comparison matrix in `AboutModal`.

### v1.2.3 Release (2026-08-07)
- [x] **Complete Suppression of PowerShell Console Window**: Added `CREATE_NO_WINDOW` (`0x08000000`) flag to Windows PowerShell command invocations for "Open with QuMaEditor" context menu registration, preventing black console windows from popping up at app startup.
- [x] **Separated Help Guide & About Modals**: Introduced a dedicated `HelpGuideModal` accessible from the top bar for quick-start instructions, while slimming down `AboutModal` to version, status badge, and troubleshooting tips.
- [x] **"Open Folder in Explorer" in Sidebar Items**: Extended "Open Containing Folder in Explorer" button to individual file items in the left sidebar.
- [x] **CI-Guarded GitHub Actions Release Pipeline**: Established CI workflow (`ci.yml`) covering TypeScript type checking, `cargo fmt` verification, and Rust unit tests (9/9 passing), linked to a Release workflow (`release.yml`) that safely builds and publishes NSIS installers (`.exe`) only upon CI green pass.

### v1.2.2 Release (2026-08-07)
- [x] **Settings Modal Reset Button Relocation**: Moved dangerous "Full Data Reset" button to the bottom-left footer row in `SettingsModal`.
- [x] **Ctrl + Scroll Wheel Preview Zoom**: Added interactive preview zooming (50%~300%) with reset badge in `Preview.tsx`.
- [x] **Selection-Aware Toolbar Formatting**: Updated Bold, Italic, Underline, and Strikethrough buttons to wrap text selections or insert at cursor with focus restoration.
- [x] **Cursor-Line Heading Insertion**: Modified H1/H2/H3 buttons to insert/replace `# ` markers at the start of the current line instead of appending at EOF.
- [x] **Open Parent Folder in Explorer**: Added native command `open_folder_native` and File menu action to open disk file directories in Explorer.
- [x] **LocalStorage Safety Explanation**: Added detailed LocalStorage dual-protection guide and comparison matrix in `AboutModal`.

### v1.2.1 Release (2026-08-06)
- [x] **Default Editor View on Startup**: Changed initial default view mode from `split` to `editor`.
- [x] **Type-Safe File Opening**: Refactored native file loading using `tauri-specta` bindings (`commands.readFileNative`).
- [x] **Windows Async Startup**: Offloaded PowerShell context menu registration to `spawn_blocking` threads to prevent freezes.
- [x] **Code Base Cleanup & Doc Completeness**: Added complete RustDoc comments and TypeScript JSDoc documentation across codebase.
- [x] **Rust Unit Test Suite Expansion**: Added unit tests covering file reading, diffing, index search, and encoding conversion (9/9 passed).

### v1.2.0 Release (2026-08-05)
- [x] **Direct File Overwrite (`Ctrl + S`) & Save As (`Ctrl + Shift + S`)**: Integrated Tauri `dialog` / `fs` plugins and Rust native reader (`read_file_native`). Retains actual `.md` file path (`filePath`) and directly overwrites disk files during manual or auto-save.
- [x] **Windows Explorer Context Menu**: Automatically registers "Open with QuMaEditor" in Windows Explorer context menu on startup and installation.
- [x] **Single Instance Enforcement**: Prevents duplicate app processes. Brings existing QuMaEditor window to focus and opens passed files as new tabs.
- [x] **Preview Font Size Synchronization**: Real-time font size adjustment across both editor and preview panels.
- [x] **Tab Bar Scrollbar Removal**: Clean CSS scrollbar hiding (`[scrollbar-width:none]`) for tab scroll area.
- [x] **AppData Path & LocalStorage Metrics in Settings**: Path display with copy-to-clipboard, real-time KB/doc metrics, and cache cleanup/reset actions in `SettingsModal`.
- [x] **Zero-Warning Vite Build via Code Splitting**: `manualChunks` in `vite.config.ts` (`vendor-react`, `vendor-icons`, `vendor-syntax`).
- [x] **Installer Binary Packaging Fix**: Declared `[[bin]]` targets in `Cargo.toml` to ensure `QuMaEditor.exe` is bundled.

### v1.1.0 Release (2026-08-04)
- [x] **Specta Auto TS Binding Export**: Auto-export type-safe TypeScript bindings (`src/bindings.ts`) from Rust DTOs.
- [x] **TypeDoc Frontend API Docs**: Generated HTML API documentation for frontend IPC wrappers (`docs/typedoc/`).
- [x] **RustDoc Backend HTML Docs**: Generated HTML documentation for native Rust core library (`cargo doc`).
- [x] **Tauri v2 IPC Architecture Guide**: Complete IPC protocol, permission, and test suite documentation (`TAURI_GUIDE.md`).
- [x] **Rust Core Unit Test Suite**: Created unit test suite covering key native modules (5/5 passed).

### v1.0.0 Formal Release (2026-08-04)
- [x] **Tauri v2 + Rust Architecture**: High performance native desktop architecture.
- [x] **Titlebar Controls & Cursor**: Frameless drag (`data-tauri-drag-region`), window actions, fixed default cursor.
- [x] **Enhanced Auto-Save Debounce**: Cancel save while typing and trigger save 3,000ms after typing stops.
- [x] **GFM Table Alignment**: Left `:---`, center `:---:`, right `---:` table alignment support.
- [x] **Light Mode Overhaul**: Ultra-bright Front Matter card (`bg-amber-50/60`), `prism` code syntax style, modal theme adaptation (`isDark`), global scrollbar theme syncing.
- [x] **Search Enhancements**: Keyword highlighting with amber badges (`<mark>`), YAML tag search (`#tag`), high-contrast search hit titles.
- [x] **PDF & Print Isolation**: A4 100% full-width page printing, `print:hidden` UI isolation, instant direct PDF file saving.
- [x] **Rust Acceleration**: 10MB+ chunk streaming, inverted index search (`search_documents_native`), Rayon multi-threaded batch conversion, `similar` text diff.
- [x] **Single Source Versioning**: Removed all version hardcoding from source code, dynamically referencing `package.json`.

---

## 🔥 Next Priority Roadmap & Feature Candidates

The following table tracks proposed features and enhancements for future QuMaEditor releases.

| # | Target Component | Feature & Task Description | Priority | Status |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `StatsModal / Editor` | **Document Statistics Dashboard Modal** — Dedicated modal rendering real-time character count, word count, line count, estimated reading time, heading count, and link counts | Medium | 🔲 Proposed |
| 2 | `Sidebar / Navigation`| **Heading Outline (Table of Contents) Navigation Tree** — Auto-extract `# H1` ~ `### H3` headings from active document for instant smart jumping | Medium | 🔲 Proposed |
| 3 | `Editor / DragDrop` | **Drag & Drop Local File Opening** — Direct drag & drop support for external `.md` / `.txt` files onto the editor canvas to open as new tabs | Medium | ✅ Done |
| 4 | `ZenMode / Editor` | **Zen Mode Audio Mute Feature** — Automatically mute all system and application sound notifications when entering Zen mode | Medium | 🔲 Proposed |
| 5 | `ZenMode / Editor` | **Zen Mode Notification Silencer** — Completely disable all in-app toasts and non-essential popups during Zen writing sessions | Medium | 🔲 Proposed |
| 6 | `ZenMode / Editor` | **Current Line Focus Mode** — Dim all text lines except the currently active cursor line for maximum concentration | Medium | 🔲 Proposed |
| 7 | `ZenMode / Editor` | **Typewriter Scrolling** — Keep active typing line locked at vertical center of screen to minimize eye and neck movement | Low | 🔲 Proposed |
| 8 | `ZenMode / Editor` | **Pomodoro Focus Timer** | Subtle, minimal 25min work + 5min break timer displayed inside Zen mode | Low | 🔲 Proposed |
| 9 | `ZenMode / Editor` | **Ambient BGM / White Noise Player** — Optional ambient sound generator (rain, cafe, white noise) for deep focus | Low | 🔲 Proposed |
| 10 | `SettingsModal / UI` | **Enhanced Editor Typography Controls** — Configurable line-height, editor font family (Monospace vs Sans-serif), and tab size options in settings | Low | 🔲 Proposed |
| 11 | `Editor / Toolbar` | **One-Click Format Insertion Helper** — Quick insertion buttons for tables, code blocks, blockquotes (`> `), and task checkboxes (`- [ ] `) | Low | 🔲 Proposed |

---

## 🔮 Long-Term Roadmap

- [ ] **Plugin & Extension Architecture Research**
- [ ] **Cloud Storage Sync Prototype (Google Drive / OneDrive)**
- [ ] **Multi-Window & Detachable Tab Exploration**
- [ ] **Rust Native YAML Front Matter Parsing & Validation**

