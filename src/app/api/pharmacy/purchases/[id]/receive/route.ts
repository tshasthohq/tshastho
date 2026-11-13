import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // 🔥 Next.js 15 Fix: params is a Promise
) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const resolvedParams = await params; // 🔥 Await the params
    const poId = resolvedParams.id;

    const user = await prisma.user.findUnique({ where: { id: auth.user.id } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    const result = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: poId },
        include: { items: true }
      });

      if (!po) throw new Error("Purchase Order not found");
      if (po.status === 'RECEIVED') throw new Error("This PO is already received");

      // 🔥 Type Fix: Explicitly typing as string | null
      let targetBranchId: string | null = po.branchId;
      
      if (!targetBranchId) {
        const mainBranch = await tx.pharmacyBranch.findFirst({
          where: { pharmacyId: po.pharmacyId },
          orderBy: { createdAt: 'asc' }
        });
        targetBranchId = mainBranch?.id || null; // 🔥 Fallback to null if undefined
      }

      if (!targetBranchId) throw new Error("No target branch found for receiving");

      for (const item of po.items) {
        await tx.branchStock.upsert({
          where: { 
            branchId_medicineId: { 
              branchId: targetBranchId, 
              medicineId: item.medicineId 
            } 
          },
          update: { quantity: { increment: item.quantity } },
          create: { 
            branchId: targetBranchId, 
            medicineId: item.medicineId, 
            quantity: item.quantity 
          }
        });

        await tx.medicine.update({
          where: { id: item.medicineId },
          data: { stock: { increment: item.quantity } }
        });
      }

      const updatedPo = await tx.purchaseOrder.update({
        where: { id: poId },
        data: { 
          status: 'RECEIVED',
          receivedDate: new Date()
        }
      });

      return updatedPo;
    });

    return NextResponse.json({ 
      success: true, 
      message: "PO received successfully and stock updated!",
      purchaseOrder: result
    });

  } catch (error: any) {
    console.error("PO Receive Error:", error);
    return NextResponse.json({ message: error.message || "Failed to receive PO" }, { status: 500 });
  }
}
