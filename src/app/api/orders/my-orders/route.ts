import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/guards';
export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { email } = await req.json();
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    const orders = await prisma.order.findMany({
      where: { patientId: user.id },
      include: {
        pharmacy: { select: { shopName: true, area: true, city: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
