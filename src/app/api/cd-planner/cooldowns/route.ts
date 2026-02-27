import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return new NextResponse("No autorizado", { status: 401 })
        }

        const { data, error } = await sb
            .from("cooldown_definitions")
            .select("*")
            .order("class_id", { ascending: true })

        if (error) throw error

        return NextResponse.json(data)
    } catch (e: any) {
        console.error("GET /api/cd-planner/cooldowns error:", e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
