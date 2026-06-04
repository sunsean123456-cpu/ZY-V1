import type { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  onAction?: (action: string) => void;
}

export default function MessageBubble({ message, onAction }: MessageBubbleProps) {
  const { msg_type, content, timestamp, has_actions } = message;

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

      <div className="bubble">
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

        <div dangerouslySetInnerHTML={{ __html: content }} />

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
