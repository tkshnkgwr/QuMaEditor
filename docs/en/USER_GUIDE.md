# User Guide (USER_GUIDE)

**English** | [日本語版](docs/ja/USER_GUIDE.md)

## 1. UI Components Overview (v1.5.0)

QuMaEditor features an intuitive Windows desktop-native layout:

1. **Title Bar (Header)**:
   - Left: Sidebar toggle, editable document title, encoding badge (`UTF-8`, `Shift_JIS`, `EUC-JP`), line-ending badge (`LF`, `CRLF`), character and line counters.
   - Right: Theme toggle (Light/Dark/System), version info (`v1.5.0`), settings button, native window controls.
   - Sub-bar: File / Template / Help dropdown menus, view mode switcher (Split / Editor Only / Preview Only), Zen Mode toggle.
2. **Left Sidebar (Sidebar & Outline)**:
   - **📁 Documents Tab**: Switch, search, tag-filter, favorite, and manage active/stored documents.
   - **📑 Outline / TOC Tab**: Instantly extracts H1~H6 headings into a hierarchical tree. Clicking any heading jumps both the editor cursor (scrolling into center view) and the preview smoothly.
3. **Formatting Toolbar**:
   - Headings (H1~H3), Bold, Italic, Underline, Strikethrough, List, Task, Table, Code, Quote, Link, Image upload, Horizontal Rule, Timestamp.
   - **Mermaid Template Dropdown**: Click the Network icon in the toolbar to insert one-click starter snippets for 8 major diagram types: flowchart (`flowchart TD`), sequence (`sequenceDiagram`), state (`stateDiagram-v2`), class (`classDiagram`), ER (`erDiagram`), mindmap (`mindmap`), gantt (`gantt`), and git graph (`gitGraph`).
   - **✨ Markdown Auto-Formatting (`Ctrl+Shift+F`)**: Instantly aligns GFM tables vertically, adds blank lines around headings, and collapses consecutive blank lines.
   - **Selection Wrapping**: Wraps selected text when pressing formatting buttons.
   - **Heading Insertion**: Inserts `# ` markers at the beginning of the active cursor line.
   - **Native Undo/Redo Integration**: Text wrapping via shortcuts (`Ctrl+B`, `Ctrl+I`, `Ctrl+U`) or toolbar buttons seamlessly integrates into the browser's native Undo history (`Ctrl + Z` to revert, `Ctrl + Y` to redo) while preserving text selection.
4. **Workspace (Editor & Preview)**:
   - **Side-by-Side Dual-Pane Editing & Preview**: Open up to 2 documents side-by-side for simultaneous comparison and editing. Launch via right-click "Open in Right Pane" in the sidebar or tabs, or use the "Side-by-Side" button on the tab bar. View mode (Editor/Preview) synchronizes across both panes.
   - **Editor Tab Indentation & Nested Lists**: Tab key stays focused, supporting nested bullet level increment (`- ` ➔ `  - `), multi-line block indent, and `Shift + Tab` unindent.
   - **Zero-Latency Typing**: Bypasses preview parsing in "Editor Only" mode for lag-free typing.
   - **`Ctrl + E` Focus Restoration**: Restores cursor position when toggling between editor and preview.
   - **Enhanced PowerShell Syntax Highlighting**: Fully highlights parameters (`-Path`), comparison operators (`-eq`), numbers, and special variables for `powershell`, `pwsh`, `ps`, `posh`, and `ps1` code blocks.
   - **Mermaid Diagrams & SVG Export**: Dynamic SVG diagram rendering with zoom controls (50%~600%, 100%↔200% toggle), fullscreen zoom modal, inline syntax error alerts, one-click **SVG image download/save**, and code copy. Diagrams also render automatically in standalone HTML exports.
5. **Status Bar (Footer)**:
   - Persistence status badge (💾 Saved to Disk / 📦 Saved in App).
   - **"💾 Save to PC File" Button**: Dedicated one-click button for documents stored solely in browser LocalStorage.
   - **Japanese Proofreading & Syntax Lint**: Displays issue counters in the bottom left with tooltip "日本語校正＆記法Lint検出結果" (Japanese Proofreading & Syntax Lint Detection Results). Clicking opens the flyout list.
   - Cursor line/col, character/word count, reading time, encoding selector.
   - **Statistics Dashboard**: Click the character/word counter to open the detailed `StatsModal`.

