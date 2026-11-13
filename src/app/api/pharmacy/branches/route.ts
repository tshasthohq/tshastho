import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/guards";

export async function GET(req: Request) {
  // 🔥 কাস্টমার (Patient) রিকোয়েস্টের জন্য পাবলিক অ্যাক্সেস
  const url = new URL(req.url);
  const reqPharmacyId = url.searchParams.get('pharmacyId');
  
  if (reqPharmacyId) {
    const branches = await prisma.pharmacyBranch.findMany({
      where: { pharmacyId: reqPharmacyId }
    });
    return NextResponse.json({ branches }, { status: 200 });
  }

  // ওনার এবং স্টাফদের জন্য আগের লজিক
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const user = await prisma.user.findUnique({ where: { id: auth.user.id } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    let pharmacy = null;
    if (user.parentPharmacyId) {
      pharmacy = await prisma.pharmacy.findFirst({ where: { id: user.parentPharmacyId } });
    }
    if (!pharmacy) {
      pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
    }
    if (!pharmacy) return NextResponse.json({ message: "Pharmacy not found" }, { status: 404 });

    if (user.role === 'PHARMACY_STAFF') {
      const staffAssignment = await prisma.branchStaff.findFirst({
        where: { userId: user.id, isActive: true },
        include: { branch: true }
      });
      if (staffAssignment && staffAssignment.branch) {
        return NextResponse.json({ branches: [staffAssignment.branch] }, { status: 200 });
      }
      return NextResponse.json({ branches: [] }, { status: 200 });
    }

    const branches = await prisma.pharmacyBranch.findMany({
      where: { pharmacyId: pharmacy.id }
    });
    return NextResponse.json({ branches }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
  }
}
