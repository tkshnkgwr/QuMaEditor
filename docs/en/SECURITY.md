# Security Policy (SECURITY)

**English Version** | [日本語版](../ja/SECURITY.md)

## 1. Security Architecture

1. **Local-First Processing & Minimal Network Exposure**:
   - All standard editing, file persistence, full-text indexing, encoding conversion, and local summarization execute strictly on-device without transmitting document data to external servers.
   - **Opt-In Exception (AI Summarization)**: Document text is sent to the configured Google Gemini API endpoint only when the user explicitly configures a Gemini API key and triggers AI summarization.
2. **XSS (Cross-Site Scripting) Protection**:
   - Both the Rust native HTML renderer (`pulldown-cmark` + `syntect` with strict HTML/attribute escaping on inline Obsidian extensions, titles, and code headers) and the React `react-markdown` renderer prevent arbitrary script injection.
3. **Atomic Persistence & Storage Isolation**:
   - Native file writes use temporary-file creation, `sync_all()`, and atomic rename to prevent 0-byte corruption on unexpected termination.

## 2. Vulnerability Reporting
Please report security vulnerabilities privately to the development team rather than opening a public issue.
