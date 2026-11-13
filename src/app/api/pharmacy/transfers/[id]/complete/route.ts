import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/guards";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const resolvedParams = await params;
    const transferId = resolvedParams.id;

    const user = await prisma.user.findUnique({ where: { id: auth.user.id } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    // 🔥 Transaction: All or Nothing
    const result = await prisma.$transaction(async (tx) => {
      const transfer = await tx.branchTransfer.findUnique({
        where: { id: transferId },
        include: { items: true }
      });

      if (!transfer) throw new Error("Transfer not found");
      if (transfer.status === 'COMPLETED') throw new Error("Transfer is already completed");

      // ১. সোর্স ব্রাঞ্চ থেকে স্টক কমানো
      for (const item of transfer.items) {
        // Check if source branch has enough stock
        const sourceStock = await tx.branchStock.findUnique({
          where: { branchId_medicineId: { branchId: transfer.fromBranchId, medicineId: item.medicineId } }
        });

        if (!sourceStock || sourceStock.quantity < item.quantity) {
          throw new Error(`Insufficient stock for medicine ID: ${item.medicineId} in source branch.`);
        }

        // Deduct from Source
        await tx.branchStock.update({
          where: { branchId_medicineId: { branchId: transfer.fromBranchId, medicineId: item.medicineId } },
          data: { quantity: { decrement: item.quantity } }
        });

        // ২. ডেস্টিনেশন ব্রাঞ্চে স্টক যোগ করা (Upsert)
        await tx.branchStock.upsert({
          where: { branchId_medicineId: { branchId: transfer.toBranchId, medicineId: item.medicineId } },
          update: { quantity: { increment: item.quantity } },
          create: { branchId: transfer.toBranchId, medicineId: item.medicineId, quantity: item.quantity }
        });
      }

      // ৩. ট্রান্সফার স্ট্যাটাস আপডেট করা
      const updatedTransfer = await tx.branchTransfer.update({
        where: { id: transferId },
        data: { 
          status: 'COMPLETED',
          // notes: transfer.notes ? transfer.notes + " | Completed" : "Completed" 
        }
      });

      return updatedTransfer;
    });

    return NextResponse.json({ success: true, message: "Transfer completed successfully!", transfer: result });
  } catch (error: any) {
    console.error("Transfer complete error:", error);
    return NextResponse.json({ message: error.message || "Failed to complete transfer" }, { status: 500 });
  }
}
