//! # QuMaEditor Main Binary Entrypoint
//!
//! Windows リリースビルド時のコンソールウィンドウ非表示処理および Tauri アプリケーションの起動エントリポイントです。

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

/// アプリケーション起動関数
fn main() {
    quma_editor_lib::run();
}
