//! # QuMaEditor Core Native Library
//!
//! Tauri v2 デスクトップアプリケーション用の高速 Rust ネイティブライブラリです。

pub mod commands;
pub mod diff;
pub mod encoding;
pub mod file_io;
pub mod search;
pub mod text_processing;

use tauri::{Emitter, Manager};

/// Specta により TypeScript 型定義ファイル (src/bindings.ts) を自動エクスポートするハンドラー
pub fn export_specta_types() {
    let _builder =
        tauri_specta::Builder::<tauri::Wry>::new().commands(tauri_specta::collect_commands![
            commands::detect_and_convert_to_utf8,
            commands::convert_utf8_to_encoding,
            commands::read_file_chunk_native,
            commands::index_documents_native,
            commands::search_documents_native,
            commands::parse_markdown_native,
            commands::compute_text_diff_native,
            commands::read_file_native,
            commands::get_file_metadata_native,
            commands::write_file_bytes_native,
            commands::write_file_native,
            commands::calculate_text_stats_native,
            commands::parse_yaml_front_matter_native,
            commands::extract_headings_native,
            commands::toggle_task_native,
            commands::export_html_full_native,
            commands::parse_csv_preview_native,
        ]);

    #[cfg(debug_assertions)]
    {
        let target_path = if std::path::Path::new("src-tauri").exists() {
            "src/bindings.ts"
        } else {
            "../src/bindings.ts"
        };

        _builder
            .export(specta_typescript::Typescript::default(), target_path)
            .expect("Specta TS 型定義のエクスポートに失敗しました");
    }
}

/// Windows のコンテキストメニュー「QuMaEditorで開く」を自動登録する
fn register_send_to_menu_native() -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        let exe_path = std::env::current_exe()
            .map_err(|e| format!("実行ファイルパス取得失敗: {}", e))?
            .to_string_lossy()
            .to_string();

        let ps_script = format!(
            "$key = 'HKCU:\\Software\\Classes\\*\\shell\\QuMaEditor'; \
            New-Item -Path $key -Force | Out-Null; \
            Set-ItemProperty -Path $key -Name '(default)' -Value 'QuMaEditorで開く'; \
            Set-ItemProperty -Path $key -Name 'Icon' -Value '{}'; \
            $cmdKey = \"$key\\command\"; \
            New-Item -Path $cmdKey -Force | Out-Null; \
            Set-ItemProperty -Path $cmdKey -Name '(default)' -Value '\"{}\" \"%1\"';",
            exe_path, exe_path
        );

        #[cfg(target_os = "windows")]
        use std::os::windows::process::CommandExt;

        let _ = std::process::Command::new("powershell")
            .creation_flags(0x08000000)
            .args(["-NoProfile", "-Command", &ps_script])
            .output();

        Ok(true)
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok(false)
    }
}

/// Tauri アプリケーションエントリポイント
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    export_specta_types();

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.set_focus();

                if argv.len() > 1 {
                    let file_path = argv[1].clone();
                    let _ = window.emit("open-file-from-args", file_path);
                }
            }
        }))
        .setup(|_app| {
            tauri::async_runtime::spawn_blocking(move || {
                let _ = register_send_to_menu_native();
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::detect_and_convert_to_utf8,
            commands::convert_utf8_to_encoding,
            commands::read_file_native,
            commands::get_file_metadata_native,
            commands::read_file_chunk_native,
            commands::index_documents_native,
            commands::search_documents_native,
            commands::parse_markdown_native,
            commands::compute_text_diff_native,
            commands::write_file_bytes_native,
            commands::write_file_native,
            commands::calculate_text_stats_native,
            commands::parse_yaml_front_matter_native,
            commands::extract_headings_native,
            commands::toggle_task_native,
            commands::export_html_full_native,
            commands::parse_csv_preview_native,
            commands::open_folder_native,
        ])
        .run(tauri::generate_context!())
        .expect("QuMaEditor ネイティブアプリの起動に失敗しました");
}
