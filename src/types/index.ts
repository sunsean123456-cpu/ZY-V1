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
