import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/infrastructure/auth/auth-options"
import { getAppPermission } from "@/infrastructure/auth/permissions"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        const roleLevel = session?.user?.roleLevel || "invitado"

        // Fetch all active navigation items
        const { data: items, error } = await supabaseAdmin
            .from("navigation_items")
            .select(`
        *,
        navigation_item_roles (role_level)
      `)
            .eq("is_active", true)
            .order("order_index", { ascending: true })

        if (error) throw error

        // Recursive filtering and tree building
        const buildTree = async (parentId: string | null = null, parentAllowedRoles: string[] | null = null) => {
            const children = items.filter((item: any) => item.parent_id === parentId)
            const results = []

            for (const item of children) {
                // 1. Roles: Own roles or inherit from parent
                const itemRoles = item.navigation_item_roles.map((r: any) => r.role_level)
                const currentAllowedRoles = itemRoles.length > 0 ? itemRoles : parentAllowedRoles

                // Check if user has one of the allowed roles (if restricted)
                if (currentAllowedRoles && !currentAllowedRoles.includes(roleLevel)) {
                    continue
                }

                // 2. App Permissions
                if (item.app_id) {
                    const perm = await getAppPermission(roleLevel, item.app_id as any)
                    if (!perm.canView) continue
                }

                // If we reach here, the item is visible. Now check its children.
                const subItems: any[] = await buildTree(item.id, currentAllowedRoles)
                results.push({
                    ...item,
                    children: subItems
                })
            }

            return results
        }

        const menuTree = await buildTree(null)

        return NextResponse.json(menuTree)
    } catch (error: any) {
        console.error("Navigation fetch error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
