import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseGroup, clean, BD_PHONE } from "@/lib/blood";
import { getBankContext, logAction, expireOldBags, COMPONENTS, EXPIRY_DAYS, DAY } from "@/lib/blood-bank";

export const dynamic = "force-dynamic";
const PAGE = 30;
const STATUSES = ["AVAILABLE", "RESERVED", "ISSUED", "EXPIRED", "DISCARDED"];

export async function GET(req: Request) {
  const ctx = await getBankContext();
  if ("error" in ctx) return ctx.error;
  const { bankId } = ctx;

  try {
    await expireOldBags(bankId);
    const sp = new URL(req.url).searchParams;
    const status = sp.get("status") || "";
    const group = parseGroup(sp.get("bloodGroup"));
    const page = Math.max(1, Number(sp.get("page")) || 1);

    const where = {
      bloodBankId: bankId,
      ...(STATUSES.includes(status) ? { status: status as any } : {}),
      ...(group ? { bloodGroup: group } : {}),
    };
    const [bags, total] = await Promise.all([
      prisma.bloodBag.findMany({
        where,
        select: {
          id: true, bagNumber: true, bloodGroup: true, component: true, volumeMl: true,
          collectedAt: true, expiresAt: true, testsClear: true, status: true, donorName: true,
          confirmedGroup: true, tests: { select: { test: true, result: true } },
        },
        orderBy: { expiresAt: "asc" },
        skip: (page - 1) * PAGE,
        take: PAGE,
      }),
      prisma.bloodBag.count({ where }),
    ]);
    return NextResponse.json({ bags, total, pages: Math.ceil(total / PAGE) });
  } catch (e) {
    console.error("[BLOOD_BAGS_GET]", e);
    return NextResponse.json({ error: "Failed to load bags" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const ctx = await getBankContext();
  if ("error" in ctx) return ctx.error;
  const { bankId, userId } = ctx;

  try {
    const b = await req.json();
    const bagNumber = clean(b.bagNumber, 40);
    const bloodGroup = parseGroup(b.bloodGroup);
    const component = COMPONENTS.includes(b.component) ? b.component : "WHOLE_BLOOD";
    const volumeMl = Math.min(1000, Math.max(50, Number(b.volumeMl) || 450));

    if (bagNumber.length < 3) return NextResponse.json({ error: "Bag number is required (min 3 characters)" }, { status: 400 });
    if (!bloodGroup) return NextResponse.json({ error: "Select a blood group" }, { status: 400 });

    const collectedAt = b.collectedAt ? new Date(b.collectedAt) : new Date();
    if (isNaN(+collectedAt) || +collectedAt > Date.now() + 3600000)
      return NextResponse.json({ error: "Invalid collection date" }, { status: 400 });

    let expiresAt = new Date(+collectedAt + EXPIRY_DAYS[component] * DAY);
    if (b.expiresAt) {
      const custom = new Date(b.expiresAt);
      if (isNaN(+custom) || +custom <= +collectedAt || +custom > +collectedAt + 400 * DAY)
        return NextResponse.json({ error: "Invalid expiry date" }, { status: 400 });
      expiresAt = custom;
    }

    const donorPhone = clean(b.donorPhone, 20).replace(/[\s-]/g, "");
    if (donorPhone && !BD_PHONE.test(donorPhone))
      return NextResponse.json({ error: "Invalid donor phone number" }, { status: 400 });

    const bag = await prisma.bloodBag.create({
      data: {
        bloodBankId: bankId, bagNumber, bloodGroup, component, volumeMl,
        donorName: clean(b.donorName) || null, donorPhone: donorPhone || null,
        collectedAt, expiresAt, testsClear: false,
      },
      select: { id: true, bagNumber: true, expiresAt: true },
    });
    await logAction(bankId, userId, "BAG_ADDED", `${bagNumber} ${bloodGroup} ${component}`);
    return NextResponse.json({ success: true, bag }, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") return NextResponse.json({ error: "This bag number already exists" }, { status: 409 });
    console.error("[BLOOD_BAGS_POST]", e);
    return NextResponse.json({ error: "Failed to add bag" }, { status: 500 });
  }
}
