// src/components/InvoicePayment.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Alert } from 'react-bootstrap';
import { useSettings } from '../context/SettingsContext';

function InvoicePayment() {
  const { invoiceNumber } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [paid, setPaid] = useState(false);
  const { settings } = useSettings();

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('invoices') || '[]');
    const found = stored.find((inv) => inv.invoiceNumber === invoiceNumber);
    setInvoice(found);
  }, [invoiceNumber]);

  const handleConfirmPayment = () => {
    setPaid(true);
  };

  if (!invoice) {
    return (
      <Alert variant="danger" className="m-4 text-center">
        🚫 Invoice not found. Please check the link.
      </Alert>
    );
  }

  const subtotal = invoice.items?.reduce(
    (acc, item) => acc + ((item.quantity || 0) * (item.price || 0)),
    0
  );
  const vat = (invoice.includeVAT ?? settings.includeVAT) ? subtotal * 0.15 : 0;
  const totalAmount = subtotal + vat;
  const formattedAmount = totalAmount.toFixed(2);

  const statusBadge =
    invoice.status === 'PAID'
      ? 'success'
      : invoice.status === 'OVERDUE'
      ? 'danger'
      : invoice.status === 'PARTIAL'
      ? 'info'
      : 'warning';

  return (
    <div className="container py-5">
      <div className="mx-auto border rounded shadow p-4 bg-white" style={{ maxWidth: '650px' }}>
        <h3 className="text-center mb-4">💳 Invoice Payment</h3>
        <hr />
        <p><strong>Invoice No:</strong> {invoice.invoiceNumber}</p>
        <p><strong>Client:</strong> {invoice.clientName}</p>
        <p><strong>Email:</strong> {invoice.clientEmail}</p>
        <p><strong>Status:</strong> <span className={`badge bg-${statusBadge}`}>{invoice.status}</span></p>
        <p><strong>Includes VAT:</strong> {(invoice.includeVAT ?? settings.includeVAT) ? 'Yes (15%)' : 'No'}</p>
        <p><strong>Total Amount:</strong> <span className="text-success fw-bold">R{formattedAmount}</span></p>

        <p><strong>Reference:</strong> {invoice.paymentReference || settings.paymentInstructions}</p>
        <p><strong>Instructions:</strong> {invoice.paymentInstructions || settings.paymentInstructions}</p>
        <p><strong>Payment Methods:</strong> {invoice.paymentOptions || settings.paymentOptions}</p>

        {!paid ? (
          <>
            <hr />
            <h5 className="mt-3 text-center">Select Payment Option</h5>
            <div className="d-flex justify-content-around my-3">
              <Button variant="outline-primary">SnapScan</Button>
              <Button variant="outline-secondary">EFT</Button>
              <Button variant="outline-dark">Credit Card</Button>
            </div>

            <div className="d-grid mt-4">
              <Button variant="success" size="lg" onClick={handleConfirmPayment}>
                ✅ Confirm Payment
              </Button>
            </div>
          </>
        ) : (
          <Alert variant="success" className="mt-4 text-center">
            <h5>✅ Payment Confirmed</h5>
            <p>This is a simulated payment. Thank you!</p>
          </Alert>
        )}
      </div>
    </div>
  );
}

export default InvoicePayment;
