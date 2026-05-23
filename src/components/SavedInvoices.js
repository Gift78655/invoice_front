// src/components/SavedInvoices.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Dropdown,
  Form,
  Row,
  Table,
} from 'react-bootstrap';
import { toast } from 'react-toastify';

const BACKEND_URL =
  process.env.REACT_APP_API_URL || 'https://invoice-backend-flsi.onrender.com';

const statuses = [
  'DRAFT',
  'DUE',
  'ACCEPTED',
  'PARTIAL',
  'PAID',
  'OVERDUE',
  'COMPLETED',
];

const workflowStatuses = [
  { status: 'DRAFT', label: 'Draft', variant: 'secondary' },
  { status: 'DUE', label: 'Due', variant: 'warning' },
  { status: 'ACCEPTED', label: 'Accepted', variant: 'success' },
  { status: 'PARTIAL', label: 'Partially Paid', variant: 'info' },
  { status: 'PAID', label: 'Paid', variant: 'success' },
  { status: 'OVERDUE', label: 'Overdue', variant: 'danger' },
  { status: 'COMPLETED', label: 'Completed', variant: 'success' },
];

const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
};

const generateDocumentNumber = (documentType = 'Invoice') => {
  const randomPart = Math.floor(100000 + Math.random() * 900000);
  const lower = documentType.toLowerCase();

  if (lower.includes('quotation')) return `QUO-${randomPart}`;
  if (lower.includes('proforma')) return `PRO-${randomPart}`;
  if (lower.includes('receipt')) return `REC-${randomPart}`;
  if (lower.includes('coc')) return `COC-${randomPart}`;

  return `INV-${randomPart}`;
};

