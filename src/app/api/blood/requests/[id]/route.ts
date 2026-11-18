import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/user";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const { status } = await req.json();
    if (status !== "FULFILLED" && status !== "CANCELLED")
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });

    const request = await prisma.bloodRequest.findUnique({
      where: { id },
      select: { requesterId: true, status: true },
    });
    if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    if (request.requesterId !== user.id && user.role !== "SUPER_ADMIN")
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    if (request.status !== "OPEN" && request.status !== "MATCHED")
      return NextResponse.json({ error: "Request is already closed" }, { status: 400 });

    await prisma.bloodRequest.update({ where: { id }, data: { status } });
    if (status === "FULFILLED")
      await prisma.bloodRequestResponse.updateMany({
        where: { requestId: id, status: "ACCEPTED" },
        data: { status: "DONATED" },
      });

    return NextResponse.json({ success: true, status });
  } catch (e) {
    console.error("[BLOOD_REQ_PATCH]", e);
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}
