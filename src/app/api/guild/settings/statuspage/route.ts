import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import { ensureAppPermission } from "@/shared/auth/permissions";
import { handleRouteError } from "@/shared/api/errors";
import { STATUSPAGE_COMPONENTS_SETTING_KEY } from "@/shared/integrations/statuspage/statuspage-client";

export const dynamic = "force-dynamic";

/** Lee el mapa de componentes de Statuspage (key -> component id). */
export async function GET() {
	try {
		await ensureAppPermission("settings-testing", "view");

		const { data, error } = await supabaseAdmin
			.from("app_settings")
			.select("value")
			.eq("key", STATUSPAGE_COMPONENTS_SETTING_KEY)
			.maybeSingle();

		if (error) {
			console.error("[GET /api/guild/settings/statuspage]", error);
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		let components: Record<string, string> = {};
		if (data?.value) {
			try {
				components = JSON.parse(data.value) as Record<string, string>;
			} catch {
				components = {};
			}
		}

		return NextResponse.json({ components });
	} catch (e) {
		return handleRouteError(e);
	}
}

/** Guarda el mapa de componentes de Statuspage. */
export async function PUT(req: Request) {
	try {
		await ensureAppPermission("settings-testing", "edit");

		const body = await req.json().catch(() => ({}));
		const raw = body?.components;

		if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
			return NextResponse.json(
				{ error: "Formato de componentes inválido" },
				{ status: 400 },
			);
		}

		const components: Record<string, string> = {};
		for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
			const trimmedKey = key.trim();
			const id = typeof value === "string" ? value.trim() : "";
			if (trimmedKey && id) {
				components[trimmedKey] = id;
			}
		}

		const { error } = await supabaseAdmin.from("app_settings").upsert(
			{
				key: STATUSPAGE_COMPONENTS_SETTING_KEY,
				value: JSON.stringify(components),
				updated_at: new Date().toISOString(),
			},
			{ onConflict: "key" },
		);

		if (error) {
			console.error("[PUT /api/guild/settings/statuspage]", error);
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({ success: true, components });
	} catch (e) {
		return handleRouteError(e);
	}
}
