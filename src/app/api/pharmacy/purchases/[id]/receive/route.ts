import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { getPharmacyId } from '@/lib/pharmacy-scope';

class UserError extends Error {}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const me: any = auth.user;
    const { id: poId } = await params;
    const body = await req.json().catch(() => ({}));

    // Optional partial receive: { items: [{ itemId, receivedQty }] }
    const requested = new Map<string, number>();
    const percent = body?.percent !== undefined ? Math.min(100, Math.max(1, Math.floor(Number(body.percent) || 0))) : null;
    if (Array.isArray(body?.items)) {
      for (const r of body.items) {
        if (r?.itemId) requested.set(String(r.itemId), Math.max(0, Math.floor(Number(r.receivedQty) || 0)));
      }
    }

    const myPharmacyId = me.role === 'SUPER_ADMIN' ? null : await getPharmacyId(me.id, me.parentPharmacyId);

    const result = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({ where: { id: poId }, include: { items: true } });
      if (!po) throw new UserError('Purchase Order not found');
      if (myPharmacyId && po.pharmacyId !== myPharmacyId) throw new UserError('Purchase Order not found');
      if (po.status === 'RECEIVED') throw new UserError('This PO is already received');
      if (po.status === 'CANCELLED') throw new UserError('This PO is cancelled');

      let targetBranchId: string | null = po.branchId;
      if (!targetBranchId) {
        const mainBranch = await tx.pharmacyBranch.findFirst({
          where: { pharmacyId: po.pharmacyId },
          orderBy: { createdAt: 'asc' },
        });
        targetBranchId = mainBranch?.id || null;
      }
      if (!targetBranchId) throw new UserError('No target branch found for receiving');

      const movements: any[] = [];
      let allDone = true;
      let totalAdded = 0;

      for (const item of po.items) {
        const already = item.receivedQty || 0;
        const remaining = Math.max(0, item.quantity - already);
        const want = requested.size ? (requested.get(item.id) ?? 0) : percent !== null && percent < 100 ? Math.max(1, Math.ceil(remaining * percent / 100)) : remaining;
        const add = Math.min(want, remaining);

        if (add > 0) {
          await tx.branchStock.upsert({
            where: { branchId_medicineId: { branchId: targetBranchId, medicineId: item.medicineId } },
            update: { quantity: { increment: add } },
            create: { branchId: targetBranchId, medicineId: item.medicineId, quantity: add },
          });
          const updated = await tx.medicine.update({
            where: { id: item.medicineId },
            data: { stock: { increment: add } },
            select: { stock: true },
          });
          await tx.purchaseItem.update({ where: { id: item.id }, data: { receivedQty: { increment: add } } });
          movements.push({
            pharmacyId: po.pharmacyId,
            medicineId: item.medicineId,
            batchId: item.batchId || null,
            type: 'PURCHASE' as any,
            quantity: add,
            previousStock: updated.stock - add,
            newStock: updated.stock,
            referenceId: poId,
            reason: already > 0 ? 'PO partial receive' : 'PO received',
            userId: me.id,
          });
          totalAdded += add;
        }
        if (already + add < item.quantity) allDone = false;
      }

      if (totalAdded === 0) throw new UserError('Nothing to receive');
      if (movements.length) await tx.stockMovement.createMany({ data: movements });

      return tx.purchaseOrder.update({
        where: { id: poId },
        data: { status: (allDone ? 'RECEIVED' : 'PARTIAL') as any, receivedDate: new Date() },
      });
    }, { timeout: 30000, maxWait: 10000 });

    return NextResponse.json({
      success: true,
      message: result.status === 'RECEIVED'
        ? 'PO received successfully and stock updated!'
        : 'PO partially received. Remaining items can be received later.',
      purchaseOrder: result,
    });
  } catch (error: any) {
    if (error instanceof UserError) return NextResponse.json({ message: error.message }, { status: 400 });
    console.error('PO Receive Error:', error);
    return NextResponse.json({ message: 'Failed to receive PO' }, { status: 500 });
  }
}
