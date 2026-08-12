import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import { ensureAppPermission } from "@/shared/auth/permissions";
import { handleRouteError } from "@/shared/api/errors";

export const dynamic = "force-dynamic";

/** Lee el canal de Discord de test configurado. */
export async function GET() {
	try {
		await ensureAppPermission("settings-testing", "view");

		const { data, error } = await supabaseAdmin
			.from("settings")
			.select("recruitment_test_channel_id")
			.eq("id", 1)
			.maybeSingle();

		if (error) {
			console.error("[GET /api/guild/settings/testing]", error);
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({
			recruitment_test_channel_id: data?.recruitment_test_channel_id ?? "",
		});
	} catch (e) {
		return handleRouteError(e);
	}
}

/** Guarda el canal de Discord de test. */
export async function PATCH(req: Request) {
	try {
		await ensureAppPermission("settings-testing", "edit");

		const body = await req.json().catch(() => ({}));
		const raw = body?.recruitment_test_channel_id;
		const channelId = typeof raw === "string" ? raw.trim() : "";

		const { error } = await supabaseAdmin
			.from("settings")
			.update({
				recruitment_test_channel_id: channelId || null,
				updated_at: new Date().toISOString(),
			})
			.eq("id", 1);

		if (error) {
			console.error("[PATCH /api/guild/settings/testing]", error);
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({
			success: true,
			recruitment_test_channel_id: channelId || null,
		});
	} catch (e) {
		return handleRouteError(e);
	}
}
