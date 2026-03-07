import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/infrastructure/auth/auth-options"
import { ensureAdmin } from "@/infrastructure/auth/permissions"

// GET: All navigation items for management (hierarchical or flat)
export async function GET() {
    try {
        await ensureAdmin()

        const { data, error } = await supabaseAdmin
            .from("navigation_items")
            .select(`
        *,
        navigation_item_roles (role_level)
      `)
            .order("order_index", { ascending: true })

        if (error) throw error
        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST: Create new navigation item
export async function POST(req: Request) {
    try {
        await ensureAdmin()
        const { roles, ...body } = await req.json()

        // 1. Create item
        const { data: item, error } = await supabaseAdmin
            .from("navigation_items")
            .insert(body)
            .select()
            .single()

        if (error) throw error

        // 2. Add roles if provided
        if (roles && roles.length > 0) {
            const roleInserts = roles.map((role: string) => ({
                item_id: item.id,
                role_level: role
            }))
            const { error: roleError } = await supabaseAdmin
                .from("navigation_item_roles")
                .insert(roleInserts)

            if (roleError) throw roleError
        }

        return NextResponse.json(item)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PATCH: Update navigation item (used for reordering too)
export async function PATCH(req: Request) {
    try {
        await ensureAdmin()
        const { id, roles, ...body } = await req.json()

        if (!id) throw new Error("Item ID is required")

        // 1. Update core fields
        const { error } = await supabaseAdmin
            .from("navigation_items")
            .update(body)
            .eq("id", id)

        if (error) throw error

        // 2. Update roles if provided (replace all)
        if (roles !== undefined) {
            // Delete old
            await supabaseAdmin.from("navigation_item_roles").delete().eq("item_id", id)

            // Insert new
            if (roles.length > 0) {
                const roleInserts = roles.map((role: string) => ({
                    item_id: id,
                    role_level: role
                }))
                const { error: roleError } = await supabaseAdmin
                    .from("navigation_item_roles")
                    .insert(roleInserts)
                if (roleError) throw roleError
            }
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE: Remove navigation item
export async function DELETE(req: Request) {
    try {
        await ensureAdmin()
        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")

        if (!id) throw new Error("Item ID is required")

        const { error } = await supabaseAdmin
            .from("navigation_items")
            .delete()
            .eq("id", id)

        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
