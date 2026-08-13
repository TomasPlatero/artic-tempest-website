import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
	buildAuthorizationUrl,
	resolveRedirectUri,
} from "@/shared/lib/jira/oauth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
	const state = randomUUID();
	const redirectUri = resolveRedirectUri(req.nextUrl.origin);
	const url = buildAuthorizationUrl(redirectUri, state);

	const res = NextResponse.redirect(url);
	res.cookies.set("jira_oauth_state", state, {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		maxAge: 60 * 10,
		path: "/",
	});
	return res;
}
