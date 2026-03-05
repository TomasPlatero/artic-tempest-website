// src/app/api/bis/route.ts
// BiS selections CRUD for the current user

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return new NextResponse("No autorizado", { status: 401 })

        const url = new URL(req.url)
        const memberId = url.searchParams.get("member_id")
        const instanceId = url.searchParams.get("instance_id")
        const difficulty = url.searchParams.get("difficulty")

        if (!memberId) {
            return NextResponse.json({ error: "Falta el member_id" }, { status: 400 })
        }

        // Verify the member belongs to the current user via bnet_characters name matching
        const { data: member } = await sb
            .from("guild_members")
            .select("id, character_name")
            .eq("id", memberId)
            .single()

        if (!member) {
            return NextResponse.json({ error: "Personaje no encontrado" }, { status: 404 })
        }

        // Check that the user owns a bnet character with that name
        const { data: bnetChar } = await sb
            .from("bnet_characters")
            .select("id")
            .eq("user_id", session.user.id)
            .eq("name", member.character_name)
            .limit(1)
            .single()

        if (!bnetChar) {
            return NextResponse.json({ error: "No autorizado para este personaje" }, { status: 403 })
        }

        let query = sb
            .from("bis_selections")
            .select("*")
            .eq("member_id", memberId)

        if (difficulty) {
            query = query.eq("difficulty", difficulty)
        }
        if (instanceId) {
            const normalizedId = instanceId === "voidspire" ? 1267 : instanceId;
            const numericInstanceId = parseInt(String(normalizedId), 10);
            if (!isNaN(numericInstanceId) && numericInstanceId !== 0) {
                query = query.eq("instance_id", numericInstanceId)
            }
        }

        const { data } = await query.order("slot")

        return NextResponse.json(data || [])
    } catch (e: any) {
        console.error("BiS GET error:", e.message)
        return new NextResponse("Error interno", { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return new NextResponse("No autorizado", { status: 401 })

        const body = await req.json()
        const { member_id, item_id, item_name, item_icon, slot, boss_name, priority, difficulty, instance_id } = body

        if (!member_id || !item_id || !item_name || !slot) {
            return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
        }

        // Verify ownership via bnet_characters
        const { data: member } = await sb
            .from("guild_members")
            .select("id, character_name")
            .eq("id", member_id)
            .single()

        if (!member) {
            return NextResponse.json({ error: "Personaje no encontrado" }, { status: 404 })
        }

        const { data: bnetChar } = await sb
            .from("bnet_characters")
            .select("id")
            .eq("user_id", session.user.id)
            .eq("name", member.character_name)
            .limit(1)
            .single()

        if (!bnetChar) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 })
        }

        const { data, error } = await sb
            .from("bis_selections")
            .upsert({
                member_id,
                item_id,
                item_name,
                item_icon: item_icon || null,
                slot,
                boss_name: boss_name || null,
                priority: priority || 2,
                difficulty: difficulty || "heroic",
                instance_id: (() => {
                    const normalizedId = instance_id === "voidspire" ? 1267 : instance_id;
                    return (normalizedId && normalizedId !== "default") ? parseInt(String(normalizedId), 10) : 0;
                })(),
            }, { onConflict: "member_id,item_id,difficulty" })
            .select()
            .single()

        if (error) {
            console.error("BiS upsert error:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (e: any) {
        console.error("BiS POST error:", e.message)
        return new NextResponse("Error interno", { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return new NextResponse("No autorizado", { status: 401 })

        const url = new URL(req.url)
        const selectionId = url.searchParams.get("id")

        if (!selectionId) {
            return NextResponse.json({ error: "Falta el id" }, { status: 400 })
        }

        // Get the selection to verify ownership
        const { data: selection } = await sb
            .from("bis_selections")
            .select("id, member_id")
            .eq("id", selectionId)
            .single()

        if (!selection) {
            return NextResponse.json({ error: "No encontrado" }, { status: 404 })
        }

        const { data: member } = await sb
            .from("guild_members")
            .select("character_name")
            .eq("id", selection.member_id)
            .single()

        if (!member) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 })
        }

        const { data: bnetChar } = await sb
            .from("bnet_characters")
            .select("id")
            .eq("user_id", session.user.id)
            .eq("name", member.character_name)
            .limit(1)
            .single()

        if (!bnetChar) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 })
        }

        await sb.from("bis_selections").delete().eq("id", selectionId)

        return NextResponse.json({ success: true })
    } catch (e: any) {
        console.error("BiS DELETE error:", e.message)
        return new NextResponse("Error interno", { status: 500 })
    }
}
