// src/components/Dashboard.js
import React, { useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from './Sidebar';
import InvoiceBuilder from './InvoiceBuilder';
import SavedInvoices from './SavedInvoices';
import Settings from './Settings';
import { useSettings } from '../context/SettingsContext';
import '../styles/DashboardEnhancements.css';

const createBlankInvoiceItem = (category = 'Labour') => ({
  id: uuidv4(),
  category,
  brand: '',
  model: '',
  rating: '',
  warranty: '',
  description: '',
  quantity: 1,
  price: 0,
  notes: '',
});

const createBlankInvoiceData = (settings = {}) => {
  const solarDefaults = settings.solarDefaults || {};

  return {
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    clientPhone: '',
    clientType: 'Residential',

    documentType: solarDefaults.defaultDocumentType || 'Solar Quotation',
    projectType: 'Hybrid Solar System',
    siteAddress: '',
    phaseType: 'Single Phase',
    roofType: 'Tiled Roof',
    installationDate: '',
    quoteValidityDays: solarDefaults.defaultQuoteValidityDays || 7,

    systemDetails: {
      inverterSizeKw: '',
      batteryCapacityKwh: '',
      pvSizeKwp: '',
      numberOfPanels: '',
      monitoringIncluded: true,
      backupCircuits: '',
    },

    compliance: {
      cocIncluded: true,
      ssegIncluded: false,
      singleLineDiagramIncluded: true,
      commissioningReportIncluded: true,
    },

    paymentPlan: {
      depositPercentage: solarDefaults.defaultDepositPercentage || 70,
      balancePercentage: solarDefaults.defaultBalancePercentage || 30,
      paymentMilestone: solarDefaults.defaultPaymentMilestone || '',
    },

    solarNotes: '',
    exclusions: solarDefaults.defaultExclusions || '',

    items: [createBlankInvoiceItem('Labour')],

    includeVAT: settings.includeVAT ?? true,
    invoiceNumber: '',
    date: '',
    updatedAt: '',
    status: 'DUE',
    notes: '',
    attachments: [],
    signature: '',
    signatureImageBase64: '',
    terms: settings.terms || '',
    paymentOptions: settings.paymentOptions || '',
    paymentReference: '',
    paymentInstructions: settings.paymentInstructions || '',

    timeline: {
      quoteDate: '',
      invoiceDate: '',
      paymentDate: '',
    },
  };
};

const tabMeta = {
  builder: {
    icon: '☀️',
    title: 'Solar Invoice Builder',
    shortTitle: 'Builder',
    description: 'Create bank-ready solar quotations, invoices and proposal packs.',
  },
  saved: {
    icon: '📂',
    title: 'Saved Invoices',
    shortTitle: 'Saved',
    description: 'Track quotations, invoices, payment links and workflow status.',
  },
  settings: {
    icon: '⚙️',
    title: 'Settings',
    shortTitle: 'Settings',
    description: 'Manage company details, VAT, bank details and document defaults.',
  },
};

function Dashboard() {
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState('builder');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState(() => createBlankInvoiceData(settings));

  const activeMeta = tabMeta[activeTab] || tabMeta.builder;

  const hasDraftData = useMemo(() => {
    return Boolean(
      invoiceData.clientName ||
        invoiceData.clientEmail ||
        invoiceData.clientAddress ||
        invoiceData.clientPhone ||
        invoiceData.invoiceNumber ||
        invoiceData.siteAddress ||
        invoiceData.projectType !== 'Hybrid Solar System' ||
        invoiceData.items?.some(
          (item) =>
            item.description ||
            item.brand ||
            item.model ||
            item.rating ||
            item.warranty ||
            item.notes ||
            Number(item.price) > 0
        )
    );
  }, [invoiceData]);

  useEffect(() => {
    const titles = {
      builder: 'Solar Invoice Builder',
      saved: 'Saved Invoices',
      settings: 'Settings',
    };

    document.title = `🧾 ${titles[activeTab] || 'Dashboard'} - Invoice App`;
  }, [activeTab]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key === '1') handleTabChange('builder');
      if (e.altKey && e.key === '2') handleTabChange('saved');
      if (e.altKey && e.key === '3') handleTabChange('settings');
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [activeTab]);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setMobileMenuOpen(false);
  };

  const handleNewInvoice = () => {
    if (hasDraftData) {
      const confirmed = window.confirm(
        'Start a new solar document? Unsaved changes in the current form will be cleared.'
      );

      if (!confirmed) return;
    }

    setInvoiceData(createBlankInvoiceData(settings));
    handleTabChange('builder');
  };

  const tabConfig = {
    builder: {
      component: (
        <InvoiceBuilder
          invoiceData={invoiceData}
          setInvoiceData={setInvoiceData}
          onNewInvoice={handleNewInvoice}
        />
      ),
    },
    saved: {
      component: (
        <SavedInvoices
          setInvoiceData={setInvoiceData}
          setActiveTab={handleTabChange}
        />
      ),
    },
    settings: {
      component: <Settings />,
    },
  };

  const renderContent = () => tabConfig[activeTab]?.component || tabConfig.builder.component;

  const mobileNavItems = [
    { key: 'builder', icon: '☀️', label: 'Builder' },
    { key: 'saved', icon: '📂', label: 'Saved' },
    { key: 'settings', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <div
      className={`dashboard-shell ${settings.theme === 'dark' ? 'dark-mode' : ''}`}
    >
      <div className="dashboard-mobile-header d-lg-none">
        <button
          type="button"
          className="dashboard-icon-button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Open navigation menu"
        >
          ☰
        </button>

        <div className="dashboard-mobile-title">
          <span>{activeMeta.icon}</span>
          <div>
            <strong>{activeMeta.shortTitle}</strong>
            <small>{invoiceData.invoiceNumber || 'Draft document'}</small>
          </div>
        </div>

        {activeTab === 'builder' ? (
          <button
            type="button"
            className="dashboard-mobile-new-btn"
            onClick={handleNewInvoice}
            aria-label="Create new solar document"
          >
            +
          </button>
        ) : (
          <button
            type="button"
            className="dashboard-mobile-new-btn"
            onClick={() => handleTabChange('builder')}
            aria-label="Go to invoice builder"
          >
            ☀️
          </button>
        )}
      </div>

      {mobileMenuOpen && (
        <button
          type="button"
          className="dashboard-mobile-overlay d-lg-none"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close navigation menu"
        />
      )}

      <div className="d-flex dashboard-wrapper">
        <aside
          className={`dashboard-sidebar-wrap ${
            mobileMenuOpen ? 'is-open' : ''
          }`}
        >
          <Sidebar
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            onNavigate={handleTabChange}
            onClose={() => setMobileMenuOpen(false)}
          />
        </aside>

        <main className="flex-grow-1 main-content">
          <header className="dashboard-page-header">
            <div className="dashboard-page-title-block">
              <span className="dashboard-page-kicker">Solar business workspace</span>

              <h3 className="dashboard-page-title fade-in">
                <span className="dashboard-title-icon">{activeMeta.icon}</span>
                {activeMeta.title}
              </h3>

              <p className="dashboard-page-description">{activeMeta.description}</p>

              {activeTab === 'builder' && hasDraftData && (
                <small className="dashboard-draft-indicator">
                  Editing current draft
                  {invoiceData.invoiceNumber ? ` · ${invoiceData.invoiceNumber}` : ''}
                </small>
              )}
            </div>

            <div className="dashboard-page-actions">
              {activeTab !== 'builder' && (
                <button
                  type="button"
                  className="btn btn-outline-primary dashboard-action-btn"
                  onClick={() => handleTabChange('builder')}
                >
                  ☀️ Open Builder
                </button>
              )}

              {activeTab === 'builder' && (
                <button
                  type="button"
                  className="btn btn-outline-primary dashboard-action-btn"
                  onClick={handleNewInvoice}
                >
                  ➕ New Solar Document
                </button>
              )}

              <button
                type="button"
                className="btn btn-outline-secondary dashboard-action-btn d-lg-none"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
              >
                ☰ Menu
              </button>
            </div>
          </header>

          <section className="dashboard-content fade-in">
            {renderContent()}
          </section>

          <footer className="app-footer dashboard-footer text-center text-muted mt-5">
            <small>
              Designed & Developed by <strong>Gift Rethabile Mthombeni</strong> ©{' '}
              {new Date().getFullYear()} | All Rights Reserved
            </small>
          </footer>
        </main>
      </div>

      <nav className="dashboard-bottom-nav d-lg-none" aria-label="Mobile navigation">
        {mobileNavItems.map((item) => (
          <button
            type="button"
            key={item.key}
            className={`dashboard-bottom-nav-item ${
              activeTab === item.key ? 'active' : ''
            }`}
            onClick={() => handleTabChange(item.key)}
          >
            <span>{item.icon}</span>
            <small>{item.label}</small>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default Dashboard;