import { useState } from 'react';
import { usePatientStore } from '../stores/patientStore';

interface LeftPanelProps {
  isCollapsed: boolean;
}

export default function LeftPanel({ isCollapsed }: LeftPanelProps) {
  const { patients, currentPatient, setCurrentPatient } = usePatientStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const preOpPatients = filteredPatients.filter(p => p.group_type === 'pre-op');
  const postOpPatients = filteredPatients.filter(p => p.group_type === 'post-op');
  const historicalPatients = filteredPatients.filter(p => p.group_type === 'historical');

  const getGroupLabel = (type: string) => {
    switch (type) {
      case 'pre-op': return '术前';
      case 'post-op': return '术后';
      case 'historical': return '历史';
      default: return type;
    }
  };

  const PatientGroup = ({ title, patients, type }: { title: string; patients: any[]; type: string }) => {
    const [expanded, setExpanded] = useState(true);

    if (patients.length === 0) return null;

    return (
      <div className="patient-group">
        <div className="group-header" onClick={() => setExpanded(!expanded)}>
          <span className={`group-arrow ${expanded ? 'expanded' : ''}`}>▶</span>
          <span className="group-title">{title}</span>
          <span className="group-badge">{patients.length}</span>
        </div>
        <div className={`group-list ${expanded ? '' : 'hidden'}`}>
          {patients.map(patient => (
            <div
              key={patient.id}
              className={`patient-item ${currentPatient?.id === patient.id ? 'active' : ''}`}
              onClick={() => {
                setCurrentPatient(patient);
                setDropdownOpen(false);
              }}
            >
              <div className={`status-dot ${patient.status}`}></div>
              <div className="pi-info">
                <div className="pi-name">
                  {patient.name}
                  <span className={`patient-tag ${type}`}>{getGroupLabel(type)}</span>
                </div>
                <div className="pi-bed">{patient.bed_number}</div>
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
          {currentPatient ? `${currentPatient.name} | ${currentPatient.bed_number}` : '选择患者...'}
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
                onClick={() => {
                  setCurrentPatient(patient);
                  setDropdownOpen(false);
                }}
              >
                <div>
                  <span className="dd-name">{patient.name}</span>
                  <span className="dd-dx">{patient.diagnosis}</span>
                </div>
                <span className="dd-bed">{patient.bed_number}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="patient-list">
        <PatientGroup title="术前患者" patients={preOpPatients} type="pre-op" />
        <PatientGroup title="术后患者" patients={postOpPatients} type="post-op" />
        <PatientGroup title="历史患者" patients={historicalPatients} type="historical" />
      </div>

      <div className="patient-count">
        当前: {patients.length}位在院患者
      </div>

      <div className="panel-footer">
        <div className="footer-label">设置</div>
        
        <div className="toggle-row">
          <span className="toggle-label">决策风格</span>
          <select className="style-select">
            <option>审慎型</option>
            <option>标准型</option>
            <option>积极型</option>
          </select>
        </div>

        <div className="toggle-row">
          <span className="toggle-label">会诊模式</span>
          <div className="toggle-switch">
            <div className="knob"></div>
          </div>
        </div>

        <div className="toggle-row">
          <span className="toggle-label">联网搜索</span>
          <div className="toggle-switch active">
            <div className="knob"></div>
          </div>
        </div>

        <div className="footer-actions">
          <div className="footer-btn">AI助手设置</div>
          <div className="footer-btn">患者资料上传</div>
        </div>
      </div>
    </div>
  );
}
