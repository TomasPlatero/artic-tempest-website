import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/infrastructure/auth/auth-options"

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        const roleLevel = session?.user?.roleLevel
        if (roleLevel !== "gm" && roleLevel !== "officer") {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 })
        }

        const { roleId, name, level } = await request.json()

        if (!roleId || !name || !level) {
            return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 })
        }

        const validLevels = ["gm", "officer", "raider", "member"]
        if (!validLevels.includes(level)) {
            return NextResponse.json({ error: "Nivel de permiso inválido" }, { status: 400 })
        }

        const { error } = await supabaseAdmin.from("discord_roles").insert({
            role_id: roleId,
            name,
            level
        })

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json({ error: "Ese ID de rol ya está registrado." }, { status: 400 })
            }
            throw error
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error("POST /api/guild/roles/discord error:", err)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        const roleLevel = session?.user?.roleLevel
        if (roleLevel !== "gm" && roleLevel !== "officer") {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 })
        }

        const url = new URL(request.url)
        const roleId = url.searchParams.get("roleId")

        if (!roleId) {
            return NextResponse.json({ error: "Falta el roleId" }, { status: 400 })
        }

        const { error } = await supabaseAdmin.from("discord_roles").delete().eq("role_id", roleId)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error("DELETE /api/guild/roles/discord error:", err)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        const roleLevel = session?.user?.roleLevel
        if (roleLevel !== "gm" && roleLevel !== "officer") {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 })
        }

        const { oldRoleId, roleId: newRoleId, name, level } = await request.json()

        if (!oldRoleId || !newRoleId || !name || !level) {
            return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 })
        }

        const validLevels = ["gm", "officer", "raider", "member"]
        if (!validLevels.includes(level)) {
            return NextResponse.json({ error: "Nivel de permiso inválido" }, { status: 400 })
        }

        if (oldRoleId !== newRoleId) {
            // Safe PK update ignoring FK restrict (via delete + insert)
            await supabaseAdmin.from("discord_roles").delete().eq("role_id", oldRoleId)
            const { error } = await supabaseAdmin.from("discord_roles").insert({
                role_id: newRoleId,
                name,
                level
            })
            if (error) {
                if (error.code === '23505') {
                    return NextResponse.json({ error: "Ese ID de rol ya está registrado." }, { status: 400 })
                }
                throw error
            }
        } else {
            const { error } = await supabaseAdmin.from("discord_roles").update({ name, level }).eq("role_id", oldRoleId)
            if (error) throw error
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error("PUT /api/guild/roles/discord error:", err)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}
