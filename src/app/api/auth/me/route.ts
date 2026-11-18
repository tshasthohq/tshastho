import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionToken, verifySessionToken } from '@/lib/auth/session';

export async function GET() {
  try {
    const token = await getSessionToken();
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const payload = await verifySessionToken(token);
    if (!payload || !payload.id) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: payload.id as string },
      select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatarUrl: true,
      role: true,
      status: true,
      isVerified: true,
      address: true,
      parentPharmacyId: true,
      staffRole: true,
      permissions: true,
      // ভারী প্রোফাইলগুলো বাদ দেওয়া হলো, কারণ এগুলো শুধু নির্দিষ্ট পেজেই দরকার
    },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('[AUTH_ME]', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
