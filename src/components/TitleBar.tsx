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
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 13, fontWeight: 700,
          }}>查</div>
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
