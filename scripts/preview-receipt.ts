// Quick ASCII preview of a sample receipt — for testing Item 12
// Run: npx tsx scripts/preview-receipt.ts
import { renderAsciiPreview } from '../lib/printer/preview';
import { buildReceipt } from '../lib/printer/receipt-builder';
import type { ReceiptData } from '../lib/printer/types';

const sample: ReceiptData = {
  pharmacyName: 'Tshastho Pharmacy',
  pharmacyNameBn: 'সাস্থো ফার্মেসি',
  branchName: 'Mirpur Branch',
  pharmacyAddress: 'House 12, Road 5, Mirpur-10, Dhaka',
  pharmacyPhone: '+880 1700-000000',
  pharmacyLicense: 'DGDA-2024-12345',

  orderNumber: 'PH-2026-000123',
  orderDate: '2026-10-07 12:45',
  cashierName: 'Rahim',
  patientName: 'Karim Ahmed',
  patientPhone: '01711-000000',
  prescriptionId: 'RX-2026-45',

  items: [
    { name: 'Napa Extend 665mg', quantity: 2, unitPrice: 12.5,  total: 25,   batch: 'B2024A', expiry: '2027-05' },
    { name: 'Seclo 20mg',        quantity: 1, unitPrice: 85,    total: 85,   batch: 'B2024C', expiry: '2026-11' },
    { name: 'Monas 10mg',        quantity: 1, unitPrice: 165.5, total: 165.5 },
  ],

  totals: { subtotal: 275.5, discount: 5.5, vat: 13.5, grandTotal: 283.5, paid: 300, due: 0 },
  paymentMethod: 'Cash',
  mushakNumber: '6.3/2026/00123',
  vatRegistration: 'BIN-001234567-0101',
  footerNote: 'Keep medicines out of reach of children.',

  paperWidth: 58,
  currencySymbol: 'Tk',
  showQr: true,
  qrData: 'https://tshastho.com/receipt/PH-2026-000123',
};

console.log('============= ASCII PREVIEW (58mm) =============\n');
console.log(renderAsciiPreview(sample));

const bytes = buildReceipt(sample);
console.log('\n============= ESC/POS BYTES =============');
console.log('Total bytes to send to printer:', bytes.length);
console.log('First 32 bytes (hex):', Array.from(bytes.slice(0, 32)).map(b => b.toString(16).padStart(2, '0')).join(' '));
console.log('Last 8 bytes (hex):  ', Array.from(bytes.slice(-8)).map(b => b.toString(16).padStart(2, '0')).join(' '));
console.log('\n✅ Success — receipt can be encoded. Hardware not required for this test.');
