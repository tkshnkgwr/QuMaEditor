# Architecture Document (ARCHITECTURE)

**English** | [日本語版](../ja/ARCHITECTURE.md)

---

## 1. Process Model (Tauri Process Architecture)

This application adopts a multi-process desktop model powered by the Tauri v2 framework. The backend core process built in Rust communicates securely and efficiently with the Webview2 (React 19 + TypeScript) renderer process via IPC.

```mermaid
flowchart TD
    subgraph Core["🦀 Core Process (Rust / src-tauri)"]
        direction TB
        NativeWin["🪟 Native Window\n(Decorations / Single-Instance)"]
        Plugins["🔌 Tauri Plugins\n(fs / dialog / http)"]
        Commands["⚡ Native IPC Commands\n(file_io / encoding / search / diff / text_processing)"]
    end

    Core <===>|"📡 Tauri IPC (tauri-specta Type-Safe IPC)"| Renderer

    subgraph Renderer["⚛️ Renderer Process (Webview2 / React 19 + TypeScript)"]
        direction TB
        subgraph TopBar["UI Navigation Components"]
            TitleBar["TitleBar"]
            Sidebar["Sidebar"]
            TabBar["TabBar"]
            Toolbar["Toolbar"]
        end

        TopBar --> AppState["🧠 App.tsx (State / Custom Hooks)"]

        AppState --> Panels["🎨 Main Panels (Editor / Preview / StatusBar)"]
        Panels --> NativeBridge["tauriNative ↔ LocalStorage (Memory Slimming GC)"]
    end

    style Core fill:#0f172a,stroke:#f59e0b,stroke-width:2px,color:#f8fafc
    style Renderer fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#f8fafc
    style AppState fill:#0369a1,stroke:#38bdf8,color:#ffffff
    style Commands fill:#b45309,stroke:#f59e0b,color:#ffffff
```

---

## 2. Character Encoding & Data Flow

Data processing flow for file imports and exports:

```mermaid
flowchart TD
    FileSel["📂 File Selection (.md / .txt / .csv)"] --> ReadData["Uint8Array Binary Read\n(readFileNative / plugin-fs)"]
    ReadData --> DetectEnc["Encoding Auto-Detection\n(encoding_rs: UTF-8 / Shift_JIS / EUC-JP)"]
    DetectEnc --> ToUtf8["Rust Native / UTF-8 String Conversion"]
    ToUtf8 --> AppState["JavaScript Standard UTF-8 (App State)"]

    AppState --> Editor["🖊️ Editor.tsx (Editing & Inputs)"]
    AppState --> Preview["👁️ Preview.tsx (Render Preview)"]

    Editor --> ExportReq["💾 Save / Export Request"]
    ExportReq --> EncSel{"Selected Encoding"}

    EncSel -->|"Shift_JIS"| EncSJIS["Convert EOL to CRLF ➔ Encode to Shift_JIS"]
    EncSel -->|"EUC-JP"| EncEUC["Convert EOL to LF ➔ Encode to EUC-JP"]
    EncSel -->|"UTF-8"| EncUTF8["Convert EOL to LF ➔ Encode to UTF-8"]

    EncSJIS --> SaveDirect["Direct Disk Write (write_file_bytes_native)"]
    EncEUC --> SaveDirect
    EncUTF8 --> SaveDirect
```

---

## 3. Persistence Architecture

- **Main Storage**: Browser `LocalStorage` key `markdown_editor_docs_v1` combined with Tauri native filesystem APIs.
- **Debounce Control**: Delayed writing via `autoSaveIntervalMs` (default 3000ms) timer to avoid performance degradation on every keystroke.
- **Memory Slimming GC**: Saved PC disk documents are converted to lightweight placeholders (`<!-- [STORAGE_SLIMMED_LOAD_FROM_DISK] -->`) during LocalStorage persistence to prevent `QuotaExceededError`.
- **Data Compatibility**: Preserves selected encoding configuration per document by persisting the `encoding` property in document state.

---

## 4. Backend Modular Architecture

```mermaid
graph TD
    subgraph Core["Tauri Application Entry"]
        Lib["lib.rs\n(Runner / Plugin Init / Specta Export)"]
        GenSpecta["bin/gen_specta.rs\n(TS Binding Generator)"]
    end

    subgraph CommandLayer["IPC Command Layer"]
        Commands["commands.rs\n(tauri::command / Specta DTO)"]
    end

    subgraph DomainModules["Domain Modules"]
        FileIO["file_io.rs\n(Native File I/O & Chunks)"]
        Encoding["encoding.rs\n(Multi-Encoding Detection)"]
        Search["search.rs\n(In-Memory Full-Text Search)"]
        Diff["diff.rs\n(Text Diff & pulldown-cmark)"]
        TextProc["text_processing.rs\n(Stats, Headings, CSV Preview, HTML)"]
    end

    Lib --> Commands
    GenSpecta --> Commands
    Commands --> FileIO
    Commands --> Encoding
    Commands --> Search
    Commands --> Diff
    Commands --> TextProc
```

| Module Name | File Path | Responsibilities & Description |
| :--- | :--- | :--- |
| `lib` | [`src-tauri/src/lib.rs`](file:///c:/Users/632792/Documents/自作/QuMaEditor/src-tauri/src/lib.rs) | Main entrypoint, plugin initialization, and Specta TypeScript binding generator handler |
| `commands` | [`src-tauri/src/commands.rs`](file:///c:/Users/632792/Documents/自作/QuMaEditor/src-tauri/src/commands.rs) | IPC command handlers exposed to TypeScript and Specta macro mappings |
| `encoding` | [`src-tauri/src/encoding.rs`](file:///c:/Users/632792/Documents/自作/QuMaEditor/src-tauri/src/encoding.rs) | Multi-encoding auto-detection (UTF-8, Shift_JIS, EUC-JP) and conversion via `encoding_rs` |
| `file_io` | [`src-tauri/src/file_io.rs`](file:///c:/Users/632792/Documents/自作/QuMaEditor/src-tauri/src/file_io.rs) | Native file reading, chunked streaming, direct byte writing, and Windows Explorer folder opening |
| `search` | [`src-tauri/src/search.rs`](file:///c:/Users/632792/Documents/自作/QuMaEditor/src-tauri/src/search.rs) | Fast inverted index search engine using `LazyLock<Mutex<Vec<DocSearchInput>>>` |
| `diff` | [`src-tauri/src/diff.rs`](file:///c:/Users/632792/Documents/自作/QuMaEditor/src-tauri/src/diff.rs) | Line-by-line text diffing via `similar` crate and native Markdown HTML parsing via `pulldown-cmark` |
| `text_processing` | [`src-tauri/src/text_processing.rs`](file:///c:/Users/632792/Documents/自作/QuMaEditor/src-tauri/src/text_processing.rs) | Text stats calculation, YAML front matter parser, heading outline, CSV fast preview, HTML export |
