// ✅ src/components/QRCode.js
import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

function QRCode({ invoiceData }) {
  // ✅ Use the deployed frontend URL OR default to localhost for development
  const baseUrl = process.env.REACT_APP_FRONTEND_URL || 'https://invoice-front-mn5z.onrender.com';

  const invoiceNumber = invoiceData?.invoiceNumber;

  // ✅ Important: use hash-based routing for Render (/#/ instead of /)
  const link = invoiceNumber ? `${baseUrl}/#/pay/${invoiceNumber}` : '';

  return (
    <div className="text-center mt-4">
      <h6 className="mb-2">📱 Scan to Pay or View Invoice</h6>
      {invoiceNumber ? (
        <>
          <QRCodeCanvas
            value={link}
            size={160}
            bgColor="#ffffff"
            fgColor="#000000"
            level="H"
            includeMargin
          />
          <p className="small mt-2 text-muted">
            <a href={link} target="_blank" rel="noopener noreferrer">{link}</a>
          </p>
        </>
      ) : (
        <p className="text-muted small">Invoice number not available yet.</p>
      )}
    </div>
  );
}

export default QRCode;
