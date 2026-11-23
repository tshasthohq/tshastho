import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { diagCtx } from "@/lib/diagnostic/api";
import { calcCommissions } from "@/lib/diagnostic/commission";
import { diffFields, writeAudit, type Change } from "@/lib/diagnostic/audit";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const c = await diagCtx();
  if (c.error) return c.error;
  const { id } = await params;
  const memo = new URL(req.url).searchParams.get("memo") === "1";
  const isOwner = c.user.role === "DIAGNOSTIC_OWNER";

  const order: any = await prisma.diagnosticOrder.findFirst({
    where: { id, diagnosticId: c.diagnostic.id },
    include: {
      patient: true,
      referrer: { select: { id: true, name: true, type: true, degree: true } },
      branch: { select: { name: true, address: true, phone: true } },
      items: { orderBy: { testName: "asc" }, include: { test: { select: { sampleType: true } } } },
      payments: { orderBy: { createdAt: "asc" } },
      ...(memo ? {} : { agent: { select: { id: true, name: true, type: true } } }),
      ...(memo || !isOwner ? {} : { commissions: { include: { referrer: { select: { name: true } } } } }),
    },
  });
  if (!order) return NextResponse.json({ message: "Order not found" }, { status: 404 });
  if (memo) delete order.agentId;

  const verifyTokens: Record<string, string> = {};
  try {
    const { signItem } = await import("@/lib/diagnostic/verify");
    for (const i of order.items) if (i.status === "VERIFIED" || i.status === "APPROVED") verifyTokens[i.id] = signItem(i.id, Math.max(1, i.reportVersion || 0));
  } catch {}

  const methodRows = await (prisma as any).diagnosticTest.findMany({
    where: { id: { in: order.items.map((i: any) => i.testId) } },
    select: { id: true, method: true },
  });
  const methods: Record<string, string> = {};
  for (const m of methodRows) if (m.method) methods[m.id] = m.method;

  const previous: Record<string, any> = {};
  await Promise.all(
    order.items
      .filter((i: any) => i.status === "VERIFIED" || i.status === "APPROVED")
      .map(async (i: any) => {
        const p = await prisma.diagnosticOrderItem.findFirst({
          where: {
            testId: i.testId,
            status: { in: ["VERIFIED", "APPROVED"] },
            verifiedAt: { lt: i.verifiedAt ?? new Date() },
            order: { patientId: order.patientId, diagnosticId: c.diagnostic.id, status: { not: "CANCELLED" }, NOT: { id: order.id } },
          },
          orderBy: { verifiedAt: "desc" },
          select: { results: true, verifiedAt: true },
        });
        if (p) previous[i.id] = { date: p.verifiedAt, results: p.results };
      })
  );

  const d = c.diagnostic;
  return NextResponse.json({
    success: true,
    order,
    previous, methods, verifyTokens,
    center: {
      name: d.centerName, address: d.address, city: d.city, phone: d.phone, logo: d.logo,
      tagline: (d as any).tagline ?? null, email: (d as any).email ?? null, website: (d as any).website ?? null,
      dghsRegNo: (d as any).dghsRegNo ?? null, helpline: (d as any).helpline ?? null, footerAddress: (d as any).footerAddress ?? null,
    },
  });
}

const schema = z.object({
  reason: z.string().trim().min(3, "Edit-er karon likhun"),
  patient: z
    .object({
      name: z.string().trim().min(2).optional(),
      phone: z.string().nullable().optional(),
      age: z.coerce.number().int().min(0).max(130).nullable().optional(),
      ageUnit: z.enum(["Y", "M", "D"]).optional(),
      gender: z.enum(["MALE", "FEMALE", "OTHER"]).nullable().optional(),
      address: z.string().nullable().optional(),
    })
    .optional(),
  referrerId: z.string().nullable().optional(),
  agentId: z.string().nullable().optional(),
  discount: z.coerce.number().min(0).optional(),
  note: z.string().nullable().optional(),
  testIds: z.array(z.string()).min(1).max(100).optional(),
});

