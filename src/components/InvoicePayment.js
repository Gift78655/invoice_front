// src/components/InvoicePayment.js
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Accordion,
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Row,
  Spinner,
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useSettings } from '../context/SettingsContext';

const BACKEND_URL =
  process.env.REACT_APP_API_URL || 'https://invoice-backend-flsi.onrender.com';

function InvoicePayment() {
  const { invoiceNumber } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [proofFile, setProofFile] = useState(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const { settings } = useSettings();

  useEffect(() => {
    let mounted = true;

    const fetchInvoice = async () => {
      setLoading(true);

      try {
        const res = await fetch(`${BACKEND_URL}/api/invoice/${invoiceNumber}`);

        if (!res.ok) {
          throw new Error('Document not found');
        }

        const data = await res.json();

        if (mounted) {
          setInvoice({
            ...data,
            invoiceNumber: data.invoiceNumber || invoiceNumber,
          });
        }
      } catch (error) {
        console.error('Payment instruction page fetch error:', error);

        if (mounted) {
          setInvoice(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchInvoice();

    return () => {
      mounted = false;
    };
  }, [invoiceNumber]);

  const formatCurrency = (value) => {
    const amount = Number(value) || 0;

    return `R${amount.toLocaleString('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (value) => {
    if (!value) return '—';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  const totals = useMemo(() => {
    const subtotal =
      invoice?.items?.reduce(
        (acc, item) =>
          acc + (Number(item.quantity) || 0) * (Number(item.price) || 0),
        0
      ) || 0;

    const includeVAT = invoice
      ? invoice.includeVAT ?? settings.includeVAT
      : settings.includeVAT;

    const vat = includeVAT ? subtotal * 0.15 : 0;
    const total = subtotal + vat;

    const depositPercentage = Number(invoice?.paymentPlan?.depositPercentage) || 0;

    const balancePercentage =
      Number(invoice?.paymentPlan?.balancePercentage) ||
      Math.max(0, 100 - depositPercentage);

    return {
      subtotal,
      vat,
      total,
      includeVAT,
      depositPercentage,
      balancePercentage,
      depositAmount: total * (depositPercentage / 100),
      balanceAmount: total * (balancePercentage / 100),
    };
  }, [invoice, settings.includeVAT]);

  const statusBadge =
    invoice?.status === 'PAID' ||
    invoice?.status === 'ACCEPTED' ||
    invoice?.status === 'COMPLETED'
      ? 'success'
      : invoice?.status === 'OVERDUE'
      ? 'danger'
      : invoice?.status === 'PARTIAL'
      ? 'info'
      : invoice?.status === 'DRAFT'
      ? 'secondary'
      : 'warning';

  const copyToClipboard = async (value, successMessage) => {
    if (!value) {
      toast.error('Nothing to copy.');
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      toast.success(successMessage);
    } catch {
      toast.error('Could not copy to clipboard.');
    }
  };

  const copyPaymentReference = async () => {
    const reference =
      invoice?.paymentReference || invoice?.invoiceNumber || invoiceNumber;

    await copyToClipboard(reference, '✅ Payment reference copied.');
  };

  const copyBankDetails = async () => {
    const bank = settings.bankDetails || {};

    const details = [
      `Bank: ${bank.bank || '—'}`,
      `Account Name: ${bank.accountName || settings.companyName || '—'}`,
      `Account Type: ${bank.accountType || '—'}`,
      `Account No: ${bank.accountNo || '—'}`,
      `Branch Code: ${bank.branchCode || '—'}`,
      `Reference: ${
        invoice?.paymentReference || invoice?.invoiceNumber || invoiceNumber
      }`,
      `Amount: ${formatCurrency(totals.total)}`,
    ].join('\n');

    await copyToClipboard(details, '✅ Bank/payment details copied.');
  };

  const copyAmount = async () => {
    await copyToClipboard(formatCurrency(totals.total), '✅ Amount copied.');
  };

  const handleProofFile = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Proof of payment file is too large. Please use a file smaller than 5MB.');
      return;
    }

    setProofFile(file);
    toast.success('✅ Proof of payment selected locally.');
  };

  const handleAcknowledgement = () => {
    setAcknowledged(true);
    toast.info(
      'Acknowledgement captured on this page. Payment must still be verified by the business.'
    );
  };

  const buildMailtoLink = () => {
    const companyEmail = settings.companyEmail || '';
    const subject = encodeURIComponent(
      `Proof of payment for ${invoice?.documentType || 'Document'} ${
        invoice?.invoiceNumber || invoiceNumber
      }`
    );

    const body = encodeURIComponent(
      `Hi ${settings.companyName || 'Team'},\n\n` +
        `Please find my proof of payment for:\n\n` +
        `Document Number: ${invoice?.invoiceNumber || invoiceNumber}\n` +
        `Client Name: ${invoice?.clientName || ''}\n` +
        `Amount: ${formatCurrency(totals.total)}\n` +
        `Payment Reference: ${
          invoice?.paymentReference || invoice?.invoiceNumber || invoiceNumber
        }\n\n` +
        `Kind regards,\n${invoice?.clientName || ''}`
    );

    return `mailto:${companyEmail}?subject=${subject}&body=${body}`;
  };

  if (loading) {
    return (
      <div className="payment-page payment-loading-page">
        <Card className="payment-loading-card border-0 shadow-sm">
          <Card.Body className="text-center">
            <Spinner animation="border" variant="success" />
            <h5 className="fw-bold mt-3 mb-1">Loading payment instructions</h5>
            <p className="text-muted mb-0">
              Please wait while we retrieve the document details.
            </p>
          </Card.Body>
        </Card>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="payment-page payment-error-page">
        <Card className="payment-error-card border-0 shadow-sm">
          <Card.Body className="text-center">
            <div className="payment-error-icon">🚫</div>
            <h4 className="fw-bold">Document not found</h4>
            <p className="text-muted">
              The document could not be found on the backend. Make sure it was saved while the backend was running.
            </p>
            <Link to="/" className="btn btn-primary">
              Go back to Invoice Builder
            </Link>
          </Card.Body>
        </Card>
      </div>
    );
  }

  const bank = settings.bankDetails || {};
  const system = invoice.systemDetails || {};
  const paymentReference = invoice.paymentReference || invoice.invoiceNumber;

  const projectSummary = [
    {
      label: 'Project',
      value: invoice.projectType || '—',
    },
    {
      label: 'Site',
      value: invoice.siteAddress || invoice.clientAddress || '—',
    },
    {
      label: 'Inverter',
      value: system.inverterSizeKw ? `${system.inverterSizeKw} kW` : '—',
    },
    {
      label: 'Battery',
      value: system.batteryCapacityKwh
        ? `${system.batteryCapacityKwh} kWh`
        : '—',
    },
    {
      label: 'PV',
      value: system.pvSizeKwp ? `${system.pvSizeKwp} kWp` : '—',
    },
  ];

  return (
    <div className="payment-page">
      <div className="payment-shell">
        <section className="payment-hero">
          <div className="payment-hero-copy">
            <Badge bg="light" text="dark" className="payment-hero-badge">
              Payment Instruction Page
            </Badge>

            <h1>{invoice.documentType || 'Invoice'}</h1>

            <p>
              Use the banking details and exact reference below. This page does not
              process online card payments.
            </p>
          </div>

          <div className="payment-document-card">
            <span className={`badge bg-${statusBadge}`}>
              {invoice.status || 'DUE'}
            </span>
            <strong>{invoice.invoiceNumber}</strong>
            <small>
              Date: {formatDate(invoice.timeline?.invoiceDate || invoice.date)}
            </small>
          </div>
        </section>

        <section className="payment-priority-grid">
          <Card className="payment-amount-card border-0 shadow-sm">
            <Card.Body>
              <span className="payment-card-kicker">Amount to pay</span>
              <strong>{formatCurrency(totals.total)}</strong>
              <small>
                {totals.includeVAT ? 'VAT included where applicable' : 'VAT excluded'}
              </small>

              <div className="payment-priority-actions">
                <Button variant="success" onClick={copyAmount}>
                  Copy Amount
                </Button>
              </div>
            </Card.Body>
          </Card>

          <Card className="payment-reference-card border-0 shadow-sm">
            <Card.Body>
              <span className="payment-card-kicker">Payment reference</span>
              <strong>{paymentReference}</strong>
              <small>Use this exact reference when paying.</small>

              <div className="payment-priority-actions">
                <Button variant="outline-primary" onClick={copyPaymentReference}>
                  📋 Copy Reference
                </Button>
              </div>
            </Card.Body>
          </Card>
        </section>

        <Alert variant="warning" className="payment-notice border-0 shadow-sm">
          <strong>Important:</strong> Payment is only confirmed once{' '}
          {settings.companyName || 'the business'} verifies the bank reflection or
          proof of payment. This page is for instructions and reference only.
        </Alert>

        <Row className="g-3 payment-info-row">
          <Col lg={6}>
            <Card className="payment-info-card h-100 border-0 shadow-sm">
              <Card.Body>
                <div className="payment-section-heading">
                  <span>👤</span>
                  <div>
                    <h5>Client</h5>
                    <p>Details linked to this payment instruction.</p>
                  </div>
                </div>

                <div className="payment-detail-list">
                  <div>
                    <span>Name</span>
                    <strong>{invoice.clientName || '—'}</strong>
                  </div>

                  <div>
                    <span>Email</span>
                    <strong>{invoice.clientEmail || '—'}</strong>
                  </div>

                  <div>
                    <span>Phone</span>
                    <strong>{invoice.clientPhone || '—'}</strong>
                  </div>

                  <div>
                    <span>Address</span>
                    <strong>{invoice.clientAddress || '—'}</strong>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={6}>
            <Card className="payment-info-card h-100 border-0 shadow-sm">
              <Card.Body>
                <div className="payment-section-heading">
                  <span>☀️</span>
                  <div>
                    <h5>Project / Site</h5>
                    <p>Solar project details for reference.</p>
                  </div>
                </div>

                <div className="payment-detail-list">
                  {projectSummary.map((item) => (
                    <div key={item.label}>
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="g-3 payment-info-row">
          <Col lg={6}>
            <Card className="payment-info-card h-100 border-0 shadow-sm">
              <Card.Body>
                <div className="payment-section-heading">
                  <span>💳</span>
                  <div>
                    <h5>Payment Plan</h5>
                    <p>Deposit and balance breakdown.</p>
                  </div>
                </div>

                <div className="payment-money-list">
                  <div>
                    <span>{totals.depositPercentage}% Deposit</span>
                    <strong>{formatCurrency(totals.depositAmount)}</strong>
                  </div>

                  <div>
                    <span>{totals.balancePercentage}% Balance</span>
                    <strong>{formatCurrency(totals.balanceAmount)}</strong>
                  </div>

                  <div>
                    <span>Subtotal</span>
                    <strong>{formatCurrency(totals.subtotal)}</strong>
                  </div>

                  <div>
                    <span>VAT 15%</span>
                    <strong>{formatCurrency(totals.vat)}</strong>
                  </div>
                </div>

                <p className="payment-small-note mt-3 mb-0">
                  {invoice.paymentPlan?.paymentMilestone ||
                    'Payment milestone to be confirmed.'}
                </p>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={6}>
            <Card className="payment-info-card h-100 border-0 shadow-sm">
              <Card.Body>
                <div className="payment-section-heading">
                  <span>🏦</span>
                  <div>
                    <h5>Bank Details</h5>
                    <p>Copy these details into your banking app.</p>
                  </div>
                </div>

                <div className="payment-detail-list">
                  <div>
                    <span>Bank</span>
                    <strong>{bank.bank || '—'}</strong>
                  </div>

                  <div>
                    <span>Account Name</span>
                    <strong>{bank.accountName || settings.companyName || '—'}</strong>
                  </div>

                  <div>
                    <span>Account Type</span>
                    <strong>{bank.accountType || '—'}</strong>
                  </div>

                  <div>
                    <span>Account No</span>
                    <strong>{bank.accountNo || '—'}</strong>
                  </div>

                  <div>
                    <span>Branch Code</span>
                    <strong>{bank.branchCode || '—'}</strong>
                  </div>
                </div>

                <Button
                  variant="outline-primary"
                  className="w-100 mt-3"
                  onClick={copyBankDetails}
                >
                  📋 Copy Bank Details
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Card className="payment-proof-card border-0 shadow-sm">
          <Card.Body>
            <div className="payment-section-heading">
              <span>📎</span>
              <div>
                <h5>Proof of Payment</h5>
                <p>
                  Select your proof locally, then use the email button and attach the
                  file in your email app.
                </p>
              </div>
            </div>

            <Row className="g-3 align-items-end">
              <Col lg={7}>
                <Form.Group>
                  <Form.Label>Select proof of payment locally</Form.Label>
                  <Form.Control
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleProofFile}
                  />
                </Form.Group>
              </Col>

              <Col lg={5}>
                <div className="payment-proof-actions">
                  <a className="btn btn-success" href={buildMailtoLink()}>
                    📧 Email Proof
                  </a>

                  <Button variant="outline-secondary" onClick={handleAcknowledgement}>
                    I understand
                  </Button>
                </div>
              </Col>
            </Row>

            {proofFile && (
              <Alert variant="success" className="mt-3 mb-0">
                Selected file: <strong>{proofFile.name}</strong>. Attach this file when your email app opens.
              </Alert>
            )}

            {acknowledged && (
              <Alert variant="info" className="mt-3 mb-0">
                ✅ Acknowledgement captured on this page. The business must still verify payment before marking the document as paid.
              </Alert>
            )}
          </Card.Body>
        </Card>

        <Accordion className="payment-mobile-accordion d-lg-none">
          <Accordion.Item eventKey="0">
            <Accordion.Header>Need help?</Accordion.Header>
            <Accordion.Body>
              <ol className="payment-help-list">
                <li>Open your banking app.</li>
                <li>Pay the exact amount shown above.</li>
                <li>Use the exact payment reference.</li>
                <li>Email proof of payment to the company.</li>
                <li>Wait for payment verification before installation or release.</li>
              </ol>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>

        <div className="payment-bottom-actions">
          <Link to="/" className="btn btn-outline-secondary">
            Back to App
          </Link>

          <Button variant="outline-dark" onClick={() => window.print()}>
            🖨️ Print Instructions
          </Button>
        </div>
      </div>
    </div>
  );
}

export default InvoicePayment;