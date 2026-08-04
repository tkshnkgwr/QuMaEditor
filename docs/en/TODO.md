# Development Roadmap & TODO (TODO)

Tracked tasks and completed features for QuMaEditor.

---

## 🎯 Completed Tasks

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

## 🔮 Future Roadmap

- [ ] **Plugin & Extension System Research**
- [ ] **Cloud Storage Sync Prototype (Google Drive / OneDrive)**
- [ ] **Multi-Window Support Exploration**
