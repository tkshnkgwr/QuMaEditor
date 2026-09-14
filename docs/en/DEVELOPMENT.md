# Development Guide (DEVELOPMENT)

**English** | [日本語版](../ja/DEVELOPMENT.md)

## 1. Directory Structure

```
├── .agents/                        # AI Agent development guidelines (AGENTS.md)
├── docs/                           # Project documentation
│   ├── ja/                         # Japanese documentation
│   └── en/                         # English documentation
├── src/                            # Frontend source code (React 19 / TypeScript)
│   ├── components/                 # UI components
│   │   ├── AboutModal.tsx          # About modal
│   │   ├── BatchConvertModal.tsx   # Batch encoding conversion dialog
│   │   ├── DiffModal.tsx           # Text diff visualizer
│   │   ├── Editor.tsx              # Text editor component
│   │   ├── HelpGuideModal.tsx      # Quick help guide dialog
│   │   ├── LogModal.tsx            # Application log modal
│   │   ├── MarkdownRenderers.tsx   # ReactMarkdown custom renderers
│   │   ├── MermaidRenderer.tsx     # Mermaid SVG renderer
│   │   ├── ModalGroup.tsx          # Consolidated modal container
│   │   ├── Preview.tsx             # Markdown real-time preview & Mermaid renderer
│   │   ├── SettingsModal.tsx       # Editor settings dialog
│   │   ├── ShortcutsModal.tsx      # Keyboard shortcuts guide
│   │   ├── Sidebar.tsx             # Document management & outline sidebar
│   │   ├── StatsModal.tsx          # Statistics dashboard modal
│   │   ├── StatusBar.tsx           # Status bar (encoding/EOL/storage status)
│   │   ├── TableModal.tsx          # Table generator dialog
│   │   ├── TabBar.tsx              # Document tabs bar
│   │   ├── TemplateModal.tsx       # Document template selector
│   │   ├── TitleBar.tsx            # Window title bar & menu
│   │   ├── Toast.tsx               # Toast alert component
│   │   └── Toolbar.tsx             # Formatting toolbar
│   ├── hooks/                      # Custom React hooks
│   │   ├── useDocumentManager.ts   # Document state & tabs manager hook
│   │   ├── useFileOperations.ts    # File open, save, export hook
│   │   ├── useFileWatcher.ts       # External file watcher hook
│   │   ├── useGlobalShortcuts.ts   # Global keyboard shortcuts hook
│   │   └── useModalState.ts        # Modal state manager hook
│   ├── utils/                      # Utilities
│   │   ├── encodingUtils.ts        # Encoding detection & conversion
│   │   ├── fileSystem.ts           # File system & chunk loader
│   │   ├── logger.ts               # Logger utility
│   │   ├── markdownUtils.ts        # Formatting insertion & stats
│   │   ├── storage.ts              # LocalStorage I/O & GC
│   │   ├── tauriNative.ts          # Tauri IPC wrappers
│   │   └── yamlUtils.ts            # YAML front matter parser
│   ├── App.tsx                     # Main application component
│   ├── bindings.ts                 # Specta auto-generated TypeScript bindings
│   ├── main.tsx                    # React entrypoint
│   ├── index.css                   # Tailwind CSS definitions
│   └── types.ts                    # TypeScript types
├── src-tauri/                      # Tauri backend source code (Rust)
│   ├── capabilities/               # Security permission settings
│   ├── src/                        # Rust source code
│   │   ├── text_processing/        # Text processing submodules
│   │   │   ├── mod.rs              # Submodule integration & re-exports
│   │   │   ├── stats.rs            # Text statistics counter
│   │   │   ├── yaml.rs             # YAML front matter parser
│   │   │   ├── structure.rs        # Outline extraction & task toggle
│   │   │   ├── formatter.rs        # GFM table alignment & line cleaner
│   │   │   └── html_renderer.rs    # syntect syntax-highlighted HTML generator
│   │   ├── commands.rs             # IPC command handlers
│   │   ├── diff.rs                 # Text diff calculation (line-by-line & inline word changes)
│   │   ├── encoding.rs             # Character encoding detection
│   │   ├── export_zip.rs           # Multi-note & asset Deflate ZIP archive export
│   │   ├── file_io.rs              # Native file I/O, chunk streaming & atomic save
│   │   ├── file_watcher.rs         # External file watcher via notify
│   │   ├── lib.rs                  # Library entrypoint & state management
│   │   ├── main.rs                 # Binary entrypoint
│   │   ├── mermaid_validator.rs    # Mermaid syntax validation & SVG diff hash cache
│   │   ├── mmap_reader.rs          # Memory-mapped zero-copy file reader via memmap2
│   │   ├── proofreading.rs         # Japanese proofreading & Markdown lint engine
│   │   ├── rope_buffer.rs          # Large file Rope buffer management via ropey
│   │   ├── search.rs               # Inverted index & parallel rayon workspace search
│   │   ├── sync_manager.rs         # Disk file & LocalStorage bi-directional sync manager
│   │   └── workspace_scanner.rs    # Parallel workspace tree scanner via ignore
│   ├── Cargo.toml                  # Rust dependencies & build profile
│   └── tauri.conf.json             # Tauri configuration
├── index.html                      # HTML entrypoint
├── package.json                    # Dependencies & scripts
└── vite.config.ts                  # Vite configuration
```

---

## 2. Pre-Commit Verifications

Run these 5 verification commands locally before committing or releasing:

```bash
# 1. Rust code formatting check
cargo fmt --manifest-path src-tauri/Cargo.toml --check

# 2. Rust compilation & type check
cargo check --manifest-path src-tauri/Cargo.toml

# 3. Rust Clippy strict quality check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings

# 4. Rust unit tests (39 tests)
cargo test --manifest-path src-tauri/Cargo.toml

# 5. TypeScript type verification
npm run lint
```
