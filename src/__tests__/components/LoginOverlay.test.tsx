import { render, screen, fireEvent } from '@testing-library/react';
import LoginOverlay from '../../components/LoginOverlay';
import { useAuthStore } from '../../stores/authStore';

// Reset store before each test
beforeEach(() => {
  useAuthStore.setState({ isLoggedIn: false, username: '', lastLogin: '' });
});

describe('LoginOverlay', () => {
  it('should render login form', () => {
    render(<LoginOverlay />);
    expect(screen.getByText('住院医生AI助手')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入工号或用户名')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入密码')).toBeInTheDocument();
    expect(screen.getByText('登 录')).toBeInTheDocument();
  });

  it('should show demo account hint', () => {
    render(<LoginOverlay />);
    expect(screen.getByText('演示账号：admin / 123456')).toBeInTheDocument();
  });

  it('should have default values in inputs', () => {
    render(<LoginOverlay />);
    const usernameInput = screen.getByPlaceholderText('请输入工号或用户名');
    const passwordInput = screen.getByPlaceholderText('请输入密码');
    expect(usernameInput).toHaveValue('admin');
    expect(passwordInput).toHaveValue('123456');
  });

  it('should allow input changes', () => {
    render(<LoginOverlay />);
    const usernameInput = screen.getByPlaceholderText('请输入工号或用户名');
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    expect(usernameInput).toHaveValue('testuser');
  });

  it('should login on button click with valid credentials', () => {
    render(<LoginOverlay />);
    const loginButton = screen.getByText('登 录');
    fireEvent.click(loginButton);
    
    // Store should be updated (component calls login)
    const state = useAuthStore.getState();
    expect(state.isLoggedIn).toBe(true);
    expect(state.username).toBe('admin');
  });

  it('should login on Enter key in password field', () => {
    render(<LoginOverlay />);
    const passwordInput = screen.getByPlaceholderText('请输入密码');
    fireEvent.keyDown(passwordInput, { key: 'Enter' });
    
    const state = useAuthStore.getState();
    expect(state.isLoggedIn).toBe(true);
  });

  it('should show error when username is empty', () => {
    render(<LoginOverlay />);
    const usernameInput = screen.getByPlaceholderText('请输入工号或用户名');
    fireEvent.change(usernameInput, { target: { value: '' } });
    
    const loginButton = screen.getByText('登 录');
    fireEvent.click(loginButton);
    
    expect(screen.getByText('请输入工号和密码')).toBeInTheDocument();
  });

  it('should show error when password is empty', () => {
    render(<LoginOverlay />);
    const passwordInput = screen.getByPlaceholderText('请输入密码');
    fireEvent.change(passwordInput, { target: { value: '' } });
    
    const loginButton = screen.getByText('登 录');
    fireEvent.click(loginButton);
    
    expect(screen.getByText('请输入工号和密码')).toBeInTheDocument();
  });
});
