// src/components/Sidebar.js
import React from 'react';
import './Sidebar.css';

function Sidebar({
  activeTab,
  setActiveTab,
  onNavigate,
  onClose,
}) {
  const navItems = [
    {
      key: 'builder',
      icon: '☀️',
      label: 'Invoice Builder',
      shortLabel: 'Builder',
      description: 'Create solar quotes and invoices',
    },
    {
      key: 'saved',
      icon: '📁',
      label: 'Saved Invoices',
      shortLabel: 'Saved',
      description: 'Track documents and payment links',
    },
    {
      key: 'settings',
      icon: '⚙️',
      label: 'Settings',
      shortLabel: 'Settings',
      description: 'Company, VAT and bank details',
    },
  ];

  const handleNavigation = (key) => {
    if (onNavigate) {
      onNavigate(key);
      return;
    }

    if (setActiveTab) {
      setActiveTab(key);
    }

    if (onClose) {
      onClose();
    }
  };

  return (
    <nav className="sidebar" aria-label="Main dashboard navigation">
      <div className="sidebar-inner">
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark" aria-hidden="true">
            ☀️
          </div>

          <div className="sidebar-brand-text">
            <span className="sidebar-eyebrow">Solar Workspace</span>
            <h5>Dashboard</h5>
          </div>

          {onClose && (
            <button
              type="button"
              className="sidebar-close-btn d-lg-none"
              onClick={onClose}
              aria-label="Close navigation menu"
            >
              ×
            </button>
          )}
        </div>

        <div className="sidebar-divider" />

        <ul className="sidebar-nav">
          {navItems.map(({ key, icon, label, shortLabel, description }) => {
            const isActive = activeTab === key;

            return (
              <li key={key} className="sidebar-nav-item">
                <button
                  type="button"
                  className={`sidebar-btn ${isActive ? 'active' : ''}`}
                  onClick={() => handleNavigation(key)}
                  aria-current={isActive ? 'page' : undefined}
                  aria-pressed={isActive}
                >
                  <span className="sidebar-btn-icon" aria-hidden="true">
                    {icon}
                  </span>

                  <span className="sidebar-btn-copy">
                    <span className="sidebar-btn-label">{label}</span>
                    <span className="sidebar-btn-short">{shortLabel}</span>
                    <small>{description}</small>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="sidebar-support-card">
          <span className="sidebar-support-icon" aria-hidden="true">
            🏦
          </span>

          <div>
            <strong>Bank-ready docs</strong>
            <p>
              Build solar quotes with equipment, compliance, payment and client details.
            </p>
          </div>
        </div>

        <div className="sidebar-footer-note">
          <small>Alt + 1 Builder</small>
          <small>Alt + 2 Saved</small>
          <small>Alt + 3 Settings</small>
        </div>
      </div>
    </nav>
  );
}

export default Sidebar;