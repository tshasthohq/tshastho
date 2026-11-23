import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseGroup, clean } from "@/lib/blood";
import { PUBLIC_BANK_SELECT, loadStatus, loadActivity, loadUnits } from "@/lib/blood-bank-public";

export const dynamic = "force-dynamic";
const RANK: Record<string, number> = { AVAILABLE: 0, LOW: 1, OUT: 2 };

export async function GET(req: Request) {
  try {
    const sp = new URL(req.url).searchParams;
    const group = parseGroup(sp.get("bloodGroup"));
    const district = clean(sp.get("district"));

    const banks = await prisma.bloodBank.findMany({
      where: { user: { status: "APPROVED" }, ...(district ? { district } : {}) },
      select: PUBLIC_BANK_SELECT,
      orderBy: { name: "asc" },
      take: 60,
    });
    const ids = banks.map((b) => b.id);
    const [status, activity, units] = await Promise.all([loadStatus(ids), loadActivity(ids), loadUnits(ids)]);
    const list = banks.map((b) => ({
      ...b,
      stock: status.get(b.id)!,
      units: units.get(b.id)!,
      stockUpdatedAt: activity.get(b.id) ?? null,
      match: group ? status.get(b.id)![group] : null,
    }));
    if (group) list.sort((a, b) => RANK[a.match!] - RANK[b.match!]);

    return NextResponse.json(
      { banks: list },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
    );
  } catch (e) {
    console.error("[BLOOD_BANKS_GET]", e);
    return NextResponse.json({ error: "Failed to load blood banks" }, { status: 500 });
  }
}
