import { NextResponse } from "next/server";
import { requireCronAuth } from "@/shared/security/cron-auth";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import { getComponentId } from "@/shared/integrations/statuspage/statuspage-client";
import { reportHeartbeat } from "@/shared/integrations/statuspage/monitor";

/**
 * CRON API Endpoint: verifies the /progreso page and the Raider.io endpoints
 * it depends on, then reports to the Statuspage "Progreso" component.
 *
 * Schedule (vercel.json): 20 3 * * *  (daily at 03:20 UTC)
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://artictempest.es";
const TIMEOUT_MS = 10_000;
const CURRENT_RAID_SLUG = process.env.RAID_TIMELINE_SLUG || "tier-mn-1";

type CheckResult = {
	check: string;
	ok: boolean;
	detail: string;
};

async function probe(
	url: string,
): Promise<{ ok: boolean; status: number | null }> {
	const MAX_ATTEMPTS = 2;
	const RETRY_DELAY_MS = 1_500;

	for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
		try {
			const res = await fetch(url, {
				cache: "no-store",
				signal: AbortSignal.timeout(TIMEOUT_MS),
			});
			return { ok: res.ok, status: res.status };
		} catch (err) {
			console.warn(
				`[check-progreso] intento ${attempt}/${MAX_ATTEMPTS} fallido:`,
				err instanceof Error ? err.message : err,
			);
		}

		if (attempt < MAX_ATTEMPTS) {
			await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
		}
	}

	return { ok: false, status: null };
}

export async function GET(req: Request) {
	const authError = requireCronAuth(req);
	if (authError) {
		return authError;
	}

	const pageId = process.env.STATUSPAGE_PAGE_ID;
	const apiKey = process.env.STATUSPAGE_API_KEY;
	const componentId = await getComponentId("progreso");

	if (!pageId || !apiKey || !componentId) {
		console.error(
			"[check-progreso] Statuspage env vars missing. Set STATUSPAGE_PAGE_ID, STATUSPAGE_API_KEY and a 'progreso' key (web > Heartbeating).",
		);
		return NextResponse.json(
			{ error: "Statuspage not configured" },
			{ status: 503 },
		);
	}

	const { data: guild } = await supabaseAdmin
		.from("settings")
		.select("name, realm, region")
		.eq("id", 1)
		.maybeSingle();

	const region = (guild?.region || "eu").toLowerCase();
	const realmSlug = (guild?.realm || "dun-modr")
		.toLowerCase()
		.replace(/\s+/g, "-");
	const guildName = guild?.name || "Artic Tempest";

	// Los 4 probes son independientes: se ejecutan en paralelo para mantenerse
	// dentro del maxDuration del cron. Cada uno reintenta una vez ante un fallo
	// transitorio (timeout/red) para no disparar incidentes falsos.
	const [page, staticData, profile, live] = await Promise.all([
		probe(`${SITE_URL}/progreso`),
		probe("https://raider.io/api/v1/raiding/static-data?expansion_id=11"),
		probe(
			`https://raider.io/api/v1/guilds/profile?region=${region}&realm=${realmSlug}&name=${encodeURIComponent(guildName)}&fields=raid_progression`,
		),
		probe(
			`https://raider.io/api/v1/live-tracking/guild/raid-progress?region=${region}&realm=${realmSlug}&guild=${encodeURIComponent(guildName)}&raid=${CURRENT_RAID_SLUG}&difficulty=mythic`,
		),
	]);

	// Raider.io live tracking: 404 = sin raid en vivo = OK
	const liveOk = live.ok || live.status === 404;

	const checks: CheckResult[] = [
		{
			check: "pagina_progreso",
			ok: page.ok,
			detail: page.status ? `HTTP ${page.status}` : "sin respuesta",
		},
		{
			check: "raiderio_static_data",
			ok: staticData.ok,
			detail: staticData.status ? `HTTP ${staticData.status}` : "sin respuesta",
		},
		{
			check: "raiderio_guild_profile",
			ok: profile.ok,
			detail: profile.status ? `HTTP ${profile.status}` : "sin respuesta",
		},
		{
			check: "raiderio_live_tracking",
			ok: liveOk,
			detail: live.status ? `HTTP ${live.status}` : "sin respuesta",
		},
	];

	const ok = checks.every((c) => c.ok);

	const report = await reportHeartbeat({
		checkKey: "progreso",
		pageId,
		apiKey,
		componentId,
		ok,
		details: checks.map((c) => `${c.check}: ${c.detail}`),
		incidentName: "Progreso degradado",
	});

	const status = report.status;

	console.log(`[check-progreso] ${ok ? "PASS" : "FAIL"} -> ${status}`);

	return NextResponse.json(
		{ ok, status, checks, statuspage: report.statuspage },
		{ status: report.statuspage.ok ? 200 : 502 },
	);
}
