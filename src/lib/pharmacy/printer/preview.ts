// ASCII/text preview of a receipt — used for on-screen preview
// and for testing without physical hardware.
// Item 12 — Tshastho Pharmacy

import type { ReceiptData, PaperWidth } from './types';

const CHARS_PER_LINE: Record<PaperWidth, number> = { 58: 32, 80: 48 };

export function renderAsciiPreview(data: ReceiptData): string {
  const width = CHARS_PER_LINE[data.paperWidth];
  const C = data.currencySymbol ?? 'Tk';
  const lines: string[] = [];

  const hr = () => lines.push('-'.repeat(width));
  const center = (s: string) =>
    s.length >= width ? s.slice(0, width) : ' '.repeat(Math.floor((width - s.length) / 2)) + s;
  const row = (l: string, r: string) => {
    const dots = Math.max(2, width - l.length - r.length - 2);
    lines.push(`${l} ${'.'.repeat(dots)} ${r}`);
  };
  const m = (n: number) => `${C} ${n.toFixed(2)}`;

  // Header
  lines.push(center(data.pharmacyName.toUpperCase()));
  if (data.pharmacyNameBn) lines.push(center(data.pharmacyNameBn));
  if (data.branchName) lines.push(center(data.branchName));
  if (data.pharmacyAddress) lines.push(center(data.pharmacyAddress));
  if (data.pharmacyPhone) lines.push(center(`Tel: ${data.pharmacyPhone}`));
  if (data.pharmacyLicense) lines.push(center(`Drug Lic: ${data.pharmacyLicense}`));
  hr();

  // Order info
  lines.push(`Order #: ${data.orderNumber}`);
  lines.push(`Date   : ${data.orderDate}`);
  if (data.cashierName) lines.push(`Cashier: ${data.cashierName}`);
  if (data.patientName) lines.push(`Patient: ${data.patientName}`);
  if (data.patientPhone) lines.push(`Phone  : ${data.patientPhone}`);
  if (data.prescriptionId) lines.push(`Rx ID  : ${data.prescriptionId}`);
  hr();

  // Items
  for (const it of data.items) {
    lines.push(it.name.slice(0, width));
    if (it.batch || it.expiry) {
      const meta = [it.batch && `Batch:${it.batch}`, it.expiry && `Exp:${it.expiry}`]
        .filter(Boolean).join(' ');
      lines.push('  ' + meta);
    }
    row(`  ${it.quantity} x ${it.unitPrice.toFixed(2)}`, m(it.total));
  }
  hr();

  // Totals
  row('Subtotal', m(data.totals.subtotal));
  if (data.totals.discount) row('Discount', '-' + m(data.totals.discount));
  if (data.totals.vat) row('VAT', m(data.totals.vat));
  if (data.totals.delivery) row('Delivery', m(data.totals.delivery));
  hr();
  row('TOTAL', m(data.totals.grandTotal));
  if (data.totals.paid !== undefined) row('Paid', m(data.totals.paid));
  if (data.totals.due) row('Due', m(data.totals.due));

  // Payment
  if (data.paymentMethod) {
    hr();
    lines.push(`Payment: ${data.paymentMethod}`);
    if (data.transactionId) lines.push(`Txn    : ${data.transactionId}`);
  }

  // Compliance
  if (data.mushakNumber) {
    hr();
    lines.push(`Mushak 6.3: ${data.mushakNumber}`);
  }
  if (data.vatRegistration) lines.push(`VAT Reg: ${data.vatRegistration}`);

  // Footer
  lines.push('');
  if (data.footerNote) lines.push(center(data.footerNote));
  lines.push(center('Thank you! Get well soon.'));
  lines.push('');
  return lines.join('\n');
}

export function getCharsPerLine(w: PaperWidth): number {
  return CHARS_PER_LINE[w];
}
