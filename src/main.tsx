import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Register service worker for PWA offline support
// Only registers in browser environments (not Tauri webview in production builds)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Skip SW registration in Tauri production (tauri:// protocol)
    if (window.location.protocol === 'tauri:' || window.location.protocol === 'ipc:') {
      return;
    }
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('[PWA] Service Worker registered, scope:', reg.scope))
      .catch(err => console.warn('[PWA] Service Worker registration failed:', err));
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
