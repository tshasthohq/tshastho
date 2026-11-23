import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireRole(["BLOOD_BANK_OWNER"]);
  if (auth.error) return auth.error;
  try {
    const bank = await prisma.bloodBank.findUnique({
      where: { userId: auth.user.id },
      select: {
        id: true, name: true, phone: true, address: true, area: true, district: true,
        dghsLicense: true, is24h: true, openTime: true, closeTime: true, isOpen: true,
        user: { select: { status: true, name: true } },
      },
    });
    if (!bank) return NextResponse.json({ error: "Blood bank profile not found" }, { status: 404 });
    return NextResponse.json({ bank });
  } catch (e) {
    console.error("[BLOOD_BANK_ME]", e);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}
