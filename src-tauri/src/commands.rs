use crate::db::{Database, Patient, Conversation, Message, MedicalRecord, MedicalOrder};
use crate::ai::AIService;
use tauri::State;
use serde::{Deserialize, Serialize};

pub struct AIState {
    pub api_key: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        ApiResponse {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn error(msg: String) -> Self {
        ApiResponse {
            success: false,
            data: None,
            error: Some(msg),
        }
    }
}

// Patient commands
#[tauri::command]
pub fn get_all_patients(db: State<Database>) -> ApiResponse<Vec<Patient>> {
    match db.get_all_patients() {
        Ok(patients) => ApiResponse::success(patients),
        Err(e) => ApiResponse::error(e.to_string()),
    }
}

#[tauri::command]
pub fn create_patient(db: State<Database>, patient: Patient) -> ApiResponse<Patient> {
    match db.create_patient(&patient) {
        Ok(_) => ApiResponse::success(patient),
        Err(e) => ApiResponse::error(e.to_string()),
    }
}

#[tauri::command]
pub fn update_patient(db: State<Database>, patient: Patient) -> ApiResponse<Patient> {
    match db.update_patient(&patient) {
        Ok(_) => ApiResponse::success(patient),
        Err(e) => ApiResponse::error(e.to_string()),
    }
}

#[tauri::command]
pub fn delete_patient(db: State<Database>, id: String) -> ApiResponse<()> {
    match db.delete_patient(&id) {
        Ok(_) => ApiResponse::success(()),
        Err(e) => ApiResponse::error(e.to_string()),
    }
}

// Conversation commands
#[tauri::command]
pub fn get_conversations_by_patient(db: State<Database>, patient_id: String) -> ApiResponse<Vec<Conversation>> {
    match db.get_conversations_by_patient(&patient_id) {
        Ok(conversations) => ApiResponse::success(conversations),
        Err(e) => ApiResponse::error(e.to_string()),
    }
}

#[tauri::command]
pub fn create_conversation(db: State<Database>, conversation: Conversation) -> ApiResponse<Conversation> {
    match db.create_conversation(&conversation) {
        Ok(_) => ApiResponse::success(conversation),
        Err(e) => ApiResponse::error(e.to_string()),
    }
}

#[tauri::command]
pub fn delete_conversation(db: State<Database>, id: String) -> ApiResponse<()> {
    match db.delete_conversation(&id) {
        Ok(_) => ApiResponse::success(()),
        Err(e) => ApiResponse::error(e.to_string()),
    }
}

// Message commands
#[tauri::command]
pub fn get_messages_by_conversation(db: State<Database>, conversation_id: String) -> ApiResponse<Vec<Message>> {
    match db.get_messages_by_conversation(&conversation_id) {
        Ok(messages) => ApiResponse::success(messages),
        Err(e) => ApiResponse::error(e.to_string()),
    }
}

#[tauri::command]
pub fn create_message(db: State<Database>, message: Message) -> ApiResponse<Message> {
    match db.create_message(&message) {
        Ok(_) => ApiResponse::success(message),
        Err(e) => ApiResponse::error(e.to_string()),
    }
}

#[tauri::command]
pub fn delete_message(db: State<Database>, id: String) -> ApiResponse<()> {
    match db.delete_message(&id) {
        Ok(_) => ApiResponse::success(()),
        Err(e) => ApiResponse::error(e.to_string()),
    }
}

// Medical Record commands
#[tauri::command]
pub fn get_medical_records(db: State<Database>, patient_id: String) -> ApiResponse<Vec<MedicalRecord>> {
    match db.get_medical_records(&patient_id) {
        Ok(records) => ApiResponse::success(records),
        Err(e) => ApiResponse::error(e.to_string()),
    }
}

#[tauri::command]
pub fn create_medical_record(db: State<Database>, record: MedicalRecord) -> ApiResponse<MedicalRecord> {
    match db.create_medical_record(&record) {
        Ok(_) => ApiResponse::success(record),
        Err(e) => ApiResponse::error(e.to_string()),
    }
}

#[tauri::command]
pub fn update_medical_record(db: State<Database>, record: MedicalRecord) -> ApiResponse<MedicalRecord> {
    match db.update_medical_record(&record) {
        Ok(_) => ApiResponse::success(record),
        Err(e) => ApiResponse::error(e.to_string()),
    }
}

#[tauri::command]
pub fn delete_medical_record(db: State<Database>, id: String) -> ApiResponse<()> {
    match db.delete_medical_record(&id) {
        Ok(_) => ApiResponse::success(()),
        Err(e) => ApiResponse::error(e.to_string()),
    }
}

// Medical Order commands
#[tauri::command]
pub fn get_medical_orders(db: State<Database>, patient_id: String) -> ApiResponse<Vec<MedicalOrder>> {
    match db.get_medical_orders(&patient_id) {
        Ok(orders) => ApiResponse::success(orders),
        Err(e) => ApiResponse::error(e.to_string()),
    }
}

#[tauri::command]
pub fn create_medical_order(db: State<Database>, order: MedicalOrder) -> ApiResponse<MedicalOrder> {
    match db.create_medical_order(&order) {
        Ok(_) => ApiResponse::success(order),
        Err(e) => ApiResponse::error(e.to_string()),
    }
}

#[tauri::command]
pub fn update_medical_order(db: State<Database>, order: MedicalOrder) -> ApiResponse<MedicalOrder> {
    match db.update_medical_order(&order) {
        Ok(_) => ApiResponse::success(order),
        Err(e) => ApiResponse::error(e.to_string()),
    }
}

#[tauri::command]
pub fn delete_medical_order(db: State<Database>, id: String) -> ApiResponse<()> {
    match db.delete_medical_order(&id) {
        Ok(_) => ApiResponse::success(()),
        Err(e) => ApiResponse::error(e.to_string()),
    }
}

// AI Chat command - 调用真实 LLM API (DashScope) 或 fallback
#[tauri::command]
pub async fn ai_chat(
    ai_state: tauri::State<'_, AIState>,
    message: String,
    patient_context: String,
    history: Vec<(String, String)>,
) -> Result<String, String> {
    let service = AIService::new_with_key(ai_state.api_key.clone());
    service.chat(&patient_context, &message, history).await
}

#[tauri::command]
pub async fn ai_generate_record(
    ai_state: tauri::State<'_, AIState>,
    patient_info: String,
    conversation: String,
) -> Result<String, String> {
    let service = AIService::new_with_key(ai_state.api_key.clone());
    service.generate_medical_record(&patient_info, &conversation).await
}

#[tauri::command]
pub async fn ai_generate_orders(
    ai_state: tauri::State<'_, AIState>,
    patient_info: String,
) -> Result<String, String> {
    let service = AIService::new_with_key(ai_state.api_key.clone());
    service.generate_orders(&patient_info).await
}

#[tauri::command]
pub async fn ai_generate_consult(
    ai_state: tauri::State<'_, AIState>,
    patient_info: String,
) -> Result<String, String> {
    let service = AIService::new_with_key(ai_state.api_key.clone());
    service.generate_consult(&patient_info).await
}

#[tauri::command]
pub async fn ai_generate_handover(
    ai_state: tauri::State<'_, AIState>,
    patient_info: String,
    conversation: String,
) -> Result<String, String> {
    let service = AIService::new_with_key(ai_state.api_key.clone());
    service.generate_handover(&patient_info, &conversation).await
}

#[tauri::command]
pub async fn ai_generate_drg(
    ai_state: tauri::State<'_, AIState>,
    patient_info: String,
) -> Result<String, String> {
    let service = AIService::new_with_key(ai_state.api_key.clone());
    service.generate_drg(&patient_info).await
}

// Window control commands
#[tauri::command]
pub fn minimize_window(window: tauri::Window) {
    let _ = window.minimize();
}

#[tauri::command]
pub fn maximize_window(window: tauri::Window) {
    if window.is_maximized().unwrap_or(false) {
        let _ = window.unmaximize();
    } else {
        let _ = window.maximize();
    }
}

#[tauri::command]
pub fn close_window(window: tauri::Window) {
    let _ = window.close();
}
