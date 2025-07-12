// ✅ UPDATED: src/components/Settings.js with Logo Upload
import React, { useState, useEffect } from 'react';
import { Card, Form, Row, Col, Button, Image } from 'react-bootstrap';
import { useSettings } from '../context/SettingsContext';

const defaultSettings = {
  companyName: 'Future Finance Group',
  companyEmail: 'info@futurefinance.co.za',
  companyPhone: '+27 87 123 4567',
  logoUrl: '/logo.png',
  logoDataUrl: '',
  website: 'www.futurefinance.co.za',
  includeVAT: true,
  currency: 'ZAR',
  bankDetails: {
    bank: 'Standard Bank',
    accountNo: '123 456 789',
    branchCode: '051001',
  },
  terms: `Payment Terms: Payment due within 7 calendar days of invoice date. Late payments will incur a 2% monthly fee.

Warranty: Services/products include a 12-month workmanship warranty unless otherwise stated.

Refund Policy: Refunds are only applicable for cancellations made within 5 days of invoice date. No refunds on delivered or executed work.

SARS Compliance: This invoice is compliant with the VAT Act and SARS invoice formatting requirements.

POPIA Notice: Client information is securely processed and stored in compliance with the Protection of Personal Information Act (POPIA).`,
  slogan: 'Empowering your future, one invoice at a time.',
  paymentOptions: 'SnapScan, EFT, Credit Card',
  paymentInstructions: 'Use invoice number as payment reference.',
};

function Settings() {
  const { settings, setSettings } = useSettings();
  const [formData, setFormData] = useState(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        [name]: value,
      },
    }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, logoDataUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSettings(formData);
    alert('✅ Settings saved successfully!');
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset settings to default values?')) {
      setSettings(defaultSettings);
      alert('🔁 Settings have been reset to default.');
    }
  };

  return (
    <div className="container py-4">
    

      <Card className="shadow-sm">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="companyName">
                  <Form.Label>Company Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="logoUpload">
                  <Form.Label>Upload Logo</Form.Label>
                  <Form.Control type="file" accept="image/*" onChange={handleLogoUpload} />
                  {formData.logoDataUrl && (
                    <Image
                      src={formData.logoDataUrl}
                      alt="Logo Preview"
                      className="mt-2 border"
                      style={{ maxHeight: '100px', objectFit: 'contain' }}
                      thumbnail
                    />
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={4}>
                <Form.Group controlId="companyEmail">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="companyEmail"
                    value={formData.companyEmail}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="companyPhone">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="text"
                    name="companyPhone"
                    value={formData.companyPhone}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="website">
                  <Form.Label>Website</Form.Label>
                  <Form.Control
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="currency">
                  <Form.Label>Currency</Form.Label>
                  <Form.Select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                  >
                    <option value="ZAR">ZAR (South African Rand)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="GBP">GBP (British Pound)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="includeVAT">
                  <Form.Label>Include VAT by Default</Form.Label>
                  <Form.Check
                    type="switch"
                    name="includeVAT"
                    label="Enable VAT (15%)"
                    checked={formData.includeVAT}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <h5 className="mt-4">🏦 Bank Details</h5>
            <Row className="mb-3">
              <Col md={4}>
                <Form.Group controlId="bank">
                  <Form.Label>Bank Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="bank"
                    value={formData.bankDetails.bank}
                    onChange={handleBankChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="accountNo">
                  <Form.Label>Account No</Form.Label>
                  <Form.Control
                    type="text"
                    name="accountNo"
                    value={formData.bankDetails.accountNo}
                    onChange={handleBankChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="branchCode">
                  <Form.Label>Branch Code</Form.Label>
                  <Form.Control
                    type="text"
                    name="branchCode"
                    value={formData.bankDetails.branchCode}
                    onChange={handleBankChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3" controlId="paymentOptions">
              <Form.Label>Default Payment Methods</Form.Label>
              <Form.Control
                type="text"
                name="paymentOptions"
                value={formData.paymentOptions}
                onChange={handleChange}
                placeholder="e.g. SnapScan, EFT, Credit Card"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="paymentInstructions">
              <Form.Label>Payment Instructions</Form.Label>
              <Form.Control
                type="text"
                name="paymentInstructions"
                value={formData.paymentInstructions}
                onChange={handleChange}
                placeholder="e.g. Use invoice number as reference"
              />
            </Form.Group>

            <Form.Group controlId="terms" className="mb-3">
              <Form.Label>Default Terms & Conditions</Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                name="terms"
                value={formData.terms}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group controlId="slogan" className="mb-3">
              <Form.Label>Company Slogan</Form.Label>
              <Form.Control
                type="text"
                name="slogan"
                value={formData.slogan}
                onChange={handleChange}
              />
            </Form.Group>

            <div className="d-flex justify-content-between">
              <Button variant="outline-danger" type="button" onClick={handleReset}>
                ♻️ Reset to Default
              </Button>
              <Button variant="primary" type="submit">
                💾 Save Settings
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}

export default Settings;
