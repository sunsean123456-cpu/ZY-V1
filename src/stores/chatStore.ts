import { create } from 'zustand';
import type { Message } from '../types';

interface ChatStore {
  messages: Message[];
  isStreaming: boolean;
  isEditing: string | null;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  deleteMessage: (id: string) => void;
  editMessage: (id: string, newContent: string) => void;
  clearMessages: () => void;
  setStreaming: (v: boolean) => void;
  setEditing: (id: string | null) => void;
  updateLastMessageContent: (content: string) => void;
  addStreamingMessage: (fullContent: string, message: Message) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isStreaming: false,
  isEditing: null,
  
  setMessages: (messages) => set({ messages }),
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  
  deleteMessage: (id) => set((state) => ({
    messages: state.messages.filter(m => m.id !== id)
  })),
  
  editMessage: (id, newContent) => set((state) => ({
    messages: state.messages.map(m =>
      m.id === id ? { ...m, content: newContent } : m
    )
  })),
  
  clearMessages: () => set({ messages: [] }),
  
  setEditing: (id) => set({ isEditing: id }),

  setStreaming: (v) => set({ isStreaming: v }),

  updateLastMessageContent: (content) => set((state) => ({
    messages: state.messages.map((msg, idx) =>
      idx === state.messages.length - 1
        ? { ...msg, content }
        : msg
    )
  })),

  addStreamingMessage: (fullContent: string, message: Message) => {
    // Add the message first with empty content
    set((state) => ({
      messages: [...state.messages, { ...message, content: '' }],
      isStreaming: true,
    }));

    // Split content into chunks by sentence boundaries
    const chunks = fullContent.split(/(?<=[。！？\n\.\!\?])/);
    let current = '';
    let i = 0;

    const interval = setInterval(() => {
      if (i < chunks.length) {
        current += chunks[i];
        set((state) => ({
          messages: state.messages.map((msg, idx) =>
            idx === state.messages.length - 1
              ? { ...msg, content: current }
              : msg
          )
        }));
        i++;
      } else {
        clearInterval(interval);
        set({ isStreaming: false });
      }
    }, 80);
  },
}));
