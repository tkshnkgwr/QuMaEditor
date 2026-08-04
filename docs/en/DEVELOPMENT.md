# Development Guide (DEVELOPMENT)

**English** | [日本語版](../ja/DEVELOPMENT.md)

## 1. Directory Structure

```
├── .agents/                  # AI Agent Guidelines (AGENTS.md)
├── docs/                     # Documentation
│   ├── ja/                   # Japanese Documentation
│   └── en/                   # English Documentation
├── src/                      # Frontend Source Code (React 19 / TypeScript)
│   ├── components/           # UI Component collection
│   │   ├── AboutModal.tsx    # Version info modal
│   │   ├── Editor.tsx        # Text editor component
│   │   ├── Preview.tsx       # Real-time Markdown preview
│   │   ├── SettingsModal.tsx # Settings modal
│   │   ├── Sidebar.tsx       # Document management sidebar
│   │   ├── StatusBar.tsx     # Status bar (Encoding / EOL status)
│   │   ├── TableModal.tsx    # Table generator dialog
│   │   ├── TemplateModal.tsx # Template selector dialog
│   │   ├── TitleBar.tsx      # Window title bar & menu
│   │   └── Toolbar.tsx       # Toolbar helpers
│   ├── utils/                # Utility modules
│   │   ├── encodingUtils.ts  # Encoding detection & conversion
│   │   ├── markdownUtils.ts  # Format insertion & statistics
│   │   ├── storage.ts        # LocalStorage I/O
│   │   └── yamlUtils.ts       # YAML Front Matter parsing
│   ├── App.tsx               # Main application component
│   ├── main.tsx              # React entry point
│   ├── index.css             # Tailwind CSS styles
│   └── types.ts              # TypeScript type definitions
├── src-tauri/                # Tauri Backend Source Code (Rust)
│   ├── capabilities/         # Permission configurations
│   ├── src/                  # Rust entry points (main.rs, lib.rs)
│   ├── Cargo.toml            # Rust dependencies & profile configs
│   └── tauri.conf.json       # Tauri app configuration
├── index.html                # HTML entry point
├── package.json              # Dependencies & scripts
└── vite.config.ts            # Vite configuration
```

## 2. Toolchain & Dependencies

- **Tauri v2**: Cross-platform desktop application framework
- **Rust (v1.80+)**: Tauri backend core engine
- **React 19 & Vite 6**: Frontend UI and dev server
- **TypeScript (v5.8+)**: Type-safe frontend code
- **Tailwind CSS & Lucide React**: Styling and icon library
- **encoding-japanese**: Automatic encoding detection (`detect`) & conversion (`convert`)
- **react-markdown, remark-gfm, rehype-raw, react-syntax-highlighter**: Markdown rendering & syntax highlighting

## 3. Development Workflow

```bash
# 1. Install dependencies
npm install

# 2. Start standalone frontend dev server (Port 3000)
npm run dev

# 3. Launch Tauri desktop application in dev mode
npx tauri dev

# 4. TypeScript type checking
npm run lint

# 5. Rust backend type checking
cargo check --manifest-path src-tauri/Cargo.toml

# 6. Production build
npx tauri build
```
