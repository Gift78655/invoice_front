// src/context/SettingsContext.js
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

const SETTINGS_STORAGE_KEY = 'settings';
const SETTINGS_VERSION = 3;

const solarTerms = `Payment Terms:
A deposit may be required before procurement of solar equipment, batteries, inverters, electrical material, and installation scheduling. The balance is payable before final handover, commissioning, release of documentation, or as otherwise agreed in writing.

Quote Validity:
Quotations are valid for 7 calendar days unless otherwise stated. Prices may change due to supplier pricing, stock availability, exchange rate changes, delivery charges, or project scope changes.

Document Status:
A quotation is issued for approval and planning purposes and is not a tax invoice. A proforma invoice may be issued for payment or procurement purposes and is not a final tax invoice. A tax invoice should only be issued where applicable and where VAT/tax requirements are satisfied.

Scope of Work:
This quotation/invoice covers only the equipment, labour, compliance items, and services listed in the document. Any additional electrical work, DB upgrades, trenching, roof repairs, structural work, internet/network work, municipal fees, engineering reports, or authority requirements not listed will be quoted separately.

Site Assessment:
Final installation requirements remain subject to site inspection, roof condition, DB condition, cable routes, access, load assessment, available space, and safety conditions. Any change in site conditions may affect the final scope, price, and installation timeline.

COC and Compliance:
A Certificate of Compliance will be issued where applicable electrical work has been completed, inspected, tested, and found compliant. Existing non-compliant wiring, unsafe DB conditions, overloaded circuits, missing protection devices, or third-party work may require corrective work before a COC can be issued.

SSEG / Municipal Registration:
SSEG registration support, single-line diagrams, commissioning information, or municipal documentation may be included only where stated. Approval timelines remain subject to the relevant municipality, utility, or authority. Municipal/authority fees are excluded unless specifically listed.

Warranty:
Manufacturer warranties apply to equipment such as inverters, batteries, panels, and accessories. Workmanship warranty applies to installation workmanship only and excludes misuse, overloading, tampering, lightning/surge damage, water damage, negligence, lack of maintenance, unauthorized modifications, or damage caused by third-party work.

Client Responsibilities:
The client must provide safe access to the site, DB board, roof area, installation area, WiFi details where monitoring is required, and accurate load information. Delays caused by access issues, unavailable information, unsafe site conditions, or client-side readiness may affect installation timelines.

Payment Confirmation:
Payment is only confirmed once reflected in the nominated bank account or verified against valid proof of payment. Installation, release of goods, or final handover may be delayed until payment verification is complete.

POPIA Notice:
Client information is processed and stored only for quotation, invoicing, compliance, communication, payment verification, after-sales support, and service delivery purposes in line with POPIA requirements.`;

const deepClone = (value) => JSON.parse(JSON.stringify(value));

