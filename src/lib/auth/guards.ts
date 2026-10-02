import { getCurrentUser } from './user';
import { NextResponse } from 'next/server';

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    };
  }
  return { user, error: null };
}

export async function requireRole(allowedRoles: string[]) {
  const { user, error } = await requireAuth();
  if (error) return { user: null, error };

  if (!allowedRoles.includes(user!.role)) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 }),
    };
  }
  return { user, error: null };
}
