import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import { ensureAdmin } from "@/shared/auth/permissions";

/** Columns that really exist in `navigation_items`; anything else is dropped. */
const ITEM_FIELDS = [
    "name",
    "url",
    "icon_name",
    "order_index",
    "parent_id",
    "app_id",
    "badge_key",
    "is_active",
    "css_class",
    "element_id",
    "visibility",
    "description",
] as const;

function pickItemFields(payload: Record<string, unknown>) {
    return ITEM_FIELDS.reduce<Record<string, unknown>>((fields, field) => {
        if (field in payload) fields[field] = payload[field];
        return fields;
    }, {});
}

/** Role slugs arriving from the menu editor; anything blank is dropped. */
function normalizeRoleSlugs(roles: string[] | undefined): string[] {
    if (!Array.isArray(roles)) return [];
    const slugs = roles
        .map((role) => String(role ?? "").trim())
        .filter((role) => role.length > 0);
    return Array.from(new Set(slugs));
}

/** Replace the role list without ever leaving the item without roles. */
async function syncItemRoles(itemId: string, roles: string[] | undefined) {
    const slugs = normalizeRoleSlugs(roles);
    const { data: existing, error: readError } = await supabaseAdmin
        .from("navigation_item_roles")
        .select("role_level")
        .eq("item_id", itemId);

    if (readError) throw readError;

    const current = new Set((existing ?? []).map((row) => row.role_level));
    const toInsert = slugs.filter((slug) => !current.has(slug));
    const toDelete = [...current].filter((slug) => !slugs.includes(slug));

    if (toInsert.length > 0) {
        const { error: insertError } = await supabaseAdmin
            .from("navigation_item_roles")
            .insert(
                toInsert.map((role_level) => ({ item_id: itemId, role_level })),
            );

        if (insertError) throw insertError;
    }

    if (toDelete.length > 0) {
        const { error: deleteError } = await supabaseAdmin
            .from("navigation_item_roles")
            .delete()
            .eq("item_id", itemId)
            .in("role_level", toDelete);

        if (deleteError) throw deleteError;
    }
}

// GET: All navigation items for management (hierarchical or flat)
export async function GET() {
    try {
        await ensureAdmin();

        const { data, error } = await supabaseAdmin
            .from("navigation_items")
            .select(`
        *,
        navigation_item_roles (role_level)
      `)
            .order("order_index", { ascending: true });

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Create new navigation item
export async function POST(req: Request) {
    try {
        const [_, rawBody] = await Promise.all([ensureAdmin(), req.json()]);
        const { roles, ...rawFields } = rawBody;

        // 1. Create item
        const { data: item, error } = await supabaseAdmin
            .from("navigation_items")
            .insert(pickItemFields(rawFields))
            .select()
            .single();

        if (error) throw error;

        // 2. Add roles if provided
        const roleSlugs = normalizeRoleSlugs(roles);
        if (roleSlugs.length > 0) {
            const roleInserts = roleSlugs.map((role_level) => ({
                item_id: item.id,
                role_level,
            }));
            const { error: roleError } = await supabaseAdmin
                .from("navigation_item_roles")
                .insert(roleInserts);

            if (roleError) throw roleError;
        }

        return NextResponse.json(item);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH: Update navigation item (used for reordering too)
export async function PATCH(req: Request) {
    try {
        const [_, rawBody] = await Promise.all([ensureAdmin(), req.json()]);
        const { id, roles, ...rawFields } = rawBody;

        if (!id) throw new Error("Item ID is required");

        // 1. Update core fields
        const { error } = await supabaseAdmin
            .from("navigation_items")
            .update(pickItemFields(rawFields))
            .eq("id", id);

        if (error) throw error;

        // 2. Update roles if provided (replace all)
        if (roles !== undefined) {
            await syncItemRoles(id, roles);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Remove navigation item
export async function DELETE(req: Request) {
    try {
        await ensureAdmin();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) throw new Error("Item ID is required");

        const { error } = await supabaseAdmin
            .from("navigation_items")
            .delete()
            .eq("id", id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
