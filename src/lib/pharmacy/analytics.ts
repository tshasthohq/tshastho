import { prisma } from '@/lib/prisma';

/**
 * Top selling medicines in date range.
 */
export async function getTopSelling(params: {
  pharmacyId: string;
  from: Date;
  to: Date;
  limit?: number;
}) {
  const sales = await prisma.posSaleItem.groupBy({
    by: ['medicineId'],
    where: {
      sale: {
        pharmacyId: params.pharmacyId,
        createdAt: { gte: params.from, lte: params.to },
      },
    },
    _sum: { quantity: true, subtotal: true },
    _count: { _all: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: params.limit || 20,
  });

  const medicineIds = sales.map((s) => s.medicineId);
  const medicines = await prisma.medicine.findMany({
    where: { id: { in: medicineIds } },
    select: { id: true, name: true, brand: true, category: true },
  });

  return sales.map((s) => ({
    medicineId: s.medicineId,
    medicine: medicines.find((m) => m.id === s.medicineId),
    quantity: s._sum.quantity || 0,
    revenue: Number(s._sum.subtotal || 0),
    saleCount: s._count._all,
  }));
}

/**
 * Dead stock — medicines with no sale in N days.
 */
export async function getDeadStock(params: {
  pharmacyId: string;
  days?: number;
  limit?: number;
}) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (params.days || 90));

  const medicines = await prisma.medicine.findMany({
    where: {
      pharmacyId: params.pharmacyId,
      isActive: true,
      stock: { gt: 0 },
    },
    select: {
      id: true,
      name: true,
      brand: true,
      category: true,
      stock: true,
      purchasePrice: true,
      sellingPrice: true,
      createdAt: true,
    },
  });

  const soldIds = await prisma.posSaleItem.findMany({
    where: {
      sale: {
        pharmacyId: params.pharmacyId,
        createdAt: { gte: cutoff },
      },
    },
    select: { medicineId: true },
    distinct: ['medicineId'],
  });
  const soldSet = new Set(soldIds.map((s) => s.medicineId));

  const dead = medicines
    .filter((m) => !soldSet.has(m.id))
    .map((m) => ({
      ...m,
      tiedCapital: Number(m.purchasePrice) * m.stock,
      daysSinceCreated: Math.floor((Date.now() - m.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
    }))
    .sort((a, b) => b.tiedCapital - a.tiedCapital)
    .slice(0, params.limit || 50);

  return dead;
}

/**
 * Category performance.
 */
export async function getCategoryPerformance(params: {
  pharmacyId: string;
  from: Date;
  to: Date;
}) {
  const sales = await prisma.posSaleItem.findMany({
    where: {
      sale: {
        pharmacyId: params.pharmacyId,
        createdAt: { gte: params.from, lte: params.to },
      },
    },
    include: {
      medicine: { select: { category: true } },
    },
  });

  const byCategory: Record<string, { qty: number; revenue: number }> = {};
  for (const s of sales) {
    const cat = s.medicine?.category || 'Uncategorized';
    if (!byCategory[cat]) byCategory[cat] = { qty: 0, revenue: 0 };
    byCategory[cat].qty += s.quantity;
    byCategory[cat].revenue += Number(s.subtotal);
  }

  return Object.entries(byCategory)
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.revenue - a.revenue);
}

/**
 * Daily sales trend.
 */
export async function getDailyTrend(params: {
  pharmacyId: string;
  days?: number;
}) {
  const days = params.days || 30;
  const start = new Date();
  start.setDate(start.getDate() - days + 1);
  start.setHours(0, 0, 0, 0);

  const sales = await prisma.posSale.findMany({
    where: {
      pharmacyId: params.pharmacyId,
      createdAt: { gte: start },
    },
    select: { totalAmount: true, profit: true, createdAt: true },
  });

  const byDate: Record<string, { sales: number; profit: number; count: number }> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    byDate[key] = { sales: 0, profit: 0, count: 0 };
  }

  for (const s of sales) {
    const key = s.createdAt.toISOString().slice(0, 10);
    if (byDate[key]) {
      byDate[key].sales += Number(s.totalAmount);
      byDate[key].profit += Number(s.profit);
      byDate[key].count += 1;
    }
  }

  return Object.entries(byDate).map(([date, data]) => ({ date, ...data }));
}

/**
 * Customer segmentation (RFM).
 */
export async function getCustomerSegmentation(pharmacyId: string) {
  const customers = await prisma.posCustomer.findMany({
    where: { pharmacyId },
    include: {
      sales: {
        select: { totalAmount: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  const now = Date.now();
  const segments: Record<string, number> = {
    VIP: 0,
    Regular: 0,
    Occasional: 0,
    Inactive: 0,
  };

  for (const c of customers) {
    const count = c.sales.length;
    if (count === 0) continue;

    const totalSpent = c.sales.reduce((s, x) => s + Number(x.totalAmount), 0);
    const daysSinceLast = Math.floor((now - c.sales[0].createdAt.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceLast > 90) segments.Inactive++;
    else if (count >= 10 && totalSpent >= 5000) segments.VIP++;
    else if (count >= 5 || totalSpent >= 2000) segments.Regular++;
    else segments.Occasional++;
  }

  return segments;
}

/**
 * Profit margin analysis.
 */
export async function getProfitMargins(params: {
  pharmacyId: string;
  from: Date;
  to: Date;
  limit?: number;
}) {
  const items = await prisma.posSaleItem.findMany({
    where: {
      sale: {
        pharmacyId: params.pharmacyId,
        createdAt: { gte: params.from, lte: params.to },
      },
    },
    include: {
      medicine: { select: { name: true, brand: true, category: true } },
    },
  });

  const byMedicine: Record<string, { qty: number; revenue: number; cost: number; name: string }> = {};
  for (const i of items) {
    if (!byMedicine[i.medicineId]) {
      byMedicine[i.medicineId] = {
        qty: 0,
        revenue: 0,
        cost: 0,
        name: i.medicine?.name || 'Unknown',
      };
    }
    const entry = byMedicine[i.medicineId];
    entry.qty += i.quantity;
    entry.revenue += Number(i.subtotal);
    entry.cost += Number(i.purchasePrice) * i.quantity;
  }

  return Object.entries(byMedicine)
    .map(([id, data]) => {
      const profit = data.revenue - data.cost;
      const margin = data.revenue > 0 ? (profit / data.revenue) * 100 : 0;
      return {
        medicineId: id,
        name: data.name,
        quantity: data.qty,
        revenue: data.revenue,
        profit,
        margin,
      };
    })
    .sort((a, b) => b.margin - a.margin)
    .slice(0, params.limit || 20);
}
