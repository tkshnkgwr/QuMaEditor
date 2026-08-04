# Architecture Document (ARCHITECTURE)

**English** | [日本語版](../ja/ARCHITECTURE.md)

## 1. Process Model (Tauri Process Architecture)

This application adopts a multi-process desktop model powered by the Tauri v2 framework. The backend core process built in Rust communicates securely and efficiently with the Webview2 (React 19) renderer process via IPC.

```
+-------------------------------------------------------------------------------+
|                             Tauri v2 Desktop App                              |
|                                                                               |
|  +-------------------------------------------------------------------------+  |
|  |                 Core Process (Rust / src-tauri)                         |  |
|  |  - Native Window Management (Decorations, Transparency)                 |  |
|  |  - Tauri Plugins (fs, dialog, http)                                     |  |
|  |  - Native IPC Command Handlers                                          |  |
|  +-------------------------------------------------------------------------+  |
|                                     |                                         |
|                             Tauri IPC Boundary                                |
|                                     |                                         |
|  +-------------------------------------------------------------------------+  |
|  |                 Renderer Process (Webview2 / React 19)                  |  |
|  |  +------------------+   +-------------------+   +--------------------+  |  |
|  |  |    TitleBar      |   |      Sidebar      |   |      Toolbar       |  |  |
|  |  +------------------+   +-------------------+   +--------------------+  |  |
|  |           |                       |                       |             |  |
|  |           +-----------------------+-----------------------+             |  |
|  |                                   v                                     |  |
|  |                     +---------------------------+                       |  |
|  |                     |   App Component (State)   |                       |  |
|  |                     +---------------------------+                       |  |
|  |                       /           |           \                         |  |
|  |                      v            v            v                        |  |
|  |             +------------+ +--------------+ +---------------+           |  |
|  |             | Editor.tsx | | Preview.tsx  | | StatusBar.tsx |           |  |
|  |             +------------+ +--------------+ +---------------+           |  |
|  |                   |               |                 |                   |  |
|  |                   v               v                 v                   |  |
|  |           +---------------+ +--------------+ +---------------+          |  |
|  |           | markdownUtils | |react-markdown| | encodingUtils |          |  |
|  |           +---------------+ +--------------+ +---------------+          |  |
|  |                                                     |                   |  |
|  |                                                     v                   |  |
|  |                                             +---------------+           |  |
|  |                                             | LocalStorage  |           |  |
|  |                                             +---------------+           |  |
|  +-------------------------------------------------------------------------+  |
+-------------------------------------------------------------------------------+
```

## 2. Character Encoding & Data Flow

Data processing flow for file imports and exports:

```
[File Selection (.md / .txt)]
         |
         v (FileReader / Tauri FS Plugin)
[Uint8Array Binary Data]
         |
         v (encoding-japanese: detectEncoding)
[Encoding Detection: UTF-8 / Shift_JIS / EUC-JP]
         |
         v (encoding-japanese: convert to UNICODE string)
[JavaScript Standard UTF-8 String (App State)]
         |
    +----+----+
    |         |
    v         v
[Editor]  [Preview (ReactMarkdown + RehypeHighlight)]
    |
    v (Export Triggered)
[prepareEncodedBlob()]
    |-- Shift_JIS -> Replace EOL with CRLF (\r\n) -> Encode to SJIS
    |-- EUC-JP    -> Replace EOL with LF (\n)   -> Encode to EUCJP
    |-- UTF-8     -> Replace EOL with LF (\n)   -> Encode to UTF8
         |
         v
[Blob -> Save to Local File / Tauri Dialog / FS Plugin]
```

## 3. Persistence Architecture

- **Main Storage**: Browser `LocalStorage` key `win_md_editor_docs` combined with Tauri native filesystem APIs.
- **Debounce Control**: Delayed writing via `autoSaveIntervalMs` (default 1000ms) timer to avoid performance degradation on every keystroke.
- **Data Compatibility**: Preserves selected encoding configuration per document by persisting the `encoding` property in document state.
