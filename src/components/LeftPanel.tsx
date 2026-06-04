import { useState } from 'react';
import { usePatientStore } from '../stores/patientStore';
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
  const { richPatients, currentRichPatient } = usePatientStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [consultMode, setConsultMode] = useState(false);
  const [webSearch, setWebSearch] = useState(true);
  const [decisionStyle, setDecisionStyle] = useState('标准型');
  const [groupStates, setGroupStates] = useState({ preOp: true, postOp: true, historical: false });

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
        <div className={`group-list ${expanded ? '' : 'hidden'}`}>
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
      </div>
    );
  };

  return (
    <div className={`left-panel ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="assistant-entry">
        <button className="assistant-btn">
          <span className="ab-icon">🧠</span>
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
        <PatientGroup title="📋 术前患者" groupPatients={preOpPatients} type="pre-op" groupKey="preOp" />
        <PatientGroup title="🩹 术后患者" groupPatients={postOpPatients} type="post-op" groupKey="postOp" />
        <PatientGroup title="📁 历史患者" groupPatients={historicalPatients} type="historical" groupKey="historical" />
      </div>

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
          <div className="footer-btn" onClick={() => setShowSettings(true)}>AI助手设置</div>
          <div className="footer-btn" onClick={() => setShowUpload(true)}>患者资料上传</div>
        </div>
      </div>
    </div>
  );
}
