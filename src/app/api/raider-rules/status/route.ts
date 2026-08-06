import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getRaiderRulesStatus } from '@/shared/lib/raider-rules.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  return NextResponse.json(await getRaiderRulesStatus(session.user.id));
}