---

## 2. 🧘 Zen Focus Writing Mode (Zen Mode)

A distraction-free, full-screen writing sanctuary.

### Highlights
- **Hidden UI Chrome**: Conceals title bar, toolbar, sidebar, and status bar for 100% writing focus.
- **Centered Typography**: Centers the editor area to minimize eye and neck fatigue on wide monitors.
- **Instant Escape**: Resume full UI immediately with a single keystroke.

### How to Use
- **Activate**: Press <kbd>Ctrl + Shift + Z</kbd> or click "Focus Mode" in the top menu.
- **Exit**: Press <kbd>Esc</kbd> or click the floating "Exit Zen Mode (Esc)" button on the top right.

---

## 3. 🔀 Side-by-Side Dual-Pane Editing & Preview (Dual Pane)

A multi-tasking workspace enabling you to view, compare, and edit two Markdown documents side-by-side.

### Highlights
- **Simultaneous Dual Document Editing**: Open different documents in the left and right panes and edit both seamlessly.
- **Synchronized View Modes**: Both panes toggle together between Editor and Preview modes. Traditional 4-way split is disabled in dual-pane view to keep the workspace clean and focused.
- **Intuitive Focus Tracking**: Clicking either pane switches the active document; toolbar formatting actions and status bar metrics track the focused document in real time.
- **Tab-Linked Loading**: Clicking a document tab while in dual-pane mode loads that document into the currently active pane.

### How to Use
- **Open in Right Pane**:
  - **Right-click** any document in the sidebar file list ➔ Select **"Open in Right Pane (Compare)"**.
  - **Right-click** any tab in the top tab bar ➔ Select **"Open in Right Pane (Compare)"**.
  - Or click the **"Side-by-Side"** button on the far right of the tab bar.
- **Close Side-by-Side View**:
  - Click the **"✕"** button on the top header of the right pane.
  - Or click the **"Close Side-by-Side"** button on the tab bar.
  - Or close the tab opened in the right pane to automatically return to single-pane view.

---

## 4. Character Encodings & Line Breaks

### Opening Files

- Open files via "File > Open (Ctrl+O)", **Drag & Drop from Explorer**, or right-click "Open with QuMaEditor".
- Character encoding is auto-detected (UTF-8, Shift_JIS, EUC-JP) with zero garbled text.
- Drag & drop text files (`.md`, `.txt`) to open as new tabs; drop images to insert Data URLs.

### Saving & Exporting

- Select target encoding from the status bar dropdown.
- Shift_JIS automatically standardizes line breaks to **CRLF**; EUC-JP / UTF-8 to **LF**.
- `Ctrl + S` directly saves back to disk; `Ctrl + Shift + S` opens the Save As dialog.

---

## 5. Crash-Proof Dual Persistence

- Text is auto-saved to **LocalStorage** within 3 seconds of typing.
- Use `Ctrl + S` or the status bar's "💾 Save to PC File" button to save directly to local `.md` files on disk.
- External file modifications are detected via `mtime` with toast alerts and manual reload (`F5` / `Ctrl+R`).

---

## 6. Editor Customization Settings

Click the ⚙️ icon in the top right to access full application settings across 3 tabs:

### 🎨 General & Appearance (`GeneralTab`)
- **Base Font Size**: 12px ~ 24px (slider)
- **Line Height**: 1.2 (compact) ~ 2.2 (extra wide)
- **Editor Font**: System Default, Monospace, Sans-serif
- **Tab Size**: 2 spaces / 4 spaces
- **Auto-Save Interval**: 1s ~ 10s (or disabled)
- **Heading Color Palette**: Subtle, Vibrant, High Contrast, Monochrome
- **Smart Paste (Auto URL Link)**: Automatically converts pasted URLs into `[Selected Text](URL)` format (toggle)
- **Syntax Theme**: Select among VS Code Dark+, Dracula, Nord, Monokai, One Dark, and Prism

### 🤖 AI Settings (`AiTab`)
- **Gemini API Key**: Set your Google AI Studio API key with visibility mask toggling
- **Model Selector**: Freely choose among latest recommended models (`gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-2.0-flash`, etc.) or input custom models
- **Custom Base URL**: Proxy or custom enterprise gateway support
- **Summary Prompt**: Fully customize instructions, tone, and formatting constraints for AI summaries
- **Connection Test**: Perform real-time connectivity and authorization validation against Google Gemini API

