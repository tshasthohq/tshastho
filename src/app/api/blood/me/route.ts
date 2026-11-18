import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/user";
import { isEligible } from "@/lib/blood";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const [donor, requests] = await Promise.all([
      prisma.bloodDonor.findUnique({
        where: { userId: user.id },
        select: {
          id: true, bloodGroup: true, gender: true, district: true, upazila: true,
          lastDonationDate: true, totalDonations: true, isAvailable: true,
          showPhone: true, verified: true,
        },
      }),
      prisma.bloodRequest.findMany({
        where: { requesterId: user.id },
        select: {
          id: true, bloodGroup: true, units: true, hospital: true, district: true,
          urgency: true, status: true, createdAt: true,
          _count: { select: { responses: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);
    const eligible = !!donor && donor.isAvailable && isEligible(donor.lastDonationDate, donor.gender);
    return NextResponse.json({ donor, eligible, requests });
  } catch (e) {
    console.error("[BLOOD_ME_GET]", e);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    const donor = await prisma.bloodDonor.findUnique({
      where: { userId: user.id },
      select: { id: true, gender: true, lastDonationDate: true },
    });
    if (!donor) return NextResponse.json({ error: "Register as a donor first" }, { status: 404 });

    if (b.action === "toggle") {
      const updated = await prisma.bloodDonor.update({
        where: { id: donor.id },
        data: { isAvailable: b.isAvailable === true },
        select: { isAvailable: true },
      });
      return NextResponse.json({ success: true, ...updated });
    }

    if (b.action === "donated") {
      if (!isEligible(donor.lastDonationDate, donor.gender))
        return NextResponse.json({ error: "You donated recently. Please wait before recording another donation." }, { status: 400 });
      const updated = await prisma.bloodDonor.update({
        where: { id: donor.id },
        data: { lastDonationDate: new Date(), totalDonations: { increment: 1 } },
        select: { totalDonations: true, lastDonationDate: true },
      });
      return NextResponse.json({ success: true, ...updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    console.error("[BLOOD_ME_PATCH]", e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
