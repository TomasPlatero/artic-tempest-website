import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { ensureAppPermission } from '@/shared/auth/permissions';
import { logRoleAudit } from '@/shared/lib/role-audit.server';

export async function GET() {
  try {
    const _session = await ensureAppPermission('settings', 'manage');

    const [{ data, error }, { data: roles }] = await Promise.all([
      supabaseAdmin
        .from('app_permissions')
        .select('*')
        .order('role_level', { ascending: true })
        .order('app_id', { ascending: true }),
      supabaseAdmin.from('app_roles').select('level,label'),
    ]);

    if (error) throw error;

    const roleMap = new Map((roles ?? []).map((role) => [role.level, role.label] as const));

    return NextResponse.json(
      (data || []).map((permission) => ({
        ...permission,
        roleSlug: permission.role_level,
        roleLabel: roleMap.get(permission.role_level) ?? permission.role_level,
      })),
    );
  } catch (err: any) {
    console.error('GET /api/guild/permissions error:', err);
    // Fallback or empty if table doesn't exist yet
    return NextResponse.json([]);
  }
}

export async function PATCH(request: Request) {
  try {
    const _session = await ensureAppPermission('settings', 'manage');

    const body = await request.json();
    const {
      role_level,
      roleSlug,
      role_slug,
      app_id,
      appId,
      can_view,
      can_edit,
      can_manage,
    } = body;

    const resolvedRoleLevel = (role_slug ?? roleSlug ?? role_level ?? '').toString().trim().toLowerCase();
    const resolvedAppId = (appId ?? app_id ?? '').toString().trim();

    if (!resolvedRoleLevel || !resolvedAppId) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('app_permissions').upsert(
      {
        role_level: resolvedRoleLevel,
        app_id: resolvedAppId,
        can_view,
        can_edit,
        can_manage,
      },
      { onConflict: 'role_level, app_id' },
    );

    if (error) throw error;

    await logRoleAudit({
      action: 'permission.update',
      roleLevel: resolvedRoleLevel,
      appId: resolvedAppId,
      payload: { can_view, can_edit, can_manage },
      changedBy: _session?.user?.id,
    });

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
