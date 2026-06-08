import { invoke } from '@tauri-apps/api/core';
import type { PatientDetail } from '../types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function loadAllPatientDetails(): Promise<PatientDetail[]> {
  const res = await invoke<ApiResponse<PatientDetail[]>>('get_all_patient_details');
  if (res.success && res.data) return res.data;
  console.error('loadAllPatientDetails failed:', res.error);
  return [];
}

export async function loadPatientDetail(patientId: string): Promise<PatientDetail | null> {
  const res = await invoke<ApiResponse<PatientDetail>>('get_patient_detail', { patientId });
  if (res.success && res.data) return res.data;
  console.error('loadPatientDetail failed:', res.error);
  return null;
}

export async function savePatientDetail(detail: PatientDetail): Promise<boolean> {
  const res = await invoke<ApiResponse<void>>('create_patient_detail', { detail });
  if (res.success) return true;
  console.error('savePatientDetail failed:', res.error);
  return false;
}
