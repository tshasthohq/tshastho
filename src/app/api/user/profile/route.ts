import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/guards';
export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { email } = await req.json();

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: email }, { phone: email }] },
      include: { patientProfile: true }
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error fetching profile", error: String(error) }, { status: 500 });
  }
}
