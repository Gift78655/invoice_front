// src/components/InvoiceForm.js
import React, { useMemo, useState } from 'react';
import ItemRow from './ItemRow';
import {
  Accordion,
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Row,
} from 'react-bootstrap';
import { v4 as uuidv4 } from 'uuid';
import { useSettings } from '../context/SettingsContext';
import SignatureCapture from './SignaturePad';

const templateButtons = [
  { key: 'backup5', label: '5kW Backup', variant: 'outline-primary' },
  { key: 'hybrid5', label: '5kW Hybrid', variant: 'outline-success' },
  { key: 'hybrid8', label: '8kW Hybrid', variant: 'outline-success' },
  { key: 'threePhase12', label: '12kW 3-Phase', variant: 'outline-dark' },
  { key: 'batteryUpgrade', label: 'Battery Upgrade', variant: 'outline-warning' },
  { key: 'geyserwise', label: 'GeyserWise', variant: 'outline-info' },
  { key: 'maintenance', label: 'Maintenance', variant: 'outline-secondary' },
  { key: 'coc', label: 'COC', variant: 'outline-danger' },
];

const addIds = (items) =>
  items.map((item) => ({
    id: uuidv4(),
    brand: '',
    model: '',
    rating: '',
    warranty: '',
    notes: '',
    ...item,
  }));

