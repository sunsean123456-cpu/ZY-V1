export interface Patient {
  id: string;
  name: string;
  bed_number: string;
  gender: string;
  age: number;
  diagnosis: string;
  admission_date: string;
  admission_no: string;
  status: string;
  group_type: string;
}

export interface Conversation {
  id: string;
  patient_id: string;
  title: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  msg_type: 'doctor' | 'ai' | 'lab' | 'nurse' | 'family' | 'imaging' | 'consult';
  timestamp: string;
  suggestions?: string;
  has_actions?: boolean;
  is_risk?: boolean;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  record_type: string;
  content: string;
  created_at: string;
}

export interface MedicalOrder {
  id: string;
  patient_id: string;
  order_type: string;
  content: string;
  status: string;
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Rich patient data types for frontend
export interface ChatMessage {
  type: 'doctor' | 'ai' | 'lab' | 'nurse' | 'family' | 'imaging' | 'consult';
  text: string;
  time: string;
  actions?: boolean;
  isRisk?: boolean;
}

export interface OrderItem {
  name: string;
  detail: string;
  checked?: boolean;
}

export interface ConsultItem {
  dept: string;
  content: string;
}

export interface TrendData {
  wbc: number[];
  crp: number[];
  neut: number[];
}

// Consultation types
export interface Consultation {
  id: string;
  patient_id: string;
  requester_id: string;
  requester_name: string;
  departments: string; // JSON array
  reason: string;
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected';
  opinions: string; // JSON array
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface ConsultationOpinion {
  dept: string;
  doctor: string;
  content: string;
  time: string;
}

// Audit Log types
export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  target_type: string;
  target_id: string;
  details: string;
  ip_address: string;
  created_at: string;
}

export interface RichPatientData {
  id: string;
  name: string;
  sex: string;
  age: number;
  bed: string;
  admission: string;
  dx: string;
  status: string;
  group: string;
  surgeryType: string;
  initialMsgs: ChatMessage[];
  pushSequence: ChatMessage[];
  record: string;
  orders: OrderItem[];
  consult: ConsultItem[];
  trends: TrendData;
  drg?: {
    group: string;
    weight: number;
    estimatedCost: number;
    usedCost: number;
    risk: string;
    suggestions: string[];
  };
}

// PatientDetail from backend (v9.0)
export interface PatientDetail {
  patient: Patient;
  initial_msgs: Message[];
  push_msgs: Message[];
  record: MedicalRecord | null;
  orders: MedicalOrder[];
  consults: ConsultItem[];
  trends: PatientTrend | null;
  drg: PatientDrg | null;
}

export interface PatientTrend {
  id: string;
  patient_id: string;
  wbc_data: string; // JSON array
  crp_data: string;
  neut_data: string;
}

export interface PatientDrg {
  id: string;
  patient_id: string;
  drg_group: string;
  weight: number;
  estimated_cost: number;
  used_cost: number;
  risk: string;
  suggestions: string; // JSON array
}
