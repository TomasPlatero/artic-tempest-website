import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ensureAppPermission } from '@/shared/auth/permissions';

export async function POST(req: Request) {
  try {
    await ensureAppPermission('settings-discord', 'edit');

    const body = await req.json();
    const { name, is_enabled } = body;

    if (!name || typeof is_enabled !== 'boolean') {
      return new NextResponse('Bad Request: missing name or is_enabled', {
        status: 400,
      });
    }

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );

    const { error } = await sb
      .from('discord_commands')
      .update({ is_enabled })
      .eq('name', name);

    if (error) {
      console.error('DB Update Error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, name, is_enabled });
  } catch (e: any) {
    console.error('Error toggling discord command:', e);
    return NextResponse.json(
      { error: e.message },
      { status: e.message?.startsWith('Unauthorized') ? 403 : 500 },
    );
  }
}
