import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/guards';
// Internal API to create a notification
export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { userId, title, message, type, link } = await req.json();

    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type: type || "info",
        link: link || null,
      },
    });

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
