import "server-only";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";

export type RateLimitResult = {
	allowed: boolean;
	count: number;
	reset: number; // Unix timestamp in ms
};

/**
 * Check rate limit using Supabase (replaces Upstash Redis).
 *
 * Uses the `check_rate_limit` PostgreSQL function which atomically
 * increments a per-key counter with automatic window reset.
 *
 * Only called for verification (~10% of requests). The local in-memory
 * rate limiter in proxy.ts handles the other 90%.
 */
function isValidRateLimitResult(data: unknown): data is RateLimitResult {
	if (!data || typeof data !== "object") return false;
	const d = data as Record<string, unknown>;
	return (
		typeof d.allowed === "boolean" &&
		typeof d.count === "number" &&
		typeof d.reset === "number"
	);
}

export async function checkSupabaseRateLimit(
	key: string,
	maxRequests: number,
	windowSeconds: number,
): Promise<RateLimitResult> {
	const { data, error } = await supabaseAdmin.rpc("check_rate_limit", {
		p_key: key,
		p_max_requests: maxRequests,
		p_window_seconds: windowSeconds,
	});

	if (error) {
		console.error("[RateLimit] Supabase RPC error:", error);
		return {
			allowed: true,
			count: 0,
			reset: Date.now() + windowSeconds * 1000,
		};
	}

	if (!isValidRateLimitResult(data)) {
		console.error(
			"[RateLimit] Unexpected RPC response shape:",
			JSON.stringify(data),
		);
		return {
			allowed: true,
			count: 0,
			reset: Date.now() + windowSeconds * 1000,
		};
	}

	return data;
}
