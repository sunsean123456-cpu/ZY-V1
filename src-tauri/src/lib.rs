mod commands;
mod db;
mod ai;

use db::Database;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let db = Database::new().expect("Failed to initialize database");
            db.init_demo_data().expect("Failed to initialize demo data");
            app.manage(db);
            
            // 初始化 AI 服务
            let api_key = std::env::var("DASHSCOPE_API_KEY")
                .unwrap_or_else(|_| String::new());
            let ai_state = commands::AIState {
                api_key,
            };
            app.manage(ai_state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_all_patients,
            commands::create_patient,
            commands::update_patient,
            commands::delete_patient,
            commands::get_conversations_by_patient,
            commands::create_conversation,
            commands::delete_conversation,
            commands::get_messages_by_conversation,
            commands::create_message,
            commands::delete_message,
            commands::get_medical_records,
            commands::update_medical_record,
            commands::delete_medical_record,
            commands::ai_chat,
            commands::ai_generate_record,
            commands::ai_generate_orders,
            commands::ai_generate_consult,
            commands::ai_generate_handover,
            commands::ai_generate_drg,
            commands::minimize_window,
            commands::maximize_window,
            commands::close_window,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
