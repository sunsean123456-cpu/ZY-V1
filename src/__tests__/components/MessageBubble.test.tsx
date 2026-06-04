import { render, screen, fireEvent } from '@testing-library/react';
import MessageBubble from '../../components/MessageBubble';
import { useChatStore } from '../../stores/chatStore';
import type { Message } from '../../types';

beforeEach(() => {
  useChatStore.setState({ messages: [], isStreaming: false, isEditing: null });
});

const baseMessage: Message = {
  id: 'msg1',
  conversation_id: 'conv1',
  role: 'user',
  content: '测试消息内容',
  msg_type: 'doctor',
  timestamp: '10:00',
};

describe('MessageBubble', () => {
  it('should render doctor message', () => {
    render(<MessageBubble message={baseMessage} />);
    expect(screen.getByText('测试消息内容')).toBeInTheDocument();
  });

  it('should render AI message', () => {
    const aiMsg: Message = {
      ...baseMessage,
      role: 'assistant',
      msg_type: 'ai',
      content: 'AI分析结论',
    };
    render(<MessageBubble message={aiMsg} />);
    expect(screen.getByText('AI分析结论')).toBeInTheDocument();
  });

  it('should render lab message', () => {
    const labMsg: Message = {
      ...baseMessage,
      msg_type: 'lab',
      content: 'WBC 12.3↑',
    };
    render(<MessageBubble message={labMsg} />);
    expect(screen.getByText('WBC 12.3↑')).toBeInTheDocument();
  });

  it('should show correct label for doctor', () => {
    render(<MessageBubble message={baseMessage} />);
    expect(screen.getByText('我')).toBeInTheDocument();
  });

  it('should show correct label for AI', () => {
    const aiMsg: Message = { ...baseMessage, msg_type: 'ai', role: 'assistant' };
    render(<MessageBubble message={aiMsg} />);
    expect(screen.getByText('AI助手')).toBeInTheDocument();
  });

  it('should show correct label for lab', () => {
    const labMsg: Message = { ...baseMessage, msg_type: 'lab', role: 'assistant' };
    render(<MessageBubble message={labMsg} />);
    expect(screen.getByText('检验科')).toBeInTheDocument();
  });

  it('should show correct label for nurse', () => {
    const nurseMsg: Message = { ...baseMessage, msg_type: 'nurse', role: 'assistant' };
    render(<MessageBubble message={nurseMsg} />);
    expect(screen.getByText('护士体征')).toBeInTheDocument();
  });

  it('should show correct label for family', () => {
    const familyMsg: Message = { ...baseMessage, msg_type: 'family', role: 'assistant' };
    render(<MessageBubble message={familyMsg} />);
    expect(screen.getByText('患者家属')).toBeInTheDocument();
  });

  it('should show correct label for imaging', () => {
    const imagingMsg: Message = { ...baseMessage, msg_type: 'imaging', role: 'assistant' };
    render(<MessageBubble message={imagingMsg} />);
    expect(screen.getByText('影像科')).toBeInTheDocument();
  });

  it('should show correct label for consult', () => {
    const consultMsg: Message = { ...baseMessage, msg_type: 'consult', role: 'assistant' };
    render(<MessageBubble message={consultMsg} />);
    expect(screen.getByText('多学科联合会诊')).toBeInTheDocument();
  });

  it('should show timestamp', () => {
    render(<MessageBubble message={baseMessage} />);
    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  it('should show action buttons for AI messages with has_actions', () => {
    const aiMsg: Message = {
      ...baseMessage,
      role: 'assistant',
      msg_type: 'ai',
      has_actions: true,
    };
    render(<MessageBubble message={aiMsg} />);
    expect(screen.getByText('确认执行')).toBeInTheDocument();
    expect(screen.getByText('修改方案')).toBeInTheDocument();
    expect(screen.getByText('追问')).toBeInTheDocument();
    expect(screen.getByText('开单建议')).toBeInTheDocument();
  });

  it('should not show action buttons for doctor messages', () => {
    render(<MessageBubble message={baseMessage} />);
    expect(screen.queryByText('确认执行')).not.toBeInTheDocument();
  });

  it('should call onAction when action button clicked', () => {
    const onAction = jest.fn();
    const aiMsg: Message = {
      ...baseMessage,
      role: 'assistant',
      msg_type: 'ai',
      has_actions: true,
    };
    render(<MessageBubble message={aiMsg} onAction={onAction} />);
    fireEvent.click(screen.getByText('确认执行'));
    expect(onAction).toHaveBeenCalledWith('confirm');
  });

  it('should render HTML content', () => {
    const htmlMsg: Message = {
      ...baseMessage,
      msg_type: 'ai',
      role: 'assistant',
      content: '<strong>重要信息</strong>',
    };
    render(<MessageBubble message={htmlMsg} />);
    expect(screen.getByText('重要信息')).toBeInTheDocument();
  });
});
