import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAuthStore } from './stores/authStore';
import { usePatientStore } from './stores/patientStore';
import LoginOverlay from './components/LoginOverlay';
import TitleBar from './components/TitleBar';
import LeftPanel from './components/LeftPanel';
import ChatPanel from './components/ChatPanel';
import type { Patient, ApiResponse } from './types';
import './styles/chat.css';
import './styles/modals.css';

function App() {
  const { isLoggedIn } = useAuthStore();
  const { setPatients, setCurrentPatient } = usePatientStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      loadPatients();
    }
  }, [isLoggedIn]);

  const loadPatients = async () => {
    try {
      const response = await invoke<ApiResponse<Patient[]>>('get_all_patients');
      if (response.success && response.data) {
        setPatients(response.data);
        if (response.data.length > 0 && !usePatientStore.getState().currentPatient) {
          setCurrentPatient(response.data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load patients:', error);
    }
  };

  if (!isLoggedIn) {
    return <LoginOverlay />;
  }

  return (
    <div className={`app-window ${isCollapsed ? 'collapsed' : ''}`}>
      <TitleBar isCollapsed={isCollapsed} onToggleCollapse={() => setIsCollapsed(!isCollapsed)} />
      <div className="app-body">
        <LeftPanel isCollapsed={isCollapsed} />
        <ChatPanel />
      </div>
    </div>
  );
}

export default App;
