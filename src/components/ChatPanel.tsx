import { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { usePatientStore } from '../stores/patientStore';
import { useChatStore } from '../stores/chatStore';
import MessageBubble from './MessageBubble';
import type { Message, ApiResponse } from '../types';

export default function ChatPanel() {
  const { currentPatient } = usePatientStore();
  const { messages, addMessage } = useChatStore();
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!inputText.trim() || !currentPatient || isLoading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      conversation_id: `conv_${currentPatient.id}`,
      role: 'user',
      content: inputText,
      msg_type: 'doctor',
      timestamp: new Date().toISOString(),
    };

    addMessage(userMessage);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await invoke<ApiResponse<string>>('ai_chat', {
        message: inputText,
        patientContext: currentPatient.diagnosis,
      });

      if (response.success && response.data) {
        const aiMessage: Message = {
          id: `msg_${Date.now()}_ai`,
          conversation_id: `conv_${currentPatient.id}`,
          role: 'assistant',
          content: response.data,
          msg_type: 'ai',
          timestamp: new Date().toISOString(),
        };
        addMessage(aiMessage);
      }
    } catch (error) {
      console.error('AI chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 100) + 'px';
    }
  };

  if (!currentPatient) {
    return (
      <div className="chat-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <div>请选择一位患者开始对话</div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="ch-left">
          <span className="ch-name">{currentPatient.name}</span>
          <span className="ch-dx">{currentPatient.diagnosis}</span>
          <span className="ch-meta">
            住院号: {currentPatient.admission_no} | {currentPatient.bed_number}
          </span>
        </div>
        <button className="ch-refresh" title="刷新会话">🔄</button>
      </div>

      <div className="chat-toolbar">
        <input type="date" className="toolbar-date" title="选择日期查看当天记录" />
        <input type="text" className="toolbar-search" placeholder="🔍 搜索对话内容、关键词..." />
        <button className="toolbar-btn">清除</button>
      </div>

      <div className="messages-area">
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
            <div>开始与AI助手讨论 {currentPatient.name} 的病情</div>
          </div>
        ) : (
          messages.map(msg => <MessageBubble key={msg.id} message={msg} />)
        )}
        {isLoading && (
          <div className="message msg-left">
            <div className="msg-avatar" style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>🤖</div>
            <div className="bubble" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <div className="input-row" style={{ position: 'relative' }}>
          <button className="icon-btn" title="上传资料">📎</button>
          <button className="icon-btn" title="语音输入/查房模式">🎤</button>
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={e => {
              setInputText(e.target.value);
              handleTextareaResize();
            }}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            rows={1}
          />
          <button className="send-btn" onClick={handleSend} disabled={isLoading}>
            📤
          </button>
        </div>
        <div className="quick-bar">
          <button className="quick-btn">生成病历</button>
          <button className="quick-btn">开单建议</button>
          <button className="quick-btn">综合研判</button>
          <button className="quick-btn">会诊</button>
          <button className="quick-btn">查看趋势</button>
          <button className="quick-btn">交班摘要</button>
          <button className="quick-btn">DRG分析</button>
        </div>
      </div>
    </div>
  );
}
