import { NextResponse } from "next/server"
import { auth } from '@/auth';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
export async function GET() {
    try {
        const session = await auth()
        if (!session) {
            return new NextResponse("No autorizado", { status: 401 })
        }

        const { data: guild, error } = await supabaseAdmin.from("settings")
            .select("icon_url, mobile_icon_url, name, version")
            .eq("id", 1)
            .maybeSingle()

        if (error) {
            console.error("Supabase fetch guild info error:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(guild)

    } catch (e: any) {
        console.error("API error:", e)
        return NextResponse.json({ error: e.message || "Error interno del servidor" }, { status: 500 })
    }
}
