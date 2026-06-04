import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { usePatientStore } from '../stores/patientStore';
import { useChatStore } from '../stores/chatStore';
import MessageBubble from './MessageBubble';
import DiagnosisPanel from './DiagnosisPanel';
import { useShortcuts } from '../hooks/useShortcuts';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useNetworkStatus, saveOfflineMessage, getPendingCount, syncWhenOnline, requestBackgroundSync } from '../utils/offlineSync';
import {
  MedicalRecordModal, MedicalOrderModal, ConsultModal,
  TrendModal, HandoverModal, DRGModal, SettingsModal, UploadModal,
} from './Modals';
import type { Message, ApiResponse } from '../types';

const newMessageIds = new Set<string>();

export default function ChatPanel() {
  const { currentPatient, currentRichPatient } = usePatientStore();
  const { messages, addMessage, setMessages, isStreaming, addStreamingMessage } = useChatStore();
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
  const [showDiagnosis, setShowDiagnosis] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputValue, setTextInputValue] = useState('');
  const [wardRoundMode, setWardRoundMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const isOnline = useNetworkStatus();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const messageRefs = useRef<Map<number, HTMLElement>>(new Map());

  const onSpeechResult = useCallback((text: string) => {
    if (!currentPatient) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const content = wardRoundMode
      ? `【🎤 查房记录】${currentPatient.name} ${timeStr}\n${text}`
      : `🎤 语音输入：${text}`;
    setInputText(content);
  }, [currentPatient, wardRoundMode]);

  const { isRecording, toggleRecording: toggleSpeech } = useSpeechRecognition(onSpeechResult);

  const buildHistory = (): [string, string][] => {
    const recent = messages.slice(-20);
    const history: [string, string][] = [];
    for (const msg of recent) {
      if (msg.msg_type === 'doctor') history.push(['user', msg.content]);
      else if (msg.msg_type === 'ai') history.push(['assistant', msg.content]);
    }
    return history;
  };

  const buildPatientContext = (): string => {
    if (!currentPatient || !currentRichPatient) return '';
    return `患者：${currentPatient.name}，${currentPatient.gender}，${currentPatient.age}岁\n床号：${currentPatient.bed_number}\n住院号：${currentPatient.admission_no}\n诊断：${currentPatient.diagnosis}\n入院日期：${currentPatient.admission_date}\n手术类型：${currentRichPatient.surgeryType}\nDRG分组：${currentRichPatient.drg?.group || '未知'}`;
  };

  const filteredMessages = useMemo(() => {
    let msgs = messages;
    if (selectedDate) msgs = msgs.filter(m => m.timestamp && m.timestamp.startsWith(selectedDate));
    if (searchQuery) {
      const indices: number[] = [];
      msgs.forEach((m, i) => { if (m.content.toLowerCase().includes(searchQuery.toLowerCase())) indices.push(i); });
      setSearchResults(indices);
      setCurrentSearchIndex(0);
    } else { setSearchResults([]); setCurrentSearchIndex(0); }
    return msgs;
  }, [messages, selectedDate, searchQuery]);

  const scrollToSearchResult = useCallback((index: number) => {
    if (searchResults.length === 0) return;
    const safeIndex = Math.max(0, Math.min(index, searchResults.length - 1));
    setCurrentSearchIndex(safeIndex);
    const msgIdx = searchResults[safeIndex];
    const el = messageRefs.current.get(msgIdx);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.style.transition = 'background 0.3s'; el.style.background = 'rgba(59,130,246,0.1)'; setTimeout(() => { el.style.background = ''; }, 1500); }
  }, [searchResults]);

  const nextSearchResult = useCallback(() => { if (searchResults.length === 0) return; scrollToSearchResult((currentSearchIndex + 1) % searchResults.length); }, [currentSearchIndex, searchResults, scrollToSearchResult]);
  const prevSearchResult = useCallback(() => { if (searchResults.length === 0) return; scrollToSearchResult((currentSearchIndex - 1 + searchResults.length) % searchResults.length); }, [currentSearchIndex, searchResults, scrollToSearchResult]);

  const handleNewChat = useCallback(() => {
    if (!currentRichPatient || !currentPatient) return;
    const initialMsgs = currentRichPatient.initialMsgs.map((m, i) => ({ id: `init_${currentRichPatient.id}_${i}`, conversation_id: `conv_${currentPatient.id}`, role: m.type === 'doctor' ? 'user' : 'assistant', content: m.text, msg_type: m.type as Message['msg_type'], timestamp: m.time, has_actions: m.actions, is_risk: m.isRisk }));
    setMessages(initialMsgs);
  }, [currentRichPatient, currentPatient, setMessages]);

  const handleFocusSearch = useCallback(() => { searchInputRef.current?.focus(); }, []);
  const handleQuickActionByIndex = useCallback((index: number) => {
    const actions = [() => setShowRecord(true), () => setShowOrder(true), () => handleQuickAction('综合研判'), handleTriggerConsult, () => setShowTrend(true), () => setShowHandover(true), () => setShowDRG(true)];
    if (actions[index]) actions[index]();
  }, [currentRichPatient, currentPatient]);

  const shortcutHandlers = useMemo(() => ({ onNewChat: handleNewChat, onSearch: handleFocusSearch, onQuickAction: handleQuickActionByIndex, onToggleDarkMode: () => {} }), [handleNewChat, handleFocusSearch, handleQuickActionByIndex]);
  useShortcuts(shortcutHandlers);

  useEffect(() => {
    // Check pending offline messages
    getPendingCount().then(setPendingCount);
    
    // Sync when back online
    if (isOnline) {
      syncWhenOnline().then(synced => {
        if (synced > 0) {
          setPendingCount(0);
          requestBackgroundSync();
        }
      });
    }
  }, [isOnline]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (virtuosoRef.current && messages.length > 0) {
      setTimeout(() => {
        virtuosoRef.current?.scrollToIndex({ index: 'LAST', behavior: 'smooth', align: 'end' });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!inputText.trim() || !currentPatient || isLoading || isStreaming) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      conversation_id: `conv_${currentPatient.id}`,
      role: 'user',
      content: inputText,
      msg_type: 'doctor',
      timestamp: timeStr,
    };
    
    addMessage(userMessage);
    
    // Save offline if not connected
    if (!isOnline) {
      await saveOfflineMessage(userMessage);
      setPendingCount(prev => prev + 1);
      setInputText('');
      return;
    }
    
    const currentInput = inputText;
    setInputText('');
    setIsLoading(true);
    const isTauri = !!(window as any).__TAURI__;
    try {
      const t2 = `${String(new Date().getHours()).padStart(2,'0')}:${String(new Date().getMinutes()).padStart(2,'0')}`;
      const aiMessageId = `msg_${Date.now()}_ai`;
      let aiContent = '';
      if (isTauri) {
        const response = await invoke<ApiResponse<string>>('ai_chat', { message: currentInput, patientContext: buildPatientContext(), history: buildHistory() });
        if (response.success && response.data) {
          aiContent = response.data;
        } else {
          aiContent = '<div class="ai-conclusion">已收到您的问题。</div><div class="ai-section"><div class="ai-section-title">建议</div><div class="ai-section-content">① 继续观察患者病情变化<br>② 必要时完善相关检查</div></div>';
        }
      } else {
        // Browser mode: simulate AI response
        await new Promise(r => setTimeout(r, 800));
        aiContent = `<div class="ai-conclusion">收到关于 ${currentPatient?.name || '患者'} 的咨询。</div><div class="ai-section"><div class="ai-section-title">分析</div><div class="ai-section-content">• ${currentInput}<br>• 当前病情需要持续关注</div></div><div class="ai-section"><div class="ai-section-title">建议</div><div class="ai-section-content">① 完善相关辅助检查<br>② 密切监测生命体征变化<br>③ 根据结果调整治疗方案</div></div><div style="font-size:10px;color:#94a3b8;margin-top:8px">⚠️ 演示模式，AI回复为模拟内容</div>`;
      }
      newMessageIds.add(aiMessageId);
      addStreamingMessage(aiContent, { id: aiMessageId, conversation_id: `conv_${currentPatient!.id}`, role: 'assistant', content: aiContent, msg_type: 'ai', timestamp: t2, has_actions: true });
    } catch (error) {
      console.error('AI chat error:', error);
      const t2 = `${String(new Date().getHours()).padStart(2,'0')}:${String(new Date().getMinutes()).padStart(2,'0')}`;
      addMessage({ id: `msg_${Date.now()}_err`, conversation_id: `conv_${currentPatient!.id}`, role: 'assistant', content: '<div class="ai-risk">⚠️ AI响应失败，请重试</div>', msg_type: 'ai', timestamp: t2 });
    } finally { setIsLoading(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const handleTextareaResize = () => { if (textareaRef.current) { textareaRef.current.style.height = 'auto'; textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 100) + 'px'; } };
  const handleAction = (action: string) => {
    if (action === 'confirm') alert('已确认执行');
    else if (action === 'modify') { setInputText('修改建议：'); textareaRef.current?.focus(); }
    else if (action === 'question') { setInputText('追问：'); textareaRef.current?.focus(); }
    else if (action === 'orders') setShowOrder(true);
  };

  const handleQuickAction = (type: string) => {
    if (!currentRichPatient) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    addMessage({ id: `msg_${Date.now()}`, conversation_id: `conv_${currentPatient?.id}`, role: 'user', content: `请${type}`, msg_type: 'doctor', timestamp: timeStr });
    setTimeout(() => {
      const t2 = `${String(new Date().getHours()).padStart(2,'0')}:${String(new Date().getMinutes()).padStart(2,'0')}`;
      addMessage({ id: `msg_${Date.now()}_ai`, conversation_id: `conv_${currentPatient?.id}`, role: 'assistant', content: `<div class="ai-conclusion">${currentRichPatient.name}${type}完成。</div><div class="ai-section"><div class="ai-section-title">关键发现</div><div class="ai-section-content">• 当前病情稳定，建议继续当前治疗方案<br>• 关注感染指标变化趋势</div></div><div class="ai-section"><div class="ai-section-title">建议</div><div class="ai-section-content">① 继续当前治疗方案<br>② 48小时后复查相关指标</div></div>`, msg_type: 'ai', timestamp: t2, has_actions: true });
    }, 1000);
  };

  const handleTriggerConsult = () => {
    if (!currentRichPatient || !currentPatient) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    let consultText = '<strong>多学科联合会诊意见</strong><br><br>';
    currentRichPatient.consult.forEach(c => { consultText += `<strong>${c.dept}：</strong>${c.content}<br><br>`; });
    addMessage({ id: `msg_${Date.now()}`, conversation_id: `conv_${currentPatient.id}`, role: 'assistant', content: consultText, msg_type: 'consult', timestamp: timeStr, has_actions: true });
    setShowConsult(true);
  };

  const handleRefresh = () => {
    if (!currentRichPatient || !currentPatient) return;
    const initialMsgs = currentRichPatient.initialMsgs.map((m, i) => ({
      id: `init_${currentRichPatient.id}_${i}`, conversation_id: `conv_${currentPatient.id}`,
      role: m.type === 'doctor' ? 'user' : 'assistant', content: m.text,
      msg_type: m.type as Message['msg_type'], timestamp: m.time, has_actions: m.actions, is_risk: m.isRisk,
    }));
    setMessages(initialMsgs);
    let delay = 2000;
    currentRichPatient.pushSequence.forEach((m, i) => {
      setTimeout(() => {
        const pushMsg: Message = {
          id: `push_${currentRichPatient.id}_${i}_${Date.now()}`, conversation_id: `conv_${currentPatient.id}`,
          role: m.type === 'doctor' ? 'user' : 'assistant', content: m.text,
          msg_type: m.type as Message['msg_type'], timestamp: m.time, has_actions: m.actions, is_risk: m.isRisk,
        };
        useChatStore.getState().addMessage(pushMsg);
        if (m.isRisk) {
          try {
            import('@tauri-apps/plugin-dialog').then(({ ask }) => {
              ask(`⚠️ 危急值预警 - ${currentRichPatient.name}`, `检测到危急值！请立即处理。\n${m.text.replace(/<[^>]*>/g,'').substring(0,120)}`);
            });
          } catch { alert(`⚠️ 危急值预警 - ${currentRichPatient.name}`); }
        }
      }, delay);
      delay += 2500;
    });
  };

  const handleToggleRecording = () => { toggleSpeech(); };

  const handleUpload = (type: string) => {
    setShowUploadMenu(false);
    if (type === 'voice') { toggleSpeech(); return; }
    if (type === 'text') { setShowTextInput(true); return; }
    const input = document.createElement('input');
    if (type === 'photo' || type === 'image') { input.type = 'file'; input.accept = 'image/*'; if (type === 'photo') input.capture = 'environment'; }
    else if (type === 'file') { input.type = 'file'; input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.txt'; }
    else return;
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file || !currentPatient) return;
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          addMessage({ id: `msg_${Date.now()}`, conversation_id: `conv_${currentPatient.id}`, role: 'user', content: `<div class="upload-preview"><img src="${reader.result}" style="max-width:200px;border-radius:8px;"/><div style="margin-top:4px;font-size:11px;color:#64748b;">📎 ${file.name}</div></div>`, msg_type: 'doctor', timestamp: timeStr });
        };
        reader.readAsDataURL(file);
      } else {
        addMessage({ id: `msg_${Date.now()}`, conversation_id: `conv_${currentPatient.id}`, role: 'user', content: `<div class="file-card"><span style="font-size:20px">📄</span><div><div style="font-weight:500">${file.name}</div><div style="font-size:11px;color:#64748b">${(file.size/1024).toFixed(1)} KB</div></div></div>`, msg_type: 'doctor', timestamp: timeStr });
      }
    };
    input.click();
  };

  const handleTextInputSubmit = () => {
    if (!textInputValue.trim() || !currentPatient) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    addMessage({ id: `msg_${Date.now()}`, conversation_id: `conv_${currentPatient.id}`, role: 'user', content: textInputValue, msg_type: 'doctor', timestamp: timeStr });
    setTextInputValue('');
    setShowTextInput(false);
  };

  const handleFilterByDate = (dateStr: string) => { setSelectedDate(dateStr); if (!dateStr) handleRefresh(); };
  const handleClearFilters = () => { setSelectedDate(''); setSearchQuery(''); handleRefresh(); };

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
          <span className="ch-meta">住院号: {currentPatient.admission_no} | {currentPatient.bed_number}</span>
        </div>
        <button className="ch-text-btn" onClick={handleRefresh}>🔄 刷新</button>
      </div>

      <div className="chat-toolbar">
        <input type="date" className="toolbar-date" value={selectedDate} onChange={e => handleFilterByDate(e.target.value)} title="选择日期" />
        <input ref={searchInputRef} type="text" className="toolbar-search" placeholder="🔍 搜索对话内容..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        {searchResults.length > 0 && (
          <span style={{ fontSize: 10, color: '#64748b' }}>
            {currentSearchIndex + 1}/{searchResults.length}
            <button className="toolbar-btn" onClick={prevSearchResult} style={{ marginLeft: 4, padding: '2px 6px' }}>↑</button>
            <button className="toolbar-btn" onClick={nextSearchResult} style={{ padding: '2px 6px' }}>↓</button>
          </span>
        )}
        <button className="toolbar-btn" onClick={handleClearFilters}>清除</button>
      </div>

      {!isOnline && (
        <div style={{
          background: '#fef3c7',
          color: '#92400e',
          padding: '8px 16px',
          fontSize: 12,
          textAlign: 'center',
          borderBottom: '1px solid #fde68a',
        }}>
          📴 离线模式 - 消息将在联网后同步 {pendingCount > 0 && `(${pendingCount}条待同步)`}
        </div>
      )}

      <div className="messages-area">
        {filteredMessages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
            <div>开始与AI助手讨论 {currentPatient.name} 的病情</div>
          </div>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            data={filteredMessages}
            followOutput="smooth"
            initialTopMostItemIndex={filteredMessages.length - 1}
            itemContent={(index, msg) => (
              <div key={msg.id} ref={el => { if (el) messageRefs.current.set(index, el); }}>
                <MessageBubble message={msg} onAction={handleAction} isNew={newMessageIds.has(msg.id)} />
              </div>
            )}
            style={{ height: '100%' }}
            overscan={10}
          />
        )}
        {isLoading && (
          <div className="message msg-left">
            <div className="msg-avatar" style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}><span style={{ fontSize: 16 }}>🤖</span></div>
            <div className="bubble" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <div style={{ display: 'flex', gap: 4 }}><div className="typing-dot"></div><div className="typing-dot"></div><div className="typing-dot"></div></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <div className="input-row" style={{ position: 'relative' }}>
          <button className="icon-btn" onClick={() => setShowUploadMenu(!showUploadMenu)} title="上传资料">📎</button>
          {showUploadMenu && (
            <div className="upload-menu open">
              <div className="upload-item" onClick={() => handleUpload('photo')}><span className="ui-icon">📷</span> 拍照上传</div>
              <div className="upload-item" onClick={() => handleUpload('image')}><span className="ui-icon">🖼️</span> 上传图片</div>
              <div className="upload-item" onClick={() => handleUpload('voice')}><span className="ui-icon">🎤</span> 语音输入</div>
              <div className="upload-item" onClick={() => handleUpload('text')}><span className="ui-icon">⌨️</span> 文字输入</div>
              <div className="upload-item" onClick={() => handleUpload('file')}><span className="ui-icon">📁</span> 文件导入</div>
            </div>
          )}
          <button className={`icon-btn ${isRecording ? 'recording' : ''}`} onClick={handleToggleRecording} title={isRecording ? '录音中...点击停止' : '语音输入'}>🎤</button>
          <textarea ref={textareaRef} value={inputText} onChange={e => { setInputText(e.target.value); handleTextareaResize(); }} onKeyDown={handleKeyDown} placeholder={wardRoundMode ? '查房模式：语音自动格式化...' : '输入消息...'} rows={1} />
          <button className="send-btn" onClick={handleSend} disabled={isLoading || isStreaming}>📤</button>
        </div>
        <div className="quick-bar">
          <button className="quick-btn" onClick={() => setShowRecord(true)}>生成病历</button>
          <button className="quick-btn" onClick={() => setShowOrder(true)}>开单建议</button>
          <button className="quick-btn" onClick={() => handleQuickAction('综合研判')}>综合研判</button>
          <button className="quick-btn" onClick={handleTriggerConsult}>会诊</button>
          <button className="quick-btn" onClick={() => setShowTrend(true)}>查看趋势</button>
          <button className="quick-btn" onClick={() => setShowDiagnosis(true)}>AI诊断</button>
          <button className="quick-btn" onClick={() => setShowHandover(true)}>交班摘要</button>
          <button className="quick-btn" onClick={() => setShowDRG(true)}>DRG分析</button>
          <button className={`quick-btn ${wardRoundMode ? 'ward-active' : ''}`} onClick={() => setWardRoundMode(!wardRoundMode)}>
            {wardRoundMode ? '✓ 查房中' : '🏥 查房模式'}
          </button>
        </div>
      </div>

      {showTextInput && (
        <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && setShowTextInput(false)}>
          <div className="modal-box" style={{ width: 420 }}>
            <button className="modal-close" onClick={() => setShowTextInput(false)}>✕</button>
            <h3>⌨️ 文字输入</h3>
            <textarea style={{ width: '100%', minHeight: 120, padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical' }} value={textInputValue} onChange={e => setTextInputValue(e.target.value)} placeholder="输入患者体征、症状等信息..." />
            <div className="modal-actions">
              <button className="modal-btn" onClick={() => setShowTextInput(false)}>取消</button>
              <button className="modal-btn primary" onClick={handleTextInputSubmit}>发送</button>
            </div>
          </div>
        </div>
      )}

      <MedicalRecordModal isOpen={showRecord} onClose={() => setShowRecord(false)} patient={currentRichPatient} />
      <MedicalOrderModal isOpen={showOrder} onClose={() => setShowOrder(false)} patient={currentRichPatient} />
      <ConsultModal isOpen={showConsult} onClose={() => setShowConsult(false)} patient={currentRichPatient} />
      <TrendModal isOpen={showTrend} onClose={() => setShowTrend(false)} patient={currentRichPatient} />
      <HandoverModal isOpen={showHandover} onClose={() => setShowHandover(false)} patient={currentRichPatient} />
      <DRGModal isOpen={showDRG} onClose={() => setShowDRG(false)} patient={currentRichPatient} />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <UploadModal isOpen={showUploadMenu} onClose={() => setShowUploadMenu(false)} />
      <DiagnosisPanel isOpen={showDiagnosis} onClose={() => setShowDiagnosis(false)} patient={currentRichPatient} />
    </div>
  );
}
