import { invoke } from '@tauri-apps/api/core';
import { AccountModal } from './Modals';
import { useNetworkStatus } from '../utils/offlineSync';

interface TitleBarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  showAccount: boolean;
  setShowAccount: (show: boolean) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function TitleBar({ isCollapsed, onToggleCollapse, showAccount, setShowAccount, isDarkMode, onToggleDarkMode }: TitleBarProps) {
  const isOnline = useNetworkStatus();
  const handleMinimize = () => invoke('minimize_window');
  const handleMaximize = () => invoke('maximize_window');
  const handleClose = () => invoke('close_window');

  return (
    <>
      <div className="title-bar" data-tauri-drag-region>
        <div className="title-bar-left">
          <span className="icon">🤖</span>
          <span>住院医生AI助手</span>
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
          <button className="mode-btn" onClick={onToggleDarkMode} title="切换深色模式 (Ctrl+D)">
            {isDarkMode ? '☀️' : '🌙'}
          </button>
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
