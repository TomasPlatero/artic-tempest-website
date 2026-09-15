import NextAuth from "next-auth";
import { buildAuthOptions } from "@/auth";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

type AuthRouteContext = {
	params: { nextauth: string[] } | Promise<{ nextauth: string[] }>;
};

// Build auth options per-request so a transient Supabase read failure during a
// cold start no longer crashes the whole route at module load time.
// getGuildCredentials() caches successful reads for 5 minutes, so this stays cheap.
export async function GET(req: NextRequest, ctx: AuthRouteContext) {
	const options = await buildAuthOptions();
	return NextAuth(options)(req, ctx);
}

export async function POST(req: NextRequest, ctx: AuthRouteContext) {
	const options = await buildAuthOptions();
	return NextAuth(options)(req, ctx);
}
