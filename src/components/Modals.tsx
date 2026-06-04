import { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { useAuthStore } from '../stores/authStore';
import type { RichPatientData } from '../types';
import {
  exportMedicalRecord,
  exportOrderList,
  exportHandover,
  exportConsult,
} from '../utils/pdfExport';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>✕</button>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

// ==================== Medical Record ====================
export function MedicalRecordModal({ isOpen, onClose, patient }: {
  isOpen: boolean; onClose: () => void; patient: RichPatientData | null;
}) {
  if (!patient) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="住院病历预览">
      <div className="record-preview" dangerouslySetInnerHTML={{ __html: patient.record }} />
      <div className="modal-actions">
        <button className="modal-btn" onClick={onClose}>取消</button>
        <button className="modal-btn" onClick={() => { onClose(); alert('请在对话框中输入修改意见'); }}>修改</button>
        <button className="modal-btn" onClick={() => { exportMedicalRecord(patient.record, patient.name); }}>导出PDF</button>
        <button className="modal-btn primary" onClick={() => { onClose(); alert('病历已提交至HIS系统'); }}>确认提交</button>
      </div>
    </Modal>
  );
}

// ==================== Medical Order ====================
export function MedicalOrderModal({ isOpen, onClose, patient }: {
  isOpen: boolean; onClose: () => void; patient: RichPatientData | null;
}) {
  const [checkedOrders, setCheckedOrders] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isOpen && patient) {
      setCheckedOrders(new Set(patient.orders.map((_, i) => i)));
    }
  }, [isOpen, patient]);

  if (!patient) return null;

  const toggleOrder = (idx: number) => {
    setCheckedOrders(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="检查/医嘱建议">
      <div className="order-preview">
        {patient.orders.map((o, i) => (
          <div key={i} className="order-item" style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }} onClick={() => toggleOrder(i)}>
            <input type="checkbox" checked={checkedOrders.has(i)} onChange={() => toggleOrder(i)} style={{ marginTop: 2 }} />
            <div>
              <div className="order-name">{o.name}</div>
              <div className="order-detail">{o.detail}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="modal-actions">
        <button className="modal-btn" onClick={onClose}>取消</button>
        <button className="modal-btn" onClick={() => { onClose(); alert('请在对话框中输入修改意见'); }}>修改</button>
        <button className="modal-btn" onClick={() => { 
          const selected = patient.orders.filter((_, i) => checkedOrders.has(i));
          exportOrderList(selected, patient.name); 
        }}>导出PDF</button>
        <button className="modal-btn primary" onClick={() => { onClose(); alert(`已提交 ${checkedOrders.size} 条医嘱至HIS系统`); }}>确认提交</button>
      </div>
    </Modal>
  );
}

// ==================== Consult ====================
export function ConsultModal({ isOpen, onClose, patient }: {
  isOpen: boolean; onClose: () => void; patient: RichPatientData | null;
}) {
  if (!patient) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="多学科联合会诊意见">
      <div className="consult-detail">
        {patient.consult.map((c, i) => (
          <div key={i} className="consult-content">
            <div className="consult-dept">{c.dept}</div>
            {c.content}
          </div>
        ))}
      </div>
      <div className="modal-actions">
        <button className="modal-btn" onClick={onClose}>关闭</button>
        <button className="modal-btn" onClick={() => { exportConsult(patient.consult, patient.name); }}>导出PDF</button>
        <button className="modal-btn primary" onClick={() => { onClose(); alert('会诊意见已确认执行'); }}>确认执行</button>
      </div>
    </Modal>
  );
}

