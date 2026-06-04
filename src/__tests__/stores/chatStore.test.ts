import { useChatStore } from '../../stores/chatStore';
import type { Message } from '../../types';

const mockMessage: Message = {
  id: 'msg1',
  conversation_id: 'conv1',
  role: 'user',
  content: '测试消息',
  msg_type: 'doctor',
  timestamp: '10:00',
};

describe('chatStore', () => {
  beforeEach(() => {
    useChatStore.setState({ messages: [], isStreaming: false, isEditing: null });
  });

  it('should start with empty messages', () => {
    expect(useChatStore.getState().messages).toHaveLength(0);
  });

  it('should add message', () => {
    useChatStore.getState().addMessage(mockMessage);
    expect(useChatStore.getState().messages).toHaveLength(1);
    expect(useChatStore.getState().messages[0].content).toBe('测试消息');
  });

  it('should add multiple messages', () => {
    useChatStore.getState().addMessage(mockMessage);
    useChatStore.getState().addMessage({ ...mockMessage, id: 'msg2', content: '第二条消息' });
    expect(useChatStore.getState().messages).toHaveLength(2);
  });

  it('should set messages', () => {
    useChatStore.getState().setMessages([mockMessage, { ...mockMessage, id: 'msg2' }]);
    expect(useChatStore.getState().messages).toHaveLength(2);
  });

  it('should edit message', () => {
    useChatStore.getState().addMessage(mockMessage);
    useChatStore.getState().editMessage('msg1', '编辑后的内容');
    expect(useChatStore.getState().messages[0].content).toBe('编辑后的内容');
  });

  it('should not affect other messages when editing', () => {
    useChatStore.getState().addMessage(mockMessage);
    useChatStore.getState().addMessage({ ...mockMessage, id: 'msg2', content: '第二条' });
    useChatStore.getState().editMessage('msg1', '编辑后');
    expect(useChatStore.getState().messages[1].content).toBe('第二条');
  });

  it('should delete message', () => {
    useChatStore.getState().addMessage(mockMessage);
    useChatStore.getState().addMessage({ ...mockMessage, id: 'msg2' });
    useChatStore.getState().deleteMessage('msg1');
    expect(useChatStore.getState().messages).toHaveLength(1);
    expect(useChatStore.getState().messages[0].id).toBe('msg2');
  });

  it('should clear messages', () => {
    useChatStore.getState().addMessage(mockMessage);
    useChatStore.getState().addMessage({ ...mockMessage, id: 'msg2' });
    useChatStore.getState().clearMessages();
    expect(useChatStore.getState().messages).toHaveLength(0);
  });

  it('should set streaming state', () => {
    useChatStore.getState().setStreaming(true);
    expect(useChatStore.getState().isStreaming).toBe(true);
    useChatStore.getState().setStreaming(false);
    expect(useChatStore.getState().isStreaming).toBe(false);
  });

  it('should set editing state', () => {
    useChatStore.getState().setEditing('msg1');
    expect(useChatStore.getState().isEditing).toBe('msg1');
    useChatStore.getState().setEditing(null);
    expect(useChatStore.getState().isEditing).toBeNull();
  });

  it('should update last message content', () => {
    useChatStore.getState().addMessage(mockMessage);
    useChatStore.getState().addMessage({ ...mockMessage, id: 'msg2', content: '第二条' });
    useChatStore.getState().updateLastMessageContent('更新后的最后一条');
    expect(useChatStore.getState().messages[1].content).toBe('更新后的最后一条');
    expect(useChatStore.getState().messages[0].content).toBe('测试消息');
  });
});
