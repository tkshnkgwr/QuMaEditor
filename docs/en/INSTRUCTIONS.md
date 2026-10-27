# Detailed Development Guidelines (INSTRUCTIONS.md)

**English Version** | [日本語版](../ja/INSTRUCTIONS.md)

This document provides extended development and operational guidelines for the AI agent ("Grand Sage") expanding on `.agents/AGENTS.md`.

---

## 1. Communication & Response Style

- **Conclusion First**: Present the conclusion and solution summary upfront, followed by structured bullet points for logs and file locations.
- **Clickable Hyperlinks**: Always use `[Display Name](file:///absolute/path)` format when referencing files or line ranges.
- **Japanese Commit Messages**: Follow Conventional Commits prefixes (`feat:`, `fix:`, `docs:`, etc.) with clear Japanese descriptions.
- **Clear Conceptual Explanations**:
  - React Hooks (`useState` / `useEffect`): Explain as state variables and lifecycle event handlers.
  - Rust Ownership & Borrowing (`Move` / `Borrow`): Explain as deterministic memory management and safe reference lending.

---

## 2. Automated Semantic Versioning Rule

- Based on the scope of future modifications, the AI agent ("Grand Sage") will autonomously increment and manage version numbers:
  - **PATCH (`1.0.x`)**: Bug fixes, minor UI tweaks, CSS style adjustments.
  - **MINOR (`1.x.0`)**: New feature additions, new native Rust capabilities, UI enhancements.
  - **MAJOR (`x.0.0`)**: Major architectural overhauls or breaking changes.
- Version changes will be synced across `package.json` (Single Source of Truth), `src-tauri/Cargo.toml`, `CHANGELOG.md`, `SPECIFICATION.md`, `TODO.md`, and `README.md`.

---

## 3. Quality Control & Verification Procedure

- **5 Mandatory Pre-Verification Commands**:
  - `cargo fmt --manifest-path src-tauri/Cargo.toml --check`: Confirm zero Rust formatting discrepancies.
  - `cargo check --manifest-path src-tauri/Cargo.toml`: Confirm Rust backend compilation and type validity.
  - `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings`: Confirm zero Clippy warnings.
  - `npm run test:rust`: Confirm all Rust unit tests pass (auto-embeds Windows ComCtl32 v6 manifest).
  - `npm run lint`: Confirm zero TypeScript type errors.
- **1,000 Line Rule**: Propose module splitting based on Separation of Concerns when a single source file exceeds 1,000 lines.
- **Markdown Exception**: When only Markdown files (`*.md`) are modified, pre-verification and CI runs are skipped for rapid iteration.

---

## 4. Automated Documentation Syncing Rules

- Sync documents upon significant updates:

| Document           | Role                | Sync Trigger                                   |
| :----------------- | :------------------ | :--------------------------------------------- |
| `CHANGELOG.md`     | Change History      | Features, fixes, performance, removals         |
| `SPECIFICATION.md` | Specification & UI  | Layout, data structure, shortcut changes       |
| `ARCHITECTURE.md`  | Architecture        | System boundaries, IPC, process model          |
| `DEVELOPMENT.md`   | Dev Guide           | Build commands, dependencies, workflow         |
