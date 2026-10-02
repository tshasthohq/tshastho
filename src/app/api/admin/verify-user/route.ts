import { NextResponse } from "next/server";
import { requireRole } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const auth = await requireRole(['SUPER_ADMIN']);
  if (auth.error) return auth.error;

  try {
    const { userId, action, reason } = await req.json();

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        status: action,
        rejectReason: action === "REJECTED" ? reason : null,
        isVerified: action === "APPROVED",
      },
    });

    // নোটিফিকেশন তৈরি করা
    await prisma.notification.create({
      data: {
        userId,
        title: action === "APPROVED" ? "🎉 Account Approved!" : "❌ Application Rejected",
        message: action === "APPROVED"
          ? "Your doctor account has been verified. You can now login to Tshastho."
          : `Your application was rejected. Reason: ${reason || "Not specified"}`,
        type: action === "APPROVED" ? "confirmed" : "rejected",
        link: "/login",
      },
    });

    return NextResponse.json({ message: "User updated", user }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
