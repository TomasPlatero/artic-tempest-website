import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { ensureAppPermission } from '@/shared/auth/permissions';

export async function POST(req: Request) {
  await ensureAppPermission('settings-accounts', 'manage');

  try {
    const { userId } = await req.json();
    if (!userId) throw new Error('userId es requerido');

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        is_banned: false,
        ban_reason: null,
        ban_expires_at: null,
        banned_at: null,
        banned_by: null,
      })
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[unban-user] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
