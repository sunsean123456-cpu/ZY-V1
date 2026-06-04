import { create } from 'zustand';

interface AuthStore {
  isLoggedIn: boolean;
  username: string;
  lastLogin: string;
  login: (username: string) => void;
  logout: () => void;
  updateLastLogin: () => void;
}

const savedLogin = localStorage.getItem('authState');
const initialState = savedLogin ? JSON.parse(savedLogin) : { isLoggedIn: false, username: '', lastLogin: '' };

export const useAuthStore = create<AuthStore>((set) => ({
  ...initialState,
  
  login: (username) => {
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const state = { isLoggedIn: true, username, lastLogin: timeStr };
    localStorage.setItem('authState', JSON.stringify(state));
    set(state);
  },
  
  logout: () => {
    localStorage.removeItem('authState');
    set({ isLoggedIn: false, username: '', lastLogin: '' });
  },
  
  updateLastLogin: () => {
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    set({ lastLogin: timeStr });
  }
}));
