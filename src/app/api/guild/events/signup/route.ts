import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { event_id, status, comment, role_preference } = body

        if (!event_id || !status) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // 1. Get the guild member ID for the current user
        const { data: memberData, error: memberErr } = await sb
            .from("guild_members")
            .select("id")
            .eq("profile_id", session.user.id)
            .single()

        if (memberErr || !memberData) {
            return NextResponse.json({ error: "No guild member associated with this profile" }, { status: 400 })
        }

        const member_id = memberData.id

        // 2. Upsert the signup
        const { data, error } = await sb
            .from("event_signups")
            .upsert({
                event_id,
                member_id,
                status,
                comment: comment || null,
                role_preference: role_preference || 'dps', // Fallback
                selection_status: 'queued', // Always queued on initial signup
            }, {
                onConflict: 'event_id, member_id'
            })
            .select()
            .single()

        if (error) {
            throw error
        }

        return NextResponse.json({ success: true, data })
    } catch (error: any) {
        console.error("Error saving event signup:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
