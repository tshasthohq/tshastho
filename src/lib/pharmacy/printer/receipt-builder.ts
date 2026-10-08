// ReceiptData → ESC/POS bytes converter
// Item 12 — Tshastho Pharmacy

import { EscPosBuilder } from './escpos';
import type { ReceiptData } from './types';

const WIDTH: Record<58 | 80, number> = { 58: 32, 80: 48 };

function money(n: number, sym = 'Tk'): string {
  return `${sym} ${n.toFixed(2)}`;
}

function center(s: string, w: number): string {
  if (s.length >= w) return s.slice(0, w);
  const pad = Math.floor((w - s.length) / 2);
  return ' '.repeat(pad) + s;
}

/**
 * Build complete ESC/POS byte stream for a receipt.
 * Structure: init → header → order info → items → totals → payment →
 *            compliance → footer → feed → cut
 */
export function buildReceipt(data: ReceiptData): Uint8Array {
  const w = WIDTH[data.paperWidth];
  const sym = data.currencySymbol ?? 'Tk';
  const b = new EscPosBuilder();

  // ===== Init =====
  b.init().alignCenter();

  // ===== Header (pharmacy name bold+double) =====
  b.bold(true).charSize(1, 2);
  b.line(data.pharmacyName.toUpperCase().slice(0, Math.floor(w / 1)));
  b.resetCharSize().bold(false);

  if (data.pharmacyNameBn) b.line(data.pharmacyNameBn);
  if (data.branchName)     b.line(data.branchName);
  if (data.pharmacyAddress) b.line(data.pharmacyAddress);
  if (data.pharmacyPhone)   b.line(`Tel: ${data.pharmacyPhone}`);
  if (data.pharmacyLicense) b.line(`Drug Lic: ${data.pharmacyLicense}`);

  b.alignLeft().hr(w, '=');

  // ===== Order info =====
  b.line(`Order #: ${data.orderNumber}`);
  b.line(`Date   : ${data.orderDate}`);
  if (data.cashierName)    b.line(`Cashier: ${data.cashierName}`);
  if (data.patientName)    b.line(`Patient: ${data.patientName}`);
  if (data.patientPhone)   b.line(`Phone  : ${data.patientPhone}`);
  if (data.prescriptionId) b.line(`Rx ID  : ${data.prescriptionId}`);
  b.hr(w);

  // ===== Items =====
  for (const it of data.items) {
    b.line(it.name.slice(0, w));
    if (it.sku || it.batch || it.expiry) {
      const meta: string[] = [];
      if (it.sku)    meta.push(`SKU:${it.sku}`);
      if (it.batch)  meta.push(`Batch:${it.batch}`);
      if (it.expiry) meta.push(`Exp:${it.expiry}`);
      b.line('  ' + meta.join(' '));
    }
    b.row(`  ${it.quantity} x ${it.unitPrice.toFixed(2)}`, money(it.total, sym), w);
  }

  b.hr(w);

  // ===== Totals =====
  b.row('Subtotal', money(data.totals.subtotal, sym), w);
  if (data.totals.discount) b.row('Discount', '-' + money(data.totals.discount, sym), w);
  if (data.totals.vat)      b.row('VAT',      money(data.totals.vat, sym), w);
  if (data.totals.delivery) b.row('Delivery', money(data.totals.delivery, sym), w);
  b.hr(w);

  // Grand total bold + double height
  b.bold(true).charSize(1, 2);
  b.row('TOTAL', money(data.totals.grandTotal, sym), w);
  b.resetCharSize().bold(false);

  if (data.totals.paid !== undefined) b.row('Paid', money(data.totals.paid, sym), w);
  if (data.totals.due && data.totals.due > 0) {
    b.bold(true);
    b.row('Due', money(data.totals.due, sym), w);
    b.bold(false);
  }

  // ===== Payment =====
  if (data.paymentMethod) {
    b.hr(w);
    b.line(`Payment: ${data.paymentMethod}`);
    if (data.transactionId) b.line(`Txn    : ${data.transactionId}`);
  }

  // ===== Bangladesh compliance =====
  if (data.mushakNumber || data.vatRegistration) {
    b.hr(w);
    if (data.mushakNumber)    b.line(`Mushak 6.3: ${data.mushakNumber}`);
    if (data.vatRegistration) b.line(`VAT Reg: ${data.vatRegistration}`);
  }

  // ===== QR code =====
  if (data.showQr && data.qrData) {
    b.newline().alignCenter();
    b.qrCode(data.qrData, 5);
  }

  // ===== Footer =====
  b.alignCenter().newline();
  if (data.footerNote) b.line(data.footerNote);
  b.bold(true).line('Thank you! Get well soon.');
  b.bold(false);
  b.newline(3);

  // ===== Cut =====
  b.cut(true);

  return b.build();
}

/**
 * Build bytes to open cash drawer only (for standalone "Open Drawer" button).
 */
export function buildCashDrawerKick(): Uint8Array {
  const b = new EscPosBuilder();
  b.init().openCashDrawer();
  return b.build();
}

export { WIDTH as RECEIPT_WIDTH };
