import { supabaseAdmin } from '@/shared/lib/supabase-admin';
type RoleAuditPayload = {
  action: string;
  roleLevel?: string;
  appId?: string;
  payload?: Record<string, unknown>;
  changedBy?: string;
};

export async function logRoleAudit({
  action,
  roleLevel,
  appId,
  payload,
  changedBy,
}: RoleAuditPayload) {
  try {
    await supabaseAdmin.from('app_role_audit').insert({
      action,
      role_level: roleLevel ?? null,
      app_id: appId ?? null,
      payload: payload ?? null,
      changed_by: changedBy ?? null,
    });
  } catch (error) {
    console.error('[role-audit] error logging action', action, error);
  }
}
