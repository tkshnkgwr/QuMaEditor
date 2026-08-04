# User Guide (USER_GUIDE)

## 1. User Interface Overview

The Markdown Editor features an intuitive Windows dark-themed desktop layout:

1. **Title Bar**:
   - Left: Sidebar toggle, editable document title, encoding badge (`UTF-8`, `Shift_JIS`, `EUC-JP`), save status.
   - Right: Version badge (`v1.2.0`), Settings button, window controls.
   - Dropdown Menu: File, Edit, View, Insert, Templates.
2. **Formatting Toolbar**:
   - One-click buttons for Headings (H1~H3), Bold, Italic, Underline, Strikethrough, Lists, Tasks, Code, Tables, Images, Links.
3. **Workspace**:
   - Dual-view split mode (Editor / Preview), Editor-only, or Preview-only modes.
4. **Status Bar**:
   - Line/Column counters, Word & Character stats, Estimated reading time, Encoding selector, Newline indicator (LF / CRLF).

## 2. Managing Encodings & Line Endings

### Opening Files
- Click **File > Open (Ctrl+O)** or use the Sidebar file importer. Local `.md` or `.txt` files will automatically have their character encodings detected to prevent garbled text.

### Saving / Exporting Files
- Select your target encoding (`UTF-8`, `Shift_JIS`, or `EUC-JP`) from the status bar dropdown menu.
- **Shift_JIS**: Converts line endings to **CRLF** (`\r\n`).
- **EUC-JP / UTF-8**: Converts line endings to **LF** (`\n`).
- Click **File > Export (.md)** to download the file in your target encoding and line ending format.

## 3. Yama YAML Front Matter & Tag Operations

### Metadata Protection Panel
- The editor features a **"YAML Front Matter (Protected)"** header block.
- Fields such as `title`, `created`, `updated`, and `encoding` are **protected from direct text editing** to prevent accidental deletion or syntax corruption.
- Click the header arrow to collapse or expand the Front Matter block.

### Managing Tags
- Only the **tags** field inside the Front Matter panel can be updated interactively.
- **Add Tag**: Click "+ Add Tag", type the tag name, and press Enter or the "Add" button.
- **Remove Tag**: Click the `x` button on any active tag badge to delete it.
- Defined tags are automatically serialized into the YAML Front Matter upon exporting (.md) your document.

## 4. Keyboard Shortcuts Help

### Opening the Shortcuts Modal
- Access via **Help > Keyboard Shortcuts** in the top title bar menu, or press <kbd>F1</kbd> on your keyboard.
- Review all available hotkeys categorized into File Operations, Formatting, and View Toggles.
- Dismiss the modal anytime by pressing <kbd>Esc</kbd> or clicking "Close".


