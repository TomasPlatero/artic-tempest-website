import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/shared/auth/auth-options"
import { ensureAdmin } from "@/shared/auth/permissions"

export async function POST(req: Request) {
    try {
        await ensureAdmin()
        const { items } = await req.json()

        if (!items || !Array.isArray(items)) {
            throw new Error("Invalid items array")
        }

        // We use a single transaction-like approach by updating each item
        // Note: For many items, this could be optimized, but for a menu it's perfect.
        // We'll use Promise.all to run them in parallel.
        const updates = items.map((item: any) => 
            supabaseAdmin
                .from("navigation_items")
                .update({ 
                    order_index: item.order_index,
                    parent_id: item.parent_id 
                })
                .eq("id", item.id)
        )

        const results = await Promise.all(updates)
        
        // Check for errors in any update
        const firstError = results.find(r => r.error)?.error
        if (firstError) throw firstError

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
