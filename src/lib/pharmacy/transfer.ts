import { prisma } from '@/lib/prisma';

function generateTransferNumber(seq: number) {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `TRF-${y}${m}-${String(seq).padStart(4, '0')}`;
}

export async function getNextTransferNumber(pharmacyId: string) {
  const count = await prisma.branchTransfer.count({ where: { pharmacyId } });
  return generateTransferNumber(count + 1);
}

export async function completeTransfer(params: {
  transferId: string;
  userId: string;
}) {
  return await prisma.$transaction(async (tx) => {
    const transfer = await tx.branchTransfer.findUnique({
      where: { id: params.transferId },
      include: { items: true },
    });
    if (!transfer) throw new Error('Transfer not found');
    if (transfer.status !== 'APPROVED') throw new Error('Transfer must be APPROVED first');

    for (const item of transfer.items) {
      // Decrease from source
      await tx.branchStock.updateMany({
        where: { branchId: transfer.fromBranchId, medicineId: item.medicineId },
        data: { quantity: { decrement: item.quantity } },
      });

      // Increase at destination
      const existing = await tx.branchStock.findFirst({
        where: { branchId: transfer.toBranchId, medicineId: item.medicineId },
      });
      if (existing) {
        await tx.branchStock.update({
          where: { id: existing.id },
          data: { quantity: { increment: item.quantity } },
        });
      } else {
        await tx.branchStock.create({
          data: {
            branchId: transfer.toBranchId,
            medicineId: item.medicineId,
            quantity: item.quantity,
          },
        });
      }

      await tx.branchTransferItem.update({
        where: { id: item.id },
        data: { receivedQty: item.quantity },
      });
    }

    return tx.branchTransfer.update({
      where: { id: params.transferId },
      data: {
        status: 'COMPLETED',
        receivedById: params.userId,
        completedAt: new Date(),
      },
    });
  });
}
