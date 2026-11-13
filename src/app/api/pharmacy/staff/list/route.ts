import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/guards";

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { email } = body;

    if (!email) return NextResponse.json({ message: "Email required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    let pharmacyId = user.parentPharmacyId;
    if (!pharmacyId) {
      const pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
      pharmacyId = pharmacy?.id || null;
    }
    if (!pharmacyId) return NextResponse.json({ message: "Pharmacy not found" }, { status: 404 });

    const staff = await prisma.user.findMany({
      where: {
        parentPharmacyId: pharmacyId,
        role: 'PHARMACY_STAFF'
      },
      orderBy: { createdAt: 'desc' },
      include: {
        branchAssignments: {
          where: { isActive: true },
          include: {
            branch: { select: { name: true } }
          }
        }
      }
    });

    return NextResponse.json({ success: true, staff });
  } catch (error) {
    console.error("Staff list error:", error);
    return NextResponse.json({ message: "Error fetching staff" }, { status: 500 });
  }
}
