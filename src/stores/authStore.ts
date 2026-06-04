import { create } from 'zustand';

interface AuthStore {
  isLoggedIn: boolean;
  username: string;
  lastLogin: string;
  login: (username: string) => void;
  logout: () => void;
  updateLastLogin: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isLoggedIn: false,
  username: '',
  lastLogin: '',
  
  login: (username) => {
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    set({
      isLoggedIn: true,
      username,
      lastLogin: timeStr
    });
  },
  
  logout: () => set({
    isLoggedIn: false,
    username: '',
    lastLogin: ''
  }),
  
  updateLastLogin: () => {
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    set({ lastLogin: timeStr });
  }
}));
