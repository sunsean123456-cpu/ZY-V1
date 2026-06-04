import { invoke } from '@tauri-apps/api/core';
import { AccountModal } from './Modals';
import { useNetworkStatus } from '../utils/offlineSync';

interface TitleBarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  showAccount: boolean;
  setShowAccount: (show: boolean) => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export default function TitleBar({ isCollapsed, onToggleCollapse, showAccount, setShowAccount }: TitleBarProps) {
  const isOnline = useNetworkStatus();
  const isTauri = () => !!(window as any).__TAURI__;
  const handleMinimize = () => { if (isTauri()) invoke('minimize_window'); };
  const handleMaximize = () => { if (isTauri()) invoke('maximize_window'); };
  const handleClose = () => { if (isTauri()) invoke('close_window'); };

  return (
    <>
      <div className="title-bar" data-tauri-drag-region>
        <div className="title-bar-left">
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(37,99,235,0.3)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" fill="none" stroke="#fff" strokeWidth="1.5"/>
              <path d="M8 14c1.5 2 5.5 2 8 0" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="9" cy="10" r="1.2" fill="#fff"/>
              <circle cx="15" cy="10" r="1.2" fill="#fff"/>
            </svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600 }}>查查鱼 - 住院医AI助手</span>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: isOnline ? '#10b981' : '#ef4444',
              marginLeft: 8,
              display: 'inline-block',
            }}
            title={isOnline ? '在线' : '离线'}
          />
        </div>

        <div className="title-bar-extra">
          <button className="mode-btn" onClick={onToggleCollapse}>
            {isCollapsed ? '展开' : '折叠'}
          </button>
          <button className="mode-btn" onClick={() => setShowAccount(true)} title="账号管理">
            👤
          </button>
        </div>

        <div className="title-bar-actions">
          <button className="title-btn" onClick={handleMinimize}>—</button>
          <button className="title-btn" onClick={handleMaximize}>□</button>
          <button className="title-btn close" onClick={handleClose}>✕</button>
        </div>
      </div>
      <AccountModal isOpen={showAccount} onClose={() => setShowAccount(false)} />
    </>
  );
}
