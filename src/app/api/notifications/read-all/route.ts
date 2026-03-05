import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/infrastructure/auth/auth-options"

export async function POST() {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const userId = (session.user as any).id

    try {
        // Obtenemos todas las IDs de notificaciones existentes
        const { data: notifications } = await supabaseAdmin.from("system_notifications")
            .select("id")

        if (!notifications || notifications.length === 0) {
            return NextResponse.json({ success: true, count: 0 })
        }

        // Insertamos registros en user_notifications_read ignorando duplicados (ya leídas)
        const readInserts = notifications.map(n => ({
            user_id: userId,
            notification_id: n.id
        }))

        const { error } = await supabaseAdmin.from("user_notifications_read")
            .upsert(readInserts, { onConflict: 'user_id,notification_id' })

        if (error) throw error

        return NextResponse.json({ success: true, count: notifications.length })
    } catch (error: any) {
        console.error("Mark all as read error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
