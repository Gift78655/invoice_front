// src/components/InvoicePreview.js
import React, { useMemo, useRef, useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import QRCodeLib from 'qrcode';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'react-toastify';
import QRCodeComponent from './QRCode';
import '../styles/InvoicePreview.css';

const pdfMakeVfs =
  pdfFonts?.pdfMake?.vfs ||
  pdfFonts?.default?.vfs ||
  pdfFonts?.vfs;

if (pdfMakeVfs) {
  pdfMake.vfs = pdfMakeVfs;
}

const BACKEND_URL =
  process.env.REACT_APP_API_URL || 'https://invoice-backend-flsi.onrender.com';

const imageToPngDataUrl = async (imageValue) => {
  if (!imageValue || typeof imageValue !== 'string') return null;

  if (
    imageValue.startsWith('data:image/png;base64,') ||
    imageValue.startsWith('data:image/jpeg;base64,') ||
    imageValue.startsWith('data:image/jpg;base64,')
  ) {
    return imageValue;
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          resolve(canvas.toDataURL('image/png'));
        } catch (error) {
          console.warn('Logo/signature conversion failed:', error);
          resolve(null);
        }
      };

      img.onerror = () => resolve(null);

      if (imageValue.startsWith('/')) {
        img.src = `${window.location.origin}${imageValue}`;
      } else {
        img.src = imageValue;
      }
    } catch (error) {
      console.warn('Image conversion failed:', error);
      resolve(null);
    }
  });
};

const createPdfBlob = (docDefinition) => {
  return new Promise((resolve, reject) => {
    try {
      pdfMake.createPdf(docDefinition).getBlob((blob) => {
        resolve(blob);
      });
    } catch (error) {
      reject(error);
    }
  });
};

