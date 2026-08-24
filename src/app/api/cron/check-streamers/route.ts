import { NextResponse } from "next/server";
import { requireCronAuth } from "@/shared/security/cron-auth";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import { getComponentId } from "@/shared/integrations/statuspage/statuspage-client";
import { reportHeartbeat } from "@/shared/integrations/statuspage/monitor";

/**
 * CRON API Endpoint: verifies the /streamers page and the Twitch endpoints
 * (via decapi.me) it depends on, then reports to the Statuspage "Streamers"
 * component.
 *
 * Schedule (vercel.json): 30 3 * * *  (daily at 03:30 UTC)
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://artictempest.es";
const TIMEOUT_MS = 12_000;
const FALLBACK_TWITCH_USER = "shroud";

type CheckResult = {
	check: string;
	ok: boolean;
	detail: string;
	// When false, the check is informational and does not contribute to the
	// component status (it cannot trigger an incident). Blocking by default.
	blocking?: boolean;
};

async function probe(
	url: string,
): Promise<{ ok: boolean; status: number | null }> {
	try {
		const res = await fetch(url, {
			cache: "no-store",
			signal: AbortSignal.timeout(TIMEOUT_MS),
		});
		return { ok: res.ok, status: res.status };
	} catch {
		return { ok: false, status: null };
	}
}

export async function GET(req: Request) {
	const authError = requireCronAuth(req);
	if (authError) {
		return authError;
	}

	const pageId = process.env.STATUSPAGE_PAGE_ID;
	const apiKey = process.env.STATUSPAGE_API_KEY;
	const componentId = await getComponentId("streamers");

	if (!pageId || !apiKey || !componentId) {
		console.error(
			"[check-streamers] Statuspage env vars missing. Set STATUSPAGE_PAGE_ID, STATUSPAGE_API_KEY and a 'streamers' key (web > Heartbeating).",
		);
		return NextResponse.json(
			{ error: "Statuspage not configured" },
			{ status: 503 },
		);
	}

	// Usuario de Twitch para probar decapi.me: el primer streamer del guild,
	// o un fallback estable si no hay streamers configurados.
	let username = FALLBACK_TWITCH_USER;
	try {
		const { data: guild } = await supabaseAdmin
			.from("settings")
			.select("guild_id")
			.eq("id", 1)
			.maybeSingle();

		if (guild?.guild_id) {
			const { data: streamers } = await supabaseAdmin
				.from("guild_streamers")
				.select("twitch_username")
				.eq("guild_id", guild.guild_id)
				.order("sort_order", { ascending: true })
				.limit(1);

			if (streamers?.[0]?.twitch_username) {
				username = streamers[0].twitch_username;
			}
		}
	} catch (err) {
		console.error("[check-streamers] failed to resolve test username:", err);
	}

	const checks: CheckResult[] = [];

	// 1. Página pública /streamers
	const page = await probe(`${SITE_URL}/streamers`);
	checks.push({
		check: "pagina_streamers",
		ok: page.ok,
		detail: page.status ? `HTTP ${page.status}` : "sin respuesta",
	});

	// 2. decapi.me uptime (Twitch live status)
	const uptime = await probe(`https://decapi.me/twitch/uptime/${username}`);
	checks.push({
		check: "decapi_uptime",
		ok: uptime.ok,
		detail: uptime.status
			? `HTTP ${uptime.status} (${username})`
			: `sin respuesta (${username})`,
	});

	// 3. decapi.me avatar (informational: decorative, does not block the incident)
	const avatar = await probe(`https://decapi.me/twitch/avatar/${username}`);
	checks.push({
		check: "decapi_avatar",
		ok: avatar.ok,
		detail: avatar.status
			? `HTTP ${avatar.status} (${username})`
			: `sin respuesta (${username})`,
		blocking: false,
	});

	const ok = checks.filter((c) => c.blocking !== false).every((c) => c.ok);

	const report = await reportHeartbeat({
		checkKey: "streamers",
		pageId,
		apiKey,
		componentId,
		ok,
		details: checks.map((c) => `${c.check}: ${c.detail}`),
		incidentName: "Streamers degradado",
	});

	const status = report.status;

	console.log(
		`[check-streamers] ${ok ? "PASS" : "FAIL"} -> ${status} (test user: ${username})`,
	);

	return NextResponse.json(
		{ ok, status, checks, testUser: username, statuspage: report.statuspage },
		{ status: report.statuspage.ok ? 200 : 502 },
	);
}
