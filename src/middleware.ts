import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { buildCsp } from "@/shared/security/csp-policy";

const cspValue = buildCsp();

export function middleware(_request: NextRequest) {
	const response = NextResponse.next();

	response.headers.set("Content-Security-Policy", cspValue);

	return response;
}

export const config = {
	// Match all paths including API routes, static files, and pages
	matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
