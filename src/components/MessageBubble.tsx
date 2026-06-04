import type { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const { msg_type, content, timestamp, role } = message;

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
      case 'doctor': return '医生';
      case 'ai': return 'AI助手';
      case 'lab': return '检验科';
      case 'nurse': return '护士';
      case 'family': return '家属';
      case 'imaging': return '影像科';
      case 'consult': return '会诊';
      default: return role;
    }
  };

  const isRightAligned = msg_type === 'doctor' || msg_type === 'ai' || msg_type === 'consult';
  const alignClass = isRightAligned ? 'msg-right' : 'msg-left';

  const formatTime = (ts: string) => {
    const date = new Date(ts);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className={`message ${alignClass} type-${msg_type}`}>
      <div className="msg-avatar" style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
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
          textAlign: isRightAligned ? 'right' : 'left'
        }}>
          {getLabel()}
        </div>
        
        <div dangerouslySetInnerHTML={{ __html: content }} />
        
        <span className="msg-time">{formatTime(timestamp)}</span>
        
        {(msg_type === 'ai' || msg_type === 'consult') && (
          <div className="bubble-actions">
            <button className="bubble-btn">查看详情</button>
            <button className="bubble-btn">复制</button>
          </div>
        )}
      </div>
    </div>
  );
}