const ERR: Record<string, string> = {
  NOT_FOUND: "Order paoa jayni",
  CANCELLED: "Cancelled order edit kora jabe na",
  COMM_PAID: "Commission already paid hoye geche, doctor/agent/test/discount bodlano jabe na",
  BAD_REF: "Doctor/Agent paoa jayni",
  BAD_TEST: "Kono test inactive ba paoa jayni",
  ITEMS_LOCKED: "Sample collection shuru hoye geche, test bodlano jabe na",
  DISC: "Discount total er beshi hote pare na",
  BELOW_PAID: "Notun total paid er cheye kom. Age refund korun",
  NO_CHANGE: "Kono poriborton nai",
};

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const c = await diagCtx();
  if (c.error) return c.error;
  const { id } = await params;
  const diagnosticId = c.diagnostic.id;
  const isOwner = c.user.role === "DIAGNOSTIC_OWNER";

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message || "Invalid data" }, { status: 400 });
  }
  const d = parsed.data;
  if (!isOwner && (d.discount !== undefined || d.testIds !== undefined || d.agentId !== undefined)) {
    return NextResponse.json({ message: "Discount, test ar agent shudhu owner bodlate parbe" }, { status: 403 });
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        const o = await tx.diagnosticOrder.findFirst({
          where: { id, diagnosticId },
          include: { patient: true, referrer: true, agent: true, items: true, commissions: true },
        });
        if (!o) throw new Error("NOT_FOUND");
        if (o.status === "CANCELLED") throw new Error("CANCELLED");

        const changes: Change[] = [];
        const orderData: any = {};

        if (d.patient) {
          const ch = diffFields(o.patient, d.patient, {
            name: "Patient name", phone: "Phone", age: "Age", ageUnit: "Age unit", gender: "Gender", address: "Address",
          });
          if (ch.length) {
            changes.push(...ch);
            const p = d.patient;
            await tx.diagnosticPatient.update({
              where: { id: o.patientId },
              data: {
                name: p.name, ageUnit: p.ageUnit,
                phone: p.phone === undefined ? undefined : p.phone || null,
                age: p.age === undefined ? undefined : p.age,
                gender: p.gender === undefined ? undefined : p.gender || null,
                address: p.address === undefined ? undefined : p.address || null,
              },
            });
          }
        }

        if (d.note !== undefined && (d.note || null) !== (o.note || null)) {
          changes.push({ field: "Note", from: o.note, to: d.note || null });
          orderData.note = d.note || null;
        }

        const fin = d.referrerId !== undefined || d.agentId !== undefined || d.discount !== undefined || d.testIds !== undefined;
        const finChanged =
          (d.referrerId !== undefined && (d.referrerId || null) !== (o.referrerId || null)) ||
          (d.agentId !== undefined && (d.agentId || null) !== (o.agentId || null)) ||
          (d.discount !== undefined && d.discount !== Number(o.discount)) ||
          d.testIds !== undefined;

        if (fin && finChanged) {
          if (o.commissions.some((x) => x.status === "PAID")) throw new Error("COMM_PAID");

          let doctor = o.referrer;
          let agent = o.agent;
          if (d.referrerId !== undefined) {
            doctor = d.referrerId ? await tx.diagnosticReferrer.findFirst({ where: { id: d.referrerId, diagnosticId } }) : null;
            if (d.referrerId && !doctor) throw new Error("BAD_REF");
            if ((o.referrerId || null) !== (d.referrerId || null)) {
              changes.push({ field: "Doctor", from: o.referrer?.name ?? null, to: doctor?.name ?? null });
              orderData.referrerId = d.referrerId || null;
            }
          }
          if (d.agentId !== undefined) {
            agent = d.agentId ? await tx.diagnosticReferrer.findFirst({ where: { id: d.agentId, diagnosticId } }) : null;
            if (d.agentId && !agent) throw new Error("BAD_REF");
            if ((o.agentId || null) !== (d.agentId || null)) {
              changes.push({ field: "Agent", from: o.agent?.name ?? null, to: agent?.name ?? null });
              orderData.agentId = d.agentId || null;
            }
          }

          if (d.testIds) {
            const ids = Array.from(new Set(d.testIds));
            const have = new Set(o.items.map((i) => i.testId));
            const newIds = ids.filter((x) => !have.has(x));
            const removed = o.items.filter((i) => !ids.includes(i.testId));
            if ((newIds.length || removed.length) && o.items.some((i) => i.status !== "PENDING")) {
              throw new Error("ITEMS_LOCKED");
            }
            const added = newIds.length
              ? await tx.diagnosticTest.findMany({ where: { id: { in: newIds }, diagnosticId, isActive: true } })
              : [];
            if (added.length !== newIds.length) throw new Error("BAD_TEST");
            if (removed.length) {
              await tx.diagnosticOrderItem.deleteMany({ where: { id: { in: removed.map((r) => r.id) } } });
              changes.push({ field: "Tests removed", from: removed.map((r) => r.testName).join(", "), to: null });
            }
            if (added.length) {
              await tx.diagnosticOrderItem.createMany({
                data: added.map((t) => ({
                  orderId: id, testId: t.id, testCode: t.code, testName: t.name, price: t.price,
                  commissionType: t.commissionType, commissionValue: t.commissionValue,
                  promisedAt: new Date(Date.now() + t.reportingHours * 3600 * 1000),
                })),
              });
              changes.push({ field: "Tests added", from: null, to: added.map((t) => t.name).join(", ") });
            }
          }

          const items = await tx.diagnosticOrderItem.findMany({ where: { orderId: id } });
          const subtotal = items.reduce((s, i) => s + Number(i.price), 0);
          let discount = Number(o.discount);
          if (d.discount !== undefined && d.discount !== discount) {
            changes.push({ field: "Discount", from: discount, to: d.discount });
            discount = d.discount;
          }
          if (discount > subtotal) throw new Error("DISC");
          const total = subtotal - discount;
          const paid = Number(o.paid);
          if (total < paid) throw new Error("BELOW_PAID");
          const due = total - paid;

          if (total !== Number(o.total)) changes.push({ field: "Total", from: Number(o.total), to: total });
          Object.assign(orderData, {
            subtotal, discount, total, due,
            payStatus: due === 0 ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID",
          });

          await tx.diagnosticCommission.deleteMany({ where: { orderId: id } });
          const comms = calcCommissions(items, subtotal, total, [
            { role: "DOCTOR", p: doctor },
            { role: "AGENT", p: agent },
          ]);
          if (comms.length) {
            await tx.diagnosticCommission.createMany({ data: comms.map((x) => ({ ...x, diagnosticId, orderId: id })) });
          }
        }

        if (!changes.length) throw new Error("NO_CHANGE");
        if (Object.keys(orderData).length) await tx.diagnosticOrder.update({ where: { id }, data: orderData });

        await writeAudit(tx, {
          diagnosticId, entity: "ORDER", entityId: id, entityLabel: o.orderNo,
          action: "UPDATE", changes, reason: d.reason, user: c.user,
        });
      },
      { timeout: 20000, maxWait: 10000 }
    );
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (ERR[e?.message]) return NextResponse.json({ message: ERR[e.message] }, { status: 400 });
    console.error("Edit order error:", e);
    return NextResponse.json({ message: "Edit save hoyni" }, { status: 500 });
  }
}
