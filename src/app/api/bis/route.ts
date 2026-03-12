// src/app/api/bis/route.ts
// BiS selections CRUD for the current user

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/shared/auth/auth-options"
import { ensureAppPermission } from "@/shared/auth/permissions"

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return new NextResponse("No autorizado", { status: 401 })

        const url = new URL(req.url)
        const memberId = url.searchParams.get("member_id")
        const instanceId = url.searchParams.get("instance_id")
        const diffId = url.searchParams.get("diff");
        const difficulty = diffId || url.searchParams.get("difficulty");
        const specId = url.searchParams.get("spec_id");

        // Authentication and Permission Check
        const permissions = await ensureAppPermission('bis', 'view')
        const userRole = session.user.roleLevel

        // If not GM/Officer, verify character ownership
        if (userRole !== 'gm' && userRole !== 'officer') {
            const { data: member } = await supabaseAdmin.from("guild_members")
                .select("id, character_name")
                .eq("id", memberId)
                .single()

            if (!member) {
                return NextResponse.json({ error: "Personaje no encontrado" }, { status: 404 })
            }

            const { data: bnetChar } = await supabaseAdmin.from("bnet_characters")
                .select("id")
                .eq("user_id", session.user.id)
                .eq("name", member.character_name)
                .limit(1)
                .single()

            if (!bnetChar) {
                return NextResponse.json({ error: "No autorizado para este personaje" }, { status: 403 })
            }
        }

        let query = supabaseAdmin.from("bis_selections")
            .select("*")
            .eq("member_id", memberId)

        if (difficulty) {
            query = query.eq("difficulty", difficulty)
        }
        if (instanceId) {
            const normalizedId = instanceId === "voidspire" ? 1307 : instanceId;
            const numericInstanceId = parseInt(String(normalizedId), 10);
            if (!isNaN(numericInstanceId) && numericInstanceId !== 0) {
                query = query.eq("instance_id", numericInstanceId)
            }
        }
        if (specId) {
            if (specId === "null") {
                query = query.is("spec_id", null)
            } else {
                query = query.eq("spec_id", parseInt(specId, 10))
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
        const {
            member_id, item_id, item_name, item_icon, slot, boss_name,
            priority, difficulty, instance_id, ilvl, dps_gain, percent_gain,
            bonus_ids, gems, enchant, upgrade_track, spec_id
        } = body

        if (!member_id || !item_id || !item_name || !slot) {
            return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
        }

        // Check permissions
        await ensureAppPermission('bis', 'edit')
        const userRole = session.user.roleLevel

        // If not GM/Officer, verify character ownership
        if (userRole !== 'gm' && userRole !== 'officer') {
            const { data: member } = await supabaseAdmin.from("guild_members")
                .select("id, character_name")
                .eq("id", member_id)
                .single()

            if (!member) {
                return NextResponse.json({ error: "Personaje no encontrado" }, { status: 404 })
            }

            const { data: bnetChar } = await supabaseAdmin.from("bnet_characters")
                .select("id")
                .eq("user_id", session.user.id)
                .eq("name", member.character_name)
                .limit(1)
                .single()

            if (!bnetChar) {
                return NextResponse.json({ error: "No autorizado" }, { status: 403 })
            }
        }

        const { data, error } = await supabaseAdmin.from("bis_selections")
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
                    if (instance_id === "voidspire") return 1307;
                    return parseInt(String(instance_id), 10) || 0;
                })(),
                dps_gain: dps_gain || null,
                percent_gain: percent_gain || null,
                ilvl: ilvl || 0,
                bonus_ids: bonus_ids || [],
                gems: gems || [],
                enchant: enchant || null,
                upgrade_track: upgrade_track || null,
                spec_id: spec_id || null,
            }, { onConflict: "member_id,item_id,difficulty,spec_id" })
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
        const { data: selection } = await supabaseAdmin.from("bis_selections")
            .select("id, member_id")
            .eq("id", selectionId)
            .single()

        if (!selection) {
            return NextResponse.json({ error: "No encontrado" }, { status: 404 })
        }

        // Permission check
        await ensureAppPermission('bis', 'edit')
        const userRole = session.user.roleLevel

        // If not GM/Officer, verify character ownership
        if (userRole !== 'gm' && userRole !== 'officer') {
            const { data: member } = await supabaseAdmin.from("guild_members")
                .select("character_name")
                .eq("id", selection.member_id)
                .single()

            if (!member) {
                return NextResponse.json({ error: "No autorizado" }, { status: 403 })
            }

            const { data: bnetChar } = await supabaseAdmin.from("bnet_characters")
                .select("id")
                .eq("user_id", session.user.id)
                .eq("name", member.character_name)
                .limit(1)
                .single()

            if (!bnetChar) {
                return NextResponse.json({ error: "No autorizado" }, { status: 403 })
            }
        }

        await supabaseAdmin.from("bis_selections").delete().eq("id", selectionId)

        return NextResponse.json({ success: true })
    } catch (e: any) {
        console.error("BiS DELETE error:", e.message)
        return new NextResponse("Error interno", { status: 500 })
    }
}

export async function PATCH(req: Request) {
    try {
        await ensureAppPermission('bis', 'edit')
        const session = await getServerSession(authOptions)
        if (!session?.user) return new NextResponse("No autorizado", { status: 401 })

        const body = await req.json()
        const { member_id, dps_gain, pct_gain } = body

        if (!member_id) {
            return NextResponse.json({ error: "Falta el member_id" }, { status: 400 })
        }

        // Verify ownership
        const { data: member } = await supabaseAdmin.from("guild_members")
            .select("character_name")
            .eq("id", member_id)
            .single()

        if (!member) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 })
        }

        const { data: bnetChar } = await supabaseAdmin.from("bnet_characters")
            .select("id")
            .eq("user_id", session.user.id)
            .eq("name", member.character_name)
            .limit(1)
            .single()

        if (!bnetChar) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 })
        }

        const { error } = await supabaseAdmin.from("guild_members")
            .update({
                bis_dps_gain: dps_gain,
                bis_pct_gain: pct_gain
            })
            .eq("id", member_id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (e: any) {
        console.error("BiS PATCH error:", e.message)
        return new NextResponse("Error interno", { status: 500 })
    }
}
