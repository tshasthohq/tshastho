import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';

async function getPharmacyId(user: any) {
  if (user.role === 'PHARMACY_OWNER') {
    const p = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    return p?.id || null;
  }
  return user.parentPharmacyId;
}

const REORDER_THRESHOLD = 10;

export async function GET() {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;
  const pharmacyId = await getPharmacyId(user);
  if (!pharmacyId) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Pharmacy not found', 404);

  // Get all branches
  const branches = await prisma.pharmacyBranch.findMany({
    where: { pharmacyId, isActive: true },
    select: { id: true, name: true, code: true },
  });

  if (branches.length < 2) {
    return NextResponse.json({ success: true, suggestions: [], message: 'Need at least 2 branches' });
  }

  // Get all branch stock
  const stocks = await prisma.branchStock.findMany({
    where: { branch: { pharmacyId, isActive: true } },
    include: {
      medicine: { select: { id: true, name: true, brand: true } },
      branch: { select: { id: true, name: true } },
    },
  });

  // Group by medicine
  const byMedicine: Record<string, any[]> = {};
  for (const s of stocks) {
    if (!byMedicine[s.medicineId]) byMedicine[s.medicineId] = [];
    byMedicine[s.medicineId].push(s);
  }

  const suggestions: any[] = [];

  for (const [medicineId, branchStocks] of Object.entries(byMedicine)) {
    // Skip if only one branch has this medicine
    if (branchStocks.length < 2) continue;

    const high = branchStocks
      .filter(s => s.quantity > REORDER_THRESHOLD * 3)
      .sort((a, b) => b.quantity - a.quantity);

    const low = branchStocks
      .filter(s => s.quantity <= REORDER_THRESHOLD)
      .sort((a, b) => a.quantity - b.quantity);

    if (high.length === 0 || low.length === 0) continue;

    const from = high[0];
    const to = low[0];

    if (from.branchId === to.branchId) continue;

    // Suggest amount: bring target to threshold + buffer
    const targetQty = REORDER_THRESHOLD * 2;
    const suggestedQty = Math.min(targetQty - to.quantity, Math.floor((from.quantity - to.quantity) / 2));

    if (suggestedQty < 5) continue;

    suggestions.push({
      medicineId,
      medicineName: from.medicine.name,
      medicineBrand: from.medicine.brand,
      fromBranchId: from.branchId,
      fromBranchName: from.branch.name,
      fromQty: from.quantity,
      toBranchId: to.branchId,
      toBranchName: to.branch.name,
      toQty: to.quantity,
      suggestedQty,
      severity: to.quantity === 0 ? 'CRITICAL' : 'LOW',
    });
  }

  // Sort by severity (CRITICAL first), then by suggestedQty
  suggestions.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'CRITICAL' ? -1 : 1;
    return b.suggestedQty - a.suggestedQty;
  });

  return NextResponse.json({ success: true, suggestions, total: suggestions.length });
}