### 💾 Storage Management (`StorageTab`)
- **Storage Metrics**: Inspect LocalStorage quota consumption, note count, and image assets
- **ZIP Export**: Batch export all documents and embedded image assets into a single ZIP file on disk
- **Reset Storage**: Safely wipe internal cache and local storage when required

---

## 7. 🔍 Japanese Proofreading & Syntax Linting (Real-Time)

To elevate writing quality and prevent Markdown structural mistakes, QuMaEditor features a high-performance background linting engine powered by Rust.

### Highlights
- **Zero-Latency Async Processing**: Runs asynchronously on a separate thread via Rust (`proofreading.rs`), guaranteeing 0ms typing interference.
- **Intuitive Status Bar Indicator**: Displays total issue count in the bottom-left corner with hover tooltip "**日本語校正＆記法Lint検出結果**" (Japanese Proofreading & Syntax Lint Detection Results).
- **Interactive Flyout & One-Click Navigation**:
  - Clicking the status bar badge opens the issues flyout.
  - Clicking any diagnostic item instantly jumps the editor cursor to the exact line/character offset and displays proposed corrections.

### Inspection Rules Overview

| Category    | Check Rule         | Description & Examples                                                           |
| :---------- | :----------------- | :------------------------------------------------------------------------------- |
| **Grammar** | Duplicate Particle | Identifies redundant consecutive usages of the particle "の" (3+ times in a sentence) |
| **Spelling**| Variant Spellings  | Detects inconsistent Japanese katakana prolonged sound marks (e.g. サーバー vs サーバ) |
| **Syntax**  | Unclosed Brackets  | Finds unclosed opening brackets and quotation marks (「」, 『』, （）, etc.)       |
| **Syntax**  | Unclosed Blocks    | Flags code fences starting with ```` ``` ```` that remain unclosed to file end   |

---

## 8. 🤖 AI Document Summary & Front Matter Management

QuMaEditor integrates Google Gemini API with seamless YAML Front Matter metadata management compatible with Obsidian and static site generators.

### Highlights
- **Hybrid Summary Engine**:
  - Automatically invokes selected Google Gemini models for deep, context-aware document summarization.
  - Automatically falls back to local text extraction when no API key is provided or offline.
- **Full Front Matter Integration**:
  - Summaries are persisted in Markdown YAML Front Matter (`summary:` and `summary_type:`).
  - Fully parsed and manipulated by both the Rust backend YAML engine and the frontend UI.
- **Intuitive UI Controls**:
  - **Editor**: Front Matter panel displays "🤖 AI Summary" button, interactive summary card with model badge, and inline edit/regenerate/delete controls.
  - **Preview**: Elegantly presented within the metadata header card above the document preview.

---

## 9. Keyboard Shortcuts


| Shortcut           | Action / Feature                               |
| :----------------- | :--------------------------------------------- |
| `Ctrl + N`         | Create new Markdown document                   |
| `Ctrl + O`         | Open local text file (.md, .txt)               |
| `Ctrl + S`         | Direct save to disk                            |
| `Ctrl + Shift + S` | Save As (choose file location)                 |
| `Ctrl + Shift + F` | Markdown auto-formatting (align tables, lines) |
| `Ctrl + E`         | Toggle View Mode (Editor Only ↔ Preview Only)  |
| `Ctrl + Z`         | Undo (reverts typing and text formatting)      |
| `Ctrl + Y`         | Redo (re-applies reverted action)              |
| `Tab`              | Indent line / nest bullet item                 |
| `Shift + Tab`      | Unindent line / promote bullet item            |
| `F5` / `Ctrl + R`  | Force reload file from disk                    |
| `Ctrl + P`         | A4 Print / PDF Export dialog                   |
| `Ctrl + B`         | Bold formatting / wrap selection               |
| `Ctrl + I`         | Italic formatting / wrap selection             |
| `Ctrl + U`         | Underline formatting / wrap selection          |
| `Ctrl + Shift + Z` | Toggle Zen Focus Mode (Exit with `Esc`)        |
| `F1`               | Open Keyboard Shortcuts Help                   |

