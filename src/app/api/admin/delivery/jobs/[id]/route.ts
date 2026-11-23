import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guards";
import { assignRider, moveJob } from "@/lib/delivery";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["SUPER_ADMIN"]);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const actorId = (auth.user as any).id as string;

    if (body.action === "assign") {
      if (!body.riderId) return NextResponse.json({ message: "riderId is required" }, { status: 400 });
      await assignRider(id, String(body.riderId), actorId);
    } else if (body.action === "unassign") {
      await moveJob(id, "PENDING", { actorId });
    } else if (body.action === "status") {
      await moveJob(id, String(body.status), { actorId, reason: body.reason ? String(body.reason) : undefined });
    } else {
      return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("[DELIVERY_JOB_PATCH]", e);
    return NextResponse.json({ message: e?.message || "Failed" }, { status: 400 });
  }
}
