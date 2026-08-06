import { NextResponse } from "next/server";
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { ensureAppPermission } from "@/shared/auth/permissions";

export async function PATCH(req: Request) {
	try {
		await ensureAppPermission("settings", "edit");
		const body = await req.json();

		const { name, realm, region, icon_url, mobile_icon_url, public_logo_url } =
			body;

		const updates: Record<string, unknown> = {
			updated_at: new Date().toISOString(),
		};

		if (name !== undefined) updates.name = name;
		if (realm !== undefined) updates.realm = realm;
		if (region !== undefined) updates.region = region;
		if (icon_url !== undefined) updates.icon_url = icon_url;
		if (mobile_icon_url !== undefined)
			updates.mobile_icon_url = mobile_icon_url;
		if (public_logo_url !== undefined)
			updates.public_logo_url = public_logo_url;

		if (Object.keys(updates).length <= 1) {
			return NextResponse.json(
				{ error: "No se proporcionan campos para actualizar" },
				{ status: 400 },
			);
		}

		// Use update on the existing row instead of upsert (avoids NOT NULL issues)
		const { error } = await supabaseAdmin
			.from("settings")
			.update(updates)
			.eq("id", 1);

		if (error) {
			console.error("Supabase update guild info error:", error);
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({ success: true });
	} catch (e: unknown) {
		console.error("[PATCH /api/guild/settings/info]", e);
		// Preserve ApiError status codes from ensureAppPermission
		if (e instanceof Error && "status" in e && typeof (e as { status: number }).status === "number") {
			const status = (e as { status: number }).status;
			if (status >= 400 && status < 500) {
				return NextResponse.json({ error: e.message }, { status });
			}
		}
		const message = e instanceof Error ? e.message : "Error interno del servidor";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
