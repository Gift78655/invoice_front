// src/components/InvoiceBuilder.js
import React, { useMemo, useState } from 'react';
import InvoiceForm from './InvoiceForm';
import InvoicePreview from './InvoicePreview';
import { Tabs, Tab, Button, Alert } from 'react-bootstrap';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';
import { useSettings } from '../context/SettingsContext';

const BACKEND_URL =
  process.env.REACT_APP_API_URL || 'https://invoice-backend-flsi.onrender.com';

const createBlankItem = (category = 'Labour') => ({
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

function InvoiceBuilder({ invoiceData, setInvoiceData, onNewInvoice }) {
  const [key, setKey] = useState('form');
  const [isSaving, setIsSaving] = useState(false);
  const { settings } = useSettings();

  const solarDefaults = settings.solarDefaults || {};

  const generateInvoiceNumber = (documentType = '') => {
    const randomPart = Math.floor(100000 + Math.random() * 900000);
    const lowerDocumentType = documentType.toLowerCase();

    if (lowerDocumentType.includes('quotation')) return `QUO-${randomPart}`;
    if (lowerDocumentType.includes('proforma')) return `PRO-${randomPart}`;
    if (lowerDocumentType.includes('receipt')) return `REC-${randomPart}`;
    if (lowerDocumentType.includes('coc')) return `COC-${randomPart}`;

    return `INV-${randomPart}`;
  };

  const calculateSubtotal = (items = []) => {
    return items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      return sum + quantity * price;
    }, 0);
  };

  const formatCurrency = (value) => {
    const amount = Number(value) || 0;

    return `R${amount.toLocaleString('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const invoiceSubtotal = calculateSubtotal(invoiceData.items || []);
  const invoiceVAT = invoiceData.includeVAT ?? settings.includeVAT ? invoiceSubtotal * 0.15 : 0;
  const invoiceTotal = invoiceSubtotal + invoiceVAT;

  const completionChecks = useMemo(() => {
    const hasClient =
      Boolean(invoiceData.clientName?.trim()) &&
      Boolean(invoiceData.clientEmail?.trim());

    const hasProject =
      Boolean(invoiceData.projectType) &&
      Boolean(invoiceData.siteAddress || invoiceData.clientAddress);

    const hasEquipment =
      Array.isArray(invoiceData.items) &&
      invoiceData.items.some(
        (item) =>
          Boolean(item.description?.trim()) &&
          Number(item.quantity) > 0 &&
          Number(item.price) >= 0
      );

    const hasPayment =
      Boolean(invoiceData.paymentPlan) &&
      Number(invoiceData.paymentPlan?.depositPercentage) >= 0 &&
      Boolean(invoiceData.paymentReference || invoiceData.invoiceNumber || invoiceData.clientName);

    return [
      {
        key: 'client',
        label: 'Client',
        complete: hasClient,
        helper: hasClient ? 'Client ready' : 'Add client name and email',
      },
      {
        key: 'project',
        label: 'Project',
        complete: hasProject,
        helper: hasProject ? 'Project ready' : 'Add project/site details',
      },
      {
        key: 'equipment',
        label: 'Equipment',
        complete: hasEquipment,
        helper: hasEquipment ? 'Items ready' : 'Add at least one item',
      },
      {
        key: 'payment',
        label: 'Payment',
        complete: hasPayment,
        helper: hasPayment ? 'Payment ready' : 'Check payment details',
      },
    ];
  }, [invoiceData]);

  const completedSteps = completionChecks.filter((step) => step.complete).length;
  const completionPercentage = Math.round((completedSteps / completionChecks.length) * 100);

  const documentLabel = invoiceData.documentType || solarDefaults.defaultDocumentType || 'Solar Quotation';
  const documentNumberLabel = invoiceData.invoiceNumber || 'Draft document';

  const saveInvoiceToLocalStorage = (invoice) => {
    const existing = JSON.parse(localStorage.getItem('invoices') || '[]');

    const filtered = existing.filter((inv) => {
      const sameId = invoice.id && inv.id === invoice.id;
      const sameInvoiceNumber =
        invoice.invoiceNumber && inv.invoiceNumber === invoice.invoiceNumber;

      return !sameId && !sameInvoiceNumber;
    });

    localStorage.setItem('invoices', JSON.stringify([...filtered, invoice]));
  };

  const saveInvoiceToBackend = async (invoice) => {
    const response = await fetch(`${BACKEND_URL}/api/invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoice),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Backend invoice save failed');
    }

    return response.json();
  };

  const normalizeInvoiceBeforeSave = () => {
    const now = new Date();
    const nowIso = now.toISOString();
    const today = nowIso.slice(0, 10);

    const documentType =
      invoiceData.documentType ||
      solarDefaults.defaultDocumentType ||
      'Solar Quotation';

    const finalInvoiceNumber =
      invoiceData.invoiceNumber || generateInvoiceNumber(documentType);

    const normalizedItems =
      Array.isArray(invoiceData.items) && invoiceData.items.length > 0
        ? invoiceData.items.map((item) => ({
            ...item,
            id: item.id || uuidv4(),
            category: item.category || 'General',
            brand: item.brand || '',
            model: item.model || '',
            rating: item.rating || '',
            warranty: item.warranty || '',
            description: item.description || '',
            quantity: Number(item.quantity) || 0,
            price: Number(item.price) || 0,
            notes: item.notes || '',
          }))
        : [createBlankItem('Labour')];

    const depositPercentage =
      Number(invoiceData.paymentPlan?.depositPercentage) ||
      Number(solarDefaults.defaultDepositPercentage) ||
      0;

    const balancePercentage =
      Number(invoiceData.paymentPlan?.balancePercentage) ||
      Number(solarDefaults.defaultBalancePercentage) ||
      Math.max(0, 100 - depositPercentage);

    return {
      ...invoiceData,
      id: invoiceData.id || uuidv4(),
      documentType,
      invoiceNumber: finalInvoiceNumber,
      date: invoiceData.date || nowIso,
      updatedAt: nowIso,
      status: invoiceData.status || 'DUE',

      clientType: invoiceData.clientType || 'Residential',
      clientPhone: invoiceData.clientPhone || '',

      projectType: invoiceData.projectType || 'Hybrid Solar System',
      siteAddress: invoiceData.siteAddress || invoiceData.clientAddress || '',
      phaseType: invoiceData.phaseType || 'Single Phase',
      roofType: invoiceData.roofType || 'Tiled Roof',
      installationDate: invoiceData.installationDate || '',
      quoteValidityDays:
        Number(invoiceData.quoteValidityDays) ||
        Number(solarDefaults.defaultQuoteValidityDays) ||
        7,

      systemDetails: {
        inverterSizeKw: invoiceData.systemDetails?.inverterSizeKw || '',
        batteryCapacityKwh: invoiceData.systemDetails?.batteryCapacityKwh || '',
        pvSizeKwp: invoiceData.systemDetails?.pvSizeKwp || '',
        numberOfPanels: invoiceData.systemDetails?.numberOfPanels || '',
        monitoringIncluded: invoiceData.systemDetails?.monitoringIncluded ?? true,
        backupCircuits: invoiceData.systemDetails?.backupCircuits || '',
      },

      compliance: {
        cocIncluded: invoiceData.compliance?.cocIncluded ?? true,
        ssegIncluded: invoiceData.compliance?.ssegIncluded ?? false,
        singleLineDiagramIncluded:
          invoiceData.compliance?.singleLineDiagramIncluded ?? true,
        commissioningReportIncluded:
          invoiceData.compliance?.commissioningReportIncluded ?? true,
      },

      paymentPlan: {
        depositPercentage,
        balancePercentage,
        paymentMilestone:
          invoiceData.paymentPlan?.paymentMilestone ||
          solarDefaults.defaultPaymentMilestone ||
          '',
      },

      solarNotes: invoiceData.solarNotes || '',
      exclusions: invoiceData.exclusions || solarDefaults.defaultExclusions || '',

      includeVAT: invoiceData.includeVAT ?? settings.includeVAT ?? true,
      terms: invoiceData.terms || settings.terms || '',
      paymentOptions: invoiceData.paymentOptions || settings.paymentOptions || '',
      paymentInstructions:
        invoiceData.paymentInstructions || settings.paymentInstructions || '',
      paymentReference:
        invoiceData.paymentReference ||
        `Use ${finalInvoiceNumber} as payment reference.`,
      items: normalizedItems,

      timeline: {
        quoteDate: invoiceData.timeline?.quoteDate || today,
        invoiceDate: invoiceData.timeline?.invoiceDate || today,
        paymentDate: invoiceData.timeline?.paymentDate || '',
      },
    };
  };

  const validateBeforeSave = () => {
    if (!invoiceData.clientName?.trim()) {
      toast.warn('⚠️ Please enter the client name.');
      setKey('form');
      return false;
    }

    if (!invoiceData.clientEmail?.trim()) {
      toast.warn('⚠️ Please enter the client email.');
      setKey('form');
      return false;
    }

    if (!invoiceData.items?.some((item) => item.description && Number(item.price) >= 0)) {
      toast.warn('⚠️ Please add at least one valid item.');
      setKey('form');
      return false;
    }

    return true;
  };

  const handleSave = async ({ goToPreview = true } = {}) => {
    if (!validateBeforeSave()) return null;

    const finalInvoice = normalizeInvoiceBeforeSave();

    setIsSaving(true);

    try {
      saveInvoiceToLocalStorage(finalInvoice);
      setInvoiceData(finalInvoice);

      await saveInvoiceToBackend(finalInvoice);

      toast.success(
        `✅ ${finalInvoice.documentType} ${finalInvoice.invoiceNumber} saved locally and to the backend.`
      );

      if (goToPreview) {
        setKey('preview');
      }

      return finalInvoice;
    } catch (error) {
      console.error('Invoice save error:', error);

      saveInvoiceToLocalStorage(finalInvoice);
      setInvoiceData(finalInvoice);

      toast.warning(
        `⚠️ ${finalInvoice.documentType} ${finalInvoice.invoiceNumber} was saved locally, but backend sync failed. QR/payment link may not work until backend is running.`
      );

      if (goToPreview) {
        setKey('preview');
      }

      return finalInvoice;
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreviewClick = () => {
    setKey('preview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFormClick = () => {
    setKey('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderInvoiceForm = () => {
    try {
      if (!invoiceData || typeof invoiceData !== 'object') {
        throw new Error('Invalid invoice data');
      }

      return (
        <InvoiceForm
          invoiceData={invoiceData}
          setInvoiceData={setInvoiceData}
        />
      );
    } catch (err) {
      console.error('💥 Error rendering InvoiceForm:', err);

      return (
        <Alert variant="danger">
          🚨 Failed to load form. Check invoice data structure.
        </Alert>
      );
    }
  };

  const renderInvoicePreview = () => {
    try {
      if (!invoiceData || typeof invoiceData !== 'object') {
        throw new Error('Invalid invoice data');
      }

      return (
        <InvoicePreview
          invoiceData={invoiceData}
          invoiceNumber={invoiceData.invoiceNumber}
        />
      );
    } catch (err) {
      console.error('💥 Error rendering InvoicePreview:', err);

      return (
        <Alert variant="danger">
          🚨 Failed to load preview. Check invoice data structure.
        </Alert>
      );
    }
  };

  return (
    <div className="container-fluid invoice-builder-shell">
      <section className="builder-command-card">
        <div className="builder-command-main">
          <span className="builder-kicker">Guided solar document workflow</span>

          <div className="builder-title-row">
            <div>
              <h5 className="fw-bold mb-1">Solar quotation and invoicing workspace</h5>
              <p className="text-muted mb-0">
                Capture client, project, equipment, compliance and payment details without overwhelming the user.
              </p>
            </div>

            <div className="builder-document-pill">
              <small>{documentLabel}</small>
              <strong>{documentNumberLabel}</strong>
            </div>
          </div>

          <div className="builder-progress-wrap">
            <div className="builder-progress-top">
              <span>Document readiness</span>
              <strong>{completionPercentage}%</strong>
            </div>

            <div className="builder-progress-track" aria-hidden="true">
              <div
                className="builder-progress-fill"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>

            <div className="builder-check-grid">
              {completionChecks.map((step) => (
                <div
                  key={step.key}
                  className={`builder-check-chip ${step.complete ? 'complete' : ''}`}
                  title={step.helper}
                >
                  <span>{step.complete ? '✓' : '•'}</span>
                  {step.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="builder-command-actions">
          <div className="builder-total-card">
            <small>Total value</small>
            <strong>{formatCurrency(invoiceTotal)}</strong>
            <span>{invoiceData.includeVAT ?? settings.includeVAT ? 'Incl. VAT' : 'VAT excluded'}</span>
          </div>

          <div className="builder-action-buttons">
            {onNewInvoice && (
              <Button
                variant="outline-secondary"
                onClick={onNewInvoice}
                className="btn-hover-scale shadow-sm"
                disabled={isSaving}
              >
                ➕ New
              </Button>
            )}

            <Button
              variant="success"
              onClick={() => handleSave({ goToPreview: true })}
              className="btn-hover-scale shadow-sm"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Saving...
                </>
              ) : (
                <>📂 Save</>
              )}
            </Button>
          </div>
        </div>
      </section>

      <div className="builder-mobile-stepper d-md-none">
        <button
          type="button"
          className={key === 'form' ? 'active' : ''}
          onClick={handleFormClick}
        >
          <span>1</span>
          Form
        </button>

        <button
          type="button"
          className={key === 'preview' ? 'active' : ''}
          onClick={handlePreviewClick}
        >
          <span>2</span>
          Preview
        </button>
      </div>

      <Tabs
        id="invoice-tabs"
        activeKey={key}
        onSelect={(k) => setKey(k || 'form')}
        className="mb-3 builder-tabs"
        fill
      >
        <Tab
          eventKey="form"
          title={
            <span className="builder-tab-title">
              <span>☀️</span>
              Solar Project & Items
            </span>
          }
        >
          <div className="fade-in builder-tab-panel">
            {renderInvoiceForm()}
          </div>
        </Tab>

        <Tab
          eventKey="preview"
          title={
            <span className="builder-tab-title">
              <span>📄</span>
              Preview & PDF
            </span>
          }
        >
          <div className="fade-in builder-tab-panel">
            {renderInvoicePreview()}
          </div>
        </Tab>
      </Tabs>

      <div className="builder-mobile-action-bar d-md-none">
        <button
          type="button"
          className="builder-mobile-secondary"
          onClick={key === 'form' ? handlePreviewClick : handleFormClick}
          disabled={isSaving}
        >
          {key === 'form' ? 'Preview' : 'Edit'}
        </button>

        <button
          type="button"
          className="builder-mobile-primary"
          onClick={() => handleSave({ goToPreview: true })}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Document'}
        </button>
      </div>
    </div>
  );
}

export default InvoiceBuilder;