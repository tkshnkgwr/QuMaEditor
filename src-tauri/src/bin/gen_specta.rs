use quma_editor_lib::export_specta_types;

fn main() {
    export_specta_types();
    println!("Successfully exported Specta TypeScript bindings to src/bindings.ts");
}