// ==================== Trend ====================
export function TrendModal({ isOpen, onClose, patient }: {
  isOpen: boolean; onClose: () => void; patient: RichPatientData | null;
}) {
  if (!patient) return null;

  const chartOption = {
    title: { text: '近7日检验指标趋势', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: {
      trigger: 'axis' as const,
      formatter: (params: any) => {
        let html = `${params[0].axisValue}<br/>`;
        params.forEach((p: any) => {
          const isAbnormal = (p.seriesName === 'WBC' && (p.value > 10 || p.value < 4))
            || (p.seriesName === 'CRP' && p.value > 5)
            || (p.seriesName === 'NEUT%' && (p.value > 75 || p.value < 40));
          html += `${p.marker} ${p.seriesName}: <b>${p.value}</b>${isAbnormal ? ' ⚠️' : ''}<br/>`;
        });
        return html;
      }
    },
    legend: { data: ['WBC', 'CRP', 'NEUT%'], bottom: 0, textStyle: { fontSize: 10 } },
    grid: { left: 50, right: 50, top: 40, bottom: 40 },
    xAxis: {
      type: 'category' as const,
      data: ['D-6', 'D-5', 'D-4', 'D-3', 'D-2', 'D-1', '今日'],
      axisLabel: { fontSize: 11 },
    },
    yAxis: [
      { type: 'value' as const, name: 'WBC/CRP', min: 0, nameTextStyle: { fontSize: 9 }, axisLabel: { fontSize: 9 } },
      { type: 'value' as const, name: 'NEUT%', min: 30, max: 100, nameTextStyle: { fontSize: 9 }, axisLabel: { fontSize: 9 }, splitLine: { show: false } },
    ],
    series: [
      {
        name: 'WBC', type: 'line', data: patient.trends.wbc, yAxisIndex: 0, smooth: true,
        lineStyle: { width: 2, color: '#3b82f6' },
        markLine: {
          silent: true,
          data: [
            { yAxis: 10, label: { formatter: '上限 10', fontSize: 10 }, lineStyle: { type: 'dashed', color: '#ef4444' } },
            { yAxis: 4, label: { formatter: '下限 4', fontSize: 10 }, lineStyle: { type: 'dashed', color: '#22c55e' } }
          ]
        },
        itemStyle: { color: (params: any) => params.value > 10 || params.value < 4 ? '#ef4444' : '#3b82f6' }
      },
      {
        name: 'CRP', type: 'line', data: patient.trends.crp, yAxisIndex: 0, smooth: true,
        lineStyle: { width: 2, color: '#10b981' },
        markLine: {
          silent: true,
          data: [
            { yAxis: 5, label: { formatter: '参考 <5', fontSize: 10 }, lineStyle: { type: 'dashed', color: '#f59e0b' } }
          ]
        },
        itemStyle: { color: (params: any) => params.value > 5 ? '#ef4444' : '#10b981' }
      },
      {
        name: 'NEUT%', type: 'line', data: patient.trends.neut, yAxisIndex: 1, smooth: true,
        lineStyle: { width: 2, color: '#8b5cf6' },
        itemStyle: { color: (params: any) => params.value > 75 || params.value < 40 ? '#ef4444' : '#8b5cf6' }
      }
    ],
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="检验指标趋势图">
      <div className="trend-chart">
        <ReactECharts option={chartOption} style={{ height: 320 }} />
      </div>
      <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 8, textAlign: 'center' }}>
        近7日 WBC / CRP / NEUT% 变化趋势 | ⚠️ 表示超出参考范围
      </p>
    </Modal>
  );
}

// ==================== Handover ====================
export function HandoverModal({ isOpen, onClose, patient }: {
  isOpen: boolean; onClose: () => void; patient: RichPatientData | null;
}) {
  if (!patient) return null;

  const handoverHtml = (() => {
    let html = `<div class="section-title">交班摘要 - ${patient.name} | ${patient.bed}</div>`;
    html += `<div class="section-title">当前诊断</div>${patient.dx}`;
    html += '<div class="section-title">今日关键变化</div>';
    patient.pushSequence.forEach(m => {
      if (m.type === 'lab' || m.type === 'nurse' || m.type === 'ai') {
        const cleanText = (m.text || '').replace(/\n/g, ' ').replace(/<[^>]*>/g, '').substring(0, 80);
        html += `• [${m.time}] ${cleanText}...<br>`;
      }
    });
    html += '<div class="section-title">待办事项</div>';
    html += '• 关注检验结果复查<br>• 监测体征变化<br>• 必要时调整治疗方案';
    return html;
  })();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="交班摘要">
      <div className="record-preview" dangerouslySetInnerHTML={{ __html: handoverHtml }} />
      <div className="modal-actions">
        <button className="modal-btn" onClick={onClose}>关闭</button>
        <button className="modal-btn" onClick={() => { exportHandover(handoverHtml, patient.name); onClose(); }}>导出PDF</button>
        <button className="modal-btn primary" onClick={() => { alert('交班摘要已发送至接班医生'); onClose(); }}>确认发送</button>
      </div>
    </Modal>
  );
}

