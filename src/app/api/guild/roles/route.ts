import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        const roleLevel = session?.user?.roleLevel
        if (!session || (roleLevel !== "gm" && roleLevel !== "officer")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { discord_role_id, role_name, app_role } = body

        if (!discord_role_id || !role_name || !app_role) {
            return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
        }

        // Insert into DB
        const { data, error } = await sb
            .from("discord_roles")
            .insert({
                role_id: discord_role_id,
                name: role_name,
                level: app_role,
            })
            .select()
            .single()

        if (error) {
            if (error.code === "23505") {
                return NextResponse.json({ error: "Este Role ID ya está mapeado" }, { status: 400 })
            }
            throw error
        }

        return NextResponse.json({ mapping: data })
    } catch (error: any) {
        console.error("Error saving role mapping:", error)
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        const roleLevel = session?.user?.roleLevel
        if (!session || (roleLevel !== "gm" && roleLevel !== "officer")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id") // In discord_roles, the primary key is role_id or id?

        if (!id) {
            return NextResponse.json({ error: "Falta el ID" }, { status: 400 })
        }

        const { error } = await sb
            .from("discord_roles")
            .delete()
            .match({ role_id: id }) // Match role_id

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("Error deleting role mapping:", error)
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }
}
