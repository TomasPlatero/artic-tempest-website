import { NextResponse } from 'next/server';
import { ensureAuthenticatedSession } from '@/shared/auth/permissions';
import { touchUserPresence } from '@/shared/lib/presence';

export const runtime = 'nodejs';

export async function POST() {
  const session = await ensureAuthenticatedSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await touchUserPresence(session.user.id);

  return NextResponse.json({ success: true });
}
