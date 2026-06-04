import { useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { usePatientStore } from '../stores/patientStore';
import { useChatStore } from '../stores/chatStore';
import type { RichPatientData } from '../types';

interface LeftPanelProps {
  isCollapsed: boolean;
  switchPatient: (p: RichPatientData) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  showUpload: boolean;
  setShowUpload: (show: boolean) => void;
}

export default function LeftPanel({
  isCollapsed,
  switchPatient,
  setShowSettings,
  setShowUpload,
}: LeftPanelProps) {
  const { richPatients, currentRichPatient, setRichPatients } = usePatientStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [consultMode, setConsultMode] = useState(false);
  const [webSearch, setWebSearch] = useState(true);
  const [decisionStyle, setDecisionStyle] = useState('标准型');
  const [groupStates, setGroupStates] = useState({ preOp: true, postOp: true, historical: false });
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: '', sex: '男', age: '', bed: '', dx: '', admission: '', group: 'pre-op', surgeryType: '' });

  const handleAddPatient = () => {
    if (!newPatient.name.trim() || !newPatient.bed.trim()) {
      alert('请填写患者姓名和床号');
      return;
    }
    const id = `new_${Date.now()}`;
    const added: RichPatientData = {
      id,
      name: newPatient.name,
      sex: newPatient.sex,
      age: parseInt(newPatient.age) || 0,
      bed: newPatient.bed,
      admission: newPatient.admission || `ADM${Date.now()}`,
      dx: newPatient.dx || '待诊断',
      status: 'stable',
      group: newPatient.group,
      surgeryType: newPatient.surgeryType || '',
      initialMsgs: [{ type: 'ai', text: `欢迎！我是AI助手，已准备好为 ${newPatient.name} 提供诊疗支持。`, time: new Date().toTimeString().slice(0, 5), actions: true }],
      pushSequence: [],
      record: `<div class="section-title">基本信息</div>姓名：${newPatient.name} | 性别：${newPatient.sex} | 年龄：${newPatient.age}岁<br>床号：${newPatient.bed} | 住院号：${newPatient.admission}<br><div class="section-title">诊断</div>${newPatient.dx || '待诊断'}`,
      orders: [],
      consult: [],
      trends: { wbc: [0,0,0,0,0,0,0], crp: [0,0,0,0,0,0,0], neut: [60,60,60,60,60,60,60] },
      drg: { group: '待分组', weight: 0, estimatedCost: 0, usedCost: 0, risk: '未知', suggestions: [] },
    };
    setRichPatients([...richPatients, added]);
    setNewPatient({ name: '', sex: '男', age: '', bed: '', dx: '', admission: '', group: 'pre-op', surgeryType: '' });
    setShowAddPatient(false);
  };

  const patients = richPatients.length > 0 ? richPatients : [];

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const preOpPatients = filteredPatients.filter(p => p.group === 'pre-op');
  const postOpPatients = filteredPatients.filter(p => p.group === 'post-op');
  const historicalPatients = filteredPatients.filter(p => p.group === 'historical');

  const toggleGroup = (key: 'preOp' | 'postOp' | 'historical') => {
    setGroupStates(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getGroupLabel = (type: string) => {
    switch (type) {
      case 'pre-op': return '术前';
      case 'post-op': return '术后';
      case 'historical': return '历史';
      default: return type;
    }
  };

  const handleSelectPatient = (p: RichPatientData) => {
    switchPatient(p);
    setDropdownOpen(false);
  };

  const PatientGroup = ({ title, groupPatients, type, groupKey }: {
    title: string;
    groupPatients: RichPatientData[];
    type: string;
    groupKey: 'preOp' | 'postOp' | 'historical';
  }) => {
    if (groupPatients.length === 0) return null;
    const expanded = groupStates[groupKey];

    return (
      <div className="patient-group">
        <div className="group-header" onClick={() => toggleGroup(groupKey)}>
          <span className={`group-arrow ${expanded ? 'expanded' : ''}`}>▶</span>
          <span className="group-title">{title}</span>
          <span className="group-badge">{groupPatients.length}</span>
        </div>
        {!expanded ? null : groupPatients.length > 20 ? (
          <Virtuoso
            data={groupPatients}
            itemContent={(_index, patient) => (
              <div
                key={patient.id}
                className={`patient-item ${currentRichPatient?.id === patient.id ? 'active' : ''}`}
                onClick={() => handleSelectPatient(patient)}
              >
                <div className={`status-dot ${patient.status}`}></div>
                <div className="pi-info">
                  <div className="pi-name">
                    {patient.name}
                    <span className={`patient-tag ${type}`}>{getGroupLabel(type)}</span>
                  </div>
                  <div className="pi-bed">{patient.bed} · {patient.surgeryType || patient.sex + patient.age + '岁'}</div>
                </div>
                {patient.status === 'has-msg' && (
                  <div className="badge-dot">!</div>
                )}
              </div>
            )}
            style={{ height: Math.min(groupPatients.length * 56, 300) }}
            overscan={5}
          />
        ) : (
          <div className="group-list">
            {groupPatients.map(patient => (
              <div
                key={patient.id}
                className={`patient-item ${currentRichPatient?.id === patient.id ? 'active' : ''}`}
                onClick={() => handleSelectPatient(patient)}
              >
                <div className={`status-dot ${patient.status}`}></div>
                <div className="pi-info">
                  <div className="pi-name">
                    {patient.name}
                    <span className={`patient-tag ${type}`}>{getGroupLabel(type)}</span>
                  </div>
                  <div className="pi-bed">{patient.bed} · {patient.surgeryType || patient.sex + patient.age + '岁'}</div>
                </div>
                {patient.status === 'has-msg' && (
                  <div className="badge-dot">!</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`left-panel ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="assistant-entry">
        <button className="assistant-btn" onClick={() => {
          usePatientStore.getState().setCurrentPatient(null);
          usePatientStore.getState().setCurrentRichPatient(null);
          useChatStore.getState().setMessages([]);
        }}>
          <span className="ab-icon">◆</span>
          智能助手
        </button>
      </div>

      <div className="patient-selector">
        <div className="select-trigger" onClick={() => setDropdownOpen(!dropdownOpen)}>
          {currentRichPatient ? `${currentRichPatient.name} | ${currentRichPatient.bed}` : '选择患者...'}
        </div>
        <span className="select-arrow">▾</span>

        <div className={`dropdown-list ${dropdownOpen ? 'open' : ''}`}>
          <div className="dropdown-search">
            <input
              type="text"
              placeholder="搜索患者姓名..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            {filteredPatients.map(patient => (
              <div
                key={patient.id}
                className="dropdown-item"
                onClick={() => handleSelectPatient(patient)}
              >
                <div>
                  <span className="dd-name">{patient.name}</span>
                  <span className="dd-dx">{patient.dx.split('|')[0].trim()}</span>
                </div>
                <span className="dd-bed">{patient.bed}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="patient-list">
        <PatientGroup title="术前患者" groupPatients={preOpPatients} type="pre-op" groupKey="preOp" />
        <PatientGroup title="术后患者" groupPatients={postOpPatients} type="post-op" groupKey="postOp" />
        <PatientGroup title="历史患者" groupPatients={historicalPatients} type="historical" groupKey="historical" />
      </div>

      <button className="add-patient-btn" onClick={() => setShowAddPatient(true)}>
        <span style={{ fontSize: 16, marginRight: 6 }}>➕</span> 新添患者
      </button>

      <div className="patient-count">
        当前: {patients.length}位在院患者
      </div>

      <div className="panel-footer">
        <div className="footer-label">设置</div>

        <div className="toggle-row">
          <span className="toggle-label">决策风格</span>
          <select
            className="style-select"
            value={decisionStyle}
            onChange={e => setDecisionStyle(e.target.value)}
          >
            <option value="审慎型">审慎型</option>
            <option value="标准型">标准型</option>
            <option value="积极型">积极型</option>
          </select>
        </div>

        <div className="toggle-row">
          <span className="toggle-label">会诊模式</span>
          <div
            className={`toggle-switch ${consultMode ? 'active' : ''}`}
            onClick={() => setConsultMode(!consultMode)}
          >
            <div className="knob"></div>
          </div>
        </div>

        <div className="toggle-row">
          <span className="toggle-label">联网搜索</span>
          <div
            className={`toggle-switch ${webSearch ? 'active' : ''}`}
            onClick={() => setWebSearch(!webSearch)}
          >
            <div className="knob"></div>
          </div>
        </div>

        <div className="footer-actions">
          <div className="footer-btn" onClick={() => setShowSettings(true)}>🎛️ 助手偏好设置</div>
          <div className="footer-btn" onClick={() => setShowUpload(true)}>📂 导入患者资料</div>
        </div>
      </div>

      {showAddPatient && (
        <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && setShowAddPatient(false)}>
          <div className="modal-box" style={{ width: 420 }}>
            <button className="modal-close" onClick={() => setShowAddPatient(false)}>✕</button>
            <h3>➕ 新添患者</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="login-field">
                <label>姓名 *</label>
                <input value={newPatient.name} onChange={e => setNewPatient(p => ({...p, name: e.target.value}))} placeholder="请输入患者姓名" />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="login-field" style={{ flex: 1 }}>
                  <label>性别</label>
                  <select value={newPatient.sex} onChange={e => setNewPatient(p => ({...p, sex: e.target.value}))} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13 }}>
                    <option value="男">男</option>
                    <option value="女">女</option>
                  </select>
                </div>
                <div className="login-field" style={{ flex: 1 }}>
                  <label>年龄</label>
                  <input type="number" value={newPatient.age} onChange={e => setNewPatient(p => ({...p, age: e.target.value}))} placeholder="岁" />
                </div>
              </div>
              <div className="login-field">
                <label>床号 *</label>
                <input value={newPatient.bed} onChange={e => setNewPatient(p => ({...p, bed: e.target.value}))} placeholder="如：32床" />
              </div>
              <div className="login-field">
                <label>住院号</label>
                <input value={newPatient.admission} onChange={e => setNewPatient(p => ({...p, admission: e.target.value}))} placeholder="留空自动生成" />
              </div>
              <div className="login-field">
                <label>诊断</label>
                <input value={newPatient.dx} onChange={e => setNewPatient(p => ({...p, dx: e.target.value}))} placeholder="初步诊断" />
              </div>
              <div className="login-field">
                <label>分组</label>
                <select value={newPatient.group} onChange={e => setNewPatient(p => ({...p, group: e.target.value}))} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13 }}>
                  <option value="pre-op">术前</option>
                  <option value="post-op">术后</option>
                  <option value="historical">历史</option>
                </select>
              </div>
              <div className="login-field">
                <label>手术类型</label>
                <input value={newPatient.surgeryType} onChange={e => setNewPatient(p => ({...p, surgeryType: e.target.value}))} placeholder="如：腹腔镜胆囊切除术" />
              </div>
            </div>
            <div className="modal-actions">
              <button className="modal-btn" onClick={() => setShowAddPatient(false)}>取消</button>
              <button className="modal-btn primary" onClick={handleAddPatient}>确认添加</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
