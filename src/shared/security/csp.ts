import "server-only";
import { headers } from "next/headers";

export async function getCspNonce() {
	return (await headers()).get("x-nonce") ?? undefined;
}

// Re-export the pure CSP builder for consumers that can't import from
// a server-only module (e.g. next.config.ts, middleware.ts).
export { buildCsp } from "./csp-policy";
