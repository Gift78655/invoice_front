// src/components/QRCode.js
import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

function QRCode({ invoiceData, documentType = 'Invoice' }) {
  const baseUrl =
    process.env.REACT_APP_FRONTEND_URL ||
    window.location.origin ||
    'https://invoice-front-mn5z.onrender.com';

  const invoiceNumber = invoiceData?.invoiceNumber;
  const link = invoiceNumber ? `${baseUrl}/#/pay/${invoiceNumber}` : '';

  return (
    <div className="qr-preview-card">
      <h3>Scan to View / Pay</h3>

      {invoiceNumber ? (
        <>
          <div className="qr-frame">
            <QRCodeCanvas
              value={link}
              size={140}
              bgColor="#ffffff"
              fgColor="#123524"
              level="H"
              includeMargin
            />
          </div>

          <p>
            Scan this QR code to open the {documentType.toLowerCase()} online.
          </p>

          <a href={link} target="_blank" rel="noopener noreferrer">
            {link}
          </a>
        </>
      ) : (
        <p className="text-muted small">
          Save the document first to generate a QR payment/view link.
        </p>
      )}
    </div>
  );
}

export default QRCode;