import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, sb } from "@/infrastructure/auth/auth-options";

export const dynamic = "force-dynamic";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Fetch all notifications and join with read status for the current user
    const { data: notifications, error } = await sb
        .from("system_notifications")
        .select(`
            *,
            user_notifications_read(user_id, read_at)
        `)
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Process to add 'isRead' flag - only true if THIS user has read it
    const processed = notifications.map(n => ({
        ...n,
        isRead: n.user_notifications_read?.some((r: any) => r.user_id === userId) || false,
        // Remove the raw array to keep it clean if needed, or keep it.
        // Let's keep it but simplified.
    }));

    return NextResponse.json(processed);
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Only GM and Officers can send system notifications
    if (session.user.roleLevel !== "gm" && session.user.roleLevel !== "officer") {
        return NextResponse.json({ error: "Solo el GM u Oficiales pueden enviar notificaciones de sistema" }, { status: 403 });
    }

    const { title, content, type } = await request.json();

    if (!title || !content) {
        return NextResponse.json({ error: "Título y contenido son requeridos" }, { status: 400 });
    }

    const { data, error } = await sb
        .from("system_notifications")
        .insert({
            title,
            content,
            type: type || 'info',
            created_by: userId
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Only GM and Officers can delete system notifications
    if (session.user.roleLevel !== "gm" && session.user.roleLevel !== "officer") {
        return NextResponse.json({ error: "Solo el GM u Oficiales pueden eliminar notificaciones" }, { status: 403 });
    }

    const { id } = await request.json();

    if (!id) {
        return NextResponse.json({ error: "ID de notificación requerido" }, { status: 400 });
    }

    const { error } = await sb
        .from("system_notifications")
        .delete()
        .eq("id", id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Only GM and Officers can update system notifications
    if (session.user.roleLevel !== "gm" && session.user.roleLevel !== "officer") {
        return NextResponse.json({ error: "Solo el GM u Oficiales pueden editar notificaciones" }, { status: 403 });
    }

    const { id, title, content, type } = await request.json();

    if (!id || !title || !content) {
        return NextResponse.json({ error: "ID, título y contenido son requeridos" }, { status: 400 });
    }

    const { data, error } = await sb
        .from("system_notifications")
        .update({
            title,
            content,
            type: type || 'info'
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
