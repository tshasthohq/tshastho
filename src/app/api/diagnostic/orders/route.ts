import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { diagCtx } from "@/lib/diagnostic/api";
import { calcCommissions } from "@/lib/diagnostic/commission";
import { writeAudit } from "@/lib/diagnostic/audit";

const schema = z.object({
  patientId: z.string().optional(),
  patient: z
    .object({
      name: z.string().min(2),
      phone: z.string().optional(),
      age: z.coerce.number().int().min(0).max(130).optional(),
      ageUnit: z.enum(["Y", "M", "D"]).optional(),
      gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
      address: z.string().optional(),
    })
    .optional(),
  testIds: z.array(z.string()).min(1).max(100),
  referrerId: z.string().nullable().optional(),
  agentId: z.string().nullable().optional(),
  discount: z.coerce.number().min(0).default(0),
  paid: z.coerce.number().min(0).default(0),
  method: z.enum(["CASH", "BKASH", "NAGAD", "CARD", "BANK", "OTHER"]).default("CASH"),
  reference: z.string().optional(),
  note: z.string().optional(),
});

// Dhaka time e dinar key (yymmdd)
const dayKey = () => new Date(Date.now() + 6 * 3600 * 1000).toISOString().slice(2, 10).replace(/-/g, "");

export async function GET(req: Request) {
  const c = await diagCtx();
  if (c.error) return c.error;
  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") || "").trim();
  const dueOnly = sp.get("due") === "1";
  const all = sp.get("all") === "1";

  const start = new Date(new Date(Date.now() + 6 * 3600 * 1000).toISOString().slice(0, 10) + "T00:00:00+06:00");

  const orders = await prisma.diagnosticOrder.findMany({
    where: {
      diagnosticId: c.diagnostic.id,
      ...(all || q || dueOnly ? {} : { createdAt: { gte: start } }),
      ...(dueOnly ? { due: { gt: 0 }, status: { not: "CANCELLED" } } : {}),
      ...(q
        ? {
            OR: [
              { orderNo: { contains: q, mode: "insensitive" } },
              { patient: { name: { contains: q, mode: "insensitive" } } },
              { patient: { phone: { contains: q } } },
            ],
          }
        : {}),
    },
    include: { patient: { select: { name: true, phone: true, patientNo: true } }, _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const sum = (k: "total" | "paid" | "due") => orders.reduce((s, o) => s + Number(o[k]), 0);
  return NextResponse.json({
    success: true,
    orders,
    totals: { count: orders.length, total: sum("total"), paid: sum("paid"), due: sum("due") },
  });
}

export async function POST(req: Request) {
  const c = await diagCtx();
  if (c.error) return c.error;
  const diagnosticId = c.diagnostic.id;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ message: "Patient ar test thik moto din" }, { status: 400 });
  const d = parsed.data;
  if (!d.patientId && !d.patient) return NextResponse.json({ message: "Patient select ba notun patient din" }, { status: 400 });

  // Test gulo database theke (client er price trust kora hobe na)
  const ids = Array.from(new Set(d.testIds));
  const tests = await prisma.diagnosticTest.findMany({
    where: { id: { in: ids }, diagnosticId, isActive: true },
  });
  if (tests.length !== ids.length) {
    return NextResponse.json({ message: "Kono test inactive ba paoa jayni. Page refresh korun" }, { status: 400 });
  }

  const subtotal = tests.reduce((s, t) => s + Number(t.price), 0);
  if (d.discount > subtotal) return NextResponse.json({ message: "Discount total er beshi hote pare na" }, { status: 400 });
  const total = subtotal - d.discount;
  if (d.paid > total) return NextResponse.json({ message: "Paid amount total er beshi hote pare na" }, { status: 400 });
  const due = total - d.paid;
  const payStatus = due === 0 ? "PAID" : d.paid > 0 ? "PARTIAL" : "UNPAID";

  if (d.patientId) {
    const p = await prisma.diagnosticPatient.findFirst({ where: { id: d.patientId, diagnosticId } });
    if (!p) return NextResponse.json({ message: "Patient paoa jayni" }, { status: 400 });
  }
  const doctor = d.referrerId ? await prisma.diagnosticReferrer.findFirst({ where: { id: d.referrerId, diagnosticId } }) : null;
  if (d.referrerId && !doctor) return NextResponse.json({ message: "Doctor paoa jayni" }, { status: 400 });
  const agent = d.agentId ? await prisma.diagnosticReferrer.findFirst({ where: { id: d.agentId, diagnosticId } }) : null;
  if (d.agentId && !agent) return NextResponse.json({ message: "Agent paoa jayni" }, { status: 400 });

  // Branch: staff er nijer branch, na hole main branch
  let branchId: string | null = null;
  if (c.user.role === "DIAGNOSTIC_STAFF") {
    const s = await prisma.diagnosticStaff.findUnique({ where: { userId: c.user.id }, select: { branchId: true } });
    branchId = s?.branchId ?? null;
  }
  if (!branchId) {
    const b = await prisma.diagnosticBranch.findFirst({ where: { diagnosticId, isMain: true }, select: { id: true } });
    branchId = b?.id ?? null;
  }

  try {
    const order = await prisma.$transaction(
      async (tx) => {
        const next = async (key: string) =>
          (
            await tx.diagnosticCounter.upsert({
              where: { diagnosticId_key: { diagnosticId, key } },
              create: { diagnosticId, key, value: 1 },
              update: { value: { increment: 1 } },
            })
          ).value;

        let patientId = d.patientId;
        if (!patientId) {
          const n = await next("PATIENT");
          const p = d.patient!;
          const created = await tx.diagnosticPatient.create({
            data: {
              diagnosticId,
              patientNo: `P-${String(n).padStart(6, "0")}`,
              name: p.name.trim(),
              phone: p.phone || null,
              age: p.age ?? null,
              ageUnit: p.ageUnit ?? "Y",
              gender: p.gender ?? null,
              address: p.address || null,
            },
          });
          patientId = created.id;
        }

        const key = dayKey();
        const on = await next(`ORDER-${key}`);
        const orderNo = `${key}-${String(on).padStart(4, "0")}`;
        const now = Date.now();

        const o = await tx.diagnosticOrder.create({
          data: {
            diagnosticId,
            branchId,
            orderNo,
            patientId,
            referrerId: d.referrerId || null,
            agentId: d.agentId || null,
            payStatus,
            subtotal,
            discount: d.discount,
            total,
            paid: d.paid,
            due,
            note: d.note || null,
            createdById: c.user.id,
          },
        });
        await tx.diagnosticOrderItem.createMany({
          data: tests.map((t) => ({
            orderId: o.id,
            testId: t.id,
            testCode: t.code,
            testName: t.name,
            price: t.price,
            commissionType: t.commissionType,
            commissionValue: t.commissionValue,
            promisedAt: new Date(now + t.reportingHours * 3600 * 1000),
          })),
        });
        const comms = calcCommissions(
          tests.map((t) => ({ price: t.price, commissionType: t.commissionType, commissionValue: t.commissionValue })),
          subtotal, total,
          [{ role: "DOCTOR", p: doctor }, { role: "AGENT", p: agent }]
        );
        if (comms.length) {
          await tx.diagnosticCommission.createMany({ data: comms.map((x) => ({ ...x, diagnosticId, orderId: o.id })) });
        }
        await writeAudit(tx, {
          diagnosticId, entity: "ORDER", entityId: o.id, entityLabel: orderNo, action: "CREATE", user: c.user,
          changes: [{ field: "Total", from: null, to: total }, { field: "Tests", from: null, to: tests.map((t) => t.name).join(", ") }],
        });
        if (d.paid > 0) {
          await tx.diagnosticOrderPayment.create({
            data: { orderId: o.id, amount: d.paid, method: d.method, reference: d.reference || null, receivedById: c.user.id },
          });
        }
        return o;
      },
      { timeout: 20000, maxWait: 10000 }
    );
    return NextResponse.json({ success: true, order: { id: order.id, orderNo: order.orderNo } }, { status: 201 });
  } catch (e) {
    console.error("Create order error:", e);
    return NextResponse.json({ message: "Order save hoyni, abar chesta korun" }, { status: 500 });
  }
}
