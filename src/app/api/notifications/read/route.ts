import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, supabaseAdmin } from "@/shared/auth/auth-options";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { notificationId } = await request.json();

    if (!notificationId) {
        return NextResponse.json({ error: "ID de notificación requerido" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("user_notifications_read")
        .upsert({
            user_id: userId,
            notification_id: notificationId
        });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
