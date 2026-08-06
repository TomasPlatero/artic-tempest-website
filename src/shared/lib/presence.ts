import "server-only";

import { supabaseAdmin } from "@/shared/lib/supabase-admin"; // react-doctor-disable-line supabase-client-owned-authz-field — server-only file
const PRESENCE_TTL_SECONDS = Number(process.env.USER_PRESENCE_TTL ?? 120);

export async function touchUserPresence(userId: string) {
	try {
		await supabaseAdmin
			.from("profiles")
			.update({ last_seen_at: new Date().toISOString() })
			.eq("user_id", userId);
	} catch (error) {
		console.error("[Presence] touch error", error);
	}
}

export async function getPresenceMap(
	userIds: string[],
): Promise<Record<string, number | null>> {
	const map: Record<string, number | null> = {};
	if (userIds.length === 0) return map;
	try {
		const { data } = await supabaseAdmin
			.from("profiles")
			.select("user_id, last_seen_at")
			.in("user_id", userIds);

		for (const id of userIds) {
			map[id] = null;
		}

		if (data) {
			for (const row of data) {
				map[row.user_id] = row.last_seen_at
					? new Date(row.last_seen_at).getTime()
					: null;
			}
		}
	} catch (error) {
		console.error("[Presence] fetch error", error);
	}
	return map;
}

export function isUserOnline(timestamp: number | null) {
	if (!timestamp) return false;
	return Date.now() - timestamp <= PRESENCE_TTL_SECONDS * 1000;
}
