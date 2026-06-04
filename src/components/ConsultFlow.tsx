import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { Consultation, ConsultationOpinion, ApiResponse } from '../types';
import { audit } from '../utils/auditLogger';

interface ConsultFlowProps {
  patientId: string;
  patientName: string;
  onClose: () => void;
}

const DEPARTMENTS = [
  '神经内科', '心内科', '呼吸科', '消化科', '内分泌科',
  '肾内科', '血液科', '肿瘤科', '感染科', '风湿免疫科',
  '外科', '骨科', '神经外科', '胸外科', '泌尿外科',
  'ICU', '急诊科', '康复科', '营养科', '药剂科',
];

const STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: '待审核', color: '#f59e0b', icon: '⏳' },
  approved: { label: '已批准', color: '#3b82f6', icon: '✅' },
  in_progress: { label: '会诊中', color: '#8b5cf6', icon: '🔄' },
  completed: { label: '已完成', color: '#22c55e', icon: '✔️' },
  rejected: { label: '已拒绝', color: '#ef4444', icon: '❌' },
};

export default function ConsultFlow({ patientId, patientName, onClose }: ConsultFlowProps) {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showOpinionForm, setShowOpinionForm] = useState(false);
  const [opDept, setOpDept] = useState('');
  const [opDoctor, setOpDoctor] = useState('');
  const [opContent, setOpContent] = useState('');

  useEffect(() => { loadConsultations(); }, [patientId]);

  const loadConsultations = async () => {
    try {
      const res = await invoke<ApiResponse<Consultation[]>>('get_consultations', { patientId });
      if (res.success && res.data) setConsultations(res.data);
    } catch (e) { console.warn('Failed to load consultations:', e); }
  };

  const handleCreate = async () => {
    if (selectedDepts.length === 0 || !reason.trim()) {
      alert('请选择会诊科室并填写会诊原因');
      return;
    }
    setLoading(true);
    try {
      const res = await invoke<ApiResponse<Consultation>>('create_consultation', {
        patientId, reason: reason.trim(), departments: selectedDepts, requesterName: '孙医生',
      });
      if (res.success && res.data) {
        audit.createConsultation(res.data.id);
        setConsultations([res.data, ...consultations]);
        setShowForm(false);
        setSelectedDepts([]);
        setReason('');
        alert('会诊申请已提交');
      }
    } catch (e) { console.error('Failed:', e); alert('创建会诊失败'); }
    finally { setLoading(false); }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await invoke<ApiResponse<void>>('update_consultation_status', { id, status });
      if (res.success) {
        await loadConsultations();
        if (status === 'completed') alert('会诊已完成');
      }
    } catch (e) { console.error('Failed:', e); alert('更新状态失败'); }
  };

  const handleAddOpinion = async () => {
    if (!activeId || !opDept || !opDoctor || !opContent.trim()) {
      alert('请填写完整的会诊意见');
      return;
    }
    try {
      const res = await invoke<ApiResponse<void>>('add_consultation_opinion', {
        consultationId: activeId, dept: opDept, doctor: opDoctor, content: opContent.trim(),
      });
      if (res.success) {
        await loadConsultations();
        setShowOpinionForm(false);
        setOpDept(''); setOpDoctor(''); setOpContent('');
        alert('会诊意见已添加');
      }
    } catch (e) { console.error('Failed:', e); alert('添加会诊意见失败'); }
  };

  const parseDepts = (json: string): string[] => { try { return JSON.parse(json); } catch { return []; } };
  const parseOpinions = (json: string): ConsultationOpinion[] => { try { return JSON.parse(json); } catch { return []; } };

  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ width: 640, maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          🏥 会诊流程管理 - {patientName}
        </h3>

        <div style={{ marginBottom: 16 }}>
          <button className="modal-btn primary" onClick={() => setShowForm(!showForm)} style={{ width: '100%' }}>
            {showForm ? '取消新建' : '+ 发起新会诊'}
          </button>
        </div>

        {showForm && (
          <div style={{ marginBottom: 16, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                会诊原因 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="请详细描述会诊原因..."
                style={{ width: '100%', minHeight: 80, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                选择会诊科室 <span style={{ color: '#ef4444' }}>*</span>
                <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>已选: {selectedDepts.length}</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {DEPARTMENTS.map(dept => (
                  <button key={dept} onClick={() => setSelectedDepts(prev => prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept])}
                    style={{
                      padding: '4px 10px', fontSize: 12, border: '1px solid',
                      borderColor: selectedDepts.includes(dept) ? '#3b82f6' : '#d1d5db',
                      background: selectedDepts.includes(dept) ? '#eff6ff' : '#fff',
                      color: selectedDepts.includes(dept) ? '#3b82f6' : '#374151',
                      borderRadius: 4, cursor: 'pointer',
                    }}>
                    {dept}
                  </button>
                ))}
              </div>
            </div>
            <button className="modal-btn primary" onClick={handleCreate} disabled={loading || selectedDepts.length === 0 || !reason.trim()} style={{ width: '100%' }}>
              {loading ? '提交中...' : '提交会诊申请'}
            </button>
          </div>
        )}

        <div style={{ flex: 1, overflow: 'auto' }}>
          {consultations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
              <div>暂无会诊记录</div>
            </div>
          ) : (
            consultations.map(c => {
              const st = STATUS_MAP[c.status] || STATUS_MAP.pending;
              const depts = parseDepts(c.departments);
              const opinions = parseOpinions(c.opinions);
              const isActive = activeId === c.id;
              return (
                <div key={c.id} onClick={() => setActiveId(isActive ? null : c.id)}
                  style={{
                    marginBottom: 12, padding: 16, background: isActive ? '#f0f9ff' : '#fff',
                    border: '1px solid', borderColor: isActive ? '#3b82f6' : '#e2e8f0', borderRadius: 8, cursor: 'pointer',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>会诊 #{c.id.slice(0, 8)}</div>
                    <span style={{ padding: '2px 10px', fontSize: 11, background: st.color + '20', color: st.color, borderRadius: 12, fontWeight: 500 }}>
                      {st.icon} {st.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#374151', marginBottom: 8, lineHeight: 1.6 }}>
                    <strong>原因：</strong>{c.reason}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                    {depts.map((d, i) => (
                      <span key={i} style={{ padding: '2px 8px', fontSize: 11, background: '#e0e7ff', color: '#4338ca', borderRadius: 4 }}>{d}</span>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    📅 发起: {c.created_at}
                    {c.completed_at && <> | ✅ 完成: {c.completed_at}</>}
                  </div>

                  {isActive && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                        {c.status === 'pending' && (
                          <>
                            <button className="modal-btn" onClick={e => { e.stopPropagation(); handleUpdateStatus(c.id, 'approved'); }}
                              style={{ fontSize: 12, padding: '4px 12px' }}>批准</button>
                            <button className="modal-btn" onClick={e => { e.stopPropagation(); handleUpdateStatus(c.id, 'rejected'); }}
                              style={{ fontSize: 12, padding: '4px 12px', color: '#ef4444' }}>拒绝</button>
                          </>
                        )}
                        {c.status === 'approved' && (
                          <button className="modal-btn primary" onClick={e => { e.stopPropagation(); handleUpdateStatus(c.id, 'in_progress'); }}
                            style={{ fontSize: 12, padding: '4px 12px' }}>开始会诊</button>
                        )}
                        {c.status === 'in_progress' && (
                          <>
                            <button className="modal-btn" onClick={e => { e.stopPropagation(); setShowOpinionForm(true); }}
                              style={{ fontSize: 12, padding: '4px 12px' }}>添加意见</button>
                            <button className="modal-btn primary" onClick={e => { e.stopPropagation(); handleUpdateStatus(c.id, 'completed'); }}
                              style={{ fontSize: 12, padding: '4px 12px' }}>完成会诊</button>
                          </>
                        )}
                      </div>

                      {showOpinionForm && (
                        <div style={{ marginBottom: 12, padding: 12, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6 }}>
                          <div style={{ marginBottom: 8 }}>
                            <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>科室</label>
                            <select value={opDept} onChange={e => setOpDept(e.target.value)}
                              style={{ width: '100%', padding: '6px 8px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 4 }}>
                              <option value="">选择科室</option>
                              {depts.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>医生姓名</label>
                            <input type="text" value={opDoctor} onChange={e => setOpDoctor(e.target.value)} placeholder="请输入医生姓名"
                              style={{ width: '100%', padding: '6px 8px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 4 }} />
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>会诊意见</label>
                            <textarea value={opContent} onChange={e => setOpContent(e.target.value)} placeholder="请输入会诊意见..."
                              style={{ width: '100%', minHeight: 60, padding: '6px 8px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 4, fontFamily: 'inherit' }} />
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="modal-btn" onClick={() => setShowOpinionForm(false)} style={{ fontSize: 12, padding: '4px 12px' }}>取消</button>
                            <button className="modal-btn primary" onClick={handleAddOpinion} style={{ fontSize: 12, padding: '4px 12px' }}>提交意见</button>
                          </div>
                        </div>
                      )}

                      {opinions.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>📝 会诊意见 ({opinions.length})</div>
                          {opinions.map((op, i) => (
                            <div key={i} style={{ padding: 8, marginBottom: 6, background: '#f1f5f9', borderRadius: 4, fontSize: 12 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontWeight: 500, color: '#4338ca' }}>{op.dept} - {op.doctor}</span>
                                <span style={{ color: '#94a3b8', fontSize: 11 }}>{op.time}</span>
                              </div>
                              <div style={{ color: '#374151', lineHeight: 1.5 }}>{op.content}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
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
