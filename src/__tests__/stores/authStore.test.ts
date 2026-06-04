import { useAuthStore } from '../../stores/authStore';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ isLoggedIn: false, username: '', lastLogin: '' });
  });

  it('should start logged out', () => {
    const state = useAuthStore.getState();
    expect(state.isLoggedIn).toBe(false);
    expect(state.username).toBe('');
    expect(state.lastLogin).toBe('');
  });

  it('should login successfully', () => {
    const { login } = useAuthStore.getState();
    login('admin');
    const state = useAuthStore.getState();
    expect(state.isLoggedIn).toBe(true);
    expect(state.username).toBe('admin');
    expect(state.lastLogin).toBeDefined();
    expect(state.lastLogin).not.toBe('');
  });

  it('should logout', () => {
    useAuthStore.getState().login('admin');
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().isLoggedIn).toBe(false);
    expect(useAuthStore.getState().username).toBe('');
  });

  it('should update last login time', () => {
    useAuthStore.getState().login('admin');
    const firstLoginTime = useAuthStore.getState().lastLogin;
    expect(firstLoginTime).not.toBe('');

    // Update should produce a valid timestamp
    useAuthStore.getState().updateLastLogin();
    const updatedTime = useAuthStore.getState().lastLogin;
    expect(updatedTime).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);
  });

  it('should set username on login', () => {
    useAuthStore.getState().login('testuser');
    expect(useAuthStore.getState().username).toBe('testuser');
  });
});
