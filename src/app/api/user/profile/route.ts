import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/guards';

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        isVerified: true,
        address: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('[USER_PROFILE_GET]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { name, phone, address } = body;

    const updated = await prisma.user.update({
      where: { id: auth.user!.id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(address !== undefined && { address }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        address: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('[USER_PROFILE_PUT]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
