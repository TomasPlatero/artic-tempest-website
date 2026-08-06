// src/app/api/admin/system/update-role/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { ensureAppPermission } from '@/shared/auth/permissions';
import { fetchAppRoles } from '@/shared/auth/roles';

const VALID_ROLE_LEVELS = new Set([
  'gm',
  'officer',
  'raider',
  'trial',
  'member',
  'invitado',
]);

export async function POST(req: Request) {
  const session = await ensureAppPermission('settings-accounts', 'manage');

  try {
    const { userId, role } = await req.json();
    if (!userId || !role) throw new Error('userId y role son requeridos');

    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'No puedes modificar tu propio rol desde este panel' },
        { status: 400 },
      );
    }

    const roles = await fetchAppRoles();
    const validLevels = new Set(roles.map((r) => r.level));
    if (!validLevels.has(role)) {
      return NextResponse.json(
        { error: `Rol no válido. Roles permitidos: ${[...VALID_ROLE_LEVELS].join(', ')}` },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        role_level: role,
        last_role_check: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Manual update role error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
