import { NextResponse } from "next/server";
import { requireCronAuth } from "@/shared/security/cron-auth";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import {
	getComponentId,
	setComponentStatus,
	type ComponentStatus,
} from "@/shared/integrations/statuspage/statuspage-client";

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

	const checks: CheckResult[] = [];

	// 1. Página pública /progreso
	const page = await probe(`${SITE_URL}/progreso`);
	checks.push({
		check: "pagina_progreso",
		ok: page.ok,
		detail: page.status ? `HTTP ${page.status}` : "sin respuesta",
	});

	// 2. Raider.io static-data (siempre disponible)
	const staticData = await probe(
		"https://raider.io/api/v1/raiding/static-data?expansion_id=11",
	);
	checks.push({
		check: "raiderio_static_data",
		ok: staticData.ok,
		detail: staticData.status ? `HTTP ${staticData.status}` : "sin respuesta",
	});

	// 3. Raider.io guild profile (valida guild + endpoint principal)
	const profile = await probe(
		`https://raider.io/api/v1/guilds/profile?region=${region}&realm=${realmSlug}&name=${encodeURIComponent(guildName)}&fields=raid_progression`,
	);
	checks.push({
		check: "raiderio_guild_profile",
		ok: profile.ok,
		detail: profile.status ? `HTTP ${profile.status}` : "sin respuesta",
	});

	// 4. Raider.io live tracking (404 = sin raid en vivo = OK)
	const live = await probe(
		`https://raider.io/api/v1/live-tracking/guild/raid-progress?region=${region}&realm=${realmSlug}&guild=${encodeURIComponent(guildName)}&raid=${CURRENT_RAID_SLUG}&difficulty=mythic`,
	);
	const liveOk = live.ok || live.status === 404;
	checks.push({
		check: "raiderio_live_tracking",
		ok: liveOk,
		detail: live.status ? `HTTP ${live.status}` : "sin respuesta",
	});

	const ok = checks.every((c) => c.ok);
	const status: ComponentStatus = ok ? "operational" : "major_outage";
	const report = await setComponentStatus(pageId, apiKey, componentId, status);

	console.log(`[check-progreso] ${ok ? "PASS" : "FAIL"} -> ${status}`);

	return NextResponse.json(
		{ ok, status, checks, statuspage: report },
		{ status: report.ok ? 200 : 502 },
	);
}
