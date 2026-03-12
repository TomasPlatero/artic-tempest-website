import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/shared/auth/auth-options"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from("game_constants")
            .select("category, key, value, metadata")

        if (error) throw error

        // Transform into a more usable structure
        const constants: Record<string, Record<string, any>> = {}

        data.forEach(item => {
            if (!constants[item.category]) {
                constants[item.category] = {}
            }
            constants[item.category][item.key] = {
                value: item.value,
                metadata: item.metadata
            }
        })

        return NextResponse.json(constants)
    } catch (e: any) {
        console.error("API Error fetching constants:", e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
