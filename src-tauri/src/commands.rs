use crate::db::{Database, Patient, Conversation, Message, MedicalRecord, MedicalOrder, Consultation, AuditLog};
use crate::ai::AIService;
use tauri::State;
use serde::{Deserialize, Serialize};
use serde_json::json;

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

// ===== Consultation commands =====

#[tauri::command]
pub fn create_consultation(
    db: State<Database>,
    patient_id: String,
    reason: String,
    departments: Vec<String>,
    requester_name: String,
) -> ApiResponse<Consultation> {
    let now = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let consultation = Consultation {
        id: uuid::Uuid::new_v4().to_string(),
        patient_id,
        requester_id: "current_user".to_string(),
        requester_name,
        departments: serde_json::to_string(&departments).unwrap_or_else(|_| "[]".to_string()),
        reason,
        status: "pending".to_string(),
        opinions: "[]".to_string(),
        created_at: now.clone(),
        updated_at: now,
        completed_at: None,
    };
    match db.create_consultation(&consultation) {
        Ok(_) => ApiResponse::success(consultation),
        Err(e) => ApiResponse::error(e.to_string()),
    }
}

#[tauri::command]
pub fn get_consultations(db: State<Database>, patient_id: String) -> ApiResponse<Vec<Consultation>> {
    match db.get_consultations(&patient_id) {
        Ok(consultations) => ApiResponse::success(consultations),
        Err(e) => ApiResponse::error(e.to_string()),
    }
}

#[tauri::command]
pub fn update_consultation_status(db: State<Database>, id: String, status: String) -> ApiResponse<()> {
    match db.update_consultation_status(&id, &status) {
        Ok(_) => ApiResponse::success(()),
        Err(e) => ApiResponse::error(e.to_string()),
    }
}

#[tauri::command]
pub fn add_consultation_opinion(
    db: State<Database>,
    consultation_id: String,
    dept: String,
    doctor: String,
    content: String,
) -> ApiResponse<()> {
    match db.add_consultation_opinion(&consultation_id, &dept, &doctor, &content) {
        Ok(_) => ApiResponse::success(()),
        Err(e) => ApiResponse::error(e.to_string()),
    }
}

// ===== Audit Log commands =====

#[tauri::command]
pub fn log_audit(
    db: State<Database>,
    user_id: String,
    user_name: String,
    action: String,
    target_type: String,
    target_id: String,
    details: String,
) -> ApiResponse<()> {
    let now = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let log = AuditLog {
        id: uuid::Uuid::new_v4().to_string(),
        user_id,
        user_name,
        action,
        target_type,
        target_id,
        details,
        ip_address: "127.0.0.1".to_string(),
        created_at: now,
    };
    match db.log_audit(&log) {
        Ok(_) => ApiResponse::success(()),
        Err(e) => ApiResponse::error(e.to_string()),
    }
}

#[tauri::command]
pub fn get_audit_logs(
    db: State<Database>,
    user_id: Option<String>,
    action: Option<String>,
    start_date: Option<String>,
    end_date: Option<String>,
    limit: Option<i32>,
) -> ApiResponse<Vec<AuditLog>> {
    match db.get_audit_logs(
        user_id.as_deref(),
        action.as_deref(),
        start_date.as_deref(),
        end_date.as_deref(),
        limit,
    ) {
        Ok(logs) => ApiResponse::success(logs),
        Err(e) => ApiResponse::error(e.to_string()),
    }
}

// ===== Backup commands =====

#[tauri::command]
pub fn export_backup(db: State<Database>) -> Result<String, String> {
    let patients = db.get_all_patients_raw().map_err(|e| e.to_string())?;
    let messages = db.get_all_messages_raw().map_err(|e| e.to_string())?;
    let consultations = db.get_all_consultations_raw().map_err(|e| e.to_string())?;
    let records = db.get_all_records_raw().map_err(|e| e.to_string())?;
    let orders = db.get_all_orders_raw().map_err(|e| e.to_string())?;

    let backup = json!({
        "version": "1.0",
        "exported_at": chrono::Local::now().to_rfc3339(),
        "patients": patients,
        "messages": messages,
        "consultations": consultations,
        "medical_records": records,
        "medical_orders": orders,
    });

    Ok(backup.to_string())
}