function SavedInvoices({ setInvoiceData, setActiveTab }) {
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('ALL');
  const [projectTypeFilter, setProjectTypeFilter] = useState('ALL');
  const [syncingKey, setSyncingKey] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const getInvoiceKey = (invoice) => invoice?.id || invoice?.invoiceNumber || '';

  const loadInvoices = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('invoices') || '[]');
      setInvoices(Array.isArray(stored) ? stored : []);
    } catch (error) {
      console.error('Failed to load saved documents:', error);
      setInvoices([]);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const saveInvoices = (updatedInvoices) => {
    localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
    setInvoices(updatedInvoices);
  };

  const syncInvoiceToBackend = async (invoice) => {
    if (!invoice?.invoiceNumber) return;

    const response = await fetch(`${BACKEND_URL}/api/invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Backend sync failed');
    }
  };

  const replaceInvoice = (targetInvoice, updatedInvoice) => {
    return invoices.map((invoice) => {
      const sameId =
        targetInvoice.id &&
        invoice.id &&
        targetInvoice.id === invoice.id;

      const sameNumber =
        targetInvoice.invoiceNumber &&
        invoice.invoiceNumber &&
        targetInvoice.invoiceNumber === invoice.invoiceNumber;

      return sameId || sameNumber ? updatedInvoice : invoice;
    });
  };

  const updateOneInvoice = async (
    targetInvoice,
    updatedInvoice,
    successMessage = 'Document updated.'
  ) => {
    const updatedInvoices = replaceInvoice(targetInvoice, updatedInvoice);
    saveInvoices(updatedInvoices);

    try {
      setSyncingKey(getInvoiceKey(updatedInvoice));
      await syncInvoiceToBackend(updatedInvoice);
      toast.success(`✅ ${successMessage}`);
    } catch (error) {
      console.error('Backend sync failed:', error);
      toast.warning(`⚠️ ${successMessage} Saved locally, but backend sync failed.`);
    } finally {
      setSyncingKey('');
    }
  };

  const handleDelete = (invoice) => {
    const confirmDelete = window.confirm(
      `Delete ${invoice.invoiceNumber || 'this document'} locally?`
    );

    if (!confirmDelete) return;

    const targetKey = getInvoiceKey(invoice);
    const updated = invoices.filter((item) => getInvoiceKey(item) !== targetKey);

    saveInvoices(updated);
    toast.success('✅ Document deleted locally.');
  };

  const handleRestore = (invoice) => {
    if (!setInvoiceData || !setActiveTab) {
      toast.error('Cannot restore this document from this screen.');
      return;
    }

    setInvoiceData(invoice);
    setActiveTab('builder');
    toast.success(`🔁 ${invoice.invoiceNumber || 'Document'} restored to builder.`);
  };

  const handleDuplicate = async (invoice) => {
    const nowIso = new Date().toISOString();
    const newNumber = generateDocumentNumber(invoice.documentType || 'Invoice');

    const duplicated = {
      ...invoice,
      id: createId(),
      invoiceNumber: newNumber,
      status: 'DRAFT',
      date: nowIso,
      updatedAt: nowIso,
      duplicatedFrom: invoice.invoiceNumber || '',
      paymentReference: `Use ${newNumber} as payment reference.`,
      timeline: {
        ...(invoice.timeline || {}),
        quoteDate: nowIso.slice(0, 10),
        invoiceDate: nowIso.slice(0, 10),
        paymentDate: '',
      },
    };

    const updated = [...invoices, duplicated];
    saveInvoices(updated);

    try {
      setSyncingKey(getInvoiceKey(duplicated));
      await syncInvoiceToBackend(duplicated);
      toast.success(`✅ Duplicated as ${newNumber}.`);
    } catch (error) {
      console.error('Backend sync failed:', error);
      toast.warning(`⚠️ Duplicated as ${newNumber} locally, but backend sync failed.`);
    } finally {
      setSyncingKey('');
    }
  };

  const handleConvertToInvoice = async (invoice) => {
    const confirmed = window.confirm(
      `Convert ${invoice.invoiceNumber} into a Tax Invoice? A new invoice number will be created and the original quotation will be marked as ACCEPTED.`
    );

    if (!confirmed) return;

    const nowIso = new Date().toISOString();
    const newNumber = generateDocumentNumber('Tax Invoice');

    const originalUpdated = {
      ...invoice,
      status:
        invoice.status === 'DRAFT' || invoice.status === 'DUE'
          ? 'ACCEPTED'
          : invoice.status,
      updatedAt: nowIso,
    };

    const converted = {
      ...invoice,
      id: createId(),
      documentType: 'Tax Invoice',
      invoiceNumber: newNumber,
      status: 'DUE',
      date: nowIso,
      updatedAt: nowIso,
      convertedFrom: invoice.invoiceNumber,
      paymentReference: `Use ${newNumber} as payment reference.`,
      timeline: {
        ...(invoice.timeline || {}),
        invoiceDate: nowIso.slice(0, 10),
        paymentDate: '',
      },
    };

    const updatedWithoutOriginal = replaceInvoice(invoice, originalUpdated);
    const finalUpdatedList = [...updatedWithoutOriginal, converted];

    saveInvoices(finalUpdatedList);

    try {
      setSyncingKey(getInvoiceKey(converted));
      await syncInvoiceToBackend(originalUpdated);
      await syncInvoiceToBackend(converted);
      toast.success(`✅ Converted to Tax Invoice ${newNumber}.`);
    } catch (error) {
      console.error('Backend sync failed:', error);
      toast.warning(`⚠️ Converted locally to ${newNumber}, but backend sync failed.`);
    } finally {
      setSyncingKey('');
    }
  };

  const handleStatusChange = async (invoice, newStatus) => {
    const nowIso = new Date().toISOString();

    const updatedInvoice = {
      ...invoice,
      status: newStatus,
      updatedAt: nowIso,
      timeline: {
        ...(invoice.timeline || {}),
        paymentDate:
          newStatus === 'PAID'
            ? nowIso.slice(0, 10)
            : invoice.timeline?.paymentDate || '',
      },
    };

    await updateOneInvoice(invoice, updatedInvoice, `Status updated to ${newStatus}.`);
  };

  const quickMarkAccepted = async (invoice) => {
    await handleStatusChange(invoice, 'ACCEPTED');
  };

  const quickMarkPaid = async (invoice) => {
    await handleStatusChange(invoice, 'PAID');
  };

  const quickMarkOverdue = async (invoice) => {
    await handleStatusChange(invoice, 'OVERDUE');
  };

  const calculateSubtotal = useCallback((items = []) => {
    return items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      return sum + quantity * price;
    }, 0);
  }, []);

  const calculateTotal = useCallback(
    (invoice) => {
      const subtotal = calculateSubtotal(invoice.items || []);
      const includeVAT = invoice.includeVAT ?? true;
      const vat = includeVAT ? subtotal * 0.15 : 0;
      return subtotal + vat;
    },
    [calculateSubtotal]
  );

  const formatCurrency = (value) => {
    const amount = Number(value) || 0;

    return `R${amount.toLocaleString('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return '—';

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleDateString('en-ZA');
  };

  const getStatusBadge = (status = 'DUE') => {
    if (status === 'PAID' || status === 'ACCEPTED' || status === 'COMPLETED') {
      return 'success';
    }

    if (status === 'OVERDUE') return 'danger';
    if (status === 'PARTIAL') return 'info';
    if (status === 'DRAFT') return 'secondary';

    return 'warning';
  };

  const openPaymentLink = (invoice) => {
    if (!invoice.invoiceNumber) {
      toast.error('This document does not have a document number yet.');
      return;
    }

    const frontendUrl =
      process.env.REACT_APP_FRONTEND_URL ||
      window.location.origin ||
      'https://invoice-front-mn5z.onrender.com';

    const link = `${frontendUrl}/#/pay/${invoice.invoiceNumber}`;
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const copyPaymentLink = async (invoice) => {
    if (!invoice.invoiceNumber) {
      toast.error('This document does not have a document number yet.');
      return;
    }

    const frontendUrl =
      process.env.REACT_APP_FRONTEND_URL ||
      window.location.origin ||
      'https://invoice-front-mn5z.onrender.com';

    const link = `${frontendUrl}/#/pay/${invoice.invoiceNumber}`;

    try {
      await navigator.clipboard.writeText(link);
      toast.success('✅ Payment/view link copied.');
    } catch {
      toast.error('Could not copy link.');
    }
  };

  const copyPaymentReference = async (invoice) => {
    const reference = invoice.paymentReference || invoice.invoiceNumber || '';

    if (!reference) {
      toast.error('No payment reference found.');
      return;
    }

    try {
      await navigator.clipboard.writeText(reference);
      toast.success('✅ Payment reference copied.');
    } catch {
      toast.error('Could not copy payment reference.');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setDocumentTypeFilter('ALL');
    setProjectTypeFilter('ALL');
  };

  const uniqueDocumentTypes = useMemo(() => {
    const values = invoices.map((invoice) => invoice.documentType || 'Invoice');
    return ['ALL', ...new Set(values)];
  }, [invoices]);

  const uniqueProjectTypes = useMemo(() => {
    const values = invoices
      .map((invoice) => invoice.projectType)
      .filter(Boolean);

    return ['ALL', ...new Set(values)];
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const total = calculateTotal(invoice);

      const matchesSearch =
        !term ||
        invoice.clientName?.toLowerCase().includes(term) ||
        invoice.clientEmail?.toLowerCase().includes(term) ||
        invoice.invoiceNumber?.toLowerCase().includes(term) ||
        invoice.projectType?.toLowerCase().includes(term) ||
        invoice.siteAddress?.toLowerCase().includes(term) ||
        invoice.documentType?.toLowerCase().includes(term) ||
        String(total).includes(term);

      const matchesStatus =
        statusFilter === 'ALL' || (invoice.status || 'DUE') === statusFilter;

      const matchesDocumentType =
        documentTypeFilter === 'ALL' ||
        (invoice.documentType || 'Invoice') === documentTypeFilter;

      const matchesProjectType =
        projectTypeFilter === 'ALL' || invoice.projectType === projectTypeFilter;

      return matchesSearch && matchesStatus && matchesDocumentType && matchesProjectType;
    });
  }, [
    invoices,
    searchTerm,
    statusFilter,
    documentTypeFilter,
    projectTypeFilter,
    calculateTotal,
  ]);

  const totals = useMemo(() => {
    const totalValue = invoices.reduce(
      (sum, invoice) => sum + calculateTotal(invoice),
      0
    );

    const paidValue = invoices
      .filter((invoice) => invoice.status === 'PAID' || invoice.status === 'COMPLETED')
      .reduce((sum, invoice) => sum + calculateTotal(invoice), 0);

    const acceptedValue = invoices
      .filter((invoice) => invoice.status === 'ACCEPTED')
      .reduce((sum, invoice) => sum + calculateTotal(invoice), 0);

    const outstandingValue = invoices
      .filter((invoice) => !['PAID', 'COMPLETED'].includes(invoice.status))
      .reduce((sum, invoice) => sum + calculateTotal(invoice), 0);

    return {
      totalDocs: invoices.length,
      quotes: invoices.filter((invoice) =>
        (invoice.documentType || '').toLowerCase().includes('quotation')
      ).length,
      invoicesCount: invoices.filter((invoice) =>
        (invoice.documentType || '').toLowerCase().includes('invoice')
      ).length,
      acceptedValue,
      paidValue,
      outstandingValue,
      totalValue,
    };
  }, [invoices, calculateTotal]);

  const statusQuickFilters = [
    { label: 'All', value: 'ALL' },
    { label: 'Due', value: 'DUE' },
    { label: 'Accepted', value: 'ACCEPTED' },
    { label: 'Paid', value: 'PAID' },
    { label: 'Overdue', value: 'OVERDUE' },
  ];

  const renderWorkflowMenu = (invoice, isQuotation, isSyncing) => (
    <Dropdown>
      <Dropdown.Toggle
        variant="outline-success"
        size="sm"
        disabled={isSyncing}
      >
        Workflow
      </Dropdown.Toggle>

      <Dropdown.Menu>
        <Dropdown.Item onClick={() => quickMarkAccepted(invoice)}>
          ✅ Mark Accepted
        </Dropdown.Item>

        <Dropdown.Item onClick={() => quickMarkPaid(invoice)}>
          💰 Mark Paid
        </Dropdown.Item>

        <Dropdown.Item onClick={() => quickMarkOverdue(invoice)}>
          ⚠️ Mark Overdue
        </Dropdown.Item>

        <Dropdown.Divider />

        <Dropdown.Item onClick={() => handleDuplicate(invoice)}>
          📄 Duplicate Quote/Invoice
        </Dropdown.Item>

        {isQuotation && (
          <Dropdown.Item onClick={() => handleConvertToInvoice(invoice)}>
            ➜ Convert Quotation to Tax Invoice
          </Dropdown.Item>
        )}

        <Dropdown.Divider />

        <Dropdown.Item onClick={() => copyPaymentLink(invoice)}>
          📋 Copy Payment Link
        </Dropdown.Item>

        <Dropdown.Item onClick={() => copyPaymentReference(invoice)}>
          🧾 Copy Payment Reference
        </Dropdown.Item>

        <Dropdown.Item className="text-danger" onClick={() => handleDelete(invoice)}>
          🗑️ Delete Locally
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );

  return (
    <div className="saved-invoices-page">
      <section className="saved-hero-card">
        <div>
          <Badge bg="success" className="mb-2">
            Solar document control
          </Badge>
          <h5 className="fw-bold mb-1">Saved quotations and invoices</h5>
          <p className="text-muted mb-0">
            Search, restore, duplicate, convert, mark paid and open payment instruction links.
          </p>
        </div>

        <Button
          variant="outline-primary"
          onClick={() => {
            if (setActiveTab) setActiveTab('builder');
          }}
        >
          ☀️ Create New
        </Button>
      </section>

      <Row className="g-3 mb-3 saved-summary-grid">
        <Col xs={6} md={2}>
          <Card className="border-0 shadow-sm h-100 saved-summary-card">
            <Card.Body>
              <span>Documents</span>
              <strong>{totals.totalDocs}</strong>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={6} md={2}>
          <Card className="border-0 shadow-sm h-100 saved-summary-card">
            <Card.Body>
              <span>Quotes</span>
              <strong>{totals.quotes}</strong>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={6} md={2}>
          <Card className="border-0 shadow-sm h-100 saved-summary-card">
            <Card.Body>
              <span>Invoices</span>
              <strong>{totals.invoicesCount}</strong>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={6} md={2}>
          <Card className="border-0 shadow-sm h-100 saved-summary-card">
            <Card.Body>
              <span>Paid</span>
              <strong>{formatCurrency(totals.paidValue)}</strong>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={6} md={2}>
          <Card className="border-0 shadow-sm h-100 saved-summary-card">
            <Card.Body>
              <span>Accepted</span>
              <strong>{formatCurrency(totals.acceptedValue)}</strong>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={6} md={2}>
          <Card className="border-0 shadow-sm h-100 saved-summary-card warning">
            <Card.Body>
              <span>Outstanding</span>
              <strong>{formatCurrency(totals.outstandingValue)}</strong>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm mb-3 saved-filter-card">
        <Card.Body>
          <div className="saved-search-row">
            <Form.Group className="saved-search-box">
              <Form.Label>Search saved documents</Form.Label>
              <Form.Control
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Client, email, document number, project, site or amount"
              />
            </Form.Group>

            <Button
              type="button"
              variant="outline-secondary"
              className="saved-filter-toggle d-lg-none"
              onClick={() => setShowFilters((prev) => !prev)}
            >
              {showFilters ? 'Hide Filters' : 'Filters'}
            </Button>
          </div>

          <div className="saved-status-chips">
            {statusQuickFilters.map((filter) => (
              <button
                type="button"
                key={filter.value}
                className={statusFilter === filter.value ? 'active' : ''}
                onClick={() => setStatusFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className={`saved-advanced-filters ${showFilters ? 'show' : ''}`}>
            <Row className="g-3 align-items-end">
              <Col lg={3}>
                <Form.Group>
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All statuses</option>
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col lg={3}>
                <Form.Group>
                  <Form.Label>Document Type</Form.Label>
                  <Form.Select
                    value={documentTypeFilter}
                    onChange={(e) => setDocumentTypeFilter(e.target.value)}
                  >
                    {uniqueDocumentTypes.map((type) => (
                      <option key={type} value={type}>
                        {type === 'ALL' ? 'All types' : type}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col lg={4}>
                <Form.Group>
                  <Form.Label>Project Type</Form.Label>
                  <Form.Select
                    value={projectTypeFilter}
                    onChange={(e) => setProjectTypeFilter(e.target.value)}
                  >
                    {uniqueProjectTypes.map((type) => (
                      <option key={type} value={type}>
                        {type === 'ALL' ? 'All projects' : type}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col lg={2}>
                <Button
                  type="button"
                  variant="outline-dark"
                  className="w-100"
                  onClick={clearFilters}
                >
                  Clear
                </Button>
              </Col>
            </Row>
          </div>
        </Card.Body>
      </Card>

      {invoices.length === 0 ? (
        <Alert variant="info">
          No saved solar documents found. Create and save a quotation or invoice first.
        </Alert>
      ) : filteredInvoices.length === 0 ? (
        <Alert variant="warning">
          No documents match your current filters.
        </Alert>
      ) : (
        <>
          <div className="saved-desktop-table">
            <Table striped bordered hover responsive className="bg-white shadow-sm align-middle">
              <thead className="table-light">
                <tr>
                  <th>Document</th>
                  <th>Client</th>
                  <th>Project</th>
                  <th>Site</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th className="text-center">Workflow Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredInvoices.map((invoice) => {
                  const invoiceKey = getInvoiceKey(invoice);
                  const isSyncing = syncingKey === invoiceKey;
                  const isQuotation = (invoice.documentType || '')
                    .toLowerCase()
                    .includes('quotation');

                  return (
                    <tr key={invoiceKey}>
                      <td>
                        <div className="fw-bold">{invoice.invoiceNumber || '—'}</div>
                        <small className="text-muted">{invoice.documentType || 'Invoice'}</small>

                        {invoice.convertedFrom && (
                          <div className="mt-1">
                            <Badge bg="light" text="dark">
                              From {invoice.convertedFrom}
                            </Badge>
                          </div>
                        )}

                        {invoice.duplicatedFrom && (
                          <div className="mt-1">
                            <Badge bg="light" text="dark">
                              Copy of {invoice.duplicatedFrom}
                            </Badge>
                          </div>
                        )}
                      </td>

                      <td>
                        <div>{invoice.clientName || '—'}</div>
                        <small className="text-muted">{invoice.clientEmail || '—'}</small>
                      </td>

                      <td>
                        <div>{invoice.projectType || '—'}</div>
                        <small className="text-muted">
                          {invoice.systemDetails?.inverterSizeKw
                            ? `${invoice.systemDetails.inverterSizeKw}kW inverter`
                            : ''}
                          {invoice.systemDetails?.batteryCapacityKwh
                            ? ` | ${invoice.systemDetails.batteryCapacityKwh}kWh battery`
                            : ''}
                        </small>
                      </td>

                      <td style={{ minWidth: '150px' }}>
                        <small>{invoice.siteAddress || invoice.clientAddress || '—'}</small>
                      </td>

                      <td>{formatDate(invoice.updatedAt || invoice.date)}</td>

                      <td className="fw-bold">{formatCurrency(calculateTotal(invoice))}</td>

                      <td style={{ minWidth: '150px' }}>
                        <Form.Select
                          size="sm"
                          value={invoice.status || 'DUE'}
                          onChange={(e) => handleStatusChange(invoice, e.target.value)}
                          disabled={isSyncing}
                        >
                          {workflowStatuses.map((item) => (
                            <option key={item.status} value={item.status}>
                              {item.label}
                            </option>
                          ))}
                        </Form.Select>

                        <span className={`badge bg-${getStatusBadge(invoice.status)} mt-2`}>
                          {invoice.status || 'DUE'}
                        </span>
                      </td>

                      <td>
                        <div className="d-flex gap-2 justify-content-center flex-wrap">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleRestore(invoice)}
                          >
                            🔄 Restore
                          </Button>

                          {renderWorkflowMenu(invoice, isQuotation, isSyncing)}

                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => openPaymentLink(invoice)}
                          >
                            🔗 Payment Page
                          </Button>

                          <Button
                            variant="outline-dark"
                            size="sm"
                            onClick={() => copyPaymentReference(invoice)}
                          >
                            Ref
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>

          <div className="saved-mobile-list">
            {filteredInvoices.map((invoice) => {
              const invoiceKey = getInvoiceKey(invoice);
              const isSyncing = syncingKey === invoiceKey;
              const isQuotation = (invoice.documentType || '')
                .toLowerCase()
                .includes('quotation');

              return (
                <Card className="saved-mobile-card" key={invoiceKey}>
                  <Card.Body>
                    <div className="saved-mobile-card-top">
                      <div>
                        <Badge bg={getStatusBadge(invoice.status)}>
                          {invoice.status || 'DUE'}
                        </Badge>
                        <h6>{invoice.invoiceNumber || '—'}</h6>
                        <p>{invoice.documentType || 'Invoice'}</p>
                      </div>

                      <strong>{formatCurrency(calculateTotal(invoice))}</strong>
                    </div>

                    <div className="saved-mobile-detail-grid">
                      <div>
                        <span>Client</span>
                        <strong>{invoice.clientName || '—'}</strong>
                        <small>{invoice.clientEmail || '—'}</small>
                      </div>

                      <div>
                        <span>Project</span>
                        <strong>{invoice.projectType || '—'}</strong>
                        <small>
                          {invoice.systemDetails?.inverterSizeKw
                            ? `${invoice.systemDetails.inverterSizeKw}kW inverter`
                            : 'System size not set'}
                        </small>
                      </div>

                      <div>
                        <span>Site</span>
                        <strong>{invoice.siteAddress || invoice.clientAddress || '—'}</strong>
                      </div>

                      <div>
                        <span>Updated</span>
                        <strong>{formatDate(invoice.updatedAt || invoice.date)}</strong>
                      </div>
                    </div>

                    {(invoice.convertedFrom || invoice.duplicatedFrom) && (
                      <div className="saved-mobile-origin">
                        {invoice.convertedFrom && (
                          <Badge bg="light" text="dark">
                            Converted from {invoice.convertedFrom}
                          </Badge>
                        )}

                        {invoice.duplicatedFrom && (
                          <Badge bg="light" text="dark">
                            Copy of {invoice.duplicatedFrom}
                          </Badge>
                        )}
                      </div>
                    )}

                    <Form.Group className="mt-3">
                      <Form.Label>Status</Form.Label>
                      <Form.Select
                        size="sm"
                        value={invoice.status || 'DUE'}
                        onChange={(e) => handleStatusChange(invoice, e.target.value)}
                        disabled={isSyncing}
                      >
                        {workflowStatuses.map((item) => (
                          <option key={item.status} value={item.status}>
                            {item.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>

                    <div className="saved-mobile-actions">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleRestore(invoice)}
                      >
                        Restore
                      </Button>

                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => openPaymentLink(invoice)}
                      >
                        Payment
                      </Button>

                      {renderWorkflowMenu(invoice, isQuotation, isSyncing)}
                    </div>
                  </Card.Body>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default SavedInvoices;