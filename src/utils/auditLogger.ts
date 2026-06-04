import { invoke } from '@tauri-apps/api/core';

export async function auditLog(
  action: string,
  targetType: string = '',
  targetId: string = '',
  details: Record<string, unknown> = {}
) {
  try {
    await invoke('log_audit', {
      userId: 'current_user',
      userName: '孙医生',
      action,
      targetType,
      targetId,
      details: JSON.stringify(details),
    });
  } catch (e) {
    console.warn('Audit log failed:', e);
  }
}

// 便捷方法
export const audit = {
  login: () => auditLog('login'),
  logout: () => auditLog('logout'),
  viewPatient: (id: string, name: string) => auditLog('view_patient', 'patient', id, { name }),
  sendMessage: (id: string, type: string) => auditLog('send_message', 'message', id, { type }),
  generateRecord: (patientId: string) => auditLog('generate_record', 'patient', patientId),
  generateOrder: (patientId: string) => auditLog('generate_order', 'patient', patientId),
  editMessage: (id: string) => auditLog('edit_message', 'message', id),
  deleteMessage: (id: string) => auditLog('delete_message', 'message', id),
  exportBackup: () => auditLog('export_backup'),
  importBackup: () => auditLog('import_backup'),
  createConsultation: (id: string) => auditLog('create_consultation', 'consultation', id),
};
