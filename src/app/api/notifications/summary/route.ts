import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { getAppPermission } from '@/shared/auth/permissions';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ notifications: [], recruitmentCount: 0 });
  }

  const userRole = (session.user as any).roleLevel;
  const userId = (session.user as any).id;

  let notificationsQuery = supabaseAdmin
    .from('system_notifications')
    .select(
      `
        *,
        user_notifications_read(user_id, read_at)
      `,
    )
    .order('created_at', { ascending: false });

  const settingsPermission = await getAppPermission(
    userRole,
    'settings-notifications',
  );

  if (!settingsPermission.canEdit) {
    notificationsQuery = notificationsQuery.or(
      `target_roles.is.null,target_roles.cs.{${userRole}}`,
    );
  }

  const canViewRecruitment = (
    await getAppPermission(userRole, 'settings-recruitment')
  ).canView;

  const notificationsResult = await notificationsQuery;

  if (notificationsResult.error) {
    return NextResponse.json(
      { error: notificationsResult.error.message },
      { status: 500 },
    );
  }

  const recruitmentResult = await (
    canViewRecruitment
      ? supabaseAdmin
          .from('recruitment_applications')
          .select('id', { count: 'exact', head: true })
          .in('status', ['pending', 'reviewing', 'interview'])
      : Promise.resolve({ count: 0, error: null })
  );

  const processed = (notificationsResult.data || []).map((n) => ({
    ...n,
    isRead:
      n.user_notifications_read?.some((r: any) => r.user_id === userId) ||
      false,
  }));

  return NextResponse.json({
    notifications: processed,
    recruitmentCount: recruitmentResult.count || 0,
  });
}
