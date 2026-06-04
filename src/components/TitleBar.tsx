import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { AccountModal } from './Modals';

interface TitleBarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function TitleBar({ isCollapsed, onToggleCollapse }: TitleBarProps) {
  const [showAccount, setShowAccount] = useState(false);

  const handleMinimize = () => invoke('minimize_window');
  const handleMaximize = () => invoke('maximize_window');
  const handleClose = () => invoke('close_window');

  return (
    <>
      <div className="title-bar" data-tauri-drag-region>
        <div className="title-bar-left">
          <span className="icon">🤖</span>
          <span>住院医生AI助手</span>
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
