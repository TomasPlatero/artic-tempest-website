import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

type CronAuthOptions = {
	allowQuerySecret?: boolean;
};

function safeCompare(a: string, b: string): boolean {
	try {
		const bufA = Buffer.from(a);
		const bufB = Buffer.from(b);
		return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
	} catch {
		return false;
	}
}

export function requireCronAuth(
	request: Request,
	options: CronAuthOptions = {},
) {
	const cronSecret = process.env.CRON_SECRET;

	if (!cronSecret) {
		console.error("CRON_SECRET is missing; rejecting cron request.");
		return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
	}

	const authHeader = request.headers.get("authorization");
	const isAuthorizedByHeader =
		authHeader !== null && safeCompare(authHeader, `Bearer ${cronSecret}`);

	if (isAuthorizedByHeader) {
		return null;
	}

	if (options.allowQuerySecret) {
		try {
			const secret = new URL(request.url).searchParams.get("secret");
			if (secret !== null && safeCompare(secret, cronSecret)) {
				return null;
			}
		} catch {
			// Malformed URL — reject
		}
	}

	return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
