import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';

export default function LoginOverlay() {
  const { login } = useAuthStore();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      setError('请输入工号和密码');
      return;
    }
    if (username === 'admin' && password === '123456') {
      setError('');
      login(username);
    } else if (username && password) {
      setError('');
      login(username);
    } else {
      setError('工号或密码错误，请重试');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 40, width: 400,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <span style={{ fontSize: 48 }}>🤖</span>
          <h2 style={{ fontSize: 20, color: '#1e293b', marginTop: 10, fontWeight: 600 }}>查查鱼 - 住院医AI助手</h2>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>请登录您的账号</p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#475569', marginBottom: 6, fontWeight: 500 }}>
            工号 / 用户名
          </label>
          <input
            type="text"
            placeholder="请输入工号或用户名"
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8,
              fontSize: 13, outline: 'none', transition: 'border 0.2s'
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#475569', marginBottom: 6, fontWeight: 500 }}>
            密码
          </label>
          <input
            type="password"
            placeholder="请输入密码"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{
              width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8,
              fontSize: 13, outline: 'none', transition: 'border 0.2s'
            }}
          />
        </div>

        {error && (
          <div style={{ color: '#dc2626', fontSize: 11, marginTop: 8, textAlign: 'center' }}>{error}</div>
        )}

        <button
          onClick={handleLogin}
          style={{
            width: '100%', padding: 12, background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
            border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', marginTop: 8
          }}
        >
          登 录
        </button>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 16 }}>
          演示账号：admin / 123456
        </p>
      </div>
    </div>
  );
}
