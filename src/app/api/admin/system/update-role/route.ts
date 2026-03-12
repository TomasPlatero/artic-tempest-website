// src/app/api/admin/system/update-role/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/shared/auth/auth-options"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    // Solo permitimos que el GM cambie roles manualmente
    if (!session || session.user.roleLevel !== 'gm') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { userId, role } = await req.json()
        if (!userId || !role) throw new Error("userId y role son requeridos")

        const { error } = await supabaseAdmin.from('profiles')
            .update({
                role_level: role,
                last_role_check: new Date().toISOString()
            })
            .eq('user_id', userId)

        if (error) throw error

        return NextResponse.json({
            success: true
        })
    } catch (error: any) {
        console.error("Manual update role error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
