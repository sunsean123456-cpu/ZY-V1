use rusqlite::{Connection, Result, params};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Patient {
    pub id: String,
    pub name: String,
    pub bed_number: String,
    pub gender: String,
    pub age: i32,
    pub diagnosis: String,
    pub admission_date: String,
    pub admission_no: String,
    pub status: String,
    pub group_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Conversation {
    pub id: String,
    pub patient_id: String,
    pub title: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: String,
    pub conversation_id: String,
    pub role: String,
    pub content: String,
    pub msg_type: String,
    pub timestamp: String,
    pub suggestions: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MedicalRecord {
    pub id: String,
    pub patient_id: String,
    pub record_type: String,
    pub content: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MedicalOrder {
    pub id: String,
    pub patient_id: String,
    pub order_type: String,
    pub content: String,
    pub status: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Consultation {
    pub id: String,
    pub patient_id: String,
    pub requester_id: String,
    pub requester_name: String,
    pub departments: String,
    pub reason: String,
    pub status: String,
    pub opinions: String,
    pub created_at: String,
    pub updated_at: String,
    pub completed_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditLog {
    pub id: String,
    pub user_id: String,
    pub user_name: String,
    pub action: String,
    pub target_type: String,
    pub target_id: String,
    pub details: String,
    pub ip_address: String,
    pub created_at: String,
}

pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    pub fn new() -> Result<Self> {
        let conn = Connection::open("hospital_ai.db")?;
        
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS patients (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                bed_number TEXT,
                gender TEXT,
                age INTEGER,
                diagnosis TEXT,
                admission_date TEXT,
                admission_no TEXT,
                status TEXT,
                group_type TEXT
            );

            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                patient_id TEXT NOT NULL,
                title TEXT,
                created_at TEXT,
                FOREIGN KEY (patient_id) REFERENCES patients(id)
            );

            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                conversation_id TEXT NOT NULL,
                role TEXT,
                content TEXT,
                msg_type TEXT,
                timestamp TEXT,
                suggestions TEXT,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id)
            );

            CREATE TABLE IF NOT EXISTS medical_records (
                id TEXT PRIMARY KEY,
                patient_id TEXT NOT NULL,
                record_type TEXT,
                content TEXT,
                created_at TEXT,
                FOREIGN KEY (patient_id) REFERENCES patients(id)
            );

            CREATE TABLE IF NOT EXISTS medical_orders (
                id TEXT PRIMARY KEY,
                patient_id TEXT NOT NULL,
                order_type TEXT,
                content TEXT,
                status TEXT,
                created_at TEXT,
                FOREIGN KEY (patient_id) REFERENCES patients(id)
            );

            CREATE TABLE IF NOT EXISTS consultations (
                id TEXT PRIMARY KEY,
                patient_id TEXT NOT NULL,
                requester_id TEXT NOT NULL,
                requester_name TEXT NOT NULL,
                departments TEXT NOT NULL,
                reason TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                opinions TEXT DEFAULT '[]',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                completed_at TEXT,
                FOREIGN KEY (patient_id) REFERENCES patients(id)
            );

            CREATE TABLE IF NOT EXISTS audit_logs (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                user_name TEXT NOT NULL,
                action TEXT NOT NULL,
                target_type TEXT DEFAULT '',
                target_id TEXT DEFAULT '',
                details TEXT DEFAULT '{}',
                ip_address TEXT DEFAULT '',
                created_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
            CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
            CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);"
        )?;

        Ok(Database {
            conn: Mutex::new(conn),
        })
    }

    // Patient operations
    pub fn get_all_patients(&self) -> Result<Vec<Patient>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, bed_number, gender, age, diagnosis, admission_date, admission_no, status, group_type FROM patients"
        )?;

        let patients = stmt.query_map([], |row| {
            Ok(Patient {
                id: row.get(0)?,
                name: row.get(1)?,
                bed_number: row.get(2)?,
                gender: row.get(3)?,
                age: row.get(4)?,
                diagnosis: row.get(5)?,
                admission_date: row.get(6)?,
                admission_no: row.get(7)?,
                status: row.get(8)?,
                group_type: row.get(9)?,
            })
        })?;

        patients.collect()
    }

    pub fn create_patient(&self, patient: &Patient) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO patients (id, name, bed_number, gender, age, diagnosis, admission_date, admission_no, status, group_type)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![
                patient.id,
                patient.name,
                patient.bed_number,
                patient.gender,
                patient.age,
                patient.diagnosis,
                patient.admission_date,
                patient.admission_no,
                patient.status,
                patient.group_type,
            ],
        )?;
        Ok(())
    }

    pub fn update_patient(&self, patient: &Patient) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE patients SET name=?2, bed_number=?3, gender=?4, age=?5, diagnosis=?6,
             admission_date=?7, admission_no=?8, status=?9, group_type=?10 WHERE id=?1",
            params![
                patient.id,
                patient.name,
                patient.bed_number,
                patient.gender,
                patient.age,
                patient.diagnosis,
                patient.admission_date,
                patient.admission_no,
                patient.status,
                patient.group_type,
            ],
        )?;
        Ok(())
    }

    pub fn delete_patient(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM patients WHERE id=?1", params![id])?;
        Ok(())
    }

    // Conversation operations
    pub fn get_conversations_by_patient(&self, patient_id: &str) -> Result<Vec<Conversation>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, patient_id, title, created_at FROM conversations WHERE patient_id=?1 ORDER BY created_at DESC"
        )?;

        let conversations = stmt.query_map(params![patient_id], |row| {
            Ok(Conversation {
                id: row.get(0)?,
                patient_id: row.get(1)?,
                title: row.get(2)?,
                created_at: row.get(3)?,
            })
        })?;

        conversations.collect()
    }

    pub fn create_conversation(&self, conversation: &Conversation) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO conversations (id, patient_id, title, created_at) VALUES (?1, ?2, ?3, ?4)",
            params![
                conversation.id,
                conversation.patient_id,
                conversation.title,
                conversation.created_at,
            ],
        )?;
        Ok(())
    }

    pub fn delete_conversation(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM conversations WHERE id=?1", params![id])?;
        Ok(())
    }

    // Message operations
    pub fn get_messages_by_conversation(&self, conversation_id: &str) -> Result<Vec<Message>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, conversation_id, role, content, msg_type, timestamp, suggestions 
             FROM messages WHERE conversation_id=?1 ORDER BY timestamp ASC"
        )?;

        let messages = stmt.query_map(params![conversation_id], |row| {
            Ok(Message {
                id: row.get(0)?,
                conversation_id: row.get(1)?,
                role: row.get(2)?,
                content: row.get(3)?,
                msg_type: row.get(4)?,
                timestamp: row.get(5)?,
                suggestions: row.get(6)?,
            })
        })?;

        messages.collect()
    }

    pub fn create_message(&self, message: &Message) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO messages (id, conversation_id, role, content, msg_type, timestamp, suggestions)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                message.id,
                message.conversation_id,
                message.role,
                message.content,
                message.msg_type,
                message.timestamp,
                message.suggestions,
            ],
        )?;
        Ok(())
    }

    pub fn delete_message(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM messages WHERE id=?1", params![id])?;
        Ok(())
    }

    // Medical Record operations
    pub fn get_medical_records(&self, patient_id: &str) -> Result<Vec<MedicalRecord>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, patient_id, record_type, content, created_at 
             FROM medical_records WHERE patient_id=?1 ORDER BY created_at DESC"
        )?;

        let records = stmt.query_map(params![patient_id], |row| {
            Ok(MedicalRecord {
                id: row.get(0)?,
                patient_id: row.get(1)?,
                record_type: row.get(2)?,
                content: row.get(3)?,
                created_at: row.get(4)?,
            })
        })?;

        records.collect()
    }

    pub fn create_medical_record(&self, record: &MedicalRecord) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO medical_records (id, patient_id, record_type, content, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                record.id,
                record.patient_id,
                record.record_type,
                record.content,
                record.created_at,
            ],
        )?;
        Ok(())
    }

    pub fn update_medical_record(&self, record: &MedicalRecord) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE medical_records SET record_type=?3, content=?4, created_at=?5 WHERE id=?1 AND patient_id=?2",
            params![
                record.id,
                record.patient_id,
                record.record_type,
                record.content,
                record.created_at,
            ],
        )?;
        Ok(())
    }

    pub fn delete_medical_record(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM medical_records WHERE id=?1", params![id])?;
        Ok(())
    }

    // Medical Order operations
    pub fn get_medical_orders(&self, patient_id: &str) -> Result<Vec<MedicalOrder>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, patient_id, order_type, content, status, created_at 
             FROM medical_orders WHERE patient_id=?1 ORDER BY created_at DESC"
        )?;

        let orders = stmt.query_map(params![patient_id], |row| {
            Ok(MedicalOrder {
                id: row.get(0)?,
                patient_id: row.get(1)?,
                order_type: row.get(2)?,
                content: row.get(3)?,
                status: row.get(4)?,
                created_at: row.get(5)?,
            })
        })?;

        orders.collect()
    }

    pub fn create_medical_order(&self, order: &MedicalOrder) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO medical_orders (id, patient_id, order_type, content, status, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                order.id,
                order.patient_id,
                order.order_type,
                order.content,
                order.status,
                order.created_at,
            ],
        )?;
        Ok(())
    }

    pub fn update_medical_order(&self, order: &MedicalOrder) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE medical_orders SET order_type=?3, content=?4, status=?5, created_at=?6 
             WHERE id=?1 AND patient_id=?2",
            params![
                order.id,
                order.patient_id,
                order.order_type,
                order.content,
                order.status,
                order.created_at,
            ],
        )?;
        Ok(())
    }

    pub fn delete_medical_order(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM medical_orders WHERE id=?1", params![id])?;
        Ok(())
    }

    // ===== Consultation operations =====

    pub fn create_consultation(&self, c: &Consultation) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO consultations (id, patient_id, requester_id, requester_name, departments, reason, status, opinions, created_at, updated_at, completed_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![
                c.id, c.patient_id, c.requester_id, c.requester_name,
                c.departments, c.reason, c.status, c.opinions,
                c.created_at, c.updated_at, c.completed_at,
            ],
        )?;
        Ok(())
    }

    pub fn get_consultations(&self, patient_id: &str) -> Result<Vec<Consultation>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, patient_id, requester_id, requester_name, departments, reason, status, opinions, created_at, updated_at, completed_at
             FROM consultations WHERE patient_id=?1 ORDER BY created_at DESC"
        )?;
        let rows = stmt.query_map(params![patient_id], |row| {
            Ok(Consultation {
                id: row.get(0)?,
                patient_id: row.get(1)?,
                requester_id: row.get(2)?,
                requester_name: row.get(3)?,
                departments: row.get(4)?,
                reason: row.get(5)?,
                status: row.get(6)?,
                opinions: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
                completed_at: row.get(10)?,
            })
        })?;
        rows.collect()
    }

    pub fn update_consultation_status(&self, id: &str, status: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let now = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
        let completed = if status == "completed" { Some(now.clone()) } else { None };
        conn.execute(
            "UPDATE consultations SET status=?2, updated_at=?3, completed_at=COALESCE(?4, completed_at) WHERE id=?1",
            params![id, status, now, completed],
        )?;
        Ok(())
    }

    pub fn add_consultation_opinion(&self, consultation_id: &str, dept: &str, doctor: &str, content: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let now = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
        // Read current opinions
        let current: String = conn.query_row(
            "SELECT opinions FROM consultations WHERE id=?1",
            params![consultation_id],
            |row| row.get(0),
        )?;
        let mut opinions: Vec<serde_json::Value> = serde_json::from_str(&current).unwrap_or_default();
        opinions.push(json!({
            "dept": dept,
            "doctor": doctor,
            "content": content,
            "time": now,
        }));
        let new_json = serde_json::to_string(&opinions).unwrap_or_else(|_| "[]".to_string());
        conn.execute(
            "UPDATE consultations SET opinions=?2, updated_at=?3 WHERE id=?1",
            params![consultation_id, new_json, now],
        )?;
        Ok(())
    }

    pub fn get_all_consultations_raw(&self) -> Result<Vec<Consultation>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, patient_id, requester_id, requester_name, departments, reason, status, opinions, created_at, updated_at, completed_at FROM consultations"
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(Consultation {
                id: row.get(0)?,
                patient_id: row.get(1)?,
                requester_id: row.get(2)?,
                requester_name: row.get(3)?,
                departments: row.get(4)?,
                reason: row.get(5)?,
                status: row.get(6)?,
                opinions: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
                completed_at: row.get(10)?,
            })
        })?;
        rows.collect()
    }

    // ===== Audit Log operations =====

    pub fn log_audit(&self, log: &AuditLog) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO audit_logs (id, user_id, user_name, action, target_type, target_id, details, ip_address, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                log.id, log.user_id, log.user_name, log.action,
                log.target_type, log.target_id, log.details,
                log.ip_address, log.created_at,
            ],
        )?;
        Ok(())
    }

    pub fn get_audit_logs(
        &self,
        user_id: Option<&str>,
        action: Option<&str>,
        start_date: Option<&str>,
        end_date: Option<&str>,
        limit: Option<i32>,
    ) -> Result<Vec<AuditLog>> {
        let conn = self.conn.lock().unwrap();
        let mut sql = String::from(
            "SELECT id, user_id, user_name, action, target_type, target_id, details, ip_address, created_at FROM audit_logs WHERE 1=1"
        );
        let mut param_values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

        if let Some(uid) = user_id {
            sql.push_str(&format!(" AND user_id=?{}", param_values.len() + 1));
            param_values.push(Box::new(uid.to_string()));
        }
        if let Some(act) = action {
            sql.push_str(&format!(" AND action=?{}", param_values.len() + 1));
            param_values.push(Box::new(act.to_string()));
        }
        if let Some(sd) = start_date {
            sql.push_str(&format!(" AND created_at>=?{}", param_values.len() + 1));
            param_values.push(Box::new(sd.to_string()));
        }
        if let Some(ed) = end_date {
            sql.push_str(&format!(" AND created_at<=?{}", param_values.len() + 1));
            param_values.push(Box::new(ed.to_string()));
        }
        sql.push_str(" ORDER BY created_at DESC");
        if let Some(lim) = limit {
            sql.push_str(&format!(" LIMIT {}", lim));
        }

        let mut stmt = conn.prepare(&sql)?;
        let params_ref: Vec<&dyn rusqlite::types::ToSql> = param_values.iter().map(|p| p.as_ref()).collect();
        let rows = stmt.query_map(params_ref.as_slice(), |row| {
            Ok(AuditLog {
                id: row.get(0)?,
                user_id: row.get(1)?,
                user_name: row.get(2)?,
                action: row.get(3)?,
                target_type: row.get(4)?,
                target_id: row.get(5)?,
                details: row.get(6)?,
                ip_address: row.get(7)?,
                created_at: row.get(8)?,
            })
        })?;
        rows.collect()
    }

    // ===== Backup helpers =====

    pub fn get_all_patients_raw(&self) -> Result<Vec<Patient>> {
        self.get_all_patients()
    }

    pub fn get_all_messages_raw(&self) -> Result<Vec<Message>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, conversation_id, role, content, msg_type, timestamp, suggestions FROM messages"
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(Message {
                id: row.get(0)?,
                conversation_id: row.get(1)?,
                role: row.get(2)?,
                content: row.get(3)?,
                msg_type: row.get(4)?,
                timestamp: row.get(5)?,
                suggestions: row.get(6)?,
            })
        })?;
        rows.collect()
    }

    pub fn get_all_records_raw(&self) -> Result<Vec<MedicalRecord>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, patient_id, record_type, content, created_at FROM medical_records"
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(MedicalRecord {
                id: row.get(0)?,
                patient_id: row.get(1)?,
                record_type: row.get(2)?,
                content: row.get(3)?,
                created_at: row.get(4)?,
            })
        })?;
        rows.collect()
    }

    pub fn get_all_orders_raw(&self) -> Result<Vec<MedicalOrder>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, patient_id, order_type, content, status, created_at FROM medical_orders"
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(MedicalOrder {
                id: row.get(0)?,
                patient_id: row.get(1)?,
                order_type: row.get(2)?,
                content: row.get(3)?,
                status: row.get(4)?,
                created_at: row.get(5)?,
            })
        })?;
        rows.collect()
    }

    pub fn clear_all_data(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute_batch(
            "DELETE FROM messages;
             DELETE FROM conversations;
             DELETE FROM medical_records;
             DELETE FROM medical_orders;
             DELETE FROM consultations;
             DELETE FROM patients;"
        )?;
        Ok(())
    }

    pub fn insert_patient(&self, p: &Patient) -> Result<()> {
        self.create_patient(p)
    }

    pub fn insert_message(&self, m: &Message) -> Result<()> {
        self.create_message(m)
    }

    pub fn insert_record(&self, r: &MedicalRecord) -> Result<()> {
        self.create_medical_record(r)
    }

    pub fn insert_order(&self, o: &MedicalOrder) -> Result<()> {
        self.create_medical_order(o)
    }

    pub fn insert_consultation(&self, c: &Consultation) -> Result<()> {
        self.create_consultation(c)
    }

    // Initialize demo data
    pub fn init_demo_data(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        
        // Check if data already exists
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM patients",
            [],
            |row| row.get(0),
        )?;

        if count > 0 {
            return Ok(());
        }

        // Insert demo patients
        let demo_patients = vec![
            ("p1", "张建国", "12床", "男", 72, "急性脑梗死 | 2型糖尿病 | 高血压", "2026-05-27", "ZY20260527008", "has-msg", "pre-op"),
            ("p2", "李秀英", "8床", "女", 65, "肺炎 | 冠心病", "2026-05-26", "ZY20260526015", "online", "post-op"),
            ("p3", "王德福", "15床", "男", 58, "肝硬化（Child-Pugh B级）", "2026-05-20", "ZY20260520032", "offline", "historical"),
            ("p4", "赵淑华", "6床", "女", 70, "慢性心衰急性加重", "2026-05-25", "ZY20260525041", "online", "pre-op"),
            ("p5", "刘长生", "22床", "男", 80, "COPD急性加重 | 前列腺增生", "2026-05-24", "ZY20260524019", "has-msg", "post-op"),
        ];

        for p in demo_patients {
            conn.execute(
                "INSERT INTO patients (id, name, bed_number, gender, age, diagnosis, admission_date, admission_no, status, group_type)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
                params![p.0, p.1, p.2, p.3, p.4, p.5, p.6, p.7, p.8, p.9],
            )?;
        }

        // Insert demo conversations
        for i in 1..=5 {
            conn.execute(
                "INSERT INTO conversations (id, patient_id, title, created_at) VALUES (?1, ?2, ?3, ?4)",
                params![
                    format!("conv{}", i),
                    format!("p{}", i),
                    format!("患者{}的会话", i),
                    "2026-05-27 09:00:00",
                ],
            )?;
        }

        Ok(())
    }
}
