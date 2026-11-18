import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/user";
import { isEligible } from "@/lib/blood";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const [donor, request] = await Promise.all([
      prisma.bloodDonor.findUnique({
        where: { userId: user.id },
        select: { id: true, bloodGroup: true, gender: true, lastDonationDate: true, isAvailable: true },
      }),
      prisma.bloodRequest.findUnique({
        where: { id },
        select: { id: true, status: true, bloodGroup: true, units: true, contactPhone: true, hospital: true, expiresAt: true, requesterId: true },
      }),
    ]);

    if (!donor) return NextResponse.json({ error: "Register as a donor first" }, { status: 403 });
    if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    if (request.requesterId === user.id)
      return NextResponse.json({ error: "You cannot respond to your own request" }, { status: 400 });
    if (request.status !== "OPEN" || (request.expiresAt && request.expiresAt < new Date()))
      return NextResponse.json({ error: "This request is no longer open" }, { status: 410 });
    if (donor.bloodGroup !== request.bloodGroup)
      return NextResponse.json({ error: "Your blood group does not match" }, { status: 400 });
    if (!donor.isAvailable || !isEligible(donor.lastDonationDate, donor.gender))
      return NextResponse.json({ error: "You are not eligible to donate right now" }, { status: 400 });

    await prisma.bloodRequestResponse.upsert({
      where: { requestId_donorId: { requestId: id, donorId: donor.id } },
      create: { requestId: id, donorId: donor.id },
      update: { status: "ACCEPTED" },
    });

    const accepted = await prisma.bloodRequestResponse.count({ where: { requestId: id, status: "ACCEPTED" } });
    if (accepted >= request.units)
      await prisma.bloodRequest.update({ where: { id }, data: { status: "MATCHED" } });

    return NextResponse.json({ success: true, contactPhone: request.contactPhone, hospital: request.hospital });
  } catch (e) {
    console.error("[BLOOD_RESPOND]", e);
    return NextResponse.json({ error: "Failed to respond" }, { status: 500 });
  }
}
