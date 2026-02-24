import { sb } from "./auth-options"

export type AppId = 'roster' | 'stats' | 'calendar' | 'bis'

export async function getAppPermission(roleLevel: string, appId: AppId) {
    if (roleLevel === 'gm') return { canView: true, canEdit: true }

    try {
        const { data } = await sb
            .from("app_permissions")
            .select("can_view, can_edit")
            .eq("role_level", roleLevel)
            .eq("app_id", appId)
            .maybeSingle()

        if (data) {
            return { canView: data.can_view, canEdit: data.can_edit }
        }
    } catch (e) {
        console.error(`Error checking permission for ${appId}:`, e)
    }

    // Default Fallbacks
    if (roleLevel === 'officer') return { canView: true, canEdit: true }
    if (roleLevel === 'raider') {
        if (appId === 'bis') return { canView: true, canEdit: true }
        return { canView: true, canEdit: false }
    }

    return { canView: false, canEdit: false }
}
