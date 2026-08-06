import { supabaseAdmin } from '@/shared/lib/supabase-admin';
export async function markWowauditRosterSyncSuccess(options?: {
  syncedAt?: string;
}) {
  const syncedAt = options?.syncedAt ?? new Date().toISOString();

  const { error } = await supabaseAdmin
    .from("app_wowaudit")
    .update({ last_wowaudit_sync: syncedAt })
    .eq("id", 1);

  if (error) {
    const fallback = await supabaseAdmin
      .from("app_wowaudit")
      .update({ last_wowaudit_sync: syncedAt })
      .eq("id", 1);

    if (fallback.error) {
      throw fallback.error;
    }
  }

  return syncedAt;
}
