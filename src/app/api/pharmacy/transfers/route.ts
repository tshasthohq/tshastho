import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';

export async function GET(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const url = new URL(req.url);
    const statusFilter = url.searchParams.get('status');
    const branchId = url.searchParams.get('branchId');

    const user = await prisma.user.findUnique({ where: { id: auth.user.id } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    let pharmacy = null;
    if (user.parentPharmacyId) pharmacy = await prisma.pharmacy.findFirst({ where: { id: user.parentPharmacyId } });
    if (!pharmacy) pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    if (!pharmacy) return NextResponse.json({ message: "Pharmacy not found" }, { status: 404 });

    let whereClause: any = { pharmacyId: pharmacy.id };
    if (statusFilter && statusFilter !== 'ALL') whereClause.status = statusFilter;
    if (branchId && branchId !== 'ALL') {
      whereClause.OR = [{ fromBranchId: branchId }, { toBranchId: branchId }];
    }

    const transfers = await prisma.branchTransfer.findMany({
      where: whereClause,
      include: {
        fromBranch: { select: { name: true } },
        toBranch: { select: { name: true } },
        items: { include: { medicine: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, transfers });
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch transfers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { fromBranchId, toBranchId, reason, notes, items } = body;

    if (!fromBranchId || !toBranchId || !items || items.length === 0) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: auth.user.id } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    let pharmacyId = user.parentPharmacyId;
    if (!pharmacyId) {
      const pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
      pharmacyId = pharmacy?.id || null;
    }
    if (!pharmacyId) return NextResponse.json({ message: "Pharmacy not found" }, { status: 404 });

    // 🔥 মেডিসিনের নাম বের করা হচ্ছে (কারণ ডেটাবেসে এটি লাগে)
    const medicineIds = items.map((i: any) => i.medicineId);
    const medicines = await prisma.medicine.findMany({
      where: { id: { in: medicineIds } },
      select: { id: true, name: true }
    });

    const transferNumber = `TRF-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`;

    const transfer = await prisma.branchTransfer.create({
      data: {
        pharmacyId,
        transferNumber,
        fromBranchId,
        toBranchId,
        status: 'PENDING',
        reason: reason || null,
        notes: notes || null,
        requestedById: user.id,
        items: {
          create: items.map((i: any) => {
            const med = medicines.find(m => m.id === i.medicineId);
            return {
              medicineId: i.medicineId,
              medicineName: med?.name || "Unknown Medicine", // 🔥 নাম যুক্ত করা হলো
              quantity: Number(i.quantity),
              receivedQty: 0
            };
          })
        }
      }
    });

    return NextResponse.json({ success: true, transfer });
  } catch (error) {
    console.error("Transfer create error:", error);
    return NextResponse.json({ message: "Failed to create transfer" }, { status: 500 });
  }
}
