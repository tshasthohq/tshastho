import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/guards";
import { getPharmacyId } from "@/lib/pharmacy-scope";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const reqPharmacyId = url.searchParams.get('pharmacyId');

  // Public access for patient registration
  if (reqPharmacyId) {
    const branches = await prisma.pharmacyBranch.findMany({ where: { pharmacyId: reqPharmacyId } });
    return NextResponse.json({ branches }, { status: 200 });
  }

  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const user: any = auth.user;

    if (user.role === 'PHARMACY_STAFF') {
      const staffAssignment = await prisma.branchStaff.findFirst({
        where: { userId: user.id, isActive: true },
        include: { branch: true },
      });
      if (staffAssignment && staffAssignment.branch) {
        return NextResponse.json({ branches: [staffAssignment.branch] }, { status: 200 });
      }
      return NextResponse.json({ branches: [] }, { status: 200 });
    }

    const pharmacyId = await getPharmacyId(user.id, user.parentPharmacyId);
    if (!pharmacyId) return NextResponse.json({ message: "Pharmacy not found" }, { status: 404 });

    const branches = await prisma.pharmacyBranch.findMany({ where: { pharmacyId } });
    return NextResponse.json({ branches }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
  }
}
