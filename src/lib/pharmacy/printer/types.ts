// Thermal printer integration types — Item 12
// Tshastho Pharmacy

export type PrinterConnectionType = 'bluetooth' | 'usb' | 'network' | 'browser';
export type PaperWidth = 58 | 80; // mm

export interface PrinterConfig {
  paperWidth: PaperWidth;
  connectionType: PrinterConnectionType;
  deviceName?: string;
  deviceId?: string;
  ipAddress?: string;
  port?: number; // default 9100
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  sku?: string;
  batch?: string;
  expiry?: string;
}

export interface ReceiptTotals {
  subtotal: number;
  discount?: number;
  vat?: number;
  delivery?: number;
  grandTotal: number;
  paid?: number;
  due?: number;
}

export interface ReceiptData {
  // Header
  pharmacyName: string;
  pharmacyNameBn?: string;
  pharmacyAddress?: string;
  pharmacyPhone?: string;
  pharmacyLicense?: string;
  branchName?: string;

  // Order
  orderNumber: string;
  orderDate: string;
  cashierName?: string;
  patientName?: string;
  patientPhone?: string;
  prescriptionId?: string;

  // Items & totals
  items: ReceiptItem[];
  totals: ReceiptTotals;

  // Payment
  paymentMethod?: string;
  transactionId?: string;

  // Bangladesh compliance
  mushakNumber?: string;
  vatRegistration?: string;

  // Footer
  footerNote?: string;

  // Config
  paperWidth: PaperWidth;
  currencySymbol?: string;
  showQr?: boolean;
  qrData?: string;
}

export interface PrintResult {
  success: boolean;
  logId?: string;
  method: PrinterConnectionType;
  error?: string;
  bytesSent?: number;
}

export interface BluetoothPrinterDevice {
  id: string;
  name: string;
  connected: boolean;
}
