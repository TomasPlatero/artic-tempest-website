import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

export async function DELETE(
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
        const { error } = await sb
            .from("guild_members")
            .delete()
            .eq("id", p.id)

        if (error) {
            console.error("Supabase delete member error:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (e: any) {
        console.error("API error:", e)
        return NextResponse.json({ error: e.message || "Internal server error" }, { status: 500 })
    }
}
