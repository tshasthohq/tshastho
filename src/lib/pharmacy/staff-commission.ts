// Staff Commission Auto-calc — Item 15
// POS-sale-based. Called when a PosSale is completed.

import { prisma } from '@/lib/prisma';

export interface CalcResult {
  ok: boolean;
  commissionId?: string;
  amount?: number;
  skipped?: boolean;
  reason?: string;
  error?: string;
}

/**
 * Calculate & persist staff commission for a POS sale.
 * Base = sale.profit (fallback: totalAmount if profit <= 0)
 * Rate = User.commissionPercent
 * Idempotent via Commission.orderId (reused as posSaleId).
 */
export async function calcStaffCommission(posSaleId: string): Promise<CalcResult> {
  try {
    const sale = await prisma.posSale.findUnique({
      where: { id: posSaleId },
      select: {
        id: true,
        saleNumber: true,
        staffId: true,
        pharmacyId: true,
        totalAmount: true,
        profit: true,
        isReturned: true,
      },
    });
    if (!sale) return { ok: false, error: 'POS sale not found' };
    if (sale.isReturned) return { ok: true, skipped: true, reason: 'Sale returned' };
    if (!sale.staffId) return { ok: true, skipped: true, reason: 'No staff on sale' };

    // Idempotency — Commission.orderId stores posSaleId
    const existing = await prisma.commission.findUnique({
      where: { orderId: posSaleId },
      select: { id: true },
    });
    if (existing) {
      return { ok: true, skipped: true, commissionId: existing.id, reason: 'Already credited' };
    }

    // Rate
    const staff = await prisma.user.findUnique({
      where: { id: sale.staffId },
      select: { commissionPercent: true },
    });
    const rate = Number(staff?.commissionPercent ?? 0);
    if (!rate) {
      return { ok: true, skipped: true, reason: 'No commission rate on staff' };
    }

    // Base
    const profit = Number(sale.profit ?? 0);
    const total = Number(sale.totalAmount ?? 0);
    const base = profit > 0 ? profit : total;
    if (base <= 0) return { ok: true, skipped: true, reason: 'Zero base amount' };

    const amount = Math.round(((base * rate) / 100) * 100) / 100;
    if (amount <= 0) return { ok: true, skipped: true, reason: 'Zero commission' };

    const commission = await prisma.commission.create({
      data: {
        orderId: posSaleId,
        partnerId: sale.staffId,
        partnerType: 'STAFF',
        orderAmount: base,
        commissionRate: rate,
        commissionAmount: amount,
        partnerShare: amount,
        status: 'PENDING',
        metadata: {
          pharmacyId: sale.pharmacyId,
          saleNumber: sale.saleNumber,
          source: 'pos_sale',
          base: profit > 0 ? 'profit' : 'total',
        } as object,
      },
    });

    return { ok: true, commissionId: commission.id, amount };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[STAFF_COMMISSION_CALC]', posSaleId, msg);
    return { ok: false, error: msg };
  }
}

/**
 * List staff commissions in a period.
 */
export async function listStaffCommissions(params: {
  pharmacyId: string;
  staffId?: string;
  status?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}) {
  const { pharmacyId, staffId, status, from, to } = params;
  const limit = Math.min(200, Math.max(1, params.limit ?? 50));
  const offset = Math.max(0, params.offset ?? 0);

  // Staff IDs in this pharmacy
  const staffList = await prisma.user.findMany({
    where: { parentPharmacyId: pharmacyId },
    select: { id: true },
  });
  const staffIds = staffList.map((s) => s.id);
  if (staffIds.length === 0) {
    return { items: [], total: 0, summary: { total: 0, pending: 0, paid: 0 } };
  }

  const where = {
    partnerType: 'STAFF',
    partnerId: staffId ? staffId : { in: staffIds },
    ...(status ? { status } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
  };

  const [items, total, agg] = await Promise.all([
    prisma.commission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.commission.count({ where }),
    prisma.commission.groupBy({
      by: ['status'],
      where,
      _sum: { commissionAmount: true },
    }),
  ]);

  // Enrich with staff names
  const partnerIds = Array.from(new Set(items.map((i) => i.partnerId).filter((x): x is string => typeof x === "string")));
  const staffMap = new Map(
    (
      await prisma.user.findMany({
        where: { id: { in: partnerIds } },
        select: { id: true, name: true },
      })
    ).map((u) => [u.id, u.name]),
  );
  const enriched = items.map((i) => ({ ...i, staffName: i.partnerId ? (staffMap.get(i.partnerId) ?? null) : null }));

  const pending = Number(agg.find((a) => a.status === 'PENDING')?._sum.commissionAmount ?? 0);
  const paid = Number(agg.find((a) => a.status === 'PAID')?._sum.commissionAmount ?? 0);

  return {
    items: enriched,
    total,
    summary: { total: pending + paid, pending, paid },
  };
}

/**
 * Mark PENDING commissions as PAID for a staff member.
 */
export async function payoutStaffCommissions(params: {
  pharmacyId: string;
  staffId: string;
  method?: string;
  note?: string;
  byUserId: string;
}): Promise<{ ok: boolean; count?: number; amount?: number; error?: string }> {
  const { pharmacyId, staffId, method, note, byUserId } = params;

  const staff = await prisma.user.findFirst({
    where: { id: staffId, parentPharmacyId: pharmacyId },
    select: { id: true },
  });
  if (!staff) return { ok: false, error: 'Staff not found in this pharmacy' };

  const pending = await prisma.commission.findMany({
    where: { partnerType: 'STAFF', partnerId: staffId, status: 'PENDING' },
    select: { id: true, commissionAmount: true },
  });
  if (pending.length === 0) {
    return { ok: true, count: 0, amount: 0 };
  }

  const totalAmount = pending.reduce((s, c) => s + Number(c.commissionAmount), 0);

  await prisma.commission.updateMany({
    where: { id: { in: pending.map((p) => p.id) } },
    data: {
      status: 'PAID',
      metadata: {
        paidAt: new Date().toISOString(),
        paidBy: byUserId,
        method: method ?? 'CASH',
        note: note ?? null,
      } as object,
    },
  });

  return { ok: true, count: pending.length, amount: Math.round(totalAmount * 100) / 100 };
}
