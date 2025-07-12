import React, { useRef, useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import QRCodeLib from 'qrcode';
import { useReactToPrint } from 'react-to-print';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCodeComponent from './QRCode';
import '../styles/InvoicePreview.css';

pdfMake.vfs = pdfFonts.default.vfs;
const BACKEND_URL = process.env.REACT_APP_API_URL || 'https://invoice-backend-flsi.onrender.com';

function InvoicePreview({ invoiceData = {} }) {
  const previewRef = useRef();
  const [isSending, setIsSending] = useState(false);
  const { settings } = useSettings();
  const includeVAT = invoiceData?.includeVAT ?? settings.includeVAT;

  const invoiceNumber = invoiceData.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`;
  const invoiceDate = invoiceData.timeline?.invoiceDate || new Date().toISOString().slice(0, 10);

  const calculateSubtotal = () => {
    if (!Array.isArray(invoiceData.items)) return 0;
    return invoiceData.items.reduce((total, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.price) || 0;
      return total + qty * price;
    }, 0);
  };

  const calculateVAT = (subtotal) => includeVAT ? subtotal * 0.15 : 0;

  const convertToWords = (num) => {
    const units = ['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine'];
    const teens = ['Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    const tens = ['', '', 'Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
    const getBelowHundred = (n) => n < 10 ? units[n] : n < 20 ? teens[n - 10] : tens[Math.floor(n / 10)] + (n % 10 !== 0 ? '-' + units[n % 10] : '');
    if (num < 100) return getBelowHundred(num);
    if (num < 1000) return units[Math.floor(num / 100)] + ' Hundred ' + getBelowHundred(num % 100);
    return 'Amount too large';
  };

  const subtotal = calculateSubtotal();
  const vat = calculateVAT(subtotal);
  const total = subtotal + vat;
  const totalInWords = convertToWords(Math.round(total));
  const paymentStatus = invoiceData.status || 'DUE';

  const exportPDF = async () => {
    try {
      const qrData = `${window.location.origin}/pay/${invoiceNumber}`;
      const qrImage = await QRCodeLib.toDataURL(qrData);

      const docDefinition = {
        content: [
          ...(settings.logoDataUrl ? [{ image: settings.logoDataUrl, width: 100 }] : []),
          { text: settings.companyName, style: 'header' },
          { text: `${settings.companyEmail} | ${settings.companyPhone} | ${settings.website}`, style: 'subheader' },
          { text: `\nInvoice #: ${invoiceNumber}\nInvoice Date: ${invoiceDate}\n`, style: 'details' },
          {
            text: `Client:\n${invoiceData.clientName || '—'}\n${invoiceData.clientEmail || '—'}\n${invoiceData.clientAddress || '—'}`,
            style: 'details'
          },
          {
            table: {
              widths: ['*', 'auto', 'auto', 'auto'],
              body: [
                ['Description', 'Qty', 'Unit Price', 'Total'],
                ...(invoiceData.items?.map(item => [
                  item.description || '—',
                  item.quantity,
                  `R${(item.price || 0).toFixed(2)}`,
                  `R${((item.quantity || 0) * (item.price || 0)).toFixed(2)}`
                ]) || []),
                [{ text: 'Subtotal', colSpan: 3, alignment: 'right' }, {}, {}, `R${subtotal.toFixed(2)}`],
                ...(includeVAT ? [[{ text: 'VAT (15%)', colSpan: 3, alignment: 'right' }, {}, {}, `R${vat.toFixed(2)}`]] : []),
                [{ text: 'Total', colSpan: 3, alignment: 'right', bold: true }, {}, {}, `R${total.toFixed(2)}`]
              ]
            }
          },
          { text: `\nTotal in Words: ${totalInWords} Rand only`, italics: true },
          { text: `\nPayment Status: ${paymentStatus}`, style: 'details' },
          {
            text: `\nBank Details:\nBank: ${settings.bankDetails.bank}\nAccount No: ${settings.bankDetails.accountNo}\nBranch Code: ${settings.bankDetails.branchCode}`,
            style: 'details'
          },
          {
            text: `\nTimeline:\nQuote: ${invoiceData.timeline?.quoteDate || '—'}\nInvoice: ${invoiceDate}\nPayment: ${invoiceData.timeline?.paymentDate || '—'}`,
            style: 'details'
          },
          {
            columns: [
              { image: qrImage, width: 100 },
              {
                text: [
                  { text: 'View Invoice Online\n', bold: true },
                  {
                    text: qrData,
                    link: qrData,
                    color: 'blue',
                    decoration: 'underline'
                  }
                ],
                margin: [10, 20, 0, 0]
              }
            ]
          },
          { text: `\n${settings.slogan}`, style: 'slogan' },
          {
            columns: [
              { width: '*', text: '\n\nAuthorized Signature:\n__________________________', margin: [0, 30, 0, 0] },
              ...(invoiceData.signatureImageBase64
                ? [{ image: invoiceData.signatureImageBase64, width: 120, margin: [10, 10, 0, 0] }]
                : [])
            ]
          }
        ],
        styles: {
          header: { fontSize: 18, bold: true },
          subheader: { fontSize: 10, color: 'gray' },
          details: { fontSize: 10, margin: [0, 2, 0, 2] },
          slogan: { fontSize: 10, italics: true, alignment: 'center', margin: [0, 30, 0, 10] }
        }
      };

      pdfMake.createPdf(docDefinition).download(`${invoiceNumber}.pdf`);
    } catch (err) {
      console.error('PDF Export Error:', err);
      toast.error('❌ Error generating PDF.');
    }
  };

  const handlePrint = useReactToPrint({
    content: () => previewRef.current,
    documentTitle: invoiceNumber,
  });

  const sendEmail = async () => {
    if (!invoiceData.clientEmail) {
      toast.error('❌ No email address provided for the client.');
      return;
    }

    const confirmed = window.confirm(`📧 Send this invoice to ${invoiceData.clientEmail}?`);
    if (!confirmed) return;

    setIsSending(true);
    try {
      const canvas = await html2canvas(previewRef.current);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      const blob = pdf.output('blob');
      const formData = new FormData();
      formData.append('pdf', blob, `${invoiceNumber}.pdf`);
      formData.append('email', invoiceData.clientEmail);

      const res = await fetch(`${BACKEND_URL}/api/send-invoice`, {
        method: 'POST',
        body: formData,
      });

      res.ok ? toast.success('✅ Invoice emailed successfully!') : toast.error('❌ Failed to send invoice.');
    } catch (err) {
      console.error('Email error:', err);
      toast.error('❌ Error occurred while sending invoice.');
    }

    setIsSending(false);
  };

  return (
    <div>
      <div ref={previewRef} className="invoice-preview p-3 border rounded mb-3 bg-white card shadow-sm rounded-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-3">
            <img src={settings.logoDataUrl || settings.logoUrl} alt="Logo" style={{ maxHeight: 100 }} />
            <div>
              <h5>{settings.companyName}</h5>
              <small>{settings.companyEmail}</small><br />
              <small>{settings.companyPhone}</small><br />
              <small>{settings.website}</small>
            </div>
          </div>
          <div className="text-end">
            <span className={`badge bg-${paymentStatus === 'PAID' ? 'success' : paymentStatus === 'OVERDUE' ? 'danger' : 'warning'} mb-2`}>
              {paymentStatus}
            </span>
            <h5>Invoice #: {invoiceNumber}</h5>
            <small>{invoiceDate}</small>
          </div>
        </div>

        <div className="mb-3">
          <strong>Client:</strong>
          <p>{invoiceData.clientName || '—'}</p>
          <p>{invoiceData.clientEmail || '—'}</p>
          <p>{invoiceData.clientAddress || '—'}</p>
        </div>

        <table className="table table-hover table-borderless table-sm">
          <thead className="table-light">
            <tr>
              <th>Description</th>
              <th className="text-end">Qty</th>
              <th className="text-end">Unit Price</th>
              <th className="text-end">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoiceData.items?.length > 0 ? invoiceData.items.map((item, idx) => (
              <tr key={idx}>
                <td>{item.description}</td>
                <td className="text-end">{item.quantity}</td>
                <td className="text-end">R{(item.price || 0).toFixed(2)}</td>
                <td className="text-end">R{((item.quantity || 0) * (item.price || 0)).toFixed(2)}</td>
              </tr>
            )) : (
              <tr><td colSpan="4" className="text-center text-muted">No items</td></tr>
            )}
          </tbody>
          <tfoot>
            <tr><td colSpan="3" className="text-end">Subtotal:</td><td className="text-end">R{subtotal.toFixed(2)}</td></tr>
            {includeVAT && <tr><td colSpan="3" className="text-end">VAT (15%):</td><td className="text-end">R{vat.toFixed(2)}</td></tr>}
            <tr><td colSpan="3" className="text-end fw-bold">Total:</td><td className="text-end fw-bold">R{total.toFixed(2)}</td></tr>
          </tfoot>
        </table>

        <div className="mb-3"><em>Total in Words: <strong>{totalInWords} Rand only</strong></em></div>

        {invoiceData.notes && (
          <div className="mt-4"><strong>Notes</strong><p>{invoiceData.notes}</p></div>
        )}

        <QRCodeComponent invoiceData={invoiceData} />

        <div className="mt-4">
          <strong>Bank Details</strong>
          <p>Bank: {settings.bankDetails.bank}</p>
          <p>Account No: {settings.bankDetails.accountNo}</p>
          <p>Branch Code: {settings.bankDetails.branchCode}</p>
        </div>

        {invoiceData.terms && (
          <div className="mt-4">
            <strong>Terms & Conditions</strong>
            <div className="border p-2 bg-light small">
              <pre className="mb-0" style={{ fontFamily: 'inherit' }}>{invoiceData.terms}</pre>
            </div>
          </div>
        )}

        {invoiceData.signatureImageBase64 ? (
          <div className="mt-5 d-flex flex-column align-items-start">
            <p className="mb-1">Authorized Signature:</p>
            <img
              src={invoiceData.signatureImageBase64}
              alt="Signature"
              style={{ width: 200, height: 'auto', borderBottom: '1px solid #000', marginBottom: '0.5rem' }}
            />
            <span className="small text-muted">{invoiceData.signature || 'Signed by client'}</span>
          </div>
        ) : (
          <div className="mt-5">
            <p>__________________________</p>
            <p className="small">{invoiceData.signature || 'Authorized Signature'}</p>
          </div>
        )}
      </div>

      <div className="d-flex gap-2">
        <button className="btn light border shadow-sm w-100 btn-hover-scale" onClick={exportPDF}>📥 Download PDF</button>
        <button className="btn light border shadow-sm w-100 btn-hover-scale" onClick={handlePrint}>🖨️ Print Invoice</button>
        <button className="btn light border shadow-sm w-100 btn-hover-scale" onClick={sendEmail} disabled={isSending}>
          {isSending ? (<><span className="spinner-border spinner-border-sm me-2"></span>Sending...</>) : (<>📧 Email</>)}
        </button>
      </div>

      <ToastContainer position="bottom-center" autoClose={4000} hideProgressBar />
    </div>
  );
}

export default InvoicePreview;
