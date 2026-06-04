use rusqlite::{Connection, Result, params};
use serde::{Deserialize, Serialize};
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
            );"
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
