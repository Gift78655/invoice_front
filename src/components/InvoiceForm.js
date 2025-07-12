// src/components/InvoiceForm.js
import React from 'react';
import ItemRow from './ItemRow';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { v4 as uuidv4 } from 'uuid';
import { useSettings } from '../context/SettingsContext';
import SignatureCapture from './SignaturePad';

function InvoiceForm({ invoiceData, setInvoiceData }) {
  const { settings } = useSettings();

  const handleClientChange = (e) => {
    const { name, value } = e.target;
    setInvoiceData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTimelineChange = (e) => {
    const { name, value } = e.target;
    setInvoiceData((prev) => ({
      ...prev,
      timeline: { ...prev.timeline, [name]: value },
    }));
  };

  const handleItemChange = (index, updatedItem) => {
    const updatedItems = [...invoiceData.items];
    updatedItems[index] = updatedItem;
    setInvoiceData((prev) => ({ ...prev, items: updatedItems }));
  };

  const addItem = () => {
    setInvoiceData((prev) => ({
      ...prev,
      items: [...prev.items, { id: uuidv4(), description: '', quantity: 1, price: 0 }],
    }));
  };

  const removeItem = (index) => {
    const updatedItems = [...invoiceData.items];
    updatedItems.splice(index, 1);
    setInvoiceData((prev) => ({ ...prev, items: updatedItems }));
  };

  return (
    <div className="invoice-form">
      <h5 className="mb-3">📓 Client Information</h5>
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Client Name</Form.Label>
          <Form.Control
            type="text"
            name="clientName"
            value={invoiceData.clientName}
            onChange={handleClientChange}
            placeholder="e.g. John Doe"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Client Email</Form.Label>
          <Form.Control
            type="email"
            name="clientEmail"
            value={invoiceData.clientEmail}
            onChange={handleClientChange}
            placeholder="e.g. john@example.com"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Client Address</Form.Label>
          <Form.Control
            as="textarea"
            name="clientAddress"
            value={invoiceData.clientAddress}
            onChange={handleClientChange}
            rows={2}
            placeholder="Street, City, Zip"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Payment Status</Form.Label>
          <Form.Select
            name="status"
            value={invoiceData.status || 'DUE'}
            onChange={handleClientChange}
          >
            <option value="DUE">Due</option>
            <option value="PAID">Paid</option>
            <option value="PARTIAL">Partially Paid</option>
            <option value="OVERDUE">Overdue</option>
          </Form.Select>
        </Form.Group>

        <h5 className="mt-4">🗕️ Timeline</h5>
        <Row className="mb-3">
          <Col>
            <Form.Label>Quote Date</Form.Label>
            <Form.Control
              type="date"
              name="quoteDate"
              value={invoiceData.timeline?.quoteDate || ''}
              onChange={handleTimelineChange}
            />
          </Col>
          <Col>
            <Form.Label>Invoice Date</Form.Label>
            <Form.Control
              type="date"
              name="invoiceDate"
              value={invoiceData.timeline?.invoiceDate || ''}
              onChange={handleTimelineChange}
            />
          </Col>
          <Col>
            <Form.Label>Payment Date</Form.Label>
            <Form.Control
              type="date"
              name="paymentDate"
              value={invoiceData.timeline?.paymentDate || ''}
              onChange={handleTimelineChange}
            />
          </Col>
        </Row>

        <h5 className="mb-3">📦 Invoice Items</h5>
        {invoiceData.items?.map((item, idx) => (
          <ItemRow
            key={item.id}
            index={idx}
            item={item}
            onItemChange={handleItemChange}
            onRemoveItem={removeItem}
          />
        ))}

        <div className="d-grid mb-4">
          <Button variant="outline-primary" onClick={addItem}>➕ Add Item</Button>
        </div>

        <h5 className="mt-4">💳 Payment Options</h5>
        <Form.Group className="mb-3">
          <Form.Label>Alternative Payment Methods</Form.Label>
          <Form.Control
            type="text"
            name="paymentOptions"
            value={invoiceData.paymentOptions || settings.paymentOptions || ''}
            onChange={handleClientChange}
            placeholder="e.g. SnapScan, EFT, Credit Card"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Payment Reference Instructions</Form.Label>
          <Form.Control
            type="text"
            name="paymentReference"
            value={invoiceData.paymentReference || ''}
            onChange={handleClientChange}
            placeholder="e.g. Use invoice number as reference"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Payment Instructions</Form.Label>
          <Form.Control
            as="textarea"
            name="paymentInstructions"
            value={invoiceData.paymentInstructions || settings.paymentInstructions || ''}
            onChange={handleClientChange}
            placeholder="e.g. Email proof of payment to billing@company.com"
            rows={2}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>🌐 Digital Signature / Signed by</Form.Label>
          <Form.Control
            type="text"
            name="signature"
            value={invoiceData.signature || ''}
            onChange={handleClientChange}
            placeholder="e.g. MthombeniGR"
          />
        </Form.Group>

        <Form.Group className="mb-4" controlId="signaturePad">
          <Form.Label>✍️ Digital Signature</Form.Label>
          <SignatureCapture
            onSave={(dataUrl) => setInvoiceData((prev) => ({ ...prev, signatureImageBase64: dataUrl }))}
          />
        </Form.Group>
      </Form>
    </div>
  );
}

export default InvoiceForm;
