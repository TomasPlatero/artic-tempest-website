import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "./auth-options"

export type AppId = 'roster' | 'stats' | 'calendar' | 'bis' | 'planificador-cds' | 'recruitment' | 'settings'
export type RoleLevel = "gm" | "officer" | "raider" | "member" | "invitado"

const ROLE_ORDER: RoleLevel[] = ["invitado", "member", "raider", "officer", "gm"]

export function isAtLeast(current: string, required: RoleLevel): boolean {
    return ROLE_ORDER.indexOf(current as RoleLevel) >= ROLE_ORDER.indexOf(required)
}

export async function getAppPermission(roleLevel: string, appId: AppId) {
    if (roleLevel === 'gm') return { canView: true, canEdit: true }

    try {
        const { data } = await supabaseAdmin
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
    if (roleLevel === 'member') {
        return { canView: true, canEdit: false }
    }

    return { canView: false, canEdit: false }
}

export async function ensureAdmin() {
    const session = await getServerSession(authOptions)
    if (!session) throw new Error("Unauthorized: No session")

    if (!isAtLeast(session.user.roleLevel, 'officer')) {
        throw new Error("Unauthorized: Administrative access required")
    }

    return session
}

export async function ensureAppPermission(appId: AppId, action: 'view' | 'edit' = 'edit') {
    const session = await getServerSession(authOptions)
    if (!session) throw new Error("Unauthorized: No session")

    const roleLevel = session.user.roleLevel
    const permissions = await getAppPermission(roleLevel, appId)

    const hasPermission = action === 'view' ? permissions.canView : permissions.canEdit

    if (!hasPermission) {
        throw new Error(`Unauthorized: Role ${roleLevel} cannot ${action} ${appId}`)
    }

    return session
}
