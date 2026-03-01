import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

export const dynamic = "force-dynamic"

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.roleLevel !== 'gm' && session.user.roleLevel !== 'officer')) {
        return NextResponse.json({ count: 0 })
    }

    try {
        const { count, error } = await sb
            .from("recruitment_applications")
            .select("id", { count: 'exact', head: true })
            .in("status", ["pending", "reviewing", "interview"])

        if (error) throw error

        return NextResponse.json({ count: count || 0 })
    } catch (error: any) {
        console.error("Fetch recruitment count error:", error)
        return NextResponse.json({ count: 0, error: error.message }, { status: 500 })
    }
}
