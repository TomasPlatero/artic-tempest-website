import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, supabaseAdmin } from '@/shared/auth/auth-options';
import { ensureAppPermission } from '@/shared/auth/permissions';

export async function GET() {
  try {
    await ensureAppPermission('settings', 'manage');

    const { data, error } = await supabaseAdmin
      .from('app_permissions')
      .select('*');

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err: any) {
    console.error('GET /api/guild/permissions error:', err);
    // Fallback or empty if table doesn't exist yet
    return NextResponse.json([]);
  }
}

export async function PATCH(request: Request) {
  try {
    await ensureAppPermission('settings', 'manage');

    const body = await request.json();
    const { role_level, app_id, can_view, can_edit, can_manage } = body;

    if (!role_level || !app_id) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('app_permissions').upsert(
      {
        role_level,
        app_id,
        can_view,
        can_edit,
        can_manage,
      },
      { onConflict: 'role_level, app_id' },
    );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('PATCH /api/guild/permissions error:', err);
    return NextResponse.json(
      {
        error: 'Error de base de datos. ¿Has creado la tabla app_permissions?',
      },
      { status: 500 },
    );
  }
}
