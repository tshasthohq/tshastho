import { prisma } from '@/lib/prisma';

function genInvoiceNumber(seq: number, prefix = 'INV') {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${prefix}-${y}${m}-${String(seq + 1).padStart(5, '0')}`;
}

function genReportNumber(seq: number) {
  const d = new Date();
  return `VAT-${d.getFullYear()}-${String(seq + 1).padStart(4, '0')}`;
}

/**
 * Creates a VAT invoice for an order or POS sale.
 * Returns null if VAT is disabled for that channel.
 */
export async function createVatInvoice(params: {
  pharmacyId: string;
  orderId?: string;
  posSaleId?: string;
  subtotal: number;
  discount: number;
  customerName?: string;
  customerPhone?: string;
  customerVatNumber?: string;
}) {
  const config = await prisma.taxConfiguration.findUnique({
    where: { pharmacyId: params.pharmacyId },
  });

  if (!config || !config.isVatRegistered) return null;

  // Check channel
  if (params.orderId && !config.enableVatOnOnline) return null;
  if (params.posSaleId && !config.enableVatOnPos) return null;

  const taxableAmount = Math.max(0, params.subtotal - params.discount);
  const vatRate = Number(config.vatRate);
  const vatAmount = (taxableAmount * vatRate) / 100;
  const totalAmount = taxableAmount + vatAmount;

  const count = await prisma.vatInvoice.count({ where: { pharmacyId: params.pharmacyId } });
  const invoiceNumber = genInvoiceNumber(count, config.invoicePrefix);

  return prisma.vatInvoice.create({
    data: {
      invoiceNumber,
      pharmacyId: params.pharmacyId,
      orderId: params.orderId || null,
      posSaleId: params.posSaleId || null,
      customerName: params.customerName || null,
      customerPhone: params.customerPhone || null,
      customerVatNumber: params.customerVatNumber || null,
      subtotal: params.subtotal,
      discount: params.discount,
      vatRate,
      vatAmount,
      totalAmount,
    },
  });
}

/**
 * Generates a monthly VAT report from invoices.
 */
export async function generateVatReport(params: {
  pharmacyId: string;
  month: string; // YYYY-MM
  userId: string;
}) {
  const [y, m] = params.month.split('-').map(Number);
  const periodStart = new Date(y, m - 1, 1);
  const periodEnd = new Date(y, m, 0, 23, 59, 59, 999);

  const config = await prisma.taxConfiguration.findUnique({
    where: { pharmacyId: params.pharmacyId },
  });

  const [invoices, cancelled] = await Promise.all([
    prisma.vatInvoice.aggregate({
      where: {
        pharmacyId: params.pharmacyId,
        isCancelled: false,
        invoiceDate: { gte: periodStart, lte: periodEnd },
      },
      _sum: { subtotal: true, discount: true, vatAmount: true, totalAmount: true },
      _count: { _all: true },
    }),
    prisma.vatInvoice.count({
      where: {
        pharmacyId: params.pharmacyId,
        isCancelled: true,
        invoiceDate: { gte: periodStart, lte: periodEnd },
      },
    }),
  ]);

  const count = await prisma.vatReport.count({ where: { pharmacyId: params.pharmacyId } });
  const reportNumber = genReportNumber(count);

  return prisma.vatReport.upsert({
    where: { pharmacyId_month: { pharmacyId: params.pharmacyId, month: params.month } },
    update: {
      totalSales: Number(invoices._sum.subtotal || 0),
      totalDiscount: Number(invoices._sum.discount || 0),
      totalVat: Number(invoices._sum.vatAmount || 0),
      totalInvoices: invoices._count._all,
      cancelledCount: cancelled,
      vatNumber: config?.vatNumber || null,
      generatedById: params.userId,
    },
    create: {
      reportNumber,
      pharmacyId: params.pharmacyId,
      month: params.month,
      periodStart,
      periodEnd,
      totalSales: Number(invoices._sum.subtotal || 0),
      totalDiscount: Number(invoices._sum.discount || 0),
      totalVat: Number(invoices._sum.vatAmount || 0),
      totalInvoices: invoices._count._all,
      cancelledCount: cancelled,
      vatNumber: config?.vatNumber || null,
      generatedById: params.userId,
    },
  });
}
