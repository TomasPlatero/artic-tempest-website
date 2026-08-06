import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { ensureAppPermission } from '@/shared/auth/permissions';

export async function PATCH(req: Request) {
  try {
    await ensureAppPermission('settings', 'edit');
    const { version } = await req.json();

    if (!version) {
      return NextResponse.json(
        { error: 'La versión es obligatoria' },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin
      .from('settings')
      .upsert({ id: 1, version }, { onConflict: 'id' });

    if (error) {
      console.error('Supabase update version error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, version });
  } catch (e: any) {
    console.error('API error:', e);
    return NextResponse.json(
      { error: e.message || 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
