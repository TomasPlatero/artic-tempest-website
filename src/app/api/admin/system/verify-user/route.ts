// src/app/api/admin/system/verify-user/route.ts
import { NextResponse } from 'next/server';
import { ensureAppPermission } from '@/shared/auth/permissions';
import { verifyUser } from '@/domains/membership/lib/sync-engine.server';

export async function POST(req: Request) {
  await ensureAppPermission('settings-accounts', 'manage');

  try {
    const { userId } = await req.json();
    if (!userId) throw new Error('userId es requerido');

    const result = await verifyUser(userId);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('Manual verify error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
