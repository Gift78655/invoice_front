// ✅ src/App.js
import React, { Suspense, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom'; // Changed here ✅
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/app.css';
import './styles/DashboardEnhancements.css';
import InvoicePayment from './components/InvoicePayment';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Lazy load major components for performance
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const NotFound = React.lazy(() => import('./components/NotFound'));

function ThemedApp() {
  const { settings } = useSettings();

  // Auto apply theme class to <body>
  useEffect(() => {
    document.body.className = settings.theme === 'dark' ? 'dark-mode' : '';
  }, [settings.theme]);

  return (
    <>
      <Router>
        <Suspense
          fallback={
            <div className="d-flex justify-content-center align-items-center vh-100">
              <div className="text-center">
                <div className="spinner-border text-primary" role="status" />
                <p className="mt-3">Loading application...</p>
              </div>
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pay/:invoiceNumber" element={<InvoicePayment />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>

      {/* Global toast container */}
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar newestOnTop />
    </>
  );
}

function App() {
  return (
    <SettingsProvider>
      <ThemedApp />
    </SettingsProvider>
  );
}

export default App;
