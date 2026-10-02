import { NextResponse } from 'next/server';
import { deleteSession, getSessionToken, verifySessionToken } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const token = await getSessionToken();
    
    if (token) {
      const payload = await verifySessionToken(token);
      if (payload && payload.id) {
        // Delete session from database
        await prisma.session.deleteMany({
          where: { userId: payload.id as string },
        });
      }
    }

    await deleteSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
