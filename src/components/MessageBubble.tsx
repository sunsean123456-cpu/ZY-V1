import React, { useState, useEffect, useRef } from 'react';
import type { Message } from '../types';
import { useChatStore } from '../stores/chatStore';

interface MessageBubbleProps {
  message: Message;
  onAction?: (action: string) => void;
  isNew?: boolean;
  searchHighlight?: string;
}

function MessageBubble({ message, onAction, isNew, searchHighlight }: MessageBubbleProps) {
  const { msg_type, content, timestamp, has_actions } = message;
  const { isEditing, setEditing, editMessage, deleteMessage } = useChatStore();
  const [displayedText, setDisplayedText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [editText, setEditText] = useState('');
  const [isRecalled, setIsRecalled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLTextAreaElement>(null);
  const editing = isEditing === message.id;

  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus();
      editRef.current.style.height = 'auto';
      editRef.current.style.height = editRef.current.scrollHeight + 'px';
    }
  }, [editing]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // 只有新的 AI 消息才显示打字机效果
    if (isNew && msg_type === 'ai' && content) {
      let i = 0;
      const timer = setInterval(() => {
        if (i < content.length) {
          setDisplayedText(content.substring(0, i + 1));
          i++;
        } else {
          clearInterval(timer);
        }
      }, 20); // 20ms 每个字符
      return () => clearInterval(timer);
    } else {
      setDisplayedText(content);
    }
  }, [content, isNew, msg_type]);

  const renderContent = isNew && msg_type === 'ai' ? displayedText : content;

  const canRecall = () => {
    // 2分钟内可以撤回
    if (!timestamp) return false;
    const now = new Date();
    const [h, m] = timestamp.split(':').map(Number);
    const msgTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
    return (now.getTime() - msgTime.getTime()) < 2 * 60 * 1000;
  };

  const handleRecall = () => {
    if (canRecall()) {
      setIsRecalled(true);
      deleteMessage(message.id);
    }
    setShowMenu(false);
  };

  const handleCopy = () => {
    const text = content.replace(/<[^>]*>/g, '');
    navigator.clipboard.writeText(text);
    setShowMenu(false);
  };

  const handleEdit = () => {
    setEditText(content.replace(/<[^>]*>/g, ''));
    setEditing(message.id);
    setShowMenu(false);
  };

  const handleSaveEdit = () => {
    if (editText.trim()) {
      editMessage(message.id, editText.trim());
    }
    setEditing(null);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === 'Escape') {
      setEditing(null);
    }
  };

  const highlightContent = (html: string) => {
    if (!searchHighlight) return html;
    const regex = new RegExp(`(${searchHighlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return html.replace(regex, '<mark style="background:#fef08a;padding:0 2px;border-radius:2px">$1</mark>');
  };

  const getAvatarIcon = () => {
    switch (msg_type) {
      case 'doctor': return '👨‍⚕️';
      case 'ai': return '🤖';
      case 'lab': return '🔬';
      case 'nurse': return '👩‍⚕️';
      case 'family': return '👨‍👩‍👧';
      case 'imaging': return '📷';
      case 'consult': return '🩺';
      default: return '💬';
    }
  };

  const getLabel = () => {
    switch (msg_type) {
      case 'doctor': return '我';
      case 'ai': return 'AI助手';
      case 'lab': return '检验科';
      case 'nurse': return '护士体征';
      case 'family': return '患者家属';
      case 'imaging': return '影像科';
      case 'consult': return '多学科联合会诊';
      default: return '系统';
    }
  };

  const isRightAligned = msg_type === 'doctor' || msg_type === 'ai' || msg_type === 'consult';
  const alignClass = isRightAligned ? 'msg-right' : 'msg-left';
  const isRisk = message.is_risk;

  if (isRecalled) {
    return (
      <div className={`message ${alignClass} type-${msg_type}`}>
        <div className="msg-avatar" style={{ background: '#64748b' }}>
          <span style={{ fontSize: 16 }}>💬</span>
        </div>
        <div className="bubble" style={{ background: '#f1f5f9', border: '1px dashed #cbd5e1', color: '#94a3b8', fontStyle: 'italic' }}>
          消息已撤回
        </div>
      </div>
    );
  }

  return (
    <div className={`message ${alignClass} type-${msg_type} ${isRisk ? 'risk-alert' : ''}`}>
      <div className="msg-avatar" style={{
        background: msg_type === 'ai'
          ? 'linear-gradient(135deg, #2563eb, #3b82f6)'
          : msg_type === 'doctor'
          ? '#07c160'
          : msg_type === 'lab'
          ? '#d97706'
          : msg_type === 'nurse'
          ? '#dc2626'
          : msg_type === 'family'
          ? '#4b5563'
          : msg_type === 'imaging'
          ? '#1d4ed8'
          : msg_type === 'consult'
          ? 'linear-gradient(135deg, #6d28d9, #7c3aed)'
          : '#64748b'
      }}>
        <span style={{ fontSize: 16 }}>{getAvatarIcon()}</span>
      </div>

      <div className="bubble" style={{ position: 'relative' }}>
        <div className="bubble-label" style={{
          fontSize: 10,
          fontWeight: 600,
          marginBottom: 4,
          textAlign: isRightAligned ? 'right' : 'left',
          color: msg_type === 'doctor' ? '#07c160'
            : msg_type === 'ai' ? '#2563eb'
            : msg_type === 'lab' ? '#d97706'
            : msg_type === 'nurse' ? '#dc2626'
            : msg_type === 'family' ? '#4b5563'
            : msg_type === 'imaging' ? '#1d4ed8'
            : msg_type === 'consult' ? '#6d28d9'
            : '#64748b'
        }}>
          {getLabel()}
        </div>

        {/* 医生消息的 "..." 菜单按钮 */}
        {msg_type === 'doctor' && (
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 20,
              height: 20,
              borderRadius: 4,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: '#64748b',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: showMenu ? 1 : 0.4,
              transition: 'opacity 0.15s',
            }}
            title="更多操作"
          >
            ⋯
          </button>
        )}

        {/* 弹出菜单 */}
        {showMenu && msg_type === 'doctor' && (
          <div
            ref={menuRef}
            style={{
              position: 'absolute',
              top: 24,
              right: 4,
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 100,
              minWidth: 120,
              padding: 4,
            }}
          >
            <div
              onClick={handleEdit}
              style={{ padding: '6px 10px', cursor: 'pointer', borderRadius: 4, fontSize: 12, color: '#374151' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              ✏️ 编辑
            </div>
            <div
              onClick={handleRecall}
              style={{
                padding: '6px 10px',
                cursor: canRecall() ? 'pointer' : 'not-allowed',
                borderRadius: 4,
                fontSize: 12,
                color: canRecall() ? '#dc2626' : '#cbd5e1',
              }}
              onMouseEnter={e => canRecall() && (e.currentTarget.style.background = '#fef2f2')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              ↩️ 撤回{!canRecall() ? '（超时）' : ''}
            </div>
            <div
              onClick={handleCopy}
              style={{ padding: '6px 10px', cursor: 'pointer', borderRadius: 4, fontSize: 12, color: '#374151' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              📋 复制
            </div>
          </div>
        )}

        {/* 编辑模式 */}
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <textarea
              ref={editRef}
              value={editText}
              onChange={e => {
                setEditText(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              onKeyDown={handleEditKeyDown}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid #3b82f6',
                borderRadius: 6,
                fontSize: 12,
                lineHeight: 1.6,
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
                background: '#fff',
                color: '#1e293b',
              }}
              rows={2}
            />
            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditing(null)}
                style={{ padding: '2px 8px', fontSize: 10, borderRadius: 4, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                style={{ padding: '2px 8px', fontSize: 10, borderRadius: 4, border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer' }}
              >
                保存 (Enter)
              </button>
            </div>
          </div>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: highlightContent(renderContent) }} />
        )}

        <span className="msg-time">{timestamp}</span>

        {msg_type === 'ai' && has_actions && (
          <div className="bubble-actions">
            <button className="bubble-btn" onClick={() => onAction?.('confirm')}>确认执行</button>
            <button className="bubble-btn" onClick={() => onAction?.('modify')}>修改方案</button>
            <button className="bubble-btn" onClick={() => onAction?.('question')}>追问</button>
            <button className="bubble-btn primary" onClick={() => onAction?.('orders')}>开单建议</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(MessageBubble, (prev, next) => {
  return prev.message.id === next.message.id
    && prev.message.content === next.message.content
    && prev.isNew === next.isNew;
});
