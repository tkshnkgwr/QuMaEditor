# Resource Footprint & Benchmarks (FOOTPRINTS)

**English Version** | [日本語版](../ja/FOOTPRINTS.md)

## 1. Resource Consumption Benchmarks (Tauri v2 + Rust)

By combining Tauri v2 with a Rust native backend, QuMaEditor achieves drastically lower RAM footprint and CPU usage compared to traditional Electron apps.

| Metric | Target / Specification | Measured Value (Tauri v2 + React) | Remarks |
|---|---|---|---|
| **RAM Usage** | < 50 MB | **~ 32 MB - 45 MB** | Rust backend + WebView2 under normal execution |
| **Startup Time** | < 0.5s | **~ 0.3s** | Near-instant startup |
| **CPU Usage (Idle)** | 0.0 % | **0.0 %** | Event-driven async threads |
| **Large File Streaming** | 100 MB < 1s | **~ 0.05s** | Rust `read_file_chunk_native` streaming |
| **Encoding Detection** | Microseconds | **< 1 ms** | Native `encoding_rs` engine |
| **Text Diff Computation** | < 5 ms | **< 2 ms** | Fast LCS via `similar` crate |
| **Inverted Index Search** | < 1 ms | **< 1 ms** | Fast word index via `LazyLock` |
| **Keyword Highlighting** | Instant (< 16 ms) | **< 2 ms** | Fast regex parsing via `HighlightText` |
| **Direct PDF Export** | One-click instant | **~ 0.01s** | Instant export without print dialog |

---

## 2. Performance Optimization Techniques

1. **Native Encoding Engine (`encoding_rs`)**:
   - High-speed byte-array encoding detection and conversion using Mozilla Firefox's battle-tested Rust library.
2. **Fast GFM Parsing (`pulldown-cmark`)**:
   - Non-blocking ultra-fast Markdown rendering without freezing the JS main thread.
3. **Parallel Processing Engine (`rayon`)**:
   - Multi-threaded batch encoding conversion utilizing multi-core CPUs.
4. **Binary Footprint Optimization (`opt-level = 'z'`, `lto = true`, `strip = true`)**:
   - Symbol stripping and link-time optimization for minimal executable size and memory usage.
5. **Print Layout Isolation (`print:hidden` / `print:block`)**:
   - Complete uncoupling of flex container offsets during print/PDF generation for 100% A4 page width coverage.
