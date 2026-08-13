import { NextResponse } from "next/server";
import { requireCronAuth } from "@/shared/security/cron-auth";
import { getComponentId } from "@/shared/integrations/statuspage/statuspage-client";
import { reportHeartbeat } from "@/shared/integrations/statuspage/monitor";

/**
 * CRON API Endpoint: pings the public website once a day and reports the
 * result to the Statuspage "Web" component.
 *
 * Schedule (vercel.json): 0 3 * * *  (daily at 03:00 UTC)
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DEFAULT_SITE_URL = "https://artictempest.es";
const CHECK_URL =
	process.env.STATUSPAGE_WEB_CHECK_URL ||
	process.env.NEXT_PUBLIC_SITE_URL ||
	DEFAULT_SITE_URL;

const MAX_ATTEMPTS = 3;
const FETCH_TIMEOUT_MS = 8_000;
const RETRY_DELAY_MS = 1_500;

export async function GET(req: Request) {
	const authError = requireCronAuth(req);
	if (authError) {
		return authError;
	}

	const pageId = process.env.STATUSPAGE_PAGE_ID;
	const apiKey = process.env.STATUSPAGE_API_KEY;
	const componentId = await getComponentId("web");

	if (!pageId || !apiKey || !componentId) {
		console.error(
			"[check-web] Statuspage env vars missing. Set STATUSPAGE_PAGE_ID, STATUSPAGE_API_KEY and STATUSPAGE_COMPONENT_IDS (with a 'web' key).",
		);
		return NextResponse.json(
			{ error: "Statuspage not configured" },
			{ status: 503 },
		);
	}

	const check = await pingSite(CHECK_URL);

	const report = await reportHeartbeat({
		checkKey: "web",
		pageId,
		apiKey,
		componentId,
		ok: check.ok,
		details: [
			`URL: ${CHECK_URL}`,
			`HTTP status: ${check.httpStatus ?? "n/a"}`,
			`Attempts: ${check.attempts}/${MAX_ATTEMPTS}`,
		],
		incidentName: "Web no responde",
	});

	const status = report.status;

	console.log(
		`[check-web] ${CHECK_URL} -> ${status} (http ${check.httpStatus ?? "n/a"}, ${check.attempts} attempt(s))`,
	);

	return NextResponse.json(
		{ check, status, statuspage: report.statuspage },
		{ status: report.statuspage.ok ? 200 : 502 },
	);
}

type PingResult = {
	ok: boolean;
	httpStatus: number | null;
	attempts: number;
};

async function pingSite(url: string): Promise<PingResult> {
	let lastHttpStatus: number | null = null;

	for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
		try {
			const res = await fetch(url, {
				cache: "no-store",
				redirect: "follow",
				signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
			});
			lastHttpStatus = res.status;
			if (res.ok) {
				return { ok: true, httpStatus: res.status, attempts: attempt };
			}
		} catch (err) {
			lastHttpStatus = null;
			console.warn(
				`[check-web] attempt ${attempt}/${MAX_ATTEMPTS} failed:`,
				err instanceof Error ? err.message : err,
			);
		}

		if (attempt < MAX_ATTEMPTS) {
			await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
		}
	}

	return { ok: false, httpStatus: lastHttpStatus, attempts: MAX_ATTEMPTS };
}
