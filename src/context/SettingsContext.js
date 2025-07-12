// src/context/SettingsContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

const defaultSettings = {
  companyName: 'Future Finance Group',
  companyEmail: 'info@futurefinance.co.za',
  companyPhone: '+27 87 123 4567',
  logoUrl: '/logo.png',
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

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const stored = localStorage.getItem('settings');
    return stored ? JSON.parse(stored) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings));
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};