// ==================== DRG ====================
export function DRGModal({ isOpen, onClose, patient }: {
  isOpen: boolean; onClose: () => void; patient: RichPatientData | null;
}) {
  if (!patient) return null;

  const drg = patient.drg;
  const drgHtml = (() => {
    let html = `<div class="section-title">DRG/DIP 分析 - ${patient.name}</div>`;
    html += '<div class="section-title">分组信息</div>';
    html += `• DRG分组：${drg?.group || '未分组'}<br>`;
    html += `• 权重：${drg?.weight || 0}<br>`;
    html += `• 预计费用：¥${(drg?.estimatedCost || 0).toLocaleString()}<br>`;
    html += '<div class="section-title">费用进度</div>';
    const pct = drg ? Math.round((drg.usedCost / drg.estimatedCost) * 100) : 0;
    html += `• 已用费用：¥${(drg?.usedCost || 0).toLocaleString()} (${pct}%)<br>`;
    html += `• 剩余额度：¥${((drg?.estimatedCost || 0) - (drg?.usedCost || 0)).toLocaleString()}<br>`;
    html += `• 预计超支风险：${drg?.risk || '未知'}<br>`;
    html += '<div class="section-title">建议</div>';
    (drg?.suggestions || []).forEach(s => {
      html += `• ${s}<br>`;
    });
    return html;
  })();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="DRG/DIP 分析">
      <div className="record-preview" dangerouslySetInnerHTML={{ __html: drgHtml }} />
      <div className="modal-actions">
        <button className="modal-btn" onClick={onClose}>关闭</button>
      </div>
    </Modal>
  );
}

