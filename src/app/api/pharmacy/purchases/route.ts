import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    // branchId এখানে রিসিভ করা হচ্ছে
    const { supplierId, supplierName, items, branchId } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ message: "No items provided" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: auth.user.id } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    let pharmacy = null;
    if (user.parentPharmacyId) pharmacy = await prisma.pharmacy.findFirst({ where: { id: user.parentPharmacyId } });
    if (!pharmacy) pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    if (!pharmacy) return NextResponse.json({ message: "Pharmacy not found" }, { status: 404 });

    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await prisma.purchaseOrder.count({ where: { pharmacyId: pharmacy.id } });
    const purchaseNumber = `PO-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    let totalAmount = 0;
    for (const item of items) {
      totalAmount += Number(item.quantity) * Number(item.unitCost);
    }

    const purchase = await prisma.purchaseOrder.create({
      data: {
        pharmacyId: pharmacy.id,
        branchId: branchId || null, // Hybrid PO: Receive to specific branch
        purchaseNumber,
        supplierId: supplierId || null,
        status: 'DRAFT',
        totalAmount,
        dueAmount: totalAmount,
        createdBy: user.id,
        notes: `Quick PO generated from inventory by ${user.name || 'Staff'}`,
        items: {
          create: items.map((i: any) => ({
            medicineId: i.medicineId,
            quantity: Number(i.quantity),
            unitCost: Number(i.unitCost),
            subtotal: Number(i.quantity) * Number(i.unitCost),
            batchNumber: i.batchNumber || null,
          }))
        }
      }
    });

    return NextResponse.json({ success: true, message: "Purchase Order created successfully", purchase });
  } catch (error) {
    console.error("PO creation error:", error);
    return NextResponse.json({ message: "Failed to create PO" }, { status: 500 });
  }
}

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

    const whereClause: any = { pharmacyId: pharmacy.id };
    if (statusFilter && statusFilter !== 'ALL') {
      whereClause.status = statusFilter;
    }
    if (branchId && branchId !== 'ALL') {
      whereClause.branchId = branchId;
    }

    const purchases = await prisma.purchaseOrder.findMany({
      where: whereClause,
      include: {
        supplier: { select: { name: true } },
        items: true,
        branch: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, purchases });
  } catch (error) {
    console.error("PO fetch error:", error);
    return NextResponse.json({ message: "Failed to fetch purchases" }, { status: 500 });
  }
}
