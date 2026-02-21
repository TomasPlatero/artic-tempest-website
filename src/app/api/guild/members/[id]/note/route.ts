import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const roleLevel = session.user?.roleLevel
        if (roleLevel !== "gm" && roleLevel !== "officer") {
            return new NextResponse("Forbidden", { status: 403 })
        }

        const p = await params
        const body = await request.json()
        const { note } = body

        // Optional: length limit to prevent abuse
        const safeNote = note ? String(note).slice(0, 500) : null

        const { error } = await sb
            .from("guild_members")
            .update({ note: safeNote })
            .eq("id", p.id)

        if (error) {
            console.error("Supabase update note error:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, note: safeNote })

    } catch (e: any) {
        console.error("API error:", e)
        return NextResponse.json({ error: e.message || "Internal server error" }, { status: 500 })
    }
}