// ==================== Settings ====================
export function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI助手设置">
      <div className="setting-group">
        <div className="setting-group-title">基础设置</div>
        <div className="setting-row">
          <span className="setting-label">助手称呼</span>
          <input className="setting-input" defaultValue="小医" />
        </div>
        <div className="setting-row">
          <span className="setting-label">头像</span>
          <div className="setting-control">
            <div className="setting-opt selected">🤖</div>
            <div className="setting-opt" onClick={e => { (e.currentTarget.parentNode!.querySelectorAll('.setting-opt') as NodeListOf<Element>).forEach(el => el.classList.remove('selected')); e.currentTarget.classList.add('selected'); }}>👨‍⚕️</div>
            <div className="setting-opt" onClick={e => { (e.currentTarget.parentNode!.querySelectorAll('.setting-opt') as NodeListOf<Element>).forEach(el => el.classList.remove('selected')); e.currentTarget.classList.add('selected'); }}>🧠</div>
          </div>
        </div>
      </div>
      <div className="setting-group">
        <div className="setting-group-title">沟通风格</div>
        <div className="setting-row">
          <span className="setting-label">语气</span>
          <div className="setting-control">
            <div className="setting-opt selected">严谨</div>
            <div className="setting-opt" onClick={e => { (e.currentTarget.parentNode!.querySelectorAll('.setting-opt') as NodeListOf<Element>).forEach(el => el.classList.remove('selected')); e.currentTarget.classList.add('selected'); }}>温和</div>
            <div className="setting-opt" onClick={e => { (e.currentTarget.parentNode!.querySelectorAll('.setting-opt') as NodeListOf<Element>).forEach(el => el.classList.remove('selected')); e.currentTarget.classList.add('selected'); }}>简洁</div>
          </div>
        </div>
        <div className="setting-row">
          <span className="setting-label">详细程度</span>
          <div className="setting-control">
            <div className="setting-opt" onClick={e => { (e.currentTarget.parentNode!.querySelectorAll('.setting-opt') as NodeListOf<Element>).forEach(el => el.classList.remove('selected')); e.currentTarget.classList.add('selected'); }}>详细</div>
            <div className="setting-opt selected">适中</div>
            <div className="setting-opt" onClick={e => { (e.currentTarget.parentNode!.querySelectorAll('.setting-opt') as NodeListOf<Element>).forEach(el => el.classList.remove('selected')); e.currentTarget.classList.add('selected'); }}>精简</div>
          </div>
        </div>
        <div className="setting-row">
          <span className="setting-label">推送频率</span>
          <div className="setting-control">
            <div className="setting-opt" onClick={e => { (e.currentTarget.parentNode!.querySelectorAll('.setting-opt') as NodeListOf<Element>).forEach(el => el.classList.remove('selected')); e.currentTarget.classList.add('selected'); }}>频繁</div>
            <div className="setting-opt selected">适中</div>
            <div className="setting-opt" onClick={e => { (e.currentTarget.parentNode!.querySelectorAll('.setting-opt') as NodeListOf<Element>).forEach(el => el.classList.remove('selected')); e.currentTarget.classList.add('selected'); }}>精简</div>
          </div>
        </div>
      </div>
      <div className="setting-group">
        <div className="setting-group-title">决策偏好</div>
        <div className="setting-row">
          <span className="setting-label">预警敏感度</span>
          <div className="setting-control">
            <div className="setting-opt" onClick={e => { (e.currentTarget.parentNode!.querySelectorAll('.setting-opt') as NodeListOf<Element>).forEach(el => el.classList.remove('selected')); e.currentTarget.classList.add('selected'); }}>高</div>
            <div className="setting-opt selected">中</div>
            <div className="setting-opt" onClick={e => { (e.currentTarget.parentNode!.querySelectorAll('.setting-opt') as NodeListOf<Element>).forEach(el => el.classList.remove('selected')); e.currentTarget.classList.add('selected'); }}>低</div>
          </div>
        </div>
        <div className="setting-row">
          <span className="setting-label">消息合并</span>
          <div className="setting-control">
            <div className="setting-opt selected">开启</div>
            <div className="setting-opt" onClick={e => { (e.currentTarget.parentNode!.querySelectorAll('.setting-opt') as NodeListOf<Element>).forEach(el => el.classList.remove('selected')); e.currentTarget.classList.add('selected'); }}>关闭</div>
          </div>
        </div>
        <div className="setting-row">
          <span className="setting-label">夜间免打扰</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input className="setting-input" defaultValue="22:00" style={{ width: 70 }} />
            <span>-</span>
            <input className="setting-input" defaultValue="07:00" style={{ width: 70 }} />
          </div>
        </div>
      </div>
      <div className="setting-group">
        <div className="setting-group-title">专业设置</div>
        <div className="setting-row">
          <span className="setting-label">专业深度</span>
          <div className="setting-control">
            <div className="setting-opt" onClick={e => { (e.currentTarget.parentNode!.querySelectorAll('.setting-opt') as NodeListOf<Element>).forEach(el => el.classList.remove('selected')); e.currentTarget.classList.add('selected'); }}>住院医</div>
            <div className="setting-opt selected">主治</div>
            <div className="setting-opt" onClick={e => { (e.currentTarget.parentNode!.querySelectorAll('.setting-opt') as NodeListOf<Element>).forEach(el => el.classList.remove('selected')); e.currentTarget.classList.add('selected'); }}>主任</div>
          </div>
        </div>
        <div className="setting-row">
          <span className="setting-label">多语言</span>
          <div className="setting-control">
            <div className="setting-opt selected">中文</div>
            <div className="setting-opt" onClick={e => { (e.currentTarget.parentNode!.querySelectorAll('.setting-opt') as NodeListOf<Element>).forEach(el => el.classList.remove('selected')); e.currentTarget.classList.add('selected'); }}>中英双语</div>
          </div>
        </div>
        <div className="setting-row">
          <span className="setting-label">免责声明</span>
          <div className="setting-control">
            <div className="setting-opt selected">始终显示</div>
            <div className="setting-opt" onClick={e => { (e.currentTarget.parentNode!.querySelectorAll('.setting-opt') as NodeListOf<Element>).forEach(el => el.classList.remove('selected')); e.currentTarget.classList.add('selected'); }}>仅关键决策</div>
            <div className="setting-opt" onClick={e => { (e.currentTarget.parentNode!.querySelectorAll('.setting-opt') as NodeListOf<Element>).forEach(el => el.classList.remove('selected')); e.currentTarget.classList.add('selected'); }}>不显示</div>
          </div>
        </div>
      </div>
      <div className="modal-actions">
        <button className="modal-btn" onClick={onClose}>取消</button>
        <button className="modal-btn primary" onClick={() => { onClose(); alert('设置已保存'); }}>保存设置</button>
      </div>
    </Modal>
  );
}