const getSolarTemplate = (templateType) => {
  const templates = {
    backup5: {
      documentType: 'Solar Quotation',
      projectType: 'Backup Power System',
      phaseType: 'Single Phase',
      roofType: 'Not Applicable',
      systemDetails: {
        inverterSizeKw: '5',
        batteryCapacityKwh: '5',
        pvSizeKwp: '',
        numberOfPanels: '',
        monitoringIncluded: true,
        backupCircuits: 'Essential loads only',
      },
      compliance: {
        cocIncluded: true,
        ssegIncluded: false,
        singleLineDiagramIncluded: true,
        commissioningReportIncluded: true,
      },
      solarNotes:
        'Backup system intended for selected essential loads. Final circuit allocation must be confirmed during site assessment.',
      items: addIds([
        {
          category: 'Inverter',
          brand: 'To be confirmed',
          model: '5kW hybrid inverter',
          rating: '5kW',
          warranty: 'Manufacturer warranty',
          description: 'Hybrid inverter for essential load backup',
          quantity: 1,
          price: 0,
        },
        {
          category: 'Battery',
          brand: 'To be confirmed',
          model: 'Lithium battery',
          rating: '5kWh',
          warranty: 'Manufacturer warranty',
          description: 'Lithium battery storage system',
          quantity: 1,
          price: 0,
        },
        {
          category: 'AC Protection',
          description: 'AC protection, changeover and DB integration material',
          rating: 'As required',
          warranty: 'Workmanship warranty',
          quantity: 1,
          price: 0,
        },
        {
          category: 'Cabling',
          description: 'AC cabling, trunking, consumables and accessories',
          rating: 'As required',
          warranty: 'Workmanship warranty',
          quantity: 1,
          price: 0,
        },
        {
          category: 'Monitoring',
          description: 'WiFi / monitoring setup where supported',
          rating: 'Included',
          warranty: 'Configuration support',
          quantity: 1,
          price: 0,
        },
        {
          category: 'Labour',
          description: 'Installation, testing and commissioning',
          rating: 'Labour',
          warranty: 'Workmanship warranty',
          quantity: 1,
          price: 0,
        },
        {
          category: 'COC',
          description: 'Electrical COC where applicable and compliant',
          rating: 'Compliance',
          warranty: 'Subject to inspection',
          quantity: 1,
          price: 0,
        },
      ]),
    },

    hybrid5: {
      documentType: 'Solar Quotation',
      projectType: 'Hybrid Solar System',
      phaseType: 'Single Phase',
      roofType: 'Tiled Roof',
      systemDetails: {
        inverterSizeKw: '5',
        batteryCapacityKwh: '5',
        pvSizeKwp: '4.4',
        numberOfPanels: '8',
        monitoringIncluded: true,
        backupCircuits: 'Essential loads and selected circuits',
      },
      compliance: {
        cocIncluded: true,
        ssegIncluded: true,
        singleLineDiagramIncluded: true,
        commissioningReportIncluded: true,
      },
      solarNotes:
        'Hybrid solar system with PV generation, battery backup and selected essential load support. Final PV layout is subject to roof inspection.',
      items: addIds([
        {
          category: 'Inverter',
          brand: 'Deye / Sunsynk / Equivalent',
          model: '5kW hybrid inverter',
          rating: '5kW',
          warranty: 'Manufacturer warranty',
          description: 'Hybrid inverter with battery and PV integration',
          quantity: 1,
          price: 0,
        },
        {
          category: 'Battery',
          brand: 'Felicity / Equivalent',
          model: 'Lithium battery',
          rating: '5kWh',
          warranty: 'Manufacturer warranty',
          description: 'Lithium battery storage',
          quantity: 1,
          price: 0,
        },
        {
          category: 'Solar Panels',
          brand: 'JA Solar / Canadian / Equivalent',
          model: 'Mono solar panel',
          rating: '550W',
          warranty: 'Manufacturer warranty',
          description: 'Solar PV modules',
          quantity: 8,
          price: 0,
        },
        {
          category: 'Mounting',
          description: 'Roof mounting structure, clamps and accessories',
          rating: 'Roof specific',
          warranty: 'Workmanship warranty',
          quantity: 1,
          price: 0,
        },
        {
          category: 'DC Protection',
          description: 'DC combiner, isolators, fuses and surge protection',
          rating: 'As required',
          warranty: 'Manufacturer / workmanship warranty',
          quantity: 1,
          price: 0,
        },
        {
          category: 'AC Protection',
          description: 'AC protection, changeover and DB integration',
          rating: 'As required',
          warranty: 'Manufacturer / workmanship warranty',
          quantity: 1,
          price: 0,
        },
        {
          category: 'Cabling',
          description: 'AC/DC cabling, trunking, conduit and consumables',
          rating: 'As required',
          warranty: 'Workmanship warranty',
          quantity: 1,
          price: 0,
        },
        {
          category: 'Monitoring',
          description: 'WiFi / monitoring setup where supported',
          rating: 'Included',
          warranty: 'Configuration support',
          quantity: 1,
          price: 0,
        },
        {
          category: 'Labour',
          description: 'Installation, testing and commissioning',
          rating: 'Labour',
          warranty: 'Workmanship warranty',
          quantity: 1,
          price: 0,
        },
        {
          category: 'SSEG',
          description: 'SSEG support and single-line diagram where applicable',
          rating: 'Documentation',
          warranty: 'Subject to municipality',
          quantity: 1,
          price: 0,
        },
      ]),
    },

    hybrid8: {
      documentType: 'Solar Quotation',
      projectType: 'Hybrid Solar System',
      phaseType: 'Single Phase',
      roofType: 'IBR / Metal Roof',
      systemDetails: {
        inverterSizeKw: '8',
        batteryCapacityKwh: '10',
        pvSizeKwp: '6.6',
        numberOfPanels: '12',
        monitoringIncluded: true,
        backupCircuits:
          'Essential loads, refrigeration, office loads and selected appliances',
      },
      compliance: {
        cocIncluded: true,
        ssegIncluded: true,
        singleLineDiagramIncluded: true,
        commissioningReportIncluded: true,
      },
      solarNotes:
        'Larger hybrid system suitable for homes or small businesses with moderate daytime consumption and backup requirements.',
      items: addIds([
        {
          category: 'Inverter',
          brand: 'Deye / Sunsynk / Equivalent',
          model: '8kW hybrid inverter',
          rating: '8kW',
          warranty: 'Manufacturer warranty',
          description: 'Hybrid inverter with PV and battery integration',
          quantity: 1,
          price: 0,
        },
        {
          category: 'Battery',
          brand: 'Felicity / Equivalent',
          model: 'Lithium battery bank',
          rating: '10kWh',
          warranty: 'Manufacturer warranty',
          description: 'Lithium battery storage bank',
          quantity: 1,
          price: 0,
        },
        {
          category: 'Solar Panels',
          brand: 'JA Solar / Canadian / Equivalent',
          model: 'Mono solar panel',
          rating: '550W',
          warranty: 'Manufacturer warranty',
          description: 'Solar PV modules',
          quantity: 12,
          price: 0,
        },
        {
          category: 'Mounting',
          description: 'IBR/metal roof mounting structure and accessories',
          rating: 'Roof specific',
          warranty: 'Workmanship warranty',
          quantity: 1,
          price: 0,
        },
        {
          category: 'DC Protection',
          description: 'DC protection, combiner, isolators and surge protection',
          rating: 'As required',
          warranty: 'Manufacturer / workmanship warranty',
          quantity: 1,
          price: 0,
        },
        {
          category: 'AC Protection',
          description: 'AC protection, changeover, breakers and DB integration',
          rating: 'As required',
          warranty: 'Manufacturer / workmanship warranty',
          quantity: 1,
          price: 0,
        },
        {
          category: 'Cabling',
          description: 'AC/DC cabling, conduit, trunking and consumables',
          rating: 'As required',
          warranty: 'Workmanship warranty',
          quantity: 1,
          price: 0,
        },
        {
          category: 'Monitoring',
          description: 'Monitoring and WiFi configuration',
          rating: 'Included',
          warranty: 'Configuration support',
          quantity: 1,
          price: 0,
        },
        {
          category: 'Labour',
          description: 'Installation, testing and commissioning',
          rating: 'Labour',
          warranty: 'Workmanship warranty',
          quantity: 1,
          price: 0,
        },
        {
          category: 'SSEG',
          description: 'SSEG documentation support where applicable',
          rating: 'Documentation',
          warranty: 'Subject to municipality',
          quantity: 1,
          price: 0,
        },
      ]),
    },

    threePhase12: {
      documentType: 'Solar Quotation',
      projectType: 'Hybrid Solar System',
      phaseType: 'Three Phase',
      roofType: 'To be Confirmed',
      systemDetails: {
        inverterSizeKw: '12',
        batteryCapacityKwh: '20',
        pvSizeKwp: '13.2',
        numberOfPanels: '24',
        monitoringIncluded: true,
        backupCircuits: 'Three-phase critical loads subject to load assessment',
      },
      compliance: {
        cocIncluded: true,
        ssegIncluded: true,
        singleLineDiagramIncluded: true,
        commissioningReportIncluded: true,
      },
      solarNotes:
        'Three-phase system subject to detailed load assessment, phase balancing, DB inspection and available installation space.',
      items: addIds([
        {
          category: 'Inverter',
          brand: 'Deye / Sunsynk / Equivalent',
          model: 'Three-phase hybrid inverter system',
          rating: '12kW',
          warranty: 'Manufacturer warranty',
          description: 'Three-phase hybrid inverter solution',
          quantity: 1,
          price: 0,
        },
        {
          category: 'Battery',
          brand: 'Felicity / Equivalent',
          model: 'Lithium battery storage',
          rating: '20kWh',
          warranty: 'Manufacturer warranty',
          description: 'Lithium battery storage bank',
          quantity: 1,
          price: 0,
        },
        {
          category: 'Solar Panels',
          brand: 'JA Solar / Canadian / Equivalent',
          model: 'Mono solar panel',
          rating: '550W',
          warranty: 'Manufacturer warranty',
          description: 'Solar PV modules',
          quantity: 24,
          price: 0,
        },
        {
          category: 'Mounting',
          description: 'Roof or ground mounting structure and accessories',
          rating: 'To be confirmed',
          warranty: 'Workmanship warranty',
          quantity: 1,
          price: 0,
        },
        {
          category: 'DC Protection',
          description: 'DC combiner boxes, isolators, fuses and surge protection',
          rating: 'As required',
          warranty: 'Manufacturer / workmanship warranty',
          quantity: 1,
          price: 0,
        },
        {
          category: 'AC Protection',
          description: 'Three-phase AC protection and DB integration',
          rating: 'Three-phase',
          warranty: 'Manufacturer / workmanship warranty',
          quantity: 1,
          price: 0,
        },
        {
          category: 'Cabling',
          description: 'AC/DC cabling, trunking, conduit and consumables',
          rating: 'As required',
          warranty: 'Workmanship warranty',
          quantity: 1,
          price: 0,
        },
        {
          category: 'Labour',
          description: 'Installation, phase checks, testing and commissioning',
          rating: 'Labour',
          warranty: 'Workmanship warranty',
          quantity: 1,
          price: 0,
        },
        {
          category: 'SSEG',
          description:
            'SSEG support, single-line diagram and commissioning documentation',
          rating: 'Documentation',
          warranty: 'Subject to municipality',
          quantity: 1,
          price: 0,
        },
      ]),
    },

    batteryUpgrade: {
      documentType: 'Solar Quotation',
      projectType: 'Battery Upgrade',
      phaseType: 'Single Phase',
      roofType: 'Not Applicable',
      systemDetails: {
        inverterSizeKw: '',
        batteryCapacityKwh: '5',
        pvSizeKwp: '',
        numberOfPanels: '',
        monitoringIncluded: true,
        backupCircuits: 'Existing backup circuits retained unless otherwise stated',
      },
      compliance: {
        cocIncluded: true,
        ssegIncluded: false,
        singleLineDiagramIncluded: false,
        commissioningReportIncluded: true,
      },
      solarNotes:
        'Battery compatibility with the existing inverter must be confirmed before installation.',
      items: addIds([
        {
          category: 'Battery',
          brand: 'Felicity / Equivalent',
          model: 'Lithium battery',
          rating: '5kWh',
          warranty: 'Manufacturer warranty',
          description: 'Lithium battery upgrade',
          quantity: 1,
          price: 0,
        },
        {
          category: 'Cabling',
          description: 'Battery cables, lugs, fuses and accessories',
          rating: 'As required',
          warranty: 'Workmanship warranty',
          quantity: 1,
          price: 0,
        },
        {
          category: 'Labour',
          description: 'Installation, configuration and battery communication setup',
          rating: 'Labour',
          warranty: 'Workmanship warranty',
          quantity: 1,
          price: 0,
        },
        {
          category: 'Monitoring',
          description: 'Monitoring verification where supported',
          rating: 'Included',
          warranty: 'Configuration support',
          quantity: 1,
          price: 0,
        },
      ]),
    },

    geyserwise: {
      documentType: 'Solar Quotation',
      projectType: 'Solar Geyser / Geyserwise Conversion',
      phaseType: 'Single Phase',
      roofType: 'Not Applicable',
      systemDetails: {
        inverterSizeKw: '',
        batteryCapacityKwh: '',
        pvSizeKwp: '',
        numberOfPanels: '',
        monitoringIncluded: false,
        backupCircuits: 'Geyser circuit only',
      },
      compliance: {
        cocIncluded: true,
        ssegIncluded: false,
        singleLineDiagramIncluded: false,
        commissioningReportIncluded: true,
      },
      solarNotes:
        'Geyser conversion subject to geyser condition, access, wiring condition and existing protection devices.',
      items: addIds([
        {
          category: 'Geyser Conversion',
          brand: 'GeyserWise / Equivalent',
          model: 'Geyser control conversion kit',
          rating: 'To be confirmed',
          warranty: 'Manufacturer warranty',
          description: 'GeyserWise / geyser control conversion kit',
          quantity: 1,
          price: 0,
        },
        {
          category: 'AC Protection',
          description: 'Protection and control wiring material where required',
          rating: 'As required',
          warranty: 'Workmanship warranty',
          quantity: 1,
          price: 0,
        },
        {
          category: 'Labour',
          description: 'Installation, configuration and testing',
          rating: 'Labour',
          warranty: 'Workmanship warranty',
          quantity: 1,
          price: 0,
        },
        {
          category: 'COC',
          description: 'COC where applicable and compliant',
          rating: 'Compliance',
          warranty: 'Subject to inspection',
          quantity: 1,
          price: 0,
        },
      ]),
    },

    maintenance: {
      documentType: 'Solar Quotation',
      projectType: 'Maintenance / Troubleshooting',
      phaseType: 'Unknown / To be Confirmed',
      roofType: 'To be Confirmed',
      systemDetails: {
        inverterSizeKw: '',
        batteryCapacityKwh: '',
        pvSizeKwp: '',
        numberOfPanels: '',
        monitoringIncluded: false,
        backupCircuits: '',
      },
      compliance: {
        cocIncluded: false,
        ssegIncluded: false,
        singleLineDiagramIncluded: false,
        commissioningReportIncluded: true,
      },
      solarNotes:
        'Maintenance and troubleshooting excludes replacement parts unless specifically listed.',
      items: addIds([
        {
          category: 'Maintenance',
          description: 'Solar/inverter system inspection and fault finding',
          rating: 'Inspection',
          warranty: 'Service report',
          quantity: 1,
          price: 0,
        },
        {
          category: 'Labour',
          description: 'Technician call-out and labour',
          rating: 'Labour',
          warranty: 'Service workmanship',
          quantity: 1,
          price: 0,
        },
        {
          category: 'Transport',
          description: 'Transport / travel allowance',
          rating: 'Travel',
          warranty: 'N/A',
          quantity: 1,
          price: 0,
        },
      ]),
    },

    coc: {
      documentType: 'Electrical COC Invoice',
      projectType: 'Electrical COC / Compliance Work',
      phaseType: 'Single Phase',
      roofType: 'Not Applicable',
      systemDetails: {
        inverterSizeKw: '',
        batteryCapacityKwh: '',
        pvSizeKwp: '',
        numberOfPanels: '',
        monitoringIncluded: false,
        backupCircuits: '',
      },
      compliance: {
        cocIncluded: true,
        ssegIncluded: false,
        singleLineDiagramIncluded: false,
        commissioningReportIncluded: false,
      },
      solarNotes:
        'COC issuing is subject to inspection, testing and confirmation that the installation is compliant.',
      items: addIds([
        {
          category: 'COC',
          description: 'Inspection, testing and COC issuing where compliant',
          rating: 'Compliance',
          warranty: 'Subject to inspection',
          quantity: 1,
          price: 0,
        },
        {
          category: 'Labour',
          description: 'Corrective electrical work if required',
          rating: 'Labour',
          warranty: 'Workmanship warranty',
          quantity: 1,
          price: 0,
        },
        {
          category: 'Transport',
          description: 'Call-out / transport',
          rating: 'Travel',
          warranty: 'N/A',
          quantity: 1,
          price: 0,
        },
      ]),
    },
  };

  return templates[templateType] || null;
};