#[tauri::command]
pub fn import_backup(db: State<Database>, data: String) -> Result<String, String> {
    let backup: serde_json::Value = serde_json::from_str(&data).map_err(|e| e.to_string())?;

    // Clear existing data
    db.clear_all_data().map_err(|e| e.to_string())?;

    // Import patients
    if let Some(patients) = backup.get("patients").and_then(|v| v.as_array()) {
        for p in patients {
            if let Ok(patient) = serde_json::from_value::<Patient>(p.clone()) {
                let _ = db.insert_patient(&patient);
            }
        }
    }

    // Import messages
    if let Some(messages) = backup.get("messages").and_then(|v| v.as_array()) {
        for m in messages {
            if let Ok(message) = serde_json::from_value::<Message>(m.clone()) {
                let _ = db.insert_message(&message);
            }
        }
    }

    // Import consultations
    if let Some(consultations) = backup.get("consultations").and_then(|v| v.as_array()) {
        for c in consultations {
            if let Ok(consultation) = serde_json::from_value::<Consultation>(c.clone()) {
                let _ = db.insert_consultation(&consultation);
            }
        }
    }

    // Import medical records
    if let Some(records) = backup.get("medical_records").and_then(|v| v.as_array()) {
        for r in records {
            if let Ok(record) = serde_json::from_value::<MedicalRecord>(r.clone()) {
                let _ = db.insert_record(&record);
            }
        }
    }

    // Import medical orders
    if let Some(orders) = backup.get("medical_orders").and_then(|v| v.as_array()) {
        for o in orders {
            if let Ok(order) = serde_json::from_value::<MedicalOrder>(o.clone()) {
                let _ = db.insert_order(&order);
            }
        }
    }

    Ok("导入成功".to_string())
}

// ===== Patient Detail commands (v9.0) =====

#[tauri::command]
pub fn get_all_patient_details(db: State<Database>) -> ApiResponse<Vec<crate::db::PatientDetail>> {
    match db.get_all_patient_details() {
        Ok(details) => ApiResponse::success(details),
        Err(e) => ApiResponse::error(e.to_string()),
    }
}

#[tauri::command]
pub fn get_patient_detail(db: State<Database>, patient_id: String) -> ApiResponse<crate::db::PatientDetail> {
    match db.get_patient_detail(&patient_id) {
        Ok(detail) => ApiResponse::success(detail),
        Err(e) => ApiResponse::error(e.to_string()),
    }
}

#[tauri::command]
pub fn create_patient_detail(db: State<Database>, detail: crate::db::PatientDetail) -> ApiResponse<()> {
    match db.create_patient_detail(&detail) {
        Ok(_) => ApiResponse::success(()),
        Err(e) => ApiResponse::error(e.to_string()),
    }
}

#[tauri::command]
pub fn get_patient_trends(db: State<Database>, patient_id: String) -> ApiResponse<Option<crate::db::PatientTrend>> {
    match db.get_patient_trends(&patient_id) {
        Ok(trends) => ApiResponse::success(trends),
        Err(e) => ApiResponse::error(e.to_string()),
    }
}

#[tauri::command]
pub fn get_patient_drg(db: State<Database>, patient_id: String) -> ApiResponse<Option<crate::db::PatientDrg>> {
    match db.get_patient_drg(&patient_id) {
        Ok(drg) => ApiResponse::success(drg),
        Err(e) => ApiResponse::error(e.to_string()),
    }
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

// Re-export structs for lib.rs (already imported at top of file)
