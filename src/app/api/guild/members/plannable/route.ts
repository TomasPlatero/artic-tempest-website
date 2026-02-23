import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { data, error } = await sb
            .from("guild_members")
            .select("*")
            .eq("is_plannable", true)
            .order("rank", { ascending: true })
            .order("character_name", { ascending: true })

        if (error) throw error

        return NextResponse.json(data)
    } catch (error: any) {
        console.error("Error fetching plannable members:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
