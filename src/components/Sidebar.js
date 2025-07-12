// src/components/Sidebar.js
import React from 'react';
import './Sidebar.css';

function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { key: 'builder', icon: '📄', label: 'Invoice Builder' },
    { key: 'saved', icon: '📁', label: 'Saved Invoices' },
    { key: 'settings', icon: '⚙️', label: 'Settings' }
  ];

  return (
    <div className="sidebar bg-dark text-white p-4 min-vh-100 shadow-sm">
      <div className="mb-4 ps-1">
        <h5 className="text-white-50 fw-light">📊 Dashboard</h5>
      </div>
      <ul className="nav flex-column gap-2">
        {navItems.map(({ key, icon, label }) => (
          <li key={key} className="nav-item">
            <button
              className={`btn btn-sm w-100 text-start sidebar-btn ${
                activeTab === key ? 'btn-light active' : 'btn-outline-light'
              }`}
              onClick={() => setActiveTab(key)}
              aria-pressed={activeTab === key}
            >
              <span className="me-2">{icon}</span>
              {label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;
