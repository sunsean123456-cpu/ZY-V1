import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAuthStore } from './stores/authStore';
import { usePatientStore } from './stores/patientStore';
import { useChatStore } from './stores/chatStore';
import { patientsData } from './data/patientData';
import LoginOverlay from './components/LoginOverlay';
import TitleBar from './components/TitleBar';
import LeftPanel from './components/LeftPanel';
import ChatPanel from './components/ChatPanel';
import type { Patient, ApiResponse } from './types';
import './styles/chat.css';
import './styles/modals.css';
import './styles/dark.css';

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
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('darkMode', String(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  useEffect(() => {
    if (isLoggedIn) {
      loadPatients();
    }
  }, [isLoggedIn]);

  const loadPatients = async () => {
    // Load rich patient data into store
    setRichPatients(patientsData);

    // Also try to load from backend
    try {
      const response = await invoke<ApiResponse<Patient[]>>('get_all_patients');
      if (response.success && response.data && response.data.length > 0) {
        setPatients(response.data);
      } else {
        // Map rich data to Patient format for backend compat
        const mapped: Patient[] = patientsData.map(p => ({
          id: p.id,
          name: p.name,
          bed_number: p.bed,
          gender: p.sex,
          age: p.age,
          diagnosis: p.dx,
          admission_date: '2026-05-27',
          admission_no: p.admission,
          status: p.status,
          group_type: p.group,
        }));
        setPatients(mapped);
      }
    } catch {
      // Backend may not be ready; use rich data directly
      const mapped: Patient[] = patientsData.map(p => ({
        id: p.id,
        name: p.name,
        bed_number: p.bed,
        gender: p.sex,
        age: p.age,
        diagnosis: p.dx,
        admission_date: '2026-05-27',
        admission_no: p.admission,
        status: p.status,
        group_type: p.group,
      }));
      setPatients(mapped);
    }

    // Set first patient as current
    const firstRich = patientsData[0];
    if (firstRich) {
      setCurrentRichPatient(firstRich);
      setCurrentPatient({
        id: firstRich.id,
        name: firstRich.name,
        bed_number: firstRich.bed,
        gender: firstRich.sex,
        age: firstRich.age,
        diagnosis: firstRich.dx,
        admission_date: '2026-05-27',
        admission_no: firstRich.admission,
        status: firstRich.status,
        group_type: firstRich.group,
      });

      // Load initial messages for first patient
      const initialMsgs = firstRich.initialMsgs.map((m, i) => ({
        id: `init_${firstRich.id}_${i}`,
        conversation_id: `conv_${firstRich.id}`,
        role: m.type === 'doctor' ? 'user' : 'assistant',
        content: m.text,
        msg_type: m.type as 'doctor' | 'ai' | 'lab' | 'nurse' | 'family' | 'imaging' | 'consult',
        timestamp: m.time,
        has_actions: m.actions,
        is_risk: m.isRisk,
      }));
      setMessages(initialMsgs);

      // Schedule push sequence
      let delay = 2000;
      firstRich.pushSequence.forEach((m, i) => {
        setTimeout(() => {
          const pushMsg = {
            id: `push_${firstRich.id}_${i}_${Date.now()}`,
            conversation_id: `conv_${firstRich.id}`,
            role: m.type === 'doctor' ? 'user' : 'assistant',
            content: m.text,
            msg_type: m.type as 'doctor' | 'ai' | 'lab' | 'nurse' | 'family' | 'imaging' | 'consult',
            timestamp: m.time,
            has_actions: m.actions,
            is_risk: m.isRisk,
          };
          useChatStore.getState().addMessage(pushMsg);
        }, delay);
        delay += 2500;
      });
    }
  };

  const switchPatient = (richPatient: typeof patientsData[0]) => {
    setCurrentRichPatient(richPatient);
    setCurrentPatient({
      id: richPatient.id,
      name: richPatient.name,
      bed_number: richPatient.bed,
      gender: richPatient.sex,
      age: richPatient.age,
      diagnosis: richPatient.dx,
      admission_date: '2026-05-27',
      admission_no: richPatient.admission,
      status: richPatient.status,
      group_type: richPatient.group,
    });

    // Load initial messages
    const initialMsgs = richPatient.initialMsgs.map((m, i) => ({
      id: `init_${richPatient.id}_${i}`,
      conversation_id: `conv_${richPatient.id}`,
      role: m.type === 'doctor' ? 'user' : 'assistant',
      content: m.text,
      msg_type: m.type as 'doctor' | 'ai' | 'lab' | 'nurse' | 'family' | 'imaging' | 'consult',
      timestamp: m.time,
      has_actions: m.actions,
      is_risk: m.isRisk,
    }));
    setMessages(initialMsgs);

    // Schedule push sequence
    let delay = 2000;
    richPatient.pushSequence.forEach((m, i) => {
      setTimeout(() => {
        const pushMsg = {
          id: `push_${richPatient.id}_${i}_${Date.now()}`,
          conversation_id: `conv_${richPatient.id}`,
          role: m.type === 'doctor' ? 'user' : 'assistant',
          content: m.text,
          msg_type: m.type as 'doctor' | 'ai' | 'lab' | 'nurse' | 'family' | 'imaging' | 'consult',
          timestamp: m.time,
          has_actions: m.actions,
          is_risk: m.isRisk,
        };
        useChatStore.getState().addMessage(pushMsg);
      }, delay);
      delay += 2500;
    });
  };

  if (!isLoggedIn) {
    return <LoginOverlay />;
  }

  return (
    <div className={`app-window ${isCollapsed ? 'collapsed' : ''}`}>
      <TitleBar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        showAccount={showAccount}
        setShowAccount={setShowAccount}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />
      <div className="app-body">
        <LeftPanel
          isCollapsed={isCollapsed}
          switchPatient={switchPatient}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          showUpload={showUpload}
          setShowUpload={setShowUpload}
        />
        <ChatPanel />
      </div>
    </div>
  );
}

export default App;
