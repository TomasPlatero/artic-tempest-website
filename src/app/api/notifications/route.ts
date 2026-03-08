import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, supabaseAdmin } from "@/infrastructure/auth/auth-options";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const getAll = searchParams.get("all") === "true";
    const userRole = (session.user as any).roleLevel;
    const userId = (session.user as any).id;

    let query = supabaseAdmin.from("system_notifications")
        .select(`
            *,
            user_notifications_read(user_id, read_at)
        `)
        .order("created_at", { ascending: false });

    // If not requesting all (for management) or not an admin, filter by roles
    if (!getAll || (userRole !== "gm" && userRole !== "officer")) {
        // Show notifications where target_roles is empty OR contains user's role
        // In Supabase, the @> operator is used for "contains"
        query = query.or(`target_roles.is.null,target_roles.cs.{${userRole}}`);
    }

    const { data: notifications, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Process to add 'isRead' flag - only true if THIS user has read it
    const processed = notifications.map(n => ({
        ...n,
        isRead: n.user_notifications_read?.some((r: any) => r.user_id === userId) || false,
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

    const { title, content, type, target_roles } = await request.json();

    if (!title || !content) {
        return NextResponse.json({ error: "Título y contenido son requeridos" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.from("system_notifications")
        .insert({
            title,
            content,
            type: type || 'info',
            target_roles: target_roles && target_roles.length > 0 ? target_roles : null,
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

    const { error } = await supabaseAdmin.from("system_notifications")
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

    const { id, title, content, type, target_roles } = await request.json();

    if (!id || !title || !content) {
        return NextResponse.json({ error: "ID, título y contenido son requeridos" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.from("system_notifications")
        .update({
            title,
            content,
            type: type || 'info',
            target_roles: target_roles && target_roles.length > 0 ? target_roles : null,
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
