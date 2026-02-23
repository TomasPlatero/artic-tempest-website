import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const roleLevel = session.user?.roleLevel
        if (roleLevel !== "gm" && roleLevel !== "officer") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const eventId = (await params).id
        const body = await req.json()
        const { selections } = body // Array of { member_id, selection_status, event_role, signup_order }

        if (!Array.isArray(selections)) {
            return NextResponse.json({ error: "Invalid selections format" }, { status: 400 })
        }

        // Batch update using upsert on event_id, member_id conflict
        const updates = selections.map(s => ({
            event_id: eventId,
            member_id: s.member_id,
            selection_status: s.selection_status,
            event_role: s.event_role,
            signup_order: s.signup_order,
            status: 'present' // Assume present if selected/queued in planning
        }))

        const { error } = await sb
            .from("event_signups")
            .upsert(updates, { onConflict: "event_id, member_id" })

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("Error batch updating roster:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