// ==================== Upload ====================
export function UploadModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="患者资料上传">
      <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>上传患者资料，AI自动识别并归类至对应患者对话</p>
      <div className="setting-group">
        <div className="setting-group-title">上传方式</div>
        <div className="setting-row">
          <span className="setting-label">拍照上传</span>
          <span style={{ fontSize: 11, color: '#64748b' }}>检验单、影像资料、化验单</span>
        </div>
        <div className="setting-row">
          <span className="setting-label">图片上传</span>
          <span style={{ fontSize: 11, color: '#64748b' }}>已有图片文件</span>
        </div>
        <div className="setting-row">
          <span className="setting-label">语音输入</span>
          <span style={{ fontSize: 11, color: '#64748b' }}>查房录音、口述记录</span>
        </div>
        <div className="setting-row">
          <span className="setting-label">文字输入</span>
          <span style={{ fontSize: 11, color: '#64748b' }}>手动录入体征、症状</span>
        </div>
        <div className="setting-row">
          <span className="setting-label">文件导入</span>
          <span style={{ fontSize: 11, color: '#64748b' }}>PDF、Word、Excel等</span>
        </div>
      </div>
      <div className="modal-actions">
        <button className="modal-btn" onClick={onClose}>关闭</button>
      </div>
    </Modal>
  );
}

