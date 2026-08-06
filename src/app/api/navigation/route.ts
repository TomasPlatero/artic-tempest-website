import { NextResponse } from "next/server"
import { auth } from '@/auth';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { getAppPermission } from "@/shared/auth/permissions"
import { getAuthzSnapshot } from "@/shared/auth/authz"

export async function GET() {
    try {
        const session = await auth()
        const authz = session ? await getAuthzSnapshot(session) : null
        const roleLevel = authz?.roleSlug ?? session?.user?.roleLevel ?? "invitado"

        // Fetch all active navigation items
        const { data: items, error } = await supabaseAdmin
            .from("navigation_items")
            .select(`
        *,
        description,
        navigation_item_roles (role_level)
      `)
            .eq("is_active", true)
            .order("order_index", { ascending: true })

        if (error) throw error

        const childrenByParent = new Map<string | null, any[]>()
        for (const item of items) {
            const parentId = item.parent_id ?? null
            const currentChildren = childrenByParent.get(parentId)
            if (currentChildren) {
                currentChildren.push(item)
            } else {
                childrenByParent.set(parentId, [item])
            }
        }

        // Recursive filtering and tree building
        const buildTree = async (parentId: string | null = null, parentAllowedRoles: Set<string> | null = null) => {
            const children = childrenByParent.get(parentId) ?? []

            // Pre-fetch all app permissions for children in parallel
            const permissionResults = await Promise.all(
                children.map(async (item) => {
                    if (item.app_id) {
                        const perm = await getAppPermission(roleLevel, item.app_id as any);
                        return { itemId: item.id, canView: perm.canView };
                    }
                    return { itemId: item.id, canView: true };
                }),
            );
            const permMap = new Map(permissionResults.map((r) => [r.itemId, r.canView]));

            const results = await Promise.all(children.map(async (item) => {
                // 1. Roles: Own roles or inherit from parent
                const itemRoles: string[] = item.navigation_item_roles.map((r: any) => r.role_level)
                const currentAllowedRoles = itemRoles.length > 0 ? new Set<string>(itemRoles) : parentAllowedRoles

                // Check if user has one of the allowed roles (if restricted)
                if (currentAllowedRoles && !currentAllowedRoles.has(roleLevel)) {
                    return null
                }

                // 2. App Permissions (use cached result)
                if (item.app_id && !permMap.get(item.id)) {
                    return null;
                }

                // If we reach here, the item is visible. Now check its children.
                const subItems: any[] = await buildTree(item.id, currentAllowedRoles)
                return {
                    ...item,
                    children: subItems
                }
            }))

            return results.filter(Boolean)
        }

        const menuTree = await buildTree(null)

        return NextResponse.json(menuTree)
    } catch (error: any) {
        console.error("Navigation fetch error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
