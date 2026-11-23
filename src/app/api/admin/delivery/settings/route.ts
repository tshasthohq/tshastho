import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guards";
import { getDeliverySettings, saveDeliverySettings } from "@/lib/delivery";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireRole(["SUPER_ADMIN"]);
  if (auth.error) return auth.error;
  return NextResponse.json({ success: true, settings: await getDeliverySettings() });
}

export async function POST(req: Request) {
  const auth = await requireRole(["SUPER_ADMIN"]);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  const reason = String(body.reason || "").trim();
  if (body.enabled === false && reason.length < 3) {
    return NextResponse.json({ message: "A reason is required to turn delivery off" }, { status: 400 });
  }
  const riderPayout = body.riderPayout === undefined || body.riderPayout === "" ? undefined : Number(body.riderPayout);
  if (riderPayout !== undefined && (!Number.isFinite(riderPayout) || riderPayout < 0)) {
    return NextResponse.json({ message: "Invalid amount" }, { status: 400 });
  }

  await saveDeliverySettings({
    enabled: typeof body.enabled === "boolean" ? body.enabled : undefined,
    reason,
    riderPayout,
  });
  return NextResponse.json({ success: true, settings: await getDeliverySettings() });
}
