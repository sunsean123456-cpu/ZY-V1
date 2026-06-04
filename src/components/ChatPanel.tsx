import { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { usePatientStore } from '../stores/patientStore';
import { useChatStore } from '../stores/chatStore';
import MessageBubble from './MessageBubble';
import {
  MedicalRecordModal,
  MedicalOrderModal,
  ConsultModal,
  TrendModal,
  HandoverModal,
  DRGModal,
  SettingsModal,
  UploadModal,
} from './Modals';
import type { Message, ApiResponse } from '../types';

export default function ChatPanel() {
  const { currentPatient, currentRichPatient } = usePatientStore();
  const { messages, addMessage, setMessages } = useChatStore();
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRecord, setShowRecord] = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const [showConsult, setShowConsult] = useState(false);
  const [showTrend, setShowTrend] = useState(false);
  const [showHandover, setShowHandover] = useState(false);
  const [showDRG, setShowDRG] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

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

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      conversation_id: `conv_${currentPatient.id}`,
      role: 'user',
      content: inputText,
      msg_type: 'doctor',
      timestamp: timeStr,
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
        const t2 = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;
        const aiMessage: Message = {
          id: `msg_${Date.now()}_ai`,
          conversation_id: `conv_${currentPatient.id}`,
          role: 'assistant',
          content: response.data,
          msg_type: 'ai',
          timestamp: t2,
          has_actions: true,
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

  const handleAction = (action: string) => {
    if (action === 'confirm') {
      alert('已确认执行');
    } else if (action === 'modify') {
      setInputText('修改建议：');
      textareaRef.current?.focus();
    } else if (action === 'question') {
      setInputText('追问：');
      textareaRef.current?.focus();
    } else if (action === 'orders') {
      setShowOrder(true);
    }
  };

  const handleQuickAction = (type: string) => {
    if (!currentRichPatient) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      conversation_id: `conv_${currentPatient?.id}`,
      role: 'user',
      content: `请${type}`,
      msg_type: 'doctor',
      timestamp: timeStr,
    };
    addMessage(userMsg);

    setTimeout(() => {
      const t2 = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;
      const aiMsg: Message = {
        id: `msg_${Date.now()}_ai`,
        conversation_id: `conv_${currentPatient?.id}`,
        role: 'assistant',
        content: `<div class="ai-conclusion">${currentRichPatient.name}${type}完成。</div><div class="ai-section"><div class="ai-section-title">关键发现</div><div class="ai-section-content">• 当前病情稳定，建议继续当前治疗方案<br>• 关注感染指标变化趋势<br>• 血压控制需加强</div></div><div class="ai-section"><div class="ai-section-title">建议</div><div class="ai-section-content">① 继续当前治疗方案<br>② 48小时后复查相关指标<br>③ 如有变化及时调整</div></div>`,
        msg_type: 'ai',
        timestamp: t2,
        has_actions: true,
      };
      addMessage(aiMsg);
    }, 1000);
  };

  const handleTriggerConsult = () => {
    if (!currentRichPatient || !currentPatient) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let consultText = '<strong>多学科联合会诊意见</strong><br><br>';
    currentRichPatient.consult.forEach(c => {
      consultText += `<strong>${c.dept}：</strong>${c.content}<br><br>`;
    });

    const consultMsg: Message = {
      id: `msg_${Date.now()}`,
      conversation_id: `conv_${currentPatient.id}`,
      role: 'assistant',
      content: consultText,
      msg_type: 'consult',
      timestamp: timeStr,
      has_actions: true,
    };
    addMessage(consultMsg);
    setShowConsult(true);
  };

  const handleRefresh = () => {
    if (!currentRichPatient || !currentPatient) return;
    const initialMsgs = currentRichPatient.initialMsgs.map((m, i) => ({
      id: `init_${currentRichPatient.id}_${i}`,
      conversation_id: `conv_${currentPatient.id}`,
      role: m.type === 'doctor' ? 'user' : 'assistant',
      content: m.text,
      msg_type: m.type as 'doctor' | 'ai' | 'lab' | 'nurse' | 'family' | 'imaging' | 'consult',
      timestamp: m.time,
      has_actions: m.actions,
      is_risk: m.isRisk,
    }));
    setMessages(initialMsgs);

    let delay = 2000;
    currentRichPatient.pushSequence.forEach((m, i) => {
      setTimeout(() => {
        const pushMsg: Message = {
          id: `push_${currentRichPatient.id}_${i}_${Date.now()}`,
          conversation_id: `conv_${currentPatient.id}`,
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

  const handleToggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      alert('录音已开始（模拟）\n\n查房模式：持续录音，自动转文字\n\n点击麦克风按钮停止');
    } else {
      if (!currentPatient) return;
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const voiceMsg: Message = {
        id: `msg_${Date.now()}`,
        conversation_id: `conv_${currentPatient.id}`,
        role: 'user',
        content: '【语音转文字】患者今日精神状态良好，咳嗽减少，痰量减少。继续观察。',
        msg_type: 'doctor',
        timestamp: timeStr,
      };
      addMessage(voiceMsg);

      setTimeout(() => {
        const t2 = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;
        const aiMsg: Message = {
          id: `msg_${Date.now()}_ai`,
          conversation_id: `conv_${currentPatient.id}`,
          role: 'assistant',
          content: '<div class="ai-conclusion">已记录查房语音。</div><div class="ai-section"><div class="ai-section-title">分析</div><div class="ai-section-content">患者症状改善，建议继续当前治疗方案。48小时后复查相关指标。</div></div>',
          msg_type: 'ai',
          timestamp: t2,
          has_actions: true,
        };
        addMessage(aiMsg);
      }, 800);
    }
  };

  const handleUploadAction = (type: string) => {
    setShowUploadMenu(false);
    const names: Record<string, string> = {
      photo: '拍照上传',
      image: '上传图片',
      voice: '语音输入',
      text: '文字输入',
      file: '文件导入',
    };
    alert(`${names[type]}功能开发中...`);
  };

  const handleFilterByDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    // Filter messages by date (simplified)
    if (!dateStr) {
      handleRefresh();
      return;
    }
    // For now just show all messages
    // In a real app, you'd filter by timestamp
  };

  const handleClearFilters = () => {
    setSelectedDate('');
    setSearchQuery('');
    handleRefresh();
  };

  if (!currentPatient || !currentRichPatient) {
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
        <button className="ch-refresh" onClick={handleRefresh} title="刷新会话">🔄</button>
      </div>

      <div className="chat-toolbar">
        <input
          type="date"
          className="toolbar-date"
          value={selectedDate}
          onChange={e => handleFilterByDate(e.target.value)}
          title="选择日期查看当天记录"
        />
        <input
          type="text"
          className="toolbar-search"
          placeholder="🔍 搜索对话内容、关键词..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <button className="toolbar-btn" onClick={handleClearFilters}>清除</button>
      </div>

      <div className="messages-area">
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
            <div>开始与AI助手讨论 {currentPatient.name} 的病情</div>
          </div>
        ) : (
          messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} onAction={handleAction} />
          ))
        )}
        {isLoading && (
          <div className="message msg-left">
            <div className="msg-avatar" style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
              <span style={{ fontSize: 16 }}>🤖</span>
            </div>
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
          <button className="icon-btn" onClick={() => setShowUploadMenu(!showUploadMenu)} title="上传资料">
            📎
          </button>
          {showUploadMenu && (
            <div className="upload-menu open">
              <div className="upload-item" onClick={() => handleUploadAction('photo')}>
                <span className="ui-icon">📷</span> 拍照上传
              </div>
              <div className="upload-item" onClick={() => handleUploadAction('image')}>
                <span className="ui-icon">🖼️</span> 上传图片
              </div>
              <div className="upload-item" onClick={() => handleUploadAction('voice')}>
                <span className="ui-icon">🎤</span> 语音输入
              </div>
              <div className="upload-item" onClick={() => handleUploadAction('text')}>
                <span className="ui-icon">⌨️</span> 文字输入
              </div>
              <div className="upload-item" onClick={() => handleUploadAction('file')}>
                <span className="ui-icon">📁</span> 文件导入
              </div>
            </div>
          )}
          <button
            className={`icon-btn ${isRecording ? 'recording' : ''}`}
            onClick={handleToggleRecording}
            title={isRecording ? '录音中...点击停止' : '语音输入/查房模式'}
          >
            🎤
          </button>
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
          <button className="quick-btn" onClick={() => setShowRecord(true)}>生成病历</button>
          <button className="quick-btn" onClick={() => setShowOrder(true)}>开单建议</button>
          <button className="quick-btn" onClick={() => handleQuickAction('综合研判')}>综合研判</button>
          <button className="quick-btn" onClick={handleTriggerConsult}>会诊</button>
          <button className="quick-btn" onClick={() => setShowTrend(true)}>查看趋势</button>
          <button className="quick-btn" onClick={() => setShowHandover(true)}>交班摘要</button>
          <button className="quick-btn" onClick={() => setShowDRG(true)}>DRG分析</button>
        </div>
      </div>

      {/* Modals */}
      <MedicalRecordModal
        isOpen={showRecord}
        onClose={() => setShowRecord(false)}
        patient={currentRichPatient}
      />
      <MedicalOrderModal
        isOpen={showOrder}
        onClose={() => setShowOrder(false)}
        patient={currentRichPatient}
      />
      <ConsultModal
        isOpen={showConsult}
        onClose={() => setShowConsult(false)}
        patient={currentRichPatient}
      />
      <TrendModal
        isOpen={showTrend}
        onClose={() => setShowTrend(false)}
        patient={currentRichPatient}
      />
      <HandoverModal
        isOpen={showHandover}
        onClose={() => setShowHandover(false)}
        patient={currentRichPatient}
      />
      <DRGModal
        isOpen={showDRG}
        onClose={() => setShowDRG(false)}
        patient={currentRichPatient}
      />
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
      <UploadModal
        isOpen={showUploadMenu}
        onClose={() => setShowUploadMenu(false)}
      />
    </div>
  );
}