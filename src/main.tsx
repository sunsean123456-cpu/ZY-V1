import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Disable service worker in dev (Tauri uses http://localhost, not tauri://)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  navigator.serviceWorker?.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
}

// Error boundary to catch and display runtime errors
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean; error: string}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message + '\n' + error.stack };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding:40,background:'#1a1a2e',color:'#ef4444',fontFamily:'monospace',height:'100vh',overflow:'auto'}}>
          <h2 style={{color:'#f59e0b'}}>Application Error</h2>
          <pre style={{whiteSpace:'pre-wrap',fontSize:12,marginTop:16}}>{this.state.error}</pre>
          <button onClick={() => this.setState({hasError:false,error:''})} style={{marginTop:16,padding:'8px 16px',background:'#3b82f6',color:'#fff',border:'none',borderRadius:6,cursor:'pointer'}}>Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Debug: log to console so we can see in Tauri devtools
console.log('[ZY-2.0] main.tsx loaded, React mounting...');
window.onerror = (msg, source, line, col, err) => {
  document.title = `ERR: ${msg}`;
  console.error('[ZY-2.0 GLOBAL ERROR]', msg, source, line, col, err);
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </ErrorBoundary>
);

console.log('[ZY-2.0] React render call completed');