export const defaultSettings = {
  settingsVersion: SETTINGS_VERSION,

  companyName: 'TP Electro',
  companyEmail: 'info@tpelectro.co.za',
  companyPhone: '+27 87 123 4567',
  website: 'www.tpelectro.co.za',
  logoUrl: '/logo.png',
  logoDataUrl: '',

  slogan: 'Reliable solar, backup power and electrical solutions for South Africa.',
  theme: 'light',
  currency: 'ZAR',

  // Safer default: enable VAT only once the VAT number is confirmed in Settings.
  includeVAT: false,

  registrationDetails: {
    companyRegistrationNo: '',
    vatNumber: '',
    electricalContractorNo: '',
    registeredPersonName: '',
    registeredPersonNo: '',
    serviceAreas: 'Johannesburg, Pretoria, Gauteng and surrounding areas',
  },

  bankDetails: {
    bank: 'Standard Bank',
    accountNo: '123 456 789',
    branchCode: '051001',
    accountName: 'TP Electro',
    accountType: 'Business Current Account',
  },

  solarDefaults: {
    defaultDocumentType: 'Solar Quotation',
    defaultQuoteValidityDays: 7,
    defaultDepositPercentage: 70,
    defaultBalancePercentage: 30,

    defaultWorkmanshipWarranty:
      '12 months workmanship warranty unless otherwise stated. Manufacturer warranties apply separately to supplied equipment.',

    defaultEquipmentWarranty:
      'Manufacturer warranty applies to inverters, batteries, panels and accessories. Warranty claims remain subject to manufacturer terms, correct installation, correct usage, and proof of purchase.',

    defaultPaymentMilestone:
      '70% deposit required to secure equipment and installation booking. 30% balance payable before final handover, commissioning, or release of completion documentation, unless otherwise agreed in writing.',

    defaultCocNote:
      'COC will be issued where applicable electrical work is completed, inspected, tested and found compliant. Existing non-compliant wiring or unsafe DB conditions may require corrective work before COC issuing.',

    defaultSsegNote:
      'SSEG registration support, single-line diagrams and commissioning documentation are included only where stated in the quotation. Municipal approvals and timelines remain subject to the relevant authority.',

    defaultExclusions:
      'Excludes roof repairs, structural engineering, trenching, plastering, painting, internet/network upgrades, municipal fees, DB upgrades, additional electrical faults, existing non-compliance corrections, and authority fees unless specifically listed.',
  },

  supportingDocumentsDefaults: {
    companyRegistration: true,
    bankConfirmationLetter: true,
    electricalContractorRegistration: true,
    registeredPersonDetails: true,
    productDatasheets: true,
    warrantyDocumentation: true,
    singleLineDiagram: true,
    cocAfterInstallation: true,
    commissioningReport: true,
    proofOfPayment: true,
  },

  paymentOptions: 'EFT, Card, SnapScan',
  paymentInstructions:
    'Use the quotation or invoice number as payment reference. Please send proof of payment to the company email address. Payment is only confirmed once reflected or verified.',

  terms: solarTerms,
};

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const mergeNestedObject = (defaultValue, storedValue) => ({
  ...defaultValue,
  ...(isPlainObject(storedValue) ? storedValue : {}),
});

const mergeSettings = (storedSettings) => {
  if (!isPlainObject(storedSettings)) {
    return deepClone(defaultSettings);
  }

  return {
    ...deepClone(defaultSettings),
    ...storedSettings,
    settingsVersion: SETTINGS_VERSION,

    registrationDetails: mergeNestedObject(
      defaultSettings.registrationDetails,
      storedSettings.registrationDetails
    ),

    bankDetails: mergeNestedObject(
      defaultSettings.bankDetails,
      storedSettings.bankDetails
    ),

    solarDefaults: mergeNestedObject(
      defaultSettings.solarDefaults,
      storedSettings.solarDefaults
    ),

    supportingDocumentsDefaults: mergeNestedObject(
      defaultSettings.supportingDocumentsDefaults,
      storedSettings.supportingDocumentsDefaults
    ),
  };
};

const loadInitialSettings = () => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return deepClone(defaultSettings);
    }

    const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY);

    if (!stored) {
      return deepClone(defaultSettings);
    }

    const parsed = JSON.parse(stored);
    return mergeSettings(parsed);
  } catch (error) {
    console.error('Failed to load settings from localStorage:', error);
    return deepClone(defaultSettings);
  }
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettingsState] = useState(loadInitialSettings);

  const setSettings = (nextSettings) => {
    setSettingsState((prev) => {
      const resolved =
        typeof nextSettings === 'function' ? nextSettings(prev) : nextSettings;

      return mergeSettings(resolved);
    });
  };

  const resetSettings = () => {
    setSettingsState(deepClone(defaultSettings));
  };

  const clearStoredSettings = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
      }

      setSettingsState(deepClone(defaultSettings));
    } catch (error) {
      console.error('Failed to clear stored settings:', error);
      setSettingsState(deepClone(defaultSettings));
    }
  };

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(
          SETTINGS_STORAGE_KEY,
          JSON.stringify(settings)
        );
      }
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
  }, [settings]);

  const value = useMemo(
    () => ({
      settings,
      setSettings,
      resetSettings,
      clearStoredSettings,
      defaultSettings,
    }),
    [settings]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};