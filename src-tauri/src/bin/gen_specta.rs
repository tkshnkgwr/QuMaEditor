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
            commands::format_markdown_native,
            commands::render_markdown_html_native,
            commands::atomic_write_file_bytes_native,
            commands::atomic_write_file_native,
            commands::search_workspace_dir_native,
            commands::rope_init_buffer,
            commands::rope_get_info,
            commands::rope_get_text_range,
            commands::rope_get_lines,
            commands::rope_insert_text,
            commands::rope_remove_text,
            commands::rope_get_entire_text,
            commands::rope_drop_buffer,
            commands::sync_register_file,
            commands::sync_begin_save,
            commands::sync_finish_save,
            commands::sync_is_self_saving,
            commands::watch_file_native,
            commands::unwatch_file_native,
            commands::unwatch_all_native,
            commands::open_folder_native,
            commands::compute_detailed_diff_native,
            commands::export_notes_to_zip_native,
            commands::lint_markdown_document_native,
            commands::validate_mermaid_syntax_native,
            commands::mmap_read_file_chunk_native,
            commands::scan_workspace_tree_native,
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
