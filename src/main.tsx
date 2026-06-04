import {} from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './ErrorBoundary';
import './index.css';

// Global error handler
window.addEventListener('error', (e) => {
  document.title = 'ERR: ' + e.message;
  const el = document.getElementById('root');
  if (el) el.innerHTML = '<div style="padding:40px;color:red;font-family:monospace"><h2>Runtime Error</h2><pre>' + e.message + '\n' + (e.error?.stack || '') + '</pre></div>';
});

window.addEventListener('unhandledrejection', (e) => {
  document.title = 'REJECT: ' + e.reason;
  const el = document.getElementById('root');
  if (el) el.innerHTML = '<div style="padding:40px;color:red;font-family:monospace"><h2>Unhandled Rejection</h2><pre>' + String(e.reason) + '</pre></div>';
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
