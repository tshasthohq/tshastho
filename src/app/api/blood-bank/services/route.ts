import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clean } from "@/lib/blood";
import { getBankContext, logAction } from "@/lib/blood-bank";

export const dynamic = "force-dynamic";
const DEFAULTS = [
  "Donor screening (HIV, HBsAg, HCV, Syphilis, Malaria)",
  "Blood grouping (ABO and Rh)",
  "Crossmatch",
  "Component processing",
  "Bag and consumables",
];
const validPrice = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 100000 ? n : null;
};

export async function GET() {
  const ctx = await getBankContext();
  if ("error" in ctx) return ctx.error;
  const { bankId } = ctx;
  try {
    const count = await prisma.bloodServiceItem.count({ where: { bloodBankId: bankId } });
    if (count === 0) {
      await prisma.bloodServiceItem.createMany({
        data: DEFAULTS.map((name, i) => ({ bloodBankId: bankId, name, price: 0, sortOrder: i })),
        skipDuplicates: true,
      });
    }
    const items = await prisma.bloodServiceItem.findMany({
      where: { bloodBankId: bankId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, price: true, isActive: true },
    });
    return NextResponse.json({ items: items.map((i) => ({ ...i, price: Number(i.price) })) });
  } catch (e) {
    console.error("[BLOOD_SERVICES_GET]", e);
    return NextResponse.json({ error: "Failed to load price list" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const ctx = await getBankContext();
  if ("error" in ctx) return ctx.error;
  const { bankId, userId } = ctx;
  try {
    const b = await req.json();
    const name = clean(b.name, 100);
    const price = validPrice(b.price);
    if (name.length < 2) return NextResponse.json({ error: "Service name is required" }, { status: 400 });
    if (price === null) return NextResponse.json({ error: "Enter a valid price" }, { status: 400 });
    const last = await prisma.bloodServiceItem.findFirst({
      where: { bloodBankId: bankId }, orderBy: { sortOrder: "desc" }, select: { sortOrder: true },
    });
    const item = await prisma.bloodServiceItem.create({
      data: { bloodBankId: bankId, name, price, sortOrder: (last?.sortOrder ?? -1) + 1 },
      select: { id: true },
    });
    await logAction(bankId, userId, "SERVICE_ADDED", `${name} ${price}`);
    return NextResponse.json({ success: true, id: item.id }, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") return NextResponse.json({ error: "This service already exists" }, { status: 409 });
    console.error("[BLOOD_SERVICES_POST]", e);
    return NextResponse.json({ error: "Failed to add service" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const ctx = await getBankContext();
  if ("error" in ctx) return ctx.error;
  const { bankId, userId } = ctx;
  try {
    const b = await req.json();
    const item = await prisma.bloodServiceItem.findFirst({
      where: { id: String(b.id || ""), bloodBankId: bankId }, select: { id: true, name: true },
    });
    if (!item) return NextResponse.json({ error: "Service not found" }, { status: 404 });

    const data: { price?: number; isActive?: boolean } = {};
    if (b.price !== undefined) {
      const price = validPrice(b.price);
      if (price === null) return NextResponse.json({ error: "Enter a valid price" }, { status: 400 });
      data.price = price;
    }
    if (typeof b.isActive === "boolean") data.isActive = b.isActive;

    await prisma.bloodServiceItem.update({ where: { id: item.id }, data });
    await logAction(bankId, userId, "SERVICE_UPDATED", `${item.name} ${JSON.stringify(data)}`);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[BLOOD_SERVICES_PATCH]", e);
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 });
  }
}
