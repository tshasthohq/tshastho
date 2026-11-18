import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/guards";

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const user = await prisma.user.findFirst({ where: { email: auth.user.email } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    const orders = await prisma.order.findMany({
      where: { patientId: user.id },
      include: {
        pharmacy: {
          select: {
            shopName: true,
            area: true,
            city: true,
            address: true,
            phone: true,
            drugLicense: true,
            logo: true,
            vatPercent: true, // নতুন ফিল্ড
          },
        },
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const medicineIds = orders.flatMap(o => o.items.map((i: any) => i.medicineId));
    const medicines = await prisma.medicine.findMany({
      where: { id: { in: medicineIds } },
      select: { id: true, images: true }
    });

    const medMap = new Map(medicines.map(m => [m.id, m.images]));

    const ordersWithImages = orders.map(order => ({
      ...order,
      items: order.items.map((item: any) => ({
        ...item,
        images: medMap.get(item.medicineId) || []
      }))
    }));

    return NextResponse.json({ success: true, orders: ordersWithImages }, { status: 200 });
  } catch (error) {
    console.error("My Orders API Error:", error);
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
