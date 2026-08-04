# Detailed Development Guidelines (INSTRUCTIONS.md)

**English Version** | [日本語版](../ja/INSTRUCTIONS.md)

This document provides extended development and operational guidelines for the AI agent ("Grand Sage" / "Gem") expanding on `.agents/AGENTS.md`.

---

## 1. Automated Semantic Versioning Rule
- Based on the scope of future modifications, the AI agent ("Grand Sage") will autonomously increment and manage version numbers:
  - **PATCH (`1.0.x`)**: Bug fixes, minor UI tweaks, CSS style adjustments.
  - **MINOR (`1.x.0`)**: New feature additions, new native Rust capabilities, UI enhancements.
  - **MAJOR (`x.0.0`)**: Major architectural overhauls or breaking changes.
- Version changes will be synced across `package.json` (Single Source of Truth), `src-tauri/Cargo.toml`, `CHANGELOG.md`, `SPECIFICATION.md`, `TODO.md`, and `README.md`.

---

## 2. Quality Control & Verification Procedure
- **Code Quality Check**:
  - `npm run lint`: Confirm zero TypeScript type errors.
  - `cargo check --manifest-path src-tauri/Cargo.toml`: Confirm Rust backend validity.
- **1,000 Line Rule**: Propose module splitting when a single source file exceeds 1,000 lines.

---

## 3. Automated Documentation Syncing Rules
- Sync documents upon significant updates:

| Document           | Role                | Sync Trigger                                   |
| :----------------- | :------------------ | :--------------------------------------------- |
| `CHANGELOG.md`     | Change History      | Features, fixes, performance, removals         |
| `SPECIFICATION.md` | Specification & UI  | Layout, data structure, shortcut changes       |
| `ARCHITECTURE.md`  | Architecture        | System boundaries, IPC, process model          |
| `DEVELOPMENT.md`   | Dev Guide           | Build commands, dependencies, workflow         |
