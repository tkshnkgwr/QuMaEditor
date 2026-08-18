use quma_editor_lib::commands;

fn main() {
    let builder =
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
            commands::format_markdown_native,
            commands::render_markdown_html_native,
        ]);

    let target_path = if std::path::Path::new("src-tauri").exists() {
        std::path::PathBuf::from("src/bindings.ts")
    } else if std::path::Path::new("../src").exists() {
        std::path::PathBuf::from("../src/bindings.ts")
    } else {
        std::path::PathBuf::from("src/bindings.ts")
    };

    builder
        .export(
            specta_typescript::Typescript::default(),
            target_path.to_str().unwrap(),
        )
        .expect("Specta TS 型定義のエクスポートに失敗しました");

    println!(
        "Successfully exported Specta TypeScript bindings to {:?}",
        target_path
    );
}
