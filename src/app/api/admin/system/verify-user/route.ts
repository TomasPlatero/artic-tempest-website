// src/app/api/admin/system/verify-user/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/infrastructure/auth/auth-options"
import { verifyUser } from "@/infrastructure/verification/sync-engine"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.roleLevel !== 'gm') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { userId } = await req.json()
        if (!userId) throw new Error("userId es requerido")

        const result = await verifyUser(userId)

        return NextResponse.json({
            success: true,
            result
        })
    } catch (error: any) {
        console.error("Manual verify error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
