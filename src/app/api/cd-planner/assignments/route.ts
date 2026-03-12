import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/shared/auth/auth-options"
import { ensureAppPermission } from "@/shared/auth/permissions"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
    try {
        await ensureAppPermission('planificador-cds', 'view')
        const { searchParams } = new URL(request.url)
        const event_id = searchParams.get("event_id")
        const boss_name = searchParams.get("boss_name")

        if (!event_id || !boss_name) {
            return new NextResponse("event_id and boss_name are required", { status: 400 })
        }

        const { data, error } = await supabaseAdmin.from("cd_assignments")
            .select("*")
            .eq("event_id", event_id)
            .eq("boss_name", boss_name)
            .order("time_seconds", { ascending: true })

        if (error) throw error

        return NextResponse.json(data)
    } catch (e: any) {
        console.error("GET /api/cd-planner/assignments error:", e)
        return NextResponse.json({ error: e.message }, { status: e.message.includes("Unauthorized") ? 403 : 500 })
    }
}

export async function POST(request: Request) {
    try {
        await ensureAppPermission('planificador-cds', 'edit')

        const body = await request.json()
        const { id, event_id, boss_name, member_id, cooldown_id, time_seconds } = body

        if (!event_id || !boss_name || !member_id || !cooldown_id || time_seconds === undefined) {
            return new NextResponse("Missing required fields", { status: 400 })
        }

        const { data, error } = await supabaseAdmin.from("cd_assignments")
            .upsert({
                id: id || undefined,
                event_id,
                boss_name,
                member_id,
                cooldown_id,
                time_seconds,
                updated_at: new Date().toISOString()
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (e: any) {
        console.error("POST /api/cd-planner/assignments error:", e)
        return NextResponse.json({ error: e.message }, { status: e.message.includes("Unauthorized") ? 403 : 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        await ensureAppPermission('planificador-cds', 'edit')

        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")

        if (!id) {
            return new NextResponse("ID is required", { status: 400 })
        }

        const { error } = await supabaseAdmin.from("cd_assignments")
            .delete()
            .eq("id", id)

        if (error) throw error

        return new NextResponse(null, { status: 204 })
    } catch (e: any) {
        console.error("DELETE /api/cd-planner/assignments error:", e)
        return NextResponse.json({ error: e.message }, { status: e.message.includes("Unauthorized") ? 403 : 500 })
    }
}
