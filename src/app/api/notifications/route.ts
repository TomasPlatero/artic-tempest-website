import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { getAppPermission } from '@/shared/auth/permissions';
import { getAuthzSnapshot } from '@/shared/auth/authz';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const getAll = searchParams.get('all') === 'true';
  const userId = (session.user as any).id;
  const authz = await getAuthzSnapshot(session);
  const userRole = authz.roleSlug ?? (session.user as any).roleLevel ?? 'invitado';

  let query = supabaseAdmin
    .from('system_notifications')
    .select(
      `
            *,
            user_notifications_read(user_id, read_at)
        `,
    )
    .order('created_at', { ascending: false });

  // If not requesting all (for management) or not an admin, filter by roles
  const settingsPermission = await getAppPermission(
    userRole,
    'settings-notifications',
  );

  if (!getAll || !settingsPermission.canEdit) {
    // Show notifications where target_roles is empty OR contains user's role
    // In Supabase, the @> operator is used for "contains"
    query = query.or(`target_roles.is.null,target_roles.cs.{${userRole}}`);
  }

  const { data: notifications, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Process to add 'isRead' flag - only true if THIS user has read it
  const processed = notifications.map((n) => ({
    ...n,
    isRead:
      n.user_notifications_read?.some((r: any) => r.user_id === userId) ||
      false,
  }));

  return NextResponse.json(processed);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const postPermissions = await getAppPermission(
    (await getAuthzSnapshot(session)).roleSlug ?? session.user?.roleLevel,
    'settings-notifications',
  );
  if (!postPermissions.canEdit) {
    return NextResponse.json(
      { error: 'Sin permisos para gestionar notificaciones' },
      { status: 403 },
    );
  }

  const { title, content, type, target_roles } = await request.json();

  if (!title || !content) {
    return NextResponse.json(
      { error: 'Título y contenido son requeridos' },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from('system_notifications')
    .insert({
      title,
      content,
      type: type || 'info',
      target_roles:
        target_roles && target_roles.length > 0 ? target_roles : null,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const deletePermissions = await getAppPermission(
    (await getAuthzSnapshot(session)).roleSlug ?? session.user?.roleLevel,
    'settings-notifications',
  );
  if (!deletePermissions.canEdit) {
    return NextResponse.json(
      { error: 'Sin permisos para eliminar notificaciones' },
      { status: 403 },
    );
  }

  const { id } = await request.json();

  if (!id) {
    return NextResponse.json(
      { error: 'ID de notificación requerido' },
      { status: 400 },
    );
  }

  const { error } = await supabaseAdmin
    .from('system_notifications')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const patchPermissions = await getAppPermission(
    (await getAuthzSnapshot(session)).roleSlug ?? session.user?.roleLevel,
    'settings-notifications',
  );
  if (!patchPermissions.canEdit) {
    return NextResponse.json(
      { error: 'Sin permisos para editar notificaciones' },
      { status: 403 },
    );
  }

  const { id, title, content, type, target_roles } = await request.json();

  if (!id || !title || !content) {
    return NextResponse.json(
      { error: 'ID, título y contenido son requeridos' },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from('system_notifications')
    .update({
      title,
      content,
      type: type || 'info',
      target_roles:
        target_roles && target_roles.length > 0 ? target_roles : null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
