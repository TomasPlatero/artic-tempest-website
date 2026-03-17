import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/shared/next-auth/auth-options"
import { supabaseAdmin } from "@/shared/supabase/admin"

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const authorId = searchParams.get("authorId")

    if (!authorId) {
        return NextResponse.json({ error: "Author ID is required" }, { status: 400 })
    }

    try {
        const { data, error } = await supabaseAdmin
            .from("profiles")
            .select("discord_username, discord_avatar, role_level")
            .eq("id", authorId)
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (error) {
        console.error("Error fetching chat author profile:", error)
        return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
    }
}
