import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PUBLIC_BANK_SELECT, loadStatus, loadActivity } from "@/lib/blood-bank-public";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const bank = await prisma.bloodBank.findFirst({
      where: { id, user: { status: "APPROVED" } },
      select: PUBLIC_BANK_SELECT,
    });
    if (!bank) return NextResponse.json({ error: "Blood bank not found" }, { status: 404 });
    const [status, activity] = await Promise.all([loadStatus([id]), loadActivity([id])]);
    return NextResponse.json(
      { bank: { ...bank, stock: status.get(id)!, stockUpdatedAt: activity.get(id) ?? null } },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
    );
  } catch (e) {
    console.error("[BLOOD_BANK_GET]", e);
    return NextResponse.json({ error: "Failed to load blood bank" }, { status: 500 });
  }
}
