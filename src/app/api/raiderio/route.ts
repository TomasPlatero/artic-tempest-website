import { NextRequest, NextResponse } from "next/server";

const RAIDERIO_BASE = "https://raider.io/api/v1";

/**
 * Proxy route for Raider.io API calls from client components.
 *
 * Raider.io blocks browser-based CORS requests. This server-side proxy
 * forwards requests so the browser talks to our domain instead.
 *
 * Usage:
 *   GET /api/raiderio?path=/characters/profile&region=eu&realm=dun-modr&name=Zatoshi&fields=active_spec_name
 *
 * Security: only allows paths starting with "/api/v1" under raider.io.
 */
export async function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl;

	const path = searchParams.get("path");
	if (!path) {
		return NextResponse.json(
			{ error: 'Missing required query parameter: "path"' },
			{ status: 400 },
		);
	}

	// Security: restrict to raider.io API paths only — avoid open proxy abuse
	if (!path.startsWith("/")) {
		return NextResponse.json(
			{ error: "path must start with /" },
			{ status: 400 },
		);
	}

	const allowedPrefixes = [
		"/characters/profile",
		"/guilds/profile",
		"/guilds/boss-kill",
		"/raiding/static-data",
		"/live-tracking/guild/raid-progress",
		"/live-tracking/guild/boss-progress",
		"/live-tracking/guild/boss-pulls",
	];

	const isAllowed = allowedPrefixes.some((prefix) => path.startsWith(prefix));
	if (!isAllowed) {
		return NextResponse.json(
			{ error: "Access to this path denied" },
			{ status: 403 },
		);
	}

	// Copy all query params except "path" to forward to raider.io
	const forwardedParams = new URLSearchParams();
	for (const [key, value] of searchParams.entries()) {
		if (key !== "path") {
			forwardedParams.set(key, value);
		}
	}

	const queryString = forwardedParams.toString();
	const url = `${RAIDERIO_BASE}${path}${queryString ? `?${queryString}` : ""}`;

	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 5000);

		const response = await fetch(url, {
			signal: controller.signal,
			// Cache: allow ISR-like revalidation at CDN level
			headers: {
				"User-Agent": "ArticTempest-Web/1.0",
				Accept: "application/json",
			},
		});

		clearTimeout(timeout);

		if (!response.ok) {
			const text = await response.text().catch(() => "");
			return NextResponse.json(
				{ error: `Raider.io API error ${response.status}`, details: text },
				{ status: response.status },
			);
		}

		const data = await response.json();

		return NextResponse.json(data, {
			headers: {
				"Cache-Control":
					"public, max-age=300, s-maxage=300, stale-while-revalidate=600",
			},
		});
	} catch (error: any) {
		if (error?.name === "AbortError") {
			return NextResponse.json(
				{ error: "Raider.io request timed out" },
				{ status: 504 },
			);
		}
		return NextResponse.json(
			{ error: "Failed to proxy request to Raider.io" },
			{ status: 502 },
		);
	}
}
