// ✅ src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import * as serviceWorkerRegistration from './serviceWorkerRegistration'; // ✅

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ❌ Disable service worker for now to prevent 404 error on Render
serviceWorkerRegistration.unregister();

// Optional: measure performance
reportWebVitals();