function InvoicePreview({ invoiceData = {} }) {
  const previewRef = useRef(null);
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const { settings } = useSettings();

  const registration = settings.registrationDetails || {};
  const bank = settings.bankDetails || {};
  const solarDefaults = settings.solarDefaults || {};
  const system = invoiceData.systemDetails || {};
  const compliance = invoiceData.compliance || {};
  const paymentPlan = invoiceData.paymentPlan || {};

  const includeVAT = invoiceData?.includeVAT ?? settings.includeVAT ?? true;
  const vatNumber = registration.vatNumber || '';
  const documentType = invoiceData.documentType || 'Solar Quotation';
  const invoiceNumber = invoiceData.invoiceNumber || 'Draft';
  const companyLogo = settings.logoDataUrl || settings.logoUrl || '/logo.png';

  const isTaxInvoice = documentType === 'Tax Invoice';
  const isQuotation = documentType.toLowerCase().includes('quotation');
  const isProforma = documentType.toLowerCase().includes('proforma');
  const isReceipt = documentType.toLowerCase().includes('receipt');

  const invoiceDate =
    invoiceData.timeline?.invoiceDate ||
    invoiceData.timeline?.quoteDate ||
    invoiceData.date ||
    new Date().toISOString().slice(0, 10);

  const quoteDate =
    invoiceData.timeline?.quoteDate ||
    invoiceDate ||
    new Date().toISOString().slice(0, 10);

  const quoteValidityDays =
    Number(invoiceData.quoteValidityDays) ||
    Number(solarDefaults.defaultQuoteValidityDays) ||
    7;

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

    if (Number.isNaN(date.getTime())) return dateValue;

    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  const addDays = (dateValue, days) => {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return '';

    date.setDate(date.getDate() + Number(days || 0));
    return date.toISOString().slice(0, 10);
  };

  const quoteExpiryDate = addDays(quoteDate, quoteValidityDays);

  const calculateSubtotal = () => {
    if (!Array.isArray(invoiceData.items)) return 0;

    return invoiceData.items.reduce((total, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;

      return total + qty * price;
    }, 0);
  };

  const numberToWords = (num) => {
    const ones = [
      '',
      'One',
      'Two',
      'Three',
      'Four',
      'Five',
      'Six',
      'Seven',
      'Eight',
      'Nine',
      'Ten',
      'Eleven',
      'Twelve',
      'Thirteen',
      'Fourteen',
      'Fifteen',
      'Sixteen',
      'Seventeen',
      'Eighteen',
      'Nineteen',
    ];

    const tens = [
      '',
      '',
      'Twenty',
      'Thirty',
      'Forty',
      'Fifty',
      'Sixty',
      'Seventy',
      'Eighty',
      'Ninety',
    ];

    if (num === 0) return 'Zero';

    if (num < 20) return ones[num];

    if (num < 100) {
      return `${tens[Math.floor(num / 10)]}${num % 10 ? `-${ones[num % 10]}` : ''}`;
    }

    if (num < 1000) {
      return `${ones[Math.floor(num / 100)]} Hundred${
        num % 100 ? ` and ${numberToWords(num % 100)}` : ''
      }`;
    }

    if (num < 1000000) {
      return `${numberToWords(Math.floor(num / 1000))} Thousand${
        num % 1000 ? ` ${numberToWords(num % 1000)}` : ''
      }`;
    }

    if (num < 1000000000) {
      return `${numberToWords(Math.floor(num / 1000000))} Million${
        num % 1000000 ? ` ${numberToWords(num % 1000000)}` : ''
      }`;
    }

    return 'Amount too large';
  };

  const subtotal = calculateSubtotal();
  const vat = includeVAT ? subtotal * 0.15 : 0;
  const total = subtotal + vat;

  const depositPercentage = Number(paymentPlan.depositPercentage) || 0;

  const balancePercentage =
    Number(paymentPlan.balancePercentage) ||
    Math.max(0, 100 - depositPercentage);

  const depositAmount = total * (depositPercentage / 100);
  const balanceAmount = total * (balancePercentage / 100);

  const totalInWords = `${numberToWords(Math.round(total))} Rand only`;
  const paymentStatus = invoiceData.status || 'DUE';

  const statusClassMap = {
    PAID: 'success',
    OVERDUE: 'danger',
    PARTIAL: 'info',
    ACCEPTED: 'success',
    COMPLETED: 'success',
    DRAFT: 'secondary',
    DUE: 'warning',
  };

  const statusBadge = statusClassMap[paymentStatus] || 'warning';

  const qrLink = useMemo(() => {
    const baseUrl =
      process.env.REACT_APP_FRONTEND_URL ||
      window.location.origin ||
      'https://invoice-front-mn5z.onrender.com';

    return invoiceNumber && invoiceNumber !== 'Draft'
      ? `${baseUrl}/#/pay/${invoiceNumber}`
      : '';
  }, [invoiceNumber]);

  const documentNotice = useMemo(() => {
    if (isQuotation) {
      return 'This document is a quotation/proposal for review and approval. It is not a tax invoice. Prices, stock availability and installation timelines remain subject to final confirmation.';
    }

    if (isProforma) {
      return 'This proforma invoice is issued for payment/procurement purposes and is not a final tax invoice. A formal tax invoice may be issued where applicable after payment/supply.';
    }

    if (isTaxInvoice) {
      return includeVAT
        ? 'This document is marked as a tax invoice and includes VAT where applicable.'
        : 'This document is marked as a tax invoice, but VAT is not included on this document.';
    }

    if (isReceipt) {
      return 'This receipt confirms payment information recorded for the relevant solar/electrical document.';
    }

    return 'This document contains solar/electrical project, payment, compliance and client acceptance information.';
  }, [isQuotation, isProforma, isTaxInvoice, isReceipt, includeVAT]);

  const vatWarning = isTaxInvoice && includeVAT && !vatNumber
    ? 'VAT is enabled and this document is marked as a Tax Invoice, but no VAT number is set in Settings.'
    : '';

  const complianceRows = [
    {
      label: 'COC included where applicable',
      active: compliance.cocIncluded ?? true,
    },
    {
      label: 'SSEG registration support',
      active: compliance.ssegIncluded ?? false,
    },
    {
      label: 'Single-line diagram',
      active: compliance.singleLineDiagramIncluded ?? true,
    },
    {
      label: 'Commissioning report',
      active: compliance.commissioningReportIncluded ?? true,
    },
  ];

  const supportingDocuments = [
    'Company registration documents',
    'Bank confirmation letter',
    'Electrical contractor registration details',
    'Registered person / wireman details',
    'Product datasheets',
    'Product warranty documentation',
    'Single-line diagram where applicable',
    'COC after compliant installation',
    'Commissioning report after handover',
    'Proof of payment / receipt',
  ];

  const systemSummary = [
    { label: 'Project Type', value: invoiceData.projectType },
    { label: 'Client Type', value: invoiceData.clientType },
    { label: 'Phase Type', value: invoiceData.phaseType },
    { label: 'Roof / Mounting', value: invoiceData.roofType },
    {
      label: 'Inverter Size',
      value: system.inverterSizeKw ? `${system.inverterSizeKw} kW` : '',
    },
    {
      label: 'Battery Capacity',
      value: system.batteryCapacityKwh ? `${system.batteryCapacityKwh} kWh` : '',
    },
    {
      label: 'PV Size',
      value: system.pvSizeKwp ? `${system.pvSizeKwp} kWp` : '',
    },
    { label: 'No. of Panels', value: system.numberOfPanels },
    {
      label: 'Monitoring',
      value: system.monitoringIncluded ? 'Included' : 'Not included',
    },
    { label: 'Backup Circuits', value: system.backupCircuits },
  ].filter(
    (item) =>
      item.value !== undefined &&
      item.value !== null &&
      item.value !== ''
  );

  const buildPdfDocDefinition = async () => {
    const qrImageRaw = qrLink ? await QRCodeLib.toDataURL(qrLink) : null;
    const qrImage = await imageToPngDataUrl(qrImageRaw);
    const logoImage = await imageToPngDataUrl(companyLogo);
    const signatureImage = await imageToPngDataUrl(invoiceData.signatureImageBase64);

    const itemRows = invoiceData.items?.length
      ? invoiceData.items.map((item) => [
          item.category || 'General',
          `${item.brand || '—'}\n${item.model || '—'}`,
          `${item.rating || '—'}\n${item.warranty || '—'}`,
          `${item.description || '—'}${item.notes ? `\nNote: ${item.notes}` : ''}`,
          String(item.quantity || 0),
          formatCurrency(item.price || 0),
          formatCurrency(
            (Number(item.quantity) || 0) * (Number(item.price) || 0)
          ),
        ])
      : [
          [
            'General',
            '—',
            '—',
            'No items added',
            '0',
            formatCurrency(0),
            formatCurrency(0),
          ],
        ];

    const systemRows = systemSummary.length
      ? systemSummary.map((item) => [
          { text: item.label, bold: true },
          String(item.value || '—'),
        ])
      : [[{ text: 'System Details', bold: true }, 'To be confirmed']];

    const complianceText = complianceRows
      .map(
        (item) =>
          `${item.active ? '✓' : '•'} ${item.label}: ${
            item.active ? 'Included' : 'Not included'
          }`
      )
      .join('\n');

    const supportingDocsText = supportingDocuments
      .map((item) => `☐ ${item}`)
      .join('\n');

    return {
      pageSize: 'A4',
      pageMargins: [34, 32, 34, 42],
      background: [
        {
          canvas: [
            {
              type: 'rect',
              x: 0,
              y: 0,
              w: 595.28,
              h: 82,
              color: '#e8f6ef',
            },
            {
              type: 'rect',
              x: 0,
              y: 0,
              w: 12,
              h: 841.89,
              color: '#128246',
            },
          ],
        },
      ],
      content: [
        {
          columns: [
            {
              width: '*',
              stack: [
                ...(logoImage
                  ? [
                      {
                        image: logoImage,
                        width: 78,
                        margin: [0, 0, 0, 6],
                      },
                    ]
                  : []),
                {
                  text: settings.companyName || 'Company Name',
                  style: 'companyName',
                },
                { text: settings.slogan || '', style: 'slogan' },
                {
                  text: [
                    settings.companyEmail ? `${settings.companyEmail}\n` : '',
                    settings.companyPhone ? `${settings.companyPhone}\n` : '',
                    settings.website ? `${settings.website}\n` : '',
                  ],
                  style: 'smallText',
                },
              ],
            },
            {
              width: 220,
              stack: [
                {
                  text: documentType.toUpperCase(),
                  style: 'documentTitle',
                },
                { text: invoiceNumber, style: 'documentNumber' },
                {
                  text: `Date: ${formatDate(invoiceDate)}`,
                  style: 'smallText',
                  alignment: 'right',
                },
                {
                  text: `Status: ${paymentStatus}`,
                  style: 'smallText',
                  alignment: 'right',
                },
              ],
            },
          ],
          columnGap: 20,
          margin: [0, 0, 0, 16],
        },

        {
          text: 'BANK / FINANCE REVIEW SUMMARY',
          style: 'sectionTitle',
          margin: [0, 4, 0, 5],
        },
        {
          table: {
            widths: ['25%', '25%', '25%', '25%'],
            body: [
              [
                { text: 'Prepared For', style: 'summaryHeader' },
                { text: 'Project Value', style: 'summaryHeader' },
                { text: 'Deposit Required', style: 'summaryHeader' },
                { text: 'Quote Expiry', style: 'summaryHeader' },
              ],
              [
                invoiceData.clientName || '—',
                { text: formatCurrency(total), bold: true },
                `${depositPercentage}% - ${formatCurrency(depositAmount)}`,
                formatDate(quoteExpiryDate),
              ],
              [
                { text: 'Supplier', style: 'summaryHeader' },
                { text: 'Site Address', style: 'summaryHeader' },
                { text: 'Project Type', style: 'summaryHeader' },
                { text: 'Estimated Installation', style: 'summaryHeader' },
              ],
              [
                settings.companyName || '—',
                invoiceData.siteAddress || invoiceData.clientAddress || '—',
                invoiceData.projectType || '—',
                formatDate(invoiceData.installationDate),
              ],
            ],
          },
          layout: 'lightHorizontalLines',
          margin: [0, 4, 0, 10],
        },

        {
          text: documentNotice,
          style: 'noticeText',
          margin: [0, 3, 0, 8],
        },

        ...(vatWarning
          ? [
              {
                text: `VAT WARNING: ${vatWarning}`,
                style: 'warningText',
                margin: [0, 0, 0, 8],
              },
            ]
          : []),

        {
          columns: [
            {
              width: '50%',
              stack: [
                { text: 'Supplier / Installer Details', style: 'sectionTitle' },
                { text: `Company: ${settings.companyName || '—'}`, style: 'smallText' },
                { text: `Email: ${settings.companyEmail || '—'}`, style: 'smallText' },
                { text: `Phone: ${settings.companyPhone || '—'}`, style: 'smallText' },
                { text: `Website: ${settings.website || '—'}`, style: 'smallText' },
                { text: `Company Reg No: ${registration.companyRegistrationNo || '—'}`, style: 'smallText' },
                { text: `VAT No: ${vatNumber || '—'}`, style: 'smallText' },
                { text: `Electrical Contractor No: ${registration.electricalContractorNo || '—'}`, style: 'smallText' },
                { text: `Registered Person: ${registration.registeredPersonName || '—'}`, style: 'smallText' },
                { text: `Registered Person No: ${registration.registeredPersonNo || '—'}`, style: 'smallText' },
              ],
            },
            {
              width: '50%',
              stack: [
                { text: 'Client & Site Details', style: 'sectionTitle' },
                { text: `Client: ${invoiceData.clientName || '—'}`, style: 'smallText' },
                { text: `Email: ${invoiceData.clientEmail || '—'}`, style: 'smallText' },
                { text: `Phone: ${invoiceData.clientPhone || '—'}`, style: 'smallText' },
                { text: `Billing Address: ${invoiceData.clientAddress || '—'}`, style: 'smallText' },
                { text: `Installation Site: ${invoiceData.siteAddress || invoiceData.clientAddress || '—'}`, style: 'smallText' },
                { text: `Client Type: ${invoiceData.clientType || '—'}`, style: 'smallText' },
              ],
            },
          ],
          columnGap: 18,
          margin: [0, 6, 0, 12],
        },

        { text: 'Solar System Summary', style: 'sectionTitle' },
        {
          table: {
            widths: ['35%', '65%'],
            body: systemRows,
          },
          layout: 'lightHorizontalLines',
          margin: [0, 5, 0, 14],
        },

        { text: 'Equipment & Scope Schedule', style: 'sectionTitle' },
        {
          table: {
            headerRows: 1,
            widths: ['13%', '17%', '16%', '*', '7%', '13%', '13%'],
            body: [
              [
                { text: 'Category', style: 'tableHeader' },
                { text: 'Brand / Model', style: 'tableHeader' },
                { text: 'Rating / Warranty', style: 'tableHeader' },
                { text: 'Description / Scope', style: 'tableHeader' },
                { text: 'Qty', style: 'tableHeader', alignment: 'right' },
                { text: 'Unit', style: 'tableHeader', alignment: 'right' },
                { text: 'Total', style: 'tableHeader', alignment: 'right' },
              ],
              ...itemRows.map((row) => [
                row[0],
                row[1],
                row[2],
                row[3],
                { text: row[4], alignment: 'right' },
                { text: row[5], alignment: 'right' },
                { text: row[6], alignment: 'right' },
              ]),
              [
                {
                  text: 'Subtotal',
                  colSpan: 6,
                  alignment: 'right',
                  bold: true,
                },
                {},
                {},
                {},
                {},
                {},
                { text: formatCurrency(subtotal), alignment: 'right' },
              ],
              ...(includeVAT
                ? [
                    [
                      {
                        text: 'VAT (15%)',
                        colSpan: 6,
                        alignment: 'right',
                        bold: true,
                      },
                      {},
                      {},
                      {},
                      {},
                      {},
                      { text: formatCurrency(vat), alignment: 'right' },
                    ],
                  ]
                : []),
              [
                {
                  text: 'Grand Total',
                  colSpan: 6,
                  alignment: 'right',
                  bold: true,
                  fillColor: '#123524',
                  color: '#ffffff',
                },
                {},
                {},
                {},
                {},
                {},
                {
                  text: formatCurrency(total),
                  alignment: 'right',
                  bold: true,
                  fillColor: '#123524',
                  color: '#ffffff',
                },
              ],
            ],
          },
          layout: 'lightHorizontalLines',
          margin: [0, 5, 0, 10],
        },

        { text: `Total in Words: ${totalInWords}`, style: 'italicText' },

        {
          columns: [
            {
              width: '50%',
              stack: [
                { text: 'Payment Plan', style: 'sectionTitle' },
                {
                  text: `${depositPercentage}% Deposit: ${formatCurrency(depositAmount)}`,
                  style: 'smallText',
                },
                {
                  text: `${balancePercentage}% Balance: ${formatCurrency(balanceAmount)}`,
                  style: 'smallText',
                },
                {
                  text:
                    paymentPlan.paymentMilestone ||
                    solarDefaults.defaultPaymentMilestone ||
                    'Payment milestone to be confirmed.',
                  style: 'smallText',
                  margin: [0, 4, 0, 0],
                },
              ],
            },
            {
              width: '50%',
              stack: [
                { text: 'Banking Details', style: 'sectionTitle' },
                { text: `Bank: ${bank.bank || '—'}`, style: 'smallText' },
                {
                  text: `Account Name: ${bank.accountName || settings.companyName || '—'}`,
                  style: 'smallText',
                },
                { text: `Account Type: ${bank.accountType || '—'}`, style: 'smallText' },
                { text: `Account No: ${bank.accountNo || '—'}`, style: 'smallText' },
                { text: `Branch Code: ${bank.branchCode || '—'}`, style: 'smallText' },
                {
                  text: `Reference: ${invoiceData.paymentReference || invoiceNumber}`,
                  style: 'smallText',
                },
              ],
            },
          ],
          columnGap: 18,
          margin: [0, 8, 0, 12],
        },

        { text: 'Compliance & Handover Commitments', style: 'sectionTitle' },
        {
          text: complianceText,
          style: 'smallText',
          margin: [0, 4, 0, 8],
        },

        ...(solarDefaults.defaultCocNote
          ? [
              {
                text: `COC Note: ${solarDefaults.defaultCocNote}`,
                style: 'smallText',
                margin: [0, 0, 0, 3],
              },
            ]
          : []),

        ...(solarDefaults.defaultSsegNote
          ? [
              {
                text: `SSEG Note: ${solarDefaults.defaultSsegNote}`,
                style: 'smallText',
                margin: [0, 0, 0, 8],
              },
            ]
          : []),

        { text: 'Supporting Documents Available on Request', style: 'sectionTitle' },
        {
          text: supportingDocsText,
          style: 'smallText',
          margin: [0, 4, 0, 10],
        },

        ...(invoiceData.solarNotes
          ? [
              { text: 'Project Notes', style: 'sectionTitle' },
              {
                text: invoiceData.solarNotes,
                style: 'smallText',
                margin: [0, 4, 0, 10],
              },
            ]
          : []),

        ...(invoiceData.exclusions
          ? [
              { text: 'Exclusions', style: 'sectionTitle' },
              {
                text: invoiceData.exclusions,
                style: 'smallText',
                margin: [0, 4, 0, 10],
              },
            ]
          : []),

        ...(invoiceData.terms
          ? [
              { text: 'Terms & Conditions', style: 'sectionTitle', pageBreak: 'before' },
              {
                text: invoiceData.terms,
                style: 'termsText',
                margin: [0, 4, 0, 12],
              },
            ]
          : []),

        {
          text:
            'Client Acceptance: By signing this document, the client confirms acceptance of the quoted scope, exclusions, payment terms, site access requirements and installation conditions.',
          style: 'noticeText',
          margin: [0, 8, 0, 12],
        },

        {
          columns: [
            qrImage
              ? {
                  width: 120,
                  stack: [
                    { image: qrImage, width: 90 },
                    { text: 'Scan to view/pay', style: 'tinyText' },
                  ],
                }
              : { width: 120, text: '' },
            {
              width: '*',
              stack: [
                {
                  text: 'Prepared / Accepted By',
                  style: 'sectionTitle',
                  alignment: 'right',
                },
                ...(signatureImage
                  ? [
                      {
                        image: signatureImage,
                        width: 130,
                        alignment: 'right',
                      },
                    ]
                  : []),
                {
                  text: invoiceData.signature || '____________________________',
                  alignment: 'right',
                  margin: [0, 8, 0, 0],
                },
                {
                  text: `Date: ${formatDate(new Date().toISOString())}`,
                  alignment: 'right',
                  style: 'smallText',
                },
              ],
            },
          ],
          columnGap: 20,
          margin: [0, 10, 0, 0],
        },
      ],
      footer(currentPage, pageCount) {
        return {
          text: `${settings.companyName || 'Solar Invoice App'} | ${documentType} ${invoiceNumber} | Page ${currentPage} of ${pageCount}`,
          alignment: 'center',
          fontSize: 8,
          color: '#6b7280',
        };
      },
      styles: {
        companyName: {
          fontSize: 18,
          bold: true,
          color: '#123524',
        },
        slogan: {
          fontSize: 9,
          color: '#5b6b62',
          italics: true,
        },
        documentTitle: {
          fontSize: 20,
          bold: true,
          color: '#0f7a3a',
          alignment: 'right',
        },
        documentNumber: {
          fontSize: 13,
          bold: true,
          alignment: 'right',
          margin: [0, 4, 0, 8],
        },
        sectionTitle: {
          fontSize: 11,
          bold: true,
          color: '#123524',
          margin: [0, 10, 0, 2],
        },
        summaryHeader: {
          bold: true,
          color: '#123524',
          fillColor: '#eaf7ef',
          fontSize: 8,
        },
        tableHeader: {
          bold: true,
          fillColor: '#eaf7ef',
          color: '#123524',
          fontSize: 8,
        },
        smallText: {
          fontSize: 8.5,
          color: '#27352f',
        },
        tinyText: {
          fontSize: 7,
          color: '#6b7280',
        },
        italicText: {
          fontSize: 9,
          italics: true,
          color: '#374151',
        },
        termsText: {
          fontSize: 8,
          color: '#374151',
        },
        noticeText: {
          fontSize: 8.5,
          color: '#374151',
          fillColor: '#f8faf9',
        },
        warningText: {
          fontSize: 8.5,
          color: '#9f2d2d',
          bold: true,
        },
      },
      defaultStyle: {
        fontSize: 8.5,
      },
    };
  };

  const exportPDF = async () => {
    setIsGeneratingPdf(true);

    try {
      const docDefinition = await buildPdfDocDefinition();
      const safeFileName = `${documentType}-${invoiceNumber}`.replace(
        /[^a-z0-9-_]/gi,
        '_'
      );

      pdfMake.createPdf(docDefinition).download(`${safeFileName}.pdf`);
      toast.success('✅ Bank-ready PDF generated successfully.');
    } catch (err) {
      console.error('PDF Export Error:', err);
      toast.error('❌ Error generating PDF. Please check logo/signature image format.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = useReactToPrint({
    content: () => previewRef.current,
    documentTitle: `${documentType}-${invoiceNumber}`,
  });

  const sendEmail = async () => {
    if (!invoiceData.clientEmail) {
      toast.error('❌ No email address provided for the client.');
      return;
    }

    const confirmed = window.confirm(
      `📧 Send ${documentType.toLowerCase()} ${invoiceNumber} to ${invoiceData.clientEmail}?`
    );

    if (!confirmed) return;

    setIsSending(true);

    try {
      const docDefinition = await buildPdfDocDefinition();
      const blob = await createPdfBlob(docDefinition);
      const safeFileName = `${documentType}-${invoiceNumber}`.replace(
        /[^a-z0-9-_]/gi,
        '_'
      );

      const formData = new FormData();
      formData.append('pdf', blob, `${safeFileName}.pdf`);
      formData.append('email', invoiceData.clientEmail);
      formData.append('invoiceNumber', invoiceNumber);
      formData.append('documentType', documentType);
      formData.append('clientName', invoiceData.clientName || '');
      formData.append('companyName', settings.companyName || 'Solar Invoice App');
      formData.append('paymentReference', invoiceData.paymentReference || invoiceNumber);

      const res = await fetch(`${BACKEND_URL}/api/send-invoice`, {
        method: 'POST',
        body: formData,
      });

      const responseText = await res.text();
      let responseData = {};

      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch {
        responseData = { error: responseText };
      }

      if (res.ok) {
        toast.success(responseData.message || '✅ Document emailed successfully.');
      } else {
        toast.error(responseData.error || responseData.message || '❌ Failed to send email.');
      }
    } catch (err) {
      console.error('Email error:', err);
      toast.error('❌ Error occurred while preparing or sending the email.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="solar-preview-shell">
      <div ref={previewRef} className="solar-document">
        <div className="solar-document-topbar">
          <div>
            <span className="solar-doc-kicker">Bank-Ready Solar Proposal Pack</span>
            <h1>{documentType}</h1>
            <p>{settings.slogan || 'Reliable solar and electrical solutions.'}</p>
          </div>

          <div className="solar-doc-number-card">
            <span className={`badge bg-${statusBadge}`}>{paymentStatus}</span>
            <strong>{invoiceNumber}</strong>
            <small>{formatDate(invoiceDate)}</small>
          </div>
        </div>

        {vatWarning && (
          <div className="alert alert-warning">
            ⚠️ {vatWarning}
          </div>
        )}

        <div className="note-box mb-3">
          <strong>Document Notice:</strong>
          <p>{documentNotice}</p>
        </div>

        <div className="preview-section">
          <div className="section-heading">
            <span>🏦</span>
            <div>
              <h3>Bank / Finance Review Summary</h3>
              <p>High-level project, supplier, client and payment information for quick assessment.</p>
            </div>
          </div>

          <div className="solar-summary-grid">
            <div className="summary-tile">
              <span>Prepared For</span>
              <strong>{invoiceData.clientName || '—'}</strong>
            </div>
            <div className="summary-tile">
              <span>Project Value</span>
              <strong>{formatCurrency(total)}</strong>
            </div>
            <div className="summary-tile">
              <span>Deposit Required</span>
              <strong>{depositPercentage}% - {formatCurrency(depositAmount)}</strong>
            </div>
            <div className="summary-tile">
              <span>Quote Expiry</span>
              <strong>{formatDate(quoteExpiryDate)}</strong>
            </div>
            <div className="summary-tile">
              <span>Estimated Installation</span>
              <strong>{formatDate(invoiceData.installationDate)}</strong>
            </div>
          </div>
        </div>

        <div className="solar-header-grid mt-3">
          <div className="company-block">
            <div className="company-logo-wrap">
              <img
                src={companyLogo}
                alt="Company Logo"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>

            <div>
              <h2>{settings.companyName || 'Company Name'}</h2>
              <p>{settings.companyEmail || '—'}</p>
              <p>{settings.companyPhone || '—'}</p>
              <p>{settings.website || '—'}</p>
              {registration.serviceAreas && (
                <p className="muted-line">
                  Service Areas: {registration.serviceAreas}
                </p>
              )}
            </div>
          </div>

          <div className="registration-block">
            <h3>Supplier / Installer Details</h3>
            <p><strong>Reg No:</strong> {registration.companyRegistrationNo || '—'}</p>
            <p><strong>VAT No:</strong> {vatNumber || '—'}</p>
            <p><strong>Contractor No:</strong> {registration.electricalContractorNo || '—'}</p>
            <p><strong>Registered Person:</strong> {registration.registeredPersonName || '—'}</p>
            <p><strong>Registered Person No:</strong> {registration.registeredPersonNo || '—'}</p>
          </div>
        </div>

        <div className="preview-section two-column">
          <div className="info-card">
            <h3>Bill To</h3>
            <p className="strong-line">{invoiceData.clientName || '—'}</p>
            <p>{invoiceData.clientEmail || '—'}</p>
            <p>{invoiceData.clientPhone || '—'}</p>
            <p>{invoiceData.clientAddress || '—'}</p>
          </div>

          <div className="info-card">
            <h3>Installation Site</h3>
            <p>{invoiceData.siteAddress || invoiceData.clientAddress || '—'}</p>
            <p><strong>Client Type:</strong> {invoiceData.clientType || '—'}</p>
            <p><strong>Project Type:</strong> {invoiceData.projectType || '—'}</p>
            <p><strong>Quote Validity:</strong> {quoteValidityDays} days</p>
          </div>
        </div>

        <div className="preview-section">
          <div className="section-heading">
            <span>☀️</span>
            <div>
              <h3>Solar System Summary</h3>
              <p>Project scope, system sizing and installation assumptions.</p>
            </div>
          </div>

          <div className="solar-summary-grid">
            {systemSummary.length > 0 ? (
              systemSummary.map((item) => (
                <div className="summary-tile" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))
            ) : (
              <div className="summary-tile">
                <span>System Details</span>
                <strong>To be confirmed</strong>
              </div>
            )}
          </div>

          {invoiceData.solarNotes && (
            <div className="note-box mt-3">
              <strong>Project Notes:</strong>
              <p>{invoiceData.solarNotes}</p>
            </div>
          )}
        </div>

        <div className="preview-section">
          <div className="section-heading">
            <span>📦</span>
            <div>
              <h3>Equipment & Scope Schedule</h3>
              <p>Detailed equipment, model, rating, warranty and scope information.</p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="solar-items-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Brand / Model</th>
                  <th>Rating / Warranty</th>
                  <th>Description</th>
                  <th className="text-end">Qty</th>
                  <th className="text-end">Unit</th>
                  <th className="text-end">Total</th>
                </tr>
              </thead>

              <tbody>
                {invoiceData.items?.length > 0 ? (
                  invoiceData.items.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td>
                        <span className="category-pill">{item.category || 'General'}</span>
                      </td>
                      <td>
                        <strong>{item.brand || '—'}</strong>
                        <br />
                        <small>{item.model || '—'}</small>
                      </td>
                      <td>
                        <strong>{item.rating || '—'}</strong>
                        <br />
                        <small>{item.warranty || '—'}</small>
                      </td>
                      <td>
                        {item.description || '—'}
                        {item.notes && (
                          <>
                            <br />
                            <small className="text-muted">Note: {item.notes}</small>
                          </>
                        )}
                      </td>
                      <td className="text-end">{item.quantity || 0}</td>
                      <td className="text-end">{formatCurrency(item.price || 0)}</td>
                      <td className="text-end">
                        {formatCurrency(
                          (Number(item.quantity) || 0) *
                            (Number(item.price) || 0)
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted">
                      No items added
                    </td>
                  </tr>
                )}
              </tbody>

              <tfoot>
                <tr>
                  <td colSpan="6" className="text-end">Subtotal</td>
                  <td className="text-end">{formatCurrency(subtotal)}</td>
                </tr>

                {includeVAT && (
                  <tr>
                    <td colSpan="6" className="text-end">VAT 15%</td>
                    <td className="text-end">{formatCurrency(vat)}</td>
                  </tr>
                )}

                <tr className="grand-total-row">
                  <td colSpan="6" className="text-end">Grand Total</td>
                  <td className="text-end">{formatCurrency(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <p className="amount-words">
            Total in Words: <strong>{totalInWords}</strong>
          </p>
        </div>

        <div className="preview-section two-column">
          <div className="info-card payment-card">
            <h3>Payment Plan</h3>

            <div className="payment-row">
              <span>{depositPercentage}% Deposit</span>
              <strong>{formatCurrency(depositAmount)}</strong>
            </div>

            <div className="payment-row">
              <span>{balancePercentage}% Balance</span>
              <strong>{formatCurrency(balanceAmount)}</strong>
            </div>

            <p className="small-note">
              {paymentPlan.paymentMilestone ||
                solarDefaults.defaultPaymentMilestone ||
                'Payment milestone to be confirmed.'}
            </p>
          </div>

          <div className="info-card">
            <h3>Bank Details</h3>
            <p><strong>Bank:</strong> {bank.bank || '—'}</p>
            <p><strong>Account Name:</strong> {bank.accountName || settings.companyName || '—'}</p>
            <p><strong>Account Type:</strong> {bank.accountType || '—'}</p>
            <p><strong>Account No:</strong> {bank.accountNo || '—'}</p>
            <p><strong>Branch Code:</strong> {bank.branchCode || '—'}</p>
            <p><strong>Reference:</strong> {invoiceData.paymentReference || invoiceNumber}</p>
          </div>
        </div>

        <div className="preview-section">
          <div className="section-heading">
            <span>✅</span>
            <div>
              <h3>Compliance & Handover Commitments</h3>
              <p>Included documentation and compliance support.</p>
            </div>
          </div>

          <div className="compliance-grid">
            {complianceRows.map((item) => (
              <div
                className={`compliance-pill ${
                  item.active ? 'included' : 'not-included'
                }`}
                key={item.label}
              >
                <span>{item.active ? '✓' : '•'}</span>
                {item.label}
              </div>
            ))}
          </div>

          {solarDefaults.defaultCocNote && (
            <p className="small-note mt-3">
              <strong>COC Note:</strong> {solarDefaults.defaultCocNote}
            </p>
          )}

          {solarDefaults.defaultSsegNote && (
            <p className="small-note">
              <strong>SSEG Note:</strong> {solarDefaults.defaultSsegNote}
            </p>
          )}
        </div>

        <div className="preview-section">
          <div className="section-heading">
            <span>📎</span>
            <div>
              <h3>Supporting Documents Available on Request</h3>
              <p>Useful documents for banks, insurers and client verification.</p>
            </div>
          </div>

          <div className="compliance-grid">
            {supportingDocuments.map((item) => (
              <div className="compliance-pill included" key={item}>
                <span>☐</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        {invoiceData.exclusions && (
          <div className="preview-section">
            <div className="section-heading">
              <span>🚫</span>
              <div>
                <h3>Exclusions</h3>
                <p>Items not included unless specifically listed in the scope schedule.</p>
              </div>
            </div>

            <div className="terms-box">{invoiceData.exclusions}</div>
          </div>
        )}

        {invoiceData.terms && (
          <div className="preview-section">
            <div className="section-heading">
              <span>📄</span>
              <div>
                <h3>Terms & Conditions</h3>
                <p>Commercial, warranty, compliance and client responsibility terms.</p>
              </div>
            </div>

            <div className="terms-box">{invoiceData.terms}</div>
          </div>
        )}

        <div className="preview-section note-box">
          <strong>Client Acceptance:</strong>
          <p>
            By signing this document, the client confirms acceptance of the quoted scope,
            exclusions, payment terms, site access requirements and installation conditions.
          </p>
        </div>

        <div className="preview-section bottom-grid">
          <QRCodeComponent invoiceData={invoiceData} documentType={documentType} />

          <div className="signature-preview-block">
            <h3>Prepared / Accepted By</h3>

            {invoiceData.signatureImageBase64 ? (
              <img
                src={invoiceData.signatureImageBase64}
                alt="Signature"
                className="signature-image"
              />
            ) : (
              <div className="signature-line" />
            )}

            <p>{invoiceData.signature || 'Authorized Signature'}</p>
            <small>{formatDate(new Date().toISOString())}</small>
          </div>
        </div>
      </div>

      <div className="preview-actions">
        <button
          className="btn btn-success btn-hover-scale"
          onClick={exportPDF}
          disabled={isGeneratingPdf}
        >
          {isGeneratingPdf ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" />
              Generating...
            </>
          ) : (
            <>📥 Download Bank-Ready PDF</>
          )}
        </button>

        <button className="btn btn-outline-dark btn-hover-scale" onClick={handlePrint}>
          🖨️ Print
        </button>

        <button
          className="btn btn-outline-primary btn-hover-scale"
          onClick={sendEmail}
          disabled={isSending}
        >
          {isSending ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" />
              Sending...
            </>
          ) : (
            <>📧 Email Client</>
          )}
        </button>
      </div>
    </div>
  );
}

export default InvoicePreview;