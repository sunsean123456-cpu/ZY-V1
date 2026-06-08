import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAuthStore } from './stores/authStore';
import { usePatientStore } from './stores/patientStore';
import { useChatStore } from './stores/chatStore';
import { loadAllPatientDetails } from './api/patientApi';
import { patientsData as mockPatientsData } from './data/patientData';
import LoginOverlay from './components/LoginOverlay';
import TitleBar from './components/TitleBar';
import LeftPanel from './components/LeftPanel';
import ChatPanel from './components/ChatPanel';
import type { Patient, ApiResponse, PatientDetail, RichPatientData } from './types';
import './styles/chat.css';
import './styles/modals.css';
import './styles/dark.css';

// Per-component error boundary
class ComponentGuard extends React.Component<
  { name: string; children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { name: string; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message + '\n' + (error.stack || '').slice(0, 300) };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ZY] ComponentGuard "${this.props.name}" caught:`, error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16, background: '#7f1d1d', color: '#fff', fontSize: 11, fontFamily: 'monospace', flex: 1, overflow: 'auto' }}>
          <h3 style={{ color: '#fbbf24', marginBottom: 8 }}>❌ {this.props.name} 崩溃</h3>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 10 }}>{this.state.error}</pre>
          <button onClick={() => this.setState({ hasError: false, error: '' })} style={{ marginTop: 8, padding: '4px 12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>重试</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const { isLoggedIn } = useAuthStore();
  const { setPatients, setCurrentPatient, setRichPatients, setCurrentRichPatient } = usePatientStore();
  const { setMessages } = useChatStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });

  useEffect(() => {
    if (isDarkMode) document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
    localStorage.setItem('darkMode', String(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  useEffect(() => {
    if (isLoggedIn) loadPatients();
  }, [isLoggedIn]);

  const loadPatients = async () => {
    try {
      // Try loading from database first (v9.0)
      const details = await loadAllPatientDetails();
      
      if (details.length > 0) {
        console.log(`[ZY] Loaded ${details.length} patients from database`);
        const richPatients = details.map(detailToRichPatient);
        setRichPatients(richPatients);
        const patients: Patient[] = details.map(d => ({
          id: d.patient.id, name: d.patient.name, bed_number: d.patient.bed_number,
          gender: d.patient.gender, age: d.patient.age, diagnosis: d.patient.diagnosis,
          admission_date: d.patient.admission_date, admission_no: d.patient.admission_no,
          status: d.patient.status, group_type: d.patient.group_type,
        }));
        setPatients(patients);
        selectPatientDetail(details[0]);
        return;
      }
    } catch (e) {
      console.warn('[ZY] Database not available, falling back to mock data:', e);
    }
    
    // Fallback to mock data
    console.log('[ZY] Using mock data (fallback)');
    setRichPatients(mockPatientsData);
    const mapped: Patient[] = mockPatientsData.map(p => ({
      id: p.id, name: p.name, bed_number: p.bed, gender: p.sex, age: p.age,
      diagnosis: p.dx, admission_date: '2026-05-27', admission_no: p.admission,
      status: p.status, group_type: p.group,
    }));
    setPatients(mapped);
    const first = mockPatientsData[0];
    if (first) {
      setCurrentRichPatient(first);
      setCurrentPatient({
        id: first.id, name: first.name, bed_number: first.bed,
        gender: first.sex, age: first.age, diagnosis: first.dx,
        admission_date: '2026-05-27', admission_no: first.admission,
        status: first.status, group_type: first.group,
      });
      const msgs = first.initialMsgs.map((m, i) => ({
        id: `init_${first.id}_${i}`, conversation_id: `conv_${first.id}`,
        role: m.type === 'doctor' ? 'user' as const : 'assistant' as const,
        content: m.text, msg_type: m.type as any,
        timestamp: m.time, has_actions: m.actions, is_risk: m.isRisk,
      }));
      setMessages(msgs);
      let delay = 2000;
      first.pushSequence.forEach((m, i) => {
        setTimeout(() => {
          useChatStore.getState().addMessage({
            id: `push_${first.id}_${i}_${Date.now()}`, conversation_id: `conv_${first.id}`,
            role: m.type === 'doctor' ? 'user' as const : 'assistant' as const,
            content: m.text, msg_type: m.type as any,
            timestamp: m.time, has_actions: m.actions, is_risk: m.isRisk,
          });
        }, delay);
        delay += 2500;
      });
    }
  };
  
  // Convert PatientDetail from backend to RichPatientData for frontend
  const detailToRichPatient = (detail: PatientDetail): RichPatientData => {
    const p = detail.patient;
    return {
      id: p.id,
      name: p.name,
      sex: p.gender,
      age: p.age,
      bed: p.bed_number,
      admission: p.admission_no,
      dx: p.diagnosis,
      status: p.status,
      group: p.group_type,
      surgeryType: p.surgery_type || '',
      initialMsgs: detail.initial_msgs.map(m => ({
        type: m.msg_type as 'doctor' | 'ai' | 'lab' | 'nurse' | 'family' | 'imaging' | 'consult',
        text: m.content,
        time: m.timestamp,
        actions: m.has_actions,
        isRisk: m.is_risk,
      })),
      pushSequence: detail.push_msgs.map(m => ({
        type: m.msg_type as 'doctor' | 'ai' | 'lab' | 'nurse' | 'family' | 'imaging' | 'consult',
        text: m.content,
        time: m.timestamp,
        actions: m.has_actions,
        isRisk: m.is_risk,
      })),
      record: detail.record?.content || '',
      orders: detail.orders.map(o => ({
        name: o.order_type,
        detail: o.content,
      })),
      consult: detail.consults,
      trends: detail.trends ? {
        wbc: JSON.parse(detail.trends.wbc_data || '[]'),
        crp: JSON.parse(detail.trends.crp_data || '[]'),
        neut: JSON.parse(detail.trends.neut_data || '[]'),
      } : { wbc: [], crp: [], neut: [] },
      drg: detail.drg ? {
        group: detail.drg.drg_group,
        weight: detail.drg.weight,
        estimatedCost: detail.drg.estimated_cost,
        usedCost: detail.drg.used_cost,
        risk: detail.drg.risk,
        suggestions: JSON.parse(detail.drg.suggestions || '[]'),
      } : undefined,
    };
  };
  
  const selectPatientDetail = (detail: PatientDetail) => {
    const richPatient = detailToRichPatient(detail);
    setCurrentRichPatient(richPatient);
    setCurrentPatient({
      id: detail.patient.id,
      name: detail.patient.name,
      bed_number: detail.patient.bed_number,
      gender: detail.patient.gender,
      age: detail.patient.age,
      diagnosis: detail.patient.diagnosis,
      admission_date: detail.patient.admission_date,
      admission_no: detail.patient.admission_no,
      status: detail.patient.status,
      group_type: detail.patient.group_type,
    });
    
    const initialMsgs = detail.initial_msgs.map(m => ({
      id: m.id,
      conversation_id: m.conversation_id,
      role: m.role,
      content: m.content,
      msg_type: m.msg_type as 'doctor' | 'ai' | 'lab' | 'nurse' | 'family' | 'imaging' | 'consult',
      timestamp: m.timestamp,
      has_actions: m.has_actions,
      is_risk: m.is_risk,
    }));
    setMessages(initialMsgs);
    
    // Schedule push messages
    let delay = 2000;
    detail.push_msgs.forEach((m, i) => {
      setTimeout(() => {
        useChatStore.getState().addMessage({
          id: m.id || `push_${detail.patient.id}_${i}_${Date.now()}`,
          conversation_id: m.conversation_id,
          role: m.role,
          content: m.content,
          msg_type: m.msg_type as 'doctor' | 'ai' | 'lab' | 'nurse' | 'family' | 'imaging' | 'consult',
          timestamp: m.timestamp,
          has_actions: m.has_actions,
          is_risk: m.is_risk,
        });
      }, delay);
      delay += 2500;
    });
  };

  const switchPatient = (richPatient: RichPatientData) => {
    setCurrentRichPatient(richPatient);
    setCurrentPatient({
      id: richPatient.id, name: richPatient.name, bed_number: richPatient.bed,
      gender: richPatient.sex, age: richPatient.age, diagnosis: richPatient.dx,
      admission_date: '2026-05-27', admission_no: richPatient.admission,
      status: richPatient.status, group_type: richPatient.group,
    });
    const initialMsgs = richPatient.initialMsgs.map((m, i) => ({
      id: `init_${richPatient.id}_${i}`,
      conversation_id: `conv_${richPatient.id}`,
      role: m.type === 'doctor' ? 'user' as const : 'assistant' as const,
      content: m.text,
      msg_type: m.type as 'doctor' | 'ai' | 'lab' | 'nurse' | 'family' | 'imaging' | 'consult',
      timestamp: m.time, has_actions: m.actions, is_risk: m.isRisk,
    }));
    setMessages(initialMsgs);
    let delay = 2000;
    richPatient.pushSequence.forEach((m, i) => {
      setTimeout(() => {
        useChatStore.getState().addMessage({
          id: `push_${richPatient.id}_${i}_${Date.now()}`,
          conversation_id: `conv_${richPatient.id}`,
          role: m.type === 'doctor' ? 'user' as const : 'assistant' as const,
          content: m.text,
          msg_type: m.type as 'doctor' | 'ai' | 'lab' | 'nurse' | 'family' | 'imaging' | 'consult',
          timestamp: m.time, has_actions: m.actions, is_risk: m.isRisk,
        });
      }, delay);
      delay += 2500;
    });
  };

  if (!isLoggedIn) {
    return <LoginOverlay />;
  }

  return (
    <div className={`app-window ${isCollapsed ? 'collapsed' : ''}`}>
      <ComponentGuard name="TitleBar">
        <TitleBar
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          showAccount={showAccount}
          setShowAccount={setShowAccount}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
        />
      </ComponentGuard>
      <div className="app-body">
        <ComponentGuard name="LeftPanel">
          <LeftPanel
            isCollapsed={isCollapsed}
            switchPatient={switchPatient}
            showSettings={showSettings}
            setShowSettings={setShowSettings}
            showUpload={showUpload}
            setShowUpload={setShowUpload}
          />
        </ComponentGuard>
        <ComponentGuard name="ChatPanel">
          <ChatPanel />
        </ComponentGuard>
      </div>
    </div>
  );
}

export default App;
