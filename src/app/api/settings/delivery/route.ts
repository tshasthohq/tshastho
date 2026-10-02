import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const charge = await prisma.systemSetting.findUnique({ where: { key: "delivery_charge" } });
    const free = await prisma.systemSetting.findUnique({ where: { key: "delivery_charge_free" } });
    const threshold = await prisma.systemSetting.findUnique({ where: { key: "free_delivery_threshold" } });

    return NextResponse.json({
      charge: charge ? parseFloat(charge.value) : 30,
      free: free ? free.value === "true" : false,
      threshold: threshold ? parseFloat(threshold.value) : 500,
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
