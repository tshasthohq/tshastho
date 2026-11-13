import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/guards";

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const { staffId, branchId } = await req.json();
    if (!staffId || !branchId) return NextResponse.json({ message: "Missing fields" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: auth.user.id } });
    let pharmacyId = user?.parentPharmacyId;
    if (!pharmacyId) {
      const pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user?.id } });
      pharmacyId = pharmacy?.id || null;
    }
    if (!pharmacyId) return NextResponse.json({ message: "Pharmacy not found" }, { status: 404 });

    // 🔥 Security Check: Verify the branch belongs to this pharmacy
    const branch = await prisma.pharmacyBranch.findUnique({ where: { id: branchId } });
    if (!branch || branch.pharmacyId !== pharmacyId) {
      return NextResponse.json({ message: "Unauthorized branch access" }, { status: 403 });
    }

    // ১. আগের সব ব্রাঞ্চ অ্যাসাইনমেন্ট ডিএক্টিভেট করা
    await prisma.branchStaff.updateMany({
      where: { userId: staffId },
      data: { isActive: false }
    });

    // ২. নতুন ব্রাঞ্চে অ্যাসাইন করা
    await prisma.branchStaff.upsert({
      where: { branchId_userId: { branchId, userId: staffId } },
      update: { isActive: true },
      create: { branchId, userId: staffId, isActive: true, role: "STAFF" }
    });

    return NextResponse.json({ success: true, message: "Branch updated successfully!" });
  } catch (error) {
    console.error("Update branch error:", error);
    return NextResponse.json({ message: "Failed to update branch" }, { status: 500 });
  }
}
