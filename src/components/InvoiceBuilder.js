// ✅ Updated InvoiceBuilder.js
import React, { useState, useMemo } from 'react';
import InvoiceForm from './InvoiceForm';
import InvoicePreview from './InvoicePreview';
import { Tabs, Tab, Button, Alert } from 'react-bootstrap';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';

function InvoiceBuilder() {
  const [key, setKey] = useState('form');

  const defaultTerms = useMemo(
    () => `Payment Terms: Payment due within 7 calendar days of invoice date. Late payments will incur a 2% monthly fee.

Warranty: Services/products include a 12-month workmanship warranty unless otherwise stated.

Refund Policy: Refunds are only applicable for cancellations made within 5 days of invoice date. No refunds on delivered or executed work.

SARS Compliance: This invoice is compliant with the VAT Act and SARS invoice formatting requirements.

POPIA Notice: Client information is securely processed and stored in compliance with the Protection of Personal Information Act (POPIA).`,
    []
  );

  const [invoiceData, setInvoiceData] = useState({
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    items: [{ id: uuidv4(), description: '', quantity: 1, price: 0 }],
    includeVAT: true,
    invoiceNumber: '',
    date: '',
    status: 'DUE',
    notes: '',
    attachments: [],
    signature: '',
    terms: defaultTerms,
    timeline: {
      quoteDate: '',
      invoiceDate: '',
      paymentDate: '',
    },
  });

  const generateInvoiceNumber = () => {
    const randomPart = Math.floor(100000 + Math.random() * 900000);
    return `INV-${randomPart}`;
  };

  const handleSave = () => {
    if (!invoiceData.clientName || !invoiceData.clientEmail) {
      toast.warn('⚠️ Please enter client name and email.');
      return;
    }

    const existing = JSON.parse(localStorage.getItem('invoices') || '[]');
    const now = new Date();
    const finalInvoiceNumber = invoiceData.invoiceNumber || generateInvoiceNumber();
    const filtered = existing.filter(inv => inv.invoiceNumber !== finalInvoiceNumber);

    const newInvoice = {
      ...invoiceData,
      id: uuidv4(),
      invoiceNumber: finalInvoiceNumber,
      date: now.toISOString(),
      timeline: {
        ...invoiceData.timeline,
        quoteDate: invoiceData.timeline.quoteDate || now.toISOString(),
        invoiceDate: now.toISOString(),
        paymentDate: invoiceData.timeline.paymentDate || '',
      },
    };

    localStorage.setItem('invoices', JSON.stringify([...filtered, newInvoice]));
    setInvoiceData(prev => ({ ...prev, invoiceNumber: finalInvoiceNumber }));
    toast.success(`✅ Invoice ${finalInvoiceNumber} saved! You can now view it via QR.`);
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-end mb-3">
        <Button variant="success" onClick={handleSave} className="btn-hover-scale shadow-sm">
          📂 Save Invoice
        </Button>
      </div>

      <Tabs
        id="invoice-tabs"
        activeKey={key}
        onSelect={(k) => setKey(k)}
        className="mb-3"
        fill
      >
        <Tab eventKey="form" title="Client Info & Items">
          <div className="fade-in">
            {(() => {
              try {
                if (!invoiceData || typeof invoiceData !== 'object') {
                  throw new Error('Invalid invoice data');
                }
                return <InvoiceForm invoiceData={invoiceData} setInvoiceData={setInvoiceData} />;
              } catch (err) {
                console.error('💥 Error rendering InvoiceForm:', err);
                return <Alert variant="danger">🚨 Failed to load form. Check invoice data structure.</Alert>;
              }
            })()}
          </div>
        </Tab>

        <Tab eventKey="preview" title="Invoice Preview">
          <div className="fade-in">
            {(() => {
              try {
                if (!invoiceData || typeof invoiceData !== 'object') {
                  throw new Error('Invalid invoice data');
                }
                return <InvoicePreview invoiceData={invoiceData} invoiceNumber={invoiceData.invoiceNumber} />;
              } catch (err) {
                console.error('💥 Error rendering InvoicePreview:', err);
                return <Alert variant="danger">🚨 Failed to load preview. Check invoice data structure.</Alert>;
              }
            })()}
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}

export default InvoiceBuilder;
