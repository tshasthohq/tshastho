import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/guards';
// GET/POST: Fetch user's notifications (role-based filter)
export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
        const user = await prisma.user.findFirst({ where: { email: auth.user.email }});
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    // Staff হলে শুধু staff-related category দেখবে, Owner হলে owner-related
    const isStaff = !!user.parentPharmacyId;
    const allowedCategories = isStaff
      ? ["SALARY", "ATTENDANCE", "GENERAL"]
      : ["ORDER", "STOCK", "STAFF_ACTIVITY", "PAYMENT", "GENERAL"];

    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        category: { in: allowedCategories },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false,
        category: { in: allowedCategories },
      },
    });

    return NextResponse.json({ notifications, unreadCount }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}

// PUT: Mark all as read
export async function PUT(req: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
        const user = await prisma.user.findFirst({ where: { email: auth.user.email }});
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ message: "All marked as read" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
