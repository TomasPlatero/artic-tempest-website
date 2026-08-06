import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { ensureAppPermission } from '@/shared/auth/permissions';

export async function PATCH(req: Request) {
  try {
    await ensureAppPermission('settings', 'edit');
    const { tour_enabled } = await req.json();

    if (typeof tour_enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'El campo tour_enabled debe ser un booleano' },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin
      .from('settings')
      .update({ tour_enabled })
      .eq('id', 1);

    if (error) {
      console.error('Supabase update tour_enabled error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, tour_enabled });
  } catch (e: any) {
    console.error('API error:', e);
    return NextResponse.json(
      { error: e.message || 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
