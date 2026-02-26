import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// ── Global fetch interceptor: auto-attach JWT token ──
const _origFetch = window.fetch;
window.fetch = function (url, options = {}) {
  const token = localStorage.getItem('token');
  if (token && typeof url === 'string' && url.includes('/api/')) {
    options.headers = {
      ...(options.headers || {}),
      'Authorization': `Bearer ${token}`,
    };
    options.credentials = 'include';
  }
  return _origFetch(url, options).then(res => {
    if (res.status === 401 && typeof url === 'string' && url.includes('/api/') && !url.includes('/auth/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
    }
    return res;
  });
};

import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
