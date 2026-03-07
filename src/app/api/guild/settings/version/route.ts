import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/infrastructure/auth/auth-options"
import { ensureAdmin } from "@/infrastructure/auth/permissions"

export async function PATCH(req: Request) {
    try {
        await ensureAdmin()
        const { version } = await req.json()

        if (!version) {
            return NextResponse.json({ error: "La versión es obligatoria" }, { status: 400 })
        }

        const { error } = await supabaseAdmin
            .from("guilds_managed")
            .update({ version })
            .not("guild_id", "is", null) // Update any/all rows as there should be only one

        if (error) {
            console.error("Supabase update version error:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, version })

    } catch (e: any) {
        console.error("API error:", e)
        return NextResponse.json({ error: e.message || "Error interno del servidor" }, { status: 500 })
    }
}
