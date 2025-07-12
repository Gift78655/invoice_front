// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import InvoiceBuilder from './InvoiceBuilder';
import SavedInvoices from './SavedInvoices';
import Settings from './Settings';
import { useSettings } from '../context/SettingsContext';
import '../styles/DashboardEnhancements.css';

function Dashboard() {
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState('builder');
  const [sidebarVisible, setSidebarVisible] = useState(true);

  useEffect(() => {
    const titles = {
      builder: 'Invoice Builder',
      saved: 'Saved Invoices',
      settings: 'Settings'
    };
    document.title = `🧾 ${titles[activeTab] || 'Dashboard'} - Invoice App`;
  }, [activeTab]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key === '1') setActiveTab('builder');
      if (e.altKey && e.key === '2') setActiveTab('saved');
      if (e.altKey && e.key === '3') setActiveTab('settings');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const tabConfig = {
    builder: {
      component: <InvoiceBuilder />, title: '🧾 Invoice Builder'
    },
    saved: {
      component: <SavedInvoices />, title: '📂 Saved Invoices'
    },
    settings: {
      component: <Settings />, title: '⚙️ Settings'
    }
  };

  const renderContent = () => tabConfig[activeTab]?.component || <InvoiceBuilder />;
  const getBreadcrumbTitle = () => tabConfig[activeTab]?.title || '';

  return (
    <div className={`d-flex dashboard-wrapper ${settings.theme === 'dark' ? 'dark-mode' : ''}`}>
      {sidebarVisible && (
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      )}

      <div className="flex-grow-1 main-content">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="fw-bold text-dark fade-in mb-0">
            <span className="badge bg-primary me-2">{getBreadcrumbTitle()}</span>
          </h3>
          <button
            className="btn btn-sm btn-outline-secondary d-lg-none"
            onClick={() => setSidebarVisible((prev) => !prev)}
          >
            ☰ Toggle Sidebar
          </button>
        </div>

        <div className="fade-in">
          {renderContent()}
        </div>

        <footer className="app-footer text-center text-muted mt-5">
          <small>
            Designed & Developed by <strong>Gift Rethabile Mthombeni</strong> © {new Date().getFullYear()} | All Rights Reserved
          </small>
        </footer>
      </div>
    </div>
  );
}

export default Dashboard;
