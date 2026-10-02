import { NextResponse } from "next/server";
import { requireRole } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const { email, lat, lng, selfie, note } = await req.json();
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    let pharmacyId = user.parentPharmacyId;
    if (!pharmacyId) {
      const pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
      if (pharmacy) pharmacyId = pharmacy.id;
    }
    if (!pharmacyId) return NextResponse.json({ message: "Pharmacy not found" }, { status: 404 });

    const today = new Date().toISOString().split("T")[0];

    const existing = await prisma.attendance.findFirst({
      where: { userId: user.id, date: today, checkOutTime: null },
    });
    if (existing) {
      return NextResponse.json({ message: "Already checked in today!" }, { status: 400 });
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const lateThreshold = 9 * 60;
    const status = currentMinutes > lateThreshold ? "LATE" : "PRESENT";

    const attendance = await prisma.attendance.create({
      data: {
        userId: user.id,
        pharmacyId,
        checkInLat: lat || null,
        checkInLng: lng || null,
        checkInSelfie: selfie || null,
        date: today,
        status,
        note: note || null,
      },
    });

    return NextResponse.json({ message: "Checked in ✅", attendance, status }, { status: 201 });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
