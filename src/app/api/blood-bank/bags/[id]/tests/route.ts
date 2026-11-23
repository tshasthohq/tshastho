import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseGroup, clean } from "@/lib/blood";
import { getBankContext, logAction, TTI_TESTS } from "@/lib/blood-bank";

export const dynamic = "force-dynamic";
const RESULTS = ["PENDING", "NON_REACTIVE", "REACTIVE", "INVALID"];

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getBankContext();
  if ("error" in ctx) return ctx.error;
  const { bankId, userId } = ctx;
  const { id } = await params;

  try {
    const b = await req.json();
    const bag = await prisma.bloodBag.findFirst({
      where: { id, bloodBankId: bankId },
      select: { id: true, bagNumber: true, bloodGroup: true, status: true, confirmedGroup: true },
    });
    if (!bag) return NextResponse.json({ error: "Bag not found" }, { status: 404 });
    if (bag.status !== "AVAILABLE")
      return NextResponse.json({ error: "Only available bags can be tested" }, { status: 409 });

    const input = b.results && typeof b.results === "object" ? b.results : {};
    const entries = Object.entries(input).filter(([k]) => TTI_TESTS.includes(k));
    for (const [, v] of entries) {
      if (!RESULTS.includes(v as string)) return NextResponse.json({ error: "Invalid test result" }, { status: 400 });
    }

    let confirmedGroup = bag.confirmedGroup;
    if (b.confirmedGroup) {
      const g = parseGroup(b.confirmedGroup);
      if (!g) return NextResponse.json({ error: "Invalid confirmed blood group" }, { status: 400 });
      confirmedGroup = g;
    }
    const method = clean(b.method, 80) || null;
    const kitLot = clean(b.kitLot, 60) || null;

    const out = await prisma.$transaction(async (tx) => {
      for (const [test, value] of entries) {
        const data = {
          result: value as any, method, kitLot, testedById: userId,
          testedAt: value === "PENDING" ? null : new Date(),
        };
        await tx.bloodBagTest.upsert({
          where: { bagId_test: { bagId: id, test: test as any } },
          create: { bagId: id, test: test as any, ...data },
          update: data,
        });
      }

      const all = await tx.bloodBagTest.findMany({ where: { bagId: id }, select: { test: true, result: true } });
      const reactive = all.filter((t) => t.result === "REACTIVE").map((t) => t.test);

      if (reactive.length) {
        await tx.bloodBag.update({
          where: { id },
          data: {
            status: "DISCARDED", testsClear: false, confirmedGroup,
            confirmedById: confirmedGroup ? userId : null,
            discardReason: `Reactive screening result (${reactive.join(", ")})`,
          },
        });
        return { reactive, testsClear: false, mismatch: false };
      }

      const allDone = TTI_TESTS.every((t) => all.some((x) => x.test === t && x.result === "NON_REACTIVE"));
      const mismatch = !!confirmedGroup && confirmedGroup !== bag.bloodGroup;
      const testsClear = allDone && !!confirmedGroup && !mismatch;
      await tx.bloodBag.update({
        where: { id },
        data: { testsClear, confirmedGroup, confirmedById: confirmedGroup ? userId : null },
      });
      return { reactive: [] as string[], testsClear, mismatch };
    });

    await logAction(
      bankId, userId,
      out.reactive.length ? "TEST_REACTIVE" : out.testsClear ? "TESTS_CLEARED" : "TESTS_UPDATED",
      bag.bagNumber
    );
    return NextResponse.json({ success: true, ...out });
  } catch (e) {
    console.error("[BLOOD_BAG_TESTS]", e);
    return NextResponse.json({ error: "Failed to save test results" }, { status: 500 });
  }
}
