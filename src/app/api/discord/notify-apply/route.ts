import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import { getAuthzSnapshot } from "@/shared/auth/authz";
import { notifyApplicationCore } from "@/shared/lib/recruitment/notify-apply-core";

export async function POST(req: Request) {
	// 1. Verificar sesión para que solo un usuario logueado pueda enviar notificaciones
	const session = await auth();
	if (!session) {
		return NextResponse.json({ error: "No autorizado" }, { status: 401 });
	}

	try {
		const body = await req.json();
		const { application_id, force = false, channel_id } = body;

		if (!application_id) {
			return NextResponse.json(
				{ error: "Falta ID de la solicitud" },
				{ status: 400 },
			);
		}

		// 2. Verificar que el usuario es el dueño de la aplicación o es oficial
		const { data: application, error: appError } = await supabaseAdmin
			.from("recruitment_applications")
			.select("user_id")
			.eq("id", application_id)
			.single();

		if (appError || !application) {
			console.error("Supabase Select Error:", appError);
			throw new Error("No se pudo obtener la solicitud de la base de datos");
		}

		const isOwner = application.user_id === session.user.id;
		const authz = await getAuthzSnapshot(session);
		const isOfficial = authz.route.internalAdmin;
		if (!isOwner && !isOfficial) {
			return NextResponse.json(
				{ error: "No autorizado para notificar esta solicitud" },
				{ status: 403 },
			);
		}

		// 3. Delegar en el core compartido
		const result = await notifyApplicationCore(
			application_id,
			channel_id,
			force,
		);

		if (!result.ok) {
			if (result.reason === "not_configured") {
				return NextResponse.json({
					success: true,
					warning: "Bot no configurado, notificación ignorada.",
				});
			}
			return NextResponse.json(
				{ error: result.error || "Error al notificar" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ success: true, message_id: result.message_id });
	} catch (error: any) {
		console.error("API Recruitment Discord Notify Error:", error);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
