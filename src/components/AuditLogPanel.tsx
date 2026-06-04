import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { AuditLog, ApiResponse } from '../types';

const ACTION_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  login: { label: '登录', icon: '🔑', color: '#3b82f6' },
  logout: { label: '登出', icon: '🚪', color: '#64748b' },
  view_patient: { label: '查看患者', icon: '👤', color: '#10b981' },
  send_message: { label: '发送消息', icon: '💬', color: '#8b5cf6' },
  generate_record: { label: '生成病历', icon: '📝', color: '#f59e0b' },
  generate_order: { label: '生成医嘱', icon: '📋', color: '#ec4899' },
  create_consultation: { label: '发起会诊', icon: '🏥', color: '#06b6d4' },
  edit_message: { label: '编辑消息', icon: '✏️', color: '#f97316' },
  delete_message: { label: '删除消息', icon: '🗑️', color: '#ef4444' },
  export_backup: { label: '导出备份', icon: '📤', color: '#22c55e' },
  import_backup: { label: '导入备份', icon: '📥', color: '#eab308' },
};

export default function AuditLogPanel({ onClose }: { onClose: () => void }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadLogs();
  }, [filterAction, filterDate]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { limit: 100 };
      if (filterAction) params.action = filterAction;
      if (filterDate) {
        params.startDate = filterDate;
        params.endDate = filterDate + ' 23:59:59';
      }
      const res = await invoke<ApiResponse<AuditLog[]>>('get_audit_logs', params);
      if (res.success && res.data) setLogs(res.data);
    } catch (e) {
      console.warn('Failed to load audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  const getActionInfo = (action: string) => ACTION_LABELS[action] || { label: action, icon: '📌', color: '#64748b' };

  const parseDetails = (json: string): Record<string, unknown> => {
    try { return JSON.parse(json); } catch { return {}; }
  };

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.user_name.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.target_type.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q)
    );
  });

  const handleExport = () => {
    const data = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    a.download = `audit-logs-${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ width: 720, maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h3 style={{ margin: '0 0 16px' }}>📊 操作日志审计</h3>

        {/* 筛选栏 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="🔍 搜索操作..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ flex: 1, minWidth: 150, padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12 }}
          />
          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12 }}
          >
            <option value="">全部操作</option>
            {Object.entries(ACTION_LABELS).map(([key, val]) => (
              <option key={key} value={key}>{val.icon} {val.label}</option>
            ))}
          </select>
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12 }}
          />
          <button className="modal-btn" onClick={handleExport} style={{ fontSize: 12, padding: '6px 12px' }}>
            📥 导出
          </button>
        </div>

        {/* 统计 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <span style={{ padding: '4px 10px', background: '#f1f5f9', borderRadius: 4, fontSize: 11 }}>
            共 {filteredLogs.length} 条记录
          </span>
        </div>

        {/* 日志列表 */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>加载中...</div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
              <div>暂无操作日志</div>
            </div>
          ) : (
            filteredLogs.map(log => {
              const info = getActionInfo(log.action);
              const details = parseDetails(log.details);
              return (
                <div key={log.id} style={{
                  padding: '10px 14px', marginBottom: 6, background: '#fff',
                  border: '1px solid #e2e8f0', borderRadius: 6, display: 'flex', gap: 12, alignItems: 'flex-start',
                }}>
                  <div style={{ fontSize: 20, lineHeight: 1 }}>{info.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 500, fontSize: 13, color: info.color }}>{info.label}</span>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{log.created_at}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#475569' }}>
                      <span style={{ color: '#374151', fontWeight: 500 }}>{log.user_name}</span>
                      {log.target_type && (
                        <span style={{ marginLeft: 6, color: '#64748b' }}>
                          → {log.target_type} {log.target_id && `#${log.target_id.slice(0, 8)}`}
                        </span>
                      )}
                    </div>
                    {Object.keys(details).length > 0 && (
                      <div style={{ marginTop: 4, fontSize: 11, color: '#94a3b8' }}>
                        {Object.entries(details).map(([k, v]) => (
                          <span key={k} style={{ marginRight: 8 }}>{k}: {String(v)}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="modal-actions" style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
          <button className="modal-btn" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
}
