import { getServerSession } from 'next-auth';
import { authOptions, supabaseAdmin } from './auth-options';

export type AppId =
  | 'roster'
  | 'stats'
  | 'calendar'
  | 'bis'
  | 'planificador-cds'
  | 'recruitment'
  | 'settings'
  | 'settings-discord'
  | 'settings-bnet'
  | 'settings-accounts'
  | 'settings-api'
  | 'settings-news'
  | 'settings-widgets'
  | 'settings-streamers'
  | 'settings-notifications'
  | 'settings-recruitment'
  | 'settings-menu'
  | 'bis-admin'
  | 'weekly-vault'
  | 'weekly-vault-admin'
  | 'donations'
  | 'desktop-app-cta';
export type RoleLevel = 'gm' | 'officer' | 'raider' | 'member' | 'invitado';

export type AppPermission = {
  canView: boolean;
  canEdit: boolean;
  canManage: boolean;
};

const ROLE_ORDER: RoleLevel[] = [
  'invitado',
  'member',
  'raider',
  'officer',
  'gm',
];

export function isAtLeast(current: string, required: RoleLevel): boolean {
  return (
    ROLE_ORDER.indexOf(current as RoleLevel) >= ROLE_ORDER.indexOf(required)
  );
}

function normalizePermission(
  permission?: {
    can_view?: boolean | null;
    can_edit?: boolean | null;
    can_manage?: boolean | null;
  } | null,
): AppPermission {
  const canManage = Boolean(permission?.can_manage);
  const canEdit = canManage || Boolean(permission?.can_edit);
  const canView = canEdit || Boolean(permission?.can_view);

  return {
    canView,
    canEdit,
    canManage,
  };
}

export async function getAppPermission(
  roleLevel: string,
  appId: AppId,
): Promise<AppPermission> {
  if (!roleLevel) {
    return { canView: false, canEdit: false, canManage: false };
  }

  const normalizedRole = roleLevel.trim().toLowerCase();

  // Guild Master always has all permissions (Absolute Bypass)
  if (normalizedRole === 'gm') {
    return { canView: true, canEdit: true, canManage: true };
  }

  try {
    const { data } = await supabaseAdmin
      .from('app_permissions')
      .select('can_view, can_edit, can_manage')
      .eq('role_level', roleLevel)
      .eq('app_id', appId)
      .maybeSingle();

    if (data) {
      return normalizePermission(data);
    }
  } catch (e) {
    console.error(`Error checking permission for ${appId}:`, e);
  }

  return { canView: false, canEdit: false, canManage: false };
}

export async function ensureAuthenticatedSession() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized: No session');

  return session;
}

export async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized: No session');

  if (!isAtLeast(session.user.roleLevel, 'officer')) {
    throw new Error('Unauthorized: Administrative access required');
  }

  return session;
}

export async function ensureAppPermission(
  appId: AppId,
  action: 'view' | 'edit' | 'manage' = 'edit',
) {
  const session = await ensureAuthenticatedSession();

  const roleLevel = session.user.roleLevel;
  
  // FAIL-SAFE: Guild Master always has all permissions
  if (roleLevel && roleLevel.trim().toLowerCase() === 'gm') {
    return session;
  }

  const permissions = await getAppPermission(roleLevel, appId);

  let hasPermission = false;
  if (action === 'view') hasPermission = permissions.canView;
  else if (action === 'edit') hasPermission = permissions.canEdit;
  else if (action === 'manage') hasPermission = permissions.canManage;

  if (!hasPermission) {
    console.error(`[AUTH] Permission denied for role: "${roleLevel}", appId: "${appId}", action: "${action}"`);
    console.error(`[AUTH] Permissions object:`, permissions);
    throw new Error(
      `Unauthorized: Role ${roleLevel} cannot ${action} ${appId}`,
    );
  }

  return session;
}
