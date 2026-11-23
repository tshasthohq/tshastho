import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseGroup, clean } from "@/lib/blood";
import { getBankContext, logAction, checkCompatibility } from "@/lib/blood-bank";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getBankContext();
  if ("error" in ctx) return ctx.error;
  const { bankId, userId } = ctx;
  const { id } = await params;

  try {
    const b = await req.json();
    const bag = await prisma.bloodBag.findFirst({
      where: { id, bloodBankId: bankId },
      select: { id: true, bagNumber: true, bloodGroup: true, component: true, status: true, testsClear: true },
    });
    if (!bag) return NextResponse.json({ error: "Bag not found" }, { status: 404 });
    if (bag.status !== "AVAILABLE")
      return NextResponse.json({ error: "Only available bags can be crossmatched" }, { status: 409 });
    if (!bag.testsClear)
      return NextResponse.json({ error: "Complete the screening tests before crossmatching" }, { status: 409 });

    const patientName = clean(b.patientName);
    if (patientName.length < 2) return NextResponse.json({ error: "Patient name is required" }, { status: 400 });
    const patientGroup = parseGroup(b.patientGroup);
    if (!patientGroup) return NextResponse.json({ error: "Select the patient's blood group" }, { status: 400 });

    const type = b.type === "MINOR" ? "MINOR" : "MAJOR";
    const result = b.result === "INCOMPATIBLE" ? "INCOMPATIBLE" : "COMPATIBLE";

    const compat = checkCompatibility(bag.component, bag.bloodGroup, patientGroup);
    if (compat.level === "block" && result === "COMPATIBLE")
      return NextResponse.json({ error: `Blood group mismatch: ${compat.reason}` }, { status: 409 });

    await prisma.bloodCrossmatch.create({
      data: {
        bloodBankId: bankId, bagId: id, patientName, patientGroup, type, result,
        doneById: userId, note: clean(b.note, 300) || null,
      },
    });
    await logAction(bankId, userId, "CROSSMATCH", `${bag.bagNumber} ${patientName} ${result}`);
    return NextResponse.json({ success: true, warning: compat.level === "warn" ? compat.reason : null });
  } catch (e) {
    console.error("[BLOOD_CROSSMATCH]", e);
    return NextResponse.json({ error: "Failed to save crossmatch" }, { status: 500 });
  }
}