function InvoiceForm({ invoiceData, setInvoiceData }) {
  const { settings } = useSettings();
  const solarDefaults = settings.solarDefaults || {};
  const registrationDetails = settings.registrationDetails || {};
  const [activeSection, setActiveSection] = useState('setup');

  const vatNumber = registrationDetails.vatNumber || '';
  const includeVAT = invoiceData.includeVAT ?? settings.includeVAT ?? true;
  const isTaxInvoice = invoiceData.documentType === 'Tax Invoice';
  const isQuotation = (invoiceData.documentType || '')
    .toLowerCase()
    .includes('quotation');
  const isProforma = (invoiceData.documentType || '')
    .toLowerCase()
    .includes('proforma');

  const depositPercentage =
    invoiceData.paymentPlan?.depositPercentage ??
    solarDefaults.defaultDepositPercentage ??
    70;

  const balancePercentage =
    invoiceData.paymentPlan?.balancePercentage ??
    solarDefaults.defaultBalancePercentage ??
    30;

  const sectionState = useMemo(() => {
    const hasSetup = Boolean(invoiceData.documentType && invoiceData.status);
    const hasClient = Boolean(invoiceData.clientName && invoiceData.clientEmail);
    const hasProject = Boolean(invoiceData.projectType && (invoiceData.siteAddress || invoiceData.clientAddress));
    const hasCompliance = Boolean(invoiceData.compliance);
    const hasTimeline = Boolean(
      invoiceData.timeline?.quoteDate ||
        invoiceData.timeline?.invoiceDate ||
        invoiceData.installationDate
    );
    const hasEquipment =
      Array.isArray(invoiceData.items) &&
      invoiceData.items.some((item) => item.description);
    const hasPayment = Boolean(invoiceData.paymentPlan);
    const hasTerms = Boolean(invoiceData.terms || invoiceData.exclusions || invoiceData.signature);

    return {
      setup: hasSetup,
      client: hasClient,
      project: hasProject,
      compliance: hasCompliance,
      timeline: hasTimeline,
      equipment: hasEquipment,
      payment: hasPayment,
      terms: hasTerms,
    };
  }, [invoiceData]);

  const sectionNav = [
    { key: 'setup', icon: '☀️', label: 'Setup' },
    { key: 'client', icon: '👤', label: 'Client' },
    { key: 'project', icon: '⚡', label: 'Project' },
    { key: 'equipment', icon: '📦', label: 'Items' },
    { key: 'payment', icon: '💳', label: 'Payment' },
    { key: 'terms', icon: '✍️', label: 'Finish' },
  ];

  const handleTopLevelChange = (e) => {
    const { name, value, type, checked } = e.target;

    setInvoiceData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleNumberTopLevelChange = (e) => {
    const { name, value } = e.target;

    setInvoiceData((prev) => ({
      ...prev,
      [name]: Number(value) || '',
    }));
  };

  const handleTimelineChange = (e) => {
    const { name, value } = e.target;

    setInvoiceData((prev) => ({
      ...prev,
      timeline: {
        ...(prev.timeline || {}),
        [name]: value,
      },
    }));
  };

  const handleNestedChange = (section, field, value) => {
    setInvoiceData((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [field]: value,
      },
    }));
  };

  const handleSystemChange = (e) => {
    const { name, value, type, checked } = e.target;
    handleNestedChange('systemDetails', name, type === 'checkbox' ? checked : value);
  };

  const handleComplianceChange = (e) => {
    const { name, checked } = e.target;
    handleNestedChange('compliance', name, checked);
  };

  const handlePaymentPlanChange = (e) => {
    const { name, value } = e.target;

    setInvoiceData((prev) => ({
      ...prev,
      paymentPlan: {
        ...(prev.paymentPlan || {}),
        [name]: name.includes('Percentage') ? Number(value) || 0 : value,
      },
    }));
  };

  const syncDepositBalance = (depositValue) => {
    const deposit = Math.min(100, Math.max(0, Number(depositValue) || 0));
    const balance = Math.max(0, 100 - deposit);

    setInvoiceData((prev) => ({
      ...prev,
      paymentPlan: {
        ...(prev.paymentPlan || {}),
        depositPercentage: deposit,
        balancePercentage: balance,
      },
    }));
  };

  const handleItemChange = (index, updatedItem) => {
    const updatedItems = [...(invoiceData.items || [])];
    updatedItems[index] = updatedItem;

    setInvoiceData((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  const addItem = (category = 'General') => {
    setInvoiceData((prev) => ({
      ...prev,
      items: [
        ...(prev.items || []),
        {
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
        },
      ],
    }));

    setActiveSection('equipment');
  };

  const removeItem = (index) => {
    const updatedItems = [...(invoiceData.items || [])];
    updatedItems.splice(index, 1);

    setInvoiceData((prev) => ({
      ...prev,
      items:
        updatedItems.length > 0
          ? updatedItems
          : [
              {
                id: uuidv4(),
                category: 'General',
                brand: '',
                model: '',
                rating: '',
                warranty: '',
                description: '',
                quantity: 1,
                price: 0,
                notes: '',
              },
            ],
    }));
  };

  const applySolarTemplate = (templateType) => {
    const selected = getSolarTemplate(templateType);
    if (!selected) return;

    const confirmed = window.confirm(
      'Apply this template? It will replace the current project type, system details, compliance selections and item list.'
    );

    if (!confirmed) return;

    setInvoiceData((prev) => ({
      ...prev,
      ...selected,
      paymentPlan: {
        depositPercentage: solarDefaults.defaultDepositPercentage || 70,
        balancePercentage: solarDefaults.defaultBalancePercentage || 30,
        paymentMilestone: solarDefaults.defaultPaymentMilestone || '',
      },
      quoteValidityDays: solarDefaults.defaultQuoteValidityDays || 7,
      terms: prev.terms || settings.terms || '',
      exclusions: prev.exclusions || solarDefaults.defaultExclusions || '',
      includeVAT: prev.includeVAT ?? settings.includeVAT ?? true,
    }));

    setActiveSection('client');
  };

  const SectionTitle = ({ icon, title, subtitle, complete }) => (
    <div className="invoice-section-title">
      <span className="invoice-section-icon">{icon}</span>
      <div>
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </div>
      <Badge bg={complete ? 'success' : 'secondary'} className="ms-auto">
        {complete ? 'Ready' : 'Needed'}
      </Badge>
    </div>
  );

  return (
    <div className="invoice-form invoice-form-guided">
      <Card className="border-0 shadow-sm mb-3 invoice-mobile-guide">
        <Card.Body>
          <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
            <div>
              <Badge bg="success" className="mb-2">
                Bank-Ready Solar Builder
              </Badge>
              <h5 className="fw-bold mb-1">Build this document step by step</h5>
              <p className="text-muted mb-0">
                Complete one section at a time. On a phone, use the section buttons below
                instead of scrolling through everything at once.
              </p>
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
                {sectionState[section.key] && <i aria-hidden="true">✓</i>}
              </button>
            ))}
          </div>
        </Card.Body>
      </Card>

      <Accordion
        activeKey={activeSection}
        onSelect={(eventKey) => eventKey && setActiveSection(eventKey)}
        className="invoice-guided-accordion"
      >
        <Accordion.Item eventKey="setup">
          <Accordion.Header>
            <SectionTitle
              icon="☀️"
              title="Document Setup"
              subtitle="Choose type, status, VAT and quick template"
              complete={sectionState.setup}
            />
          </Accordion.Header>

          <Accordion.Body>
            <div className="template-strip mb-3">
              {templateButtons.map((template) => (
                <Button
                  key={template.key}
                  type="button"
                  variant={template.variant}
                  size="sm"
                  onClick={() => applySolarTemplate(template.key)}
                >
                  {template.label}
                </Button>
              ))}
            </div>

            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Document Type</Form.Label>
                  <Form.Select
                    name="documentType"
                    value={invoiceData.documentType || 'Solar Quotation'}
                    onChange={handleTopLevelChange}
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
                <Form.Group>
                  <Form.Label>Workflow Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={invoiceData.status || 'DUE'}
                    onChange={handleTopLevelChange}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="DUE">Due</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="PARTIAL">Partially Paid</option>
                    <option value="PAID">Paid</option>
                    <option value="OVERDUE">Overdue</option>
                    <option value="COMPLETED">Completed</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>Quote Validity Days</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    name="quoteValidityDays"
                    value={
                      invoiceData.quoteValidityDays ||
                      solarDefaults.defaultQuoteValidityDays ||
                      7
                    }
                    onChange={handleNumberTopLevelChange}
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>VAT</Form.Label>
                  <Form.Check
                    type="switch"
                    name="includeVAT"
                    label="Include VAT at 15%"
                    checked={Boolean(includeVAT)}
                    onChange={handleTopLevelChange}
                  />
                </Form.Group>
              </Col>

              <Col md={8}>
                {isTaxInvoice && includeVAT && !vatNumber && (
                  <Alert variant="warning" className="mb-0">
                    ⚠️ VAT is enabled and this is marked as a Tax Invoice, but no VAT number is set in Settings.
                  </Alert>
                )}

                {isQuotation && (
                  <Alert variant="info" className="mb-0">
                    ℹ️ This is a quotation. The PDF will clearly state that it is not a tax invoice.
                  </Alert>
                )}

                {isProforma && (
                  <Alert variant="info" className="mb-0">
                    ℹ️ This is a proforma invoice for payment/procurement purposes, not a final tax invoice.
                  </Alert>
                )}
              </Col>
            </Row>
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="client">
          <Accordion.Header>
            <SectionTitle
              icon="👤"
              title="Client Information"
              subtitle="Who the document is prepared for"
              complete={sectionState.client}
            />
          </Accordion.Header>

          <Accordion.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Client Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="clientName"
                    value={invoiceData.clientName || ''}
                    onChange={handleTopLevelChange}
                    placeholder="e.g. Gift Mthombeni"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Client Type</Form.Label>
                  <Form.Select
                    name="clientType"
                    value={invoiceData.clientType || 'Residential'}
                    onChange={handleTopLevelChange}
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Farm">Farm</option>
                    <option value="School">School</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Body Corporate">Body Corporate</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Client Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="clientEmail"
                    value={invoiceData.clientEmail || ''}
                    onChange={handleTopLevelChange}
                    placeholder="e.g. client@example.com"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Client Phone</Form.Label>
                  <Form.Control
                    type="text"
                    name="clientPhone"
                    value={invoiceData.clientPhone || ''}
                    onChange={handleTopLevelChange}
                    placeholder="+27 ..."
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Billing Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="clientAddress"
                    value={invoiceData.clientAddress || ''}
                    onChange={handleTopLevelChange}
                    rows={2}
                    placeholder="Billing address"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Installation / Site Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="siteAddress"
                    value={invoiceData.siteAddress || ''}
                    onChange={handleTopLevelChange}
                    rows={2}
                    placeholder="Where the solar/electrical work will be done"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="project">
          <Accordion.Header>
            <SectionTitle
              icon="⚡"
              title="Solar Project Details"
              subtitle="System size, phase, roof and installation notes"
              complete={sectionState.project}
            />
          </Accordion.Header>

          <Accordion.Body>
            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Project Type</Form.Label>
                  <Form.Select
                    name="projectType"
                    value={invoiceData.projectType || 'Hybrid Solar System'}
                    onChange={handleTopLevelChange}
                  >
                    <option value="Hybrid Solar System">Hybrid Solar System</option>
                    <option value="Backup Power System">Backup Power System</option>
                    <option value="Grid-Tied Solar System">Grid-Tied Solar System</option>
                    <option value="Off-Grid Solar System">Off-Grid Solar System</option>
                    <option value="Battery Upgrade">Battery Upgrade</option>
                    <option value="Inverter Replacement">Inverter Replacement</option>
                    <option value="Solar Geyser / Geyserwise Conversion">
                      Solar Geyser / Geyserwise Conversion
                    </option>
                    <option value="Electrical COC / Compliance Work">
                      Electrical COC / Compliance Work
                    </option>
                    <option value="Maintenance / Troubleshooting">
                      Maintenance / Troubleshooting
                    </option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>Phase Type</Form.Label>
                  <Form.Select
                    name="phaseType"
                    value={invoiceData.phaseType || 'Single Phase'}
                    onChange={handleTopLevelChange}
                  >
                    <option value="Single Phase">Single Phase</option>
                    <option value="Three Phase">Three Phase</option>
                    <option value="Unknown / To be Confirmed">
                      Unknown / To be Confirmed
                    </option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>Roof / Mounting Type</Form.Label>
                  <Form.Select
                    name="roofType"
                    value={invoiceData.roofType || 'Tiled Roof'}
                    onChange={handleTopLevelChange}
                  >
                    <option value="Tiled Roof">Tiled Roof</option>
                    <option value="IBR / Metal Roof">IBR / Metal Roof</option>
                    <option value="Flat Roof">Flat Roof</option>
                    <option value="Ground Mount">Ground Mount</option>
                    <option value="Not Applicable">Not Applicable</option>
                    <option value="To be Confirmed">To be Confirmed</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>Inverter Size (kW)</Form.Label>
                  <Form.Control
                    type="text"
                    name="inverterSizeKw"
                    value={invoiceData.systemDetails?.inverterSizeKw || ''}
                    onChange={handleSystemChange}
                    placeholder="e.g. 5"
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>Battery Capacity (kWh)</Form.Label>
                  <Form.Control
                    type="text"
                    name="batteryCapacityKwh"
                    value={invoiceData.systemDetails?.batteryCapacityKwh || ''}
                    onChange={handleSystemChange}
                    placeholder="e.g. 10"
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>PV Size (kWp)</Form.Label>
                  <Form.Control
                    type="text"
                    name="pvSizeKwp"
                    value={invoiceData.systemDetails?.pvSizeKwp || ''}
                    onChange={handleSystemChange}
                    placeholder="e.g. 5.5"
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>No. of Panels</Form.Label>
                  <Form.Control
                    type="text"
                    name="numberOfPanels"
                    value={invoiceData.systemDetails?.numberOfPanels || ''}
                    onChange={handleSystemChange}
                    placeholder="e.g. 10"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Backup Circuits / Load Notes</Form.Label>
                  <Form.Control
                    type="text"
                    name="backupCircuits"
                    value={invoiceData.systemDetails?.backupCircuits || ''}
                    onChange={handleSystemChange}
                    placeholder="e.g. Lights, plugs, WiFi, TV, fridge"
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>Estimated Installation Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="installationDate"
                    value={invoiceData.installationDate || ''}
                    onChange={handleTopLevelChange}
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group className="pt-md-4 mt-md-2">
                  <Form.Check
                    type="switch"
                    name="monitoringIncluded"
                    label="Monitoring included"
                    checked={invoiceData.systemDetails?.monitoringIncluded ?? true}
                    onChange={handleSystemChange}
                  />
                </Form.Group>
              </Col>

              <Col xs={12}>
                <Form.Group>
                  <Form.Label>Solar Project Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="solarNotes"
                    value={invoiceData.solarNotes || ''}
                    onChange={handleTopLevelChange}
                    placeholder="Important assumptions, site notes or client requirements"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="compliance">
          <Accordion.Header>
            <SectionTitle
              icon="✅"
              title="Compliance & Handover"
              subtitle="COC, SSEG, single-line diagram and commissioning"
              complete={sectionState.compliance}
            />
          </Accordion.Header>

          <Accordion.Body>
            <Alert variant="light" className="border">
              Select what is included. These commitments appear clearly in the bank-ready PDF.
            </Alert>

            <Row className="g-3">
              <Col md={3}>
                <Form.Check
                  type="checkbox"
                  name="cocIncluded"
                  label="COC included where applicable"
                  checked={invoiceData.compliance?.cocIncluded ?? true}
                  onChange={handleComplianceChange}
                />
              </Col>

              <Col md={3}>
                <Form.Check
                  type="checkbox"
                  name="ssegIncluded"
                  label="SSEG registration support"
                  checked={invoiceData.compliance?.ssegIncluded ?? false}
                  onChange={handleComplianceChange}
                />
              </Col>

              <Col md={3}>
                <Form.Check
                  type="checkbox"
                  name="singleLineDiagramIncluded"
                  label="Single-line diagram"
                  checked={invoiceData.compliance?.singleLineDiagramIncluded ?? true}
                  onChange={handleComplianceChange}
                />
              </Col>

              <Col md={3}>
                <Form.Check
                  type="checkbox"
                  name="commissioningReportIncluded"
                  label="Commissioning report"
                  checked={invoiceData.compliance?.commissioningReportIncluded ?? true}
                  onChange={handleComplianceChange}
                />
              </Col>
            </Row>
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="timeline">
          <Accordion.Header>
            <SectionTitle
              icon="🗓️"
              title="Timeline"
              subtitle="Quote, invoice, payment and installation dates"
              complete={sectionState.timeline}
            />
          </Accordion.Header>

          <Accordion.Body>
            <Row className="g-3">
              <Col md={4}>
                <Form.Label>Quote Date</Form.Label>
                <Form.Control
                  type="date"
                  name="quoteDate"
                  value={invoiceData.timeline?.quoteDate || ''}
                  onChange={handleTimelineChange}
                />
              </Col>

              <Col md={4}>
                <Form.Label>Invoice Date</Form.Label>
                <Form.Control
                  type="date"
                  name="invoiceDate"
                  value={invoiceData.timeline?.invoiceDate || ''}
                  onChange={handleTimelineChange}
                />
              </Col>

              <Col md={4}>
                <Form.Label>Payment Date</Form.Label>
                <Form.Control
                  type="date"
                  name="paymentDate"
                  value={invoiceData.timeline?.paymentDate || ''}
                  onChange={handleTimelineChange}
                />
              </Col>
            </Row>
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="equipment">
          <Accordion.Header>
            <SectionTitle
              icon="📦"
              title="Equipment & Scope Schedule"
              subtitle="Brand, model, rating, warranty, quantity and price"
              complete={sectionState.equipment}
            />
          </Accordion.Header>

          <Accordion.Body>
            <div className="equipment-add-strip mb-3">
              <Button type="button" variant="outline-success" size="sm" onClick={() => addItem('Inverter')}>
                + Inverter
              </Button>
              <Button type="button" variant="outline-success" size="sm" onClick={() => addItem('Battery')}>
                + Battery
              </Button>
              <Button type="button" variant="outline-success" size="sm" onClick={() => addItem('Solar Panels')}>
                + Panels
              </Button>
              <Button type="button" variant="outline-primary" size="sm" onClick={() => addItem('Labour')}>
                + Labour
              </Button>
              <Button type="button" variant="outline-secondary" size="sm" onClick={() => addItem('General')}>
                + Custom
              </Button>
            </div>

            {(invoiceData.items || []).map((item, idx) => (
              <ItemRow
                key={item.id || idx}
                index={idx}
                item={item}
                onItemChange={handleItemChange}
                onRemoveItem={removeItem}
              />
            ))}
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="payment">
          <Accordion.Header>
            <SectionTitle
              icon="💳"
              title="Payment Plan"
              subtitle="Deposit, balance, reference and payment instructions"
              complete={sectionState.payment}
            />
          </Accordion.Header>

          <Accordion.Body>
            <Row className="g-3">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Deposit %</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    max="100"
                    name="depositPercentage"
                    value={depositPercentage}
                    onChange={(e) => syncDepositBalance(e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>Balance %</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    max="100"
                    name="balancePercentage"
                    value={balancePercentage}
                    onChange={handlePaymentPlanChange}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Alternative Payment Methods</Form.Label>
                  <Form.Control
                    type="text"
                    name="paymentOptions"
                    value={invoiceData.paymentOptions || settings.paymentOptions || ''}
                    onChange={handleTopLevelChange}
                    placeholder="EFT, Card, SnapScan"
                  />
                </Form.Group>
              </Col>

              <Col xs={12}>
                <Form.Group>
                  <Form.Label>Payment Milestone</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="paymentMilestone"
                    value={
                      invoiceData.paymentPlan?.paymentMilestone ||
                      solarDefaults.defaultPaymentMilestone ||
                      ''
                    }
                    onChange={handlePaymentPlanChange}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Payment Reference Instructions</Form.Label>
                  <Form.Control
                    type="text"
                    name="paymentReference"
                    value={invoiceData.paymentReference || ''}
                    onChange={handleTopLevelChange}
                    placeholder="e.g. Use quotation/invoice number as reference"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Payment Instructions</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="paymentInstructions"
                    value={invoiceData.paymentInstructions || settings.paymentInstructions || ''}
                    onChange={handleTopLevelChange}
                    rows={2}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="terms">
          <Accordion.Header>
            <SectionTitle
              icon="✍️"
              title="Terms, Exclusions & Signature"
              subtitle="Final conditions and signature"
              complete={sectionState.terms}
            />
          </Accordion.Header>

          <Accordion.Body>
            <Form.Group className="mb-3">
              <Form.Label>Default Exclusions</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="exclusions"
                value={invoiceData.exclusions || solarDefaults.defaultExclusions || ''}
                onChange={handleTopLevelChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Terms & Conditions</Form.Label>
              <Form.Control
                as="textarea"
                rows={7}
                name="terms"
                value={invoiceData.terms || settings.terms || ''}
                onChange={handleTopLevelChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Signed By / Prepared By</Form.Label>
              <Form.Control
                type="text"
                name="signature"
                value={invoiceData.signature || ''}
                onChange={handleTopLevelChange}
                placeholder="e.g. TP Electro Representative / Client Name"
              />
            </Form.Group>

            <Form.Group className="mb-4" controlId="signaturePad">
              <Form.Label>✍️ Digital Signature</Form.Label>
              <SignatureCapture
                onSave={(dataUrl) =>
                  setInvoiceData((prev) => ({
                    ...prev,
                    signatureImageBase64: dataUrl,
                  }))
                }
              />
            </Form.Group>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    </div>
  );
}

export default InvoiceForm;