// ==================== Account ====================
export function AccountModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('profile');
  const { logout } = useAuthStore();
  const [fontSize, setFontSize] = useState('中');
  const [bubbleStyle, setBubbleStyle] = useState('微信风格');
  const [notifyNewMsg, setNotifyNewMsg] = useState(true);
  const [notifyCritical, setNotifyCritical] = useState(true);
  const [notifySound, setNotifySound] = useState(false);
  const [dndStart, setDndStart] = useState('22:00');
  const [dndEnd, setDndEnd] = useState('07:00');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="账号管理">
      <div className="account-tabs">
        <div
          className={`account-tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          个人信息
        </div>
        <div
          className={`account-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          个人设置
        </div>
        <div
          className={`account-tab ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          安全设置
        </div>
      </div>

      {activeTab === 'profile' && (
        <div className="account-panel active">
          <div className="profile-header">
            <div className="profile-avatar">孙</div>
            <div className="profile-info">
              <h4>孙医生</h4>
              <p>住院医师 | 神经内科</p>
            </div>
          </div>
          <div className="setting-row-inline">
            <span className="setting-label-inline">工号</span>
            <span className="setting-value-inline">DOC-2024001</span>
          </div>
          <div className="setting-row-inline">
            <span className="setting-label-inline">手机号</span>
            <span className="setting-value-inline">138****8888</span>
          </div>
          <div className="setting-row-inline">
            <span className="setting-label-inline">邮箱</span>
            <span className="setting-value-inline">doctor@hospital.com</span>
          </div>
          <div className="setting-row-inline">
            <span className="setting-label-inline">科室</span>
            <span className="setting-value-inline">神经内科</span>
          </div>
          <div className="setting-row-inline">
            <span className="setting-label-inline">职称</span>
            <span className="setting-value-inline">住院医师</span>
          </div>
          <div className="setting-row-inline">
            <span className="setting-label-inline">最后登录</span>
            <span className="setting-value-inline">{new Date().toLocaleString('zh-CN')}</span>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="account-panel active">
          <div className="setting-group">
            <div className="setting-group-title">界面设置</div>
            <div className="setting-row">
              <span className="setting-label">字体大小</span>
              <div className="setting-control">
                {['小', '中', '大'].map(v => (
                  <div key={v} className={`setting-opt ${fontSize === v ? 'selected' : ''}`} onClick={() => setFontSize(v)}>{v}</div>
                ))}
              </div>
            </div>
            <div className="setting-row">
              <span className="setting-label">消息气泡</span>
              <div className="setting-control">
                {['微信风格', '简洁风格'].map(v => (
                  <div key={v} className={`setting-opt ${bubbleStyle === v ? 'selected' : ''}`} onClick={() => setBubbleStyle(v)}>{v}</div>
                ))}
              </div>
            </div>
          </div>
          <div className="setting-group">
            <div className="setting-group-title">通知设置</div>
            <div className="setting-row">
              <span className="setting-label">新消息提醒</span>
              <div className={`toggle-switch ${notifyNewMsg ? 'active' : ''}`} onClick={() => setNotifyNewMsg(!notifyNewMsg)}><div className="knob"></div></div>
            </div>
            <div className="setting-row">
              <span className="setting-label">危急值推送</span>
              <div className={`toggle-switch ${notifyCritical ? 'active' : ''}`} onClick={() => setNotifyCritical(!notifyCritical)}><div className="knob"></div></div>
            </div>
            <div className="setting-row">
              <span className="setting-label">声音提醒</span>
              <div className={`toggle-switch ${notifySound ? 'active' : ''}`} onClick={() => setNotifySound(!notifySound)}><div className="knob"></div></div>
            </div>
            <div className="setting-row">
              <span className="setting-label">夜间免打扰</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input className="setting-input" value={dndStart} onChange={e => setDndStart(e.target.value)} style={{ width: 70 }} />
                <span>-</span>
                <input className="setting-input" value={dndEnd} onChange={e => setDndEnd(e.target.value)} style={{ width: 70 }} />
              </div>
            </div>
          </div>
          <div className="modal-actions">
            <button className="modal-btn" onClick={onClose}>取消</button>
            <button className="modal-btn primary" onClick={() => {
              localStorage.setItem('uiSettings', JSON.stringify({ fontSize, bubbleStyle, notifyNewMsg, notifyCritical, notifySound, dndStart, dndEnd }));
              onClose();
              alert('个人设置已保存');
            }}>保存设置</button>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="account-panel active">
          <div className="setting-group">
            <div className="setting-group-title">修改密码</div>
            <div className="login-field">
              <label>当前密码</label>
              <input type="password" placeholder="请输入当前密码" />
            </div>
            <div className="login-field">
              <label>新密码</label>
              <input type="password" placeholder="请输入新密码" />
            </div>
            <div className="login-field">
              <label>确认新密码</label>
              <input type="password" placeholder="请再次输入新密码" />
            </div>
            <button className="modal-btn primary" style={{ width: '100%', marginTop: 8 }} onClick={() => { alert('密码修改成功'); onClose(); }}>
              修改密码
            </button>
          </div>
          <div className="setting-group">
            <div className="setting-group-title">登录设备</div>
            <div className="setting-row-inline">
              <span className="setting-label-inline">🖥️ 孙原的MacBook Air</span>
              <span className="setting-value-inline" style={{ color: '#22c55e' }}>当前设备</span>
            </div>
            <div className="setting-row-inline">
              <span className="setting-label-inline">📱 iPhone 15 Pro</span>
              <span className="setting-value-inline" style={{ color: '#94a3b8' }}>2026-05-28</span>
            </div>
          </div>
          <div className="setting-group">
            <div className="setting-group-title">操作日志</div>
            <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.8 }}>
              • {new Date().toLocaleString('zh-CN')} 登录成功 (MacBook Air)<br />
              • 2026-05-29 08:30 登录成功 (iPhone 15 Pro)<br />
              • 2026-05-28 22:15 登录成功 (MacBook Air)<br />
              • 2026-05-28 09:00 修改密码
            </div>
          </div>
          <button className="logout-btn" onClick={() => { logout(); onClose(); }}>退出登录</button>
        </div>
      )}
    </Modal>
  );
}
