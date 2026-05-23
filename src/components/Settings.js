// src/components/Settings.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Image,
  Row,
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useSettings } from '../context/SettingsContext';

function Settings() {
  const { settings, setSettings, resetSettings } = useSettings();
  const [formData, setFormData] = useState(settings);
  const [logoPreview, setLogoPreview] = useState(
    settings.logoDataUrl || settings.logoUrl || ''
  );
  const [activeSection, setActiveSection] = useState('branding');

  useEffect(() => {
    setFormData(settings);
    setLogoPreview(settings.logoDataUrl || settings.logoUrl || '');
  }, [settings]);

  const readiness = useMemo(() => {
    const registration = formData.registrationDetails || {};
    const bank = formData.bankDetails || {};
    const solarDefaults = formData.solarDefaults || {};

    const brandingReady = Boolean(
      formData.companyName &&
        formData.companyEmail &&
        formData.companyPhone &&
        (formData.logoDataUrl || formData.logoUrl)
    );

    const complianceReady = Boolean(
      registration.companyRegistrationNo ||
        registration.vatNumber ||
        registration.electricalContractorNo ||
        registration.registeredPersonName ||
        registration.registeredPersonNo
    );

    const bankingReady = Boolean(
      bank.bank &&
        bank.accountName &&
        bank.accountNo &&
        bank.branchCode
    );

    const solarReady = Boolean(
      solarDefaults.defaultDocumentType &&
        solarDefaults.defaultQuoteValidityDays &&
        solarDefaults.defaultPaymentMilestone
    );

    const paymentReady = Boolean(
      formData.paymentOptions && formData.paymentInstructions
    );

    const termsReady = Boolean(formData.terms && formData.terms.length > 80);

    return {
      branding: brandingReady,
      compliance: complianceReady,
      banking: bankingReady,
      solar: solarReady,
      payment: paymentReady,
      terms: termsReady,
    };
  }, [formData]);

  const readyCount = Object.values(readiness).filter(Boolean).length;
  const readinessPercentage = Math.round((readyCount / 6) * 100);

  const sectionNav = [
    { key: 'branding', icon: '🏢', label: 'Branding' },
    { key: 'compliance', icon: '⚡', label: 'Compliance' },
    { key: 'banking', icon: '💰', label: 'Banking' },
    { key: 'solar', icon: '☀️', label: 'Solar' },
    { key: 'payment', icon: '💳', label: 'Payment' },
    { key: 'terms', icon: '📄', label: 'Terms' },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleNestedChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [field]: value,
      },
    }));
  };

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    handleNestedChange('bankDetails', name, value);
  };

  const handleRegistrationChange = (e) => {
    const { name, value } = e.target;
    handleNestedChange('registrationDetails', name, value);
  };

  const handleSolarDefaultChange = (e) => {
    const { name, value } = e.target;
    handleNestedChange('solarDefaults', name, value);
  };

  const handleNumberSolarDefaultChange = (e) => {
    const { name, value } = e.target;
    handleNestedChange('solarDefaults', name, Number(value) || 0);
  };

  const syncDepositBalance = (depositValue) => {
    const deposit = Math.min(100, Math.max(0, Number(depositValue) || 0));
    const balance = Math.max(0, 100 - deposit);

    setFormData((prev) => ({
      ...prev,
      solarDefaults: {
        ...(prev.solarDefaults || {}),
        defaultDepositPercentage: deposit,
        defaultBalancePercentage: balance,
      },
    }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo file is too large. Please upload an image smaller than 2MB.');
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        logoDataUrl: reader.result,
      }));
      setLogoPreview(reader.result);
      toast.success('✅ Logo uploaded locally.');
    };

    reader.readAsDataURL(file);
  };

  const removeUploadedLogo = () => {
    setFormData((prev) => ({
      ...prev,
      logoDataUrl: '',
    }));
    setLogoPreview(formData.logoUrl || '/logo.png');
    toast.info('Uploaded logo removed. Default logo path will be used.');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSettings(formData);
    toast.success('✅ Solar invoice settings saved successfully.');
  };

  const handleReset = () => {
    const confirmed = window.confirm(
      'Reset all settings to the default TP Electro solar invoicing setup?'
    );

    if (!confirmed) return;

    if (typeof resetSettings === 'function') {
      resetSettings();
      toast.success('🔁 Settings reset to solar invoicing defaults.');
      return;
    }

    toast.error('Reset function is not available in SettingsContext.');
  };

  const SectionTitle = ({ icon, title, subtitle, complete }) => (
    <div className="invoice-section-title">
      <span className="invoice-section-icon">{icon}</span>
      <div>
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </div>
      <Badge bg={complete ? 'success' : 'secondary'} className="ms-auto">
        {complete ? 'Ready' : 'Check'}
      </Badge>
    </div>
  );

  const currentProfileName = formData.companyName || 'Company not set';

  return (
    <div className="saved-invoices-page settings-page">
      <section className="saved-hero-card">
        <div>
          <Badge bg="success" className="mb-2">
            Solar / Electrical Setup
          </Badge>
          <h5 className="fw-bold mb-1">Company & invoice settings</h5>
          <p className="text-muted mb-0">
            Configure branding, banking, VAT, compliance wording and default solar
            quotation settings for bank-ready documents.
          </p>
        </div>

        <div className="builder-document-pill">
          <small>Current profile</small>
          <strong>{currentProfileName}</strong>
        </div>
      </section>

      <Card className="border-0 shadow-sm mb-3 invoice-mobile-guide">
        <Card.Body>
          <div className="builder-progress-wrap mt-0">
            <div className="builder-progress-top">
              <span>Settings readiness</span>
              <strong>{readinessPercentage}%</strong>
            </div>

            <div className="builder-progress-track" aria-hidden="true">
              <div
                className="builder-progress-fill"
                style={{ width: `${readinessPercentage}%` }}
              />
            </div>
          </div>

          <div className="invoice-section-nav mt-3">
            {sectionNav.map((section) => (
              <button
                key={section.key}
                type="button"
                className={activeSection === section.key ? 'active' : ''}
                onClick={() => setActiveSection(section.key)}
              >
                <span>{section.icon}</span>
                <small>{section.label}</small>
                {readiness[section.key] && <i aria-hidden="true">✓</i>}
              </button>
            ))}
          </div>
        </Card.Body>
      </Card>

      <Form onSubmit={handleSubmit}>
        <Accordion
          activeKey={activeSection}
          onSelect={(eventKey) => eventKey && setActiveSection(eventKey)}
          className="invoice-guided-accordion"
        >
          <Accordion.Item eventKey="branding">
            <Accordion.Header>
              <SectionTitle
                icon="🏢"
                title="Company Branding"
                subtitle="Company name, contact details, website and logo"
                complete={readiness.branding}
              />
            </Accordion.Header>

            <Accordion.Body>
              <Alert variant="light" className="border">
                These details appear on previews, PDFs, emails and payment pages.
                Use your real business details here to make the documents look more
                credible to banks and clients.
              </Alert>

              <Row className="g-3">
                <Col lg={6}>
                  <Form.Group controlId="companyName">
                    <Form.Label>Company Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="companyName"
                      value={formData.companyName || ''}
                      onChange={handleChange}
                      placeholder="e.g. TP Electro"
                    />
                  </Form.Group>
                </Col>

                <Col lg={6}>
                  <Form.Group controlId="slogan">
                    <Form.Label>Company Slogan</Form.Label>
                    <Form.Control
                      type="text"
                      name="slogan"
                      value={formData.slogan || ''}
                      onChange={handleChange}
                      placeholder="Reliable solar and electrical solutions"
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group controlId="companyEmail">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="companyEmail"
                      value={formData.companyEmail || ''}
                      onChange={handleChange}
                      placeholder="info@tpelectro.co.za"
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group controlId="companyPhone">
                    <Form.Label>Phone</Form.Label>
                    <Form.Control
                      type="text"
                      name="companyPhone"
                      value={formData.companyPhone || ''}
                      onChange={handleChange}
                      placeholder="+27 ..."
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group controlId="website">
                    <Form.Label>Website</Form.Label>
                    <Form.Control
                      type="text"
                      name="website"
                      value={formData.website || ''}
                      onChange={handleChange}
                      placeholder="www.tpelectro.co.za"
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group controlId="logoUrl">
                    <Form.Label>Default Logo Path</Form.Label>
                    <Form.Control
                      type="text"
                      name="logoUrl"
                      value={formData.logoUrl || ''}
                      onChange={handleChange}
                      placeholder="/logo.png"
                    />
                    <Form.Text className="text-muted">
                      Use this when your logo is stored inside the public folder.
                    </Form.Text>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group controlId="logoUpload">
                    <Form.Label>Upload Logo</Form.Label>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                    <Form.Text className="text-muted">
                      Uploading stores the logo locally in this browser.
                    </Form.Text>
                  </Form.Group>
                </Col>

                {logoPreview && (
                  <Col xs={12}>
                    <div className="company-block">
                      <div className="company-logo-wrap">
                        <Image
                          src={logoPreview}
                          alt="Logo Preview"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>

                      <div>
                        <h2>Logo Preview</h2>
                        <p>
                          This logo will be used on invoice previews and PDF exports.
                        </p>
                        <p className="muted-line">
                          Current source:{' '}
                          {formData.logoDataUrl ? 'Uploaded browser logo' : formData.logoUrl || '/logo.png'}
                        </p>

                        {formData.logoDataUrl && (
                          <Button
                            type="button"
                            variant="outline-danger"
                            size="sm"
                            onClick={removeUploadedLogo}
                          >
                            Remove Uploaded Logo
                          </Button>
                        )}
                      </div>
                    </div>
                  </Col>
                )}
              </Row>
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="compliance">
            <Accordion.Header>
              <SectionTitle
                icon="⚡"
                title="Electrical & Compliance Details"
                subtitle="Business registration, VAT, contractor and wireman details"
                complete={readiness.compliance}
              />
            </Accordion.Header>

            <Accordion.Body>
              <Alert variant="warning">
                For bank-ready and insurance-friendly documents, add as many
                registration/compliance details as you can. Leave unknown fields blank
                until confirmed.
              </Alert>

              <Row className="g-3">
                <Col md={4}>
                  <Form.Group controlId="companyRegistrationNo">
                    <Form.Label>Company Registration No.</Form.Label>
                    <Form.Control
                      type="text"
                      name="companyRegistrationNo"
                      value={formData.registrationDetails?.companyRegistrationNo || ''}
                      onChange={handleRegistrationChange}
                      placeholder="e.g. 2024/..."
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group controlId="vatNumber">
                    <Form.Label>VAT Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="vatNumber"
                      value={formData.registrationDetails?.vatNumber || ''}
                      onChange={handleRegistrationChange}
                      placeholder="Optional"
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group controlId="electricalContractorNo">
                    <Form.Label>Electrical Contractor No.</Form.Label>
                    <Form.Control
                      type="text"
                      name="electricalContractorNo"
                      value={formData.registrationDetails?.electricalContractorNo || ''}
                      onChange={handleRegistrationChange}
                      placeholder="Optional"
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group controlId="registeredPersonName">
                    <Form.Label>Registered Person / Wireman Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="registeredPersonName"
                      value={formData.registrationDetails?.registeredPersonName || ''}
                      onChange={handleRegistrationChange}
                      placeholder="Optional"
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group controlId="registeredPersonNo">
                    <Form.Label>Registered Person No.</Form.Label>
                    <Form.Control
                      type="text"
                      name="registeredPersonNo"
                      value={formData.registrationDetails?.registeredPersonNo || ''}
                      onChange={handleRegistrationChange}
                      placeholder="Optional"
                    />
                  </Form.Group>
                </Col>

                <Col xs={12}>
                  <Form.Group controlId="serviceAreas">
                    <Form.Label>Service Areas</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="serviceAreas"
                      value={formData.registrationDetails?.serviceAreas || ''}
                      onChange={handleRegistrationChange}
                      placeholder="Johannesburg, Pretoria, Gauteng..."
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="banking">
            <Accordion.Header>
              <SectionTitle
                icon="💰"
                title="Currency, VAT & Bank Details"
                subtitle="Currency, VAT default and EFT payment details"
                complete={readiness.banking}
              />
            </Accordion.Header>

            <Accordion.Body>
              <Row className="g-3 mb-3">
                <Col md={6}>
                  <Form.Group controlId="currency">
                    <Form.Label>Currency</Form.Label>
                    <Form.Select
                      name="currency"
                      value={formData.currency || 'ZAR'}
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
                    <Form.Label>VAT</Form.Label>
                    <Form.Check
                      type="switch"
                      name="includeVAT"
                      label="Include VAT by default at 15%"
                      checked={Boolean(formData.includeVAT)}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="g-3">
                <Col md={4}>
                  <Form.Group controlId="bank">
                    <Form.Label>Bank Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="bank"
                      value={formData.bankDetails?.bank || ''}
                      onChange={handleBankChange}
                      placeholder="e.g. FNB, Standard Bank, Capitec"
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group controlId="accountName">
                    <Form.Label>Account Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="accountName"
                      value={formData.bankDetails?.accountName || ''}
                      onChange={handleBankChange}
                      placeholder="Account holder name"
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group controlId="accountType">
                    <Form.Label>Account Type</Form.Label>
                    <Form.Control
                      type="text"
                      name="accountType"
                      value={formData.bankDetails?.accountType || ''}
                      onChange={handleBankChange}
                      placeholder="Business Current Account"
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group controlId="accountNo">
                    <Form.Label>Account No.</Form.Label>
                    <Form.Control
                      type="text"
                      name="accountNo"
                      value={formData.bankDetails?.accountNo || ''}
                      onChange={handleBankChange}
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group controlId="branchCode">
                    <Form.Label>Branch Code</Form.Label>
                    <Form.Control
                      type="text"
                      name="branchCode"
                      value={formData.bankDetails?.branchCode || ''}
                      onChange={handleBankChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="solar">
            <Accordion.Header>
              <SectionTitle
                icon="☀️"
                title="Solar Quotation Defaults"
                subtitle="Quote validity, deposit, balance, warranty and compliance wording"
                complete={readiness.solar}
              />
            </Accordion.Header>

            <Accordion.Body>
              <Row className="g-3">
                <Col md={4}>
                  <Form.Group controlId="defaultDocumentType">
                    <Form.Label>Default Document Type</Form.Label>
                    <Form.Select
                      name="defaultDocumentType"
                      value={formData.solarDefaults?.defaultDocumentType || 'Solar Quotation'}
                      onChange={handleSolarDefaultChange}
                    >
                      <option value="Solar Quotation">Solar Quotation</option>
                      <option value="Proforma Invoice">Proforma Invoice</option>
                      <option value="Tax Invoice">Tax Invoice</option>
                      <option value="Receipt">Receipt</option>
                      <option value="Electrical COC Invoice">Electrical COC Invoice</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group controlId="defaultQuoteValidityDays">
                    <Form.Label>Quote Validity Days</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      name="defaultQuoteValidityDays"
                      value={formData.solarDefaults?.defaultQuoteValidityDays || 7}
                      onChange={handleNumberSolarDefaultChange}
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group controlId="defaultWorkmanshipWarranty">
                    <Form.Label>Workmanship Warranty</Form.Label>
                    <Form.Control
                      type="text"
                      name="defaultWorkmanshipWarranty"
                      value={formData.solarDefaults?.defaultWorkmanshipWarranty || ''}
                      onChange={handleSolarDefaultChange}
                      placeholder="e.g. 12 months workmanship warranty"
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group controlId="defaultDepositPercentage">
                    <Form.Label>Default Deposit %</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      max="100"
                      name="defaultDepositPercentage"
                      value={formData.solarDefaults?.defaultDepositPercentage || 0}
                      onChange={(e) => syncDepositBalance(e.target.value)}
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group controlId="defaultBalancePercentage">
                    <Form.Label>Default Balance %</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      max="100"
                      name="defaultBalancePercentage"
                      value={formData.solarDefaults?.defaultBalancePercentage || 0}
                      onChange={handleNumberSolarDefaultChange}
                    />
                  </Form.Group>
                </Col>

                <Col xs={12}>
                  <Form.Group controlId="defaultPaymentMilestone">
                    <Form.Label>Default Payment Milestone</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="defaultPaymentMilestone"
                      value={formData.solarDefaults?.defaultPaymentMilestone || ''}
                      onChange={handleSolarDefaultChange}
                      placeholder="Example: 70% deposit to secure equipment, 30% balance before final handover."
                    />
                  </Form.Group>
                </Col>

                <Col xs={12}>
                  <Form.Group controlId="defaultEquipmentWarranty">
                    <Form.Label>Equipment Warranty Wording</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="defaultEquipmentWarranty"
                      value={formData.solarDefaults?.defaultEquipmentWarranty || ''}
                      onChange={handleSolarDefaultChange}
                    />
                  </Form.Group>
                </Col>

                <Col xs={12}>
                  <Form.Group controlId="defaultCocNote">
                    <Form.Label>COC Wording</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="defaultCocNote"
                      value={formData.solarDefaults?.defaultCocNote || ''}
                      onChange={handleSolarDefaultChange}
                    />
                  </Form.Group>
                </Col>

                <Col xs={12}>
                  <Form.Group controlId="defaultSsegNote">
                    <Form.Label>SSEG / Municipal Registration Wording</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="defaultSsegNote"
                      value={formData.solarDefaults?.defaultSsegNote || ''}
                      onChange={handleSolarDefaultChange}
                    />
                  </Form.Group>
                </Col>

                <Col xs={12}>
                  <Form.Group controlId="defaultExclusions">
                    <Form.Label>Default Exclusions</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="defaultExclusions"
                      value={formData.solarDefaults?.defaultExclusions || ''}
                      onChange={handleSolarDefaultChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="payment">
            <Accordion.Header>
              <SectionTitle
                icon="💳"
                title="Payment Instructions"
                subtitle="Default payment methods and client payment wording"
                complete={readiness.payment}
              />
            </Accordion.Header>

            <Accordion.Body>
              <Row className="g-3">
                <Col xs={12}>
                  <Form.Group controlId="paymentOptions">
                    <Form.Label>Default Payment Methods</Form.Label>
                    <Form.Control
                      type="text"
                      name="paymentOptions"
                      value={formData.paymentOptions || ''}
                      onChange={handleChange}
                      placeholder="EFT, Card, SnapScan"
                    />
                  </Form.Group>
                </Col>

                <Col xs={12}>
                  <Form.Group controlId="paymentInstructions">
                    <Form.Label>Payment Instructions</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="paymentInstructions"
                      value={formData.paymentInstructions || ''}
                      onChange={handleChange}
                      placeholder="Use the quotation/invoice number as payment reference."
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="terms">
            <Accordion.Header>
              <SectionTitle
                icon="📄"
                title="Default Solar Terms & Conditions"
                subtitle="Commercial, warranty, compliance and POPIA wording"
                complete={readiness.terms}
              />
            </Accordion.Header>

            <Accordion.Body>
              <Alert variant="info">
                Keep this wording professional but practical. It protects the
                business while explaining deposits, COC, SSEG support, warranties,
                exclusions and POPIA.
              </Alert>

              <Form.Group controlId="terms">
                <Form.Label>Terms & Conditions</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={14}
                  name="terms"
                  value={formData.terms || ''}
                  onChange={handleChange}
                />
              </Form.Group>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>

        <div className="builder-mobile-action-bar d-md-none">
          <button
            type="button"
            className="builder-mobile-secondary"
            onClick={handleReset}
          >
            Reset
          </button>

          <button type="submit" className="builder-mobile-primary">
            Save Settings
          </button>
        </div>

        <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap my-4">
          <Button variant="outline-danger" type="button" onClick={handleReset}>
            ♻️ Reset to Solar Defaults
          </Button>

          <Button variant="success" type="submit">
            💾 Save Solar Settings
          </Button>
        </div>
      </Form>
    </div>
  );
}

export default Settings;