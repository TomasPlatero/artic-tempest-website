import "server-only";

import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { SEASON_NAME } from "./constants";
import type { RosterEntry, ClassSpecsMap } from "./constants";

// ──────────────────────────────────────────────
// Data fetching — server-only, not server actions
// ──────────────────────────────────────────────

/** Every entry in the current season, enriched with character info */
export async function getSeasonRoster(
	seasonName = SEASON_NAME,
): Promise<RosterEntry[]> {
	const { data } = await supabaseAdmin
		.from("season_rosters")
		.select(
			`
			id,
			season_name,
			user_id,
			bnet_character_id,
			main_spec,
			off_spec,
			profession_1,
			profession_2,
			character_name,
			realm_slug,
			class_id,
			created_at,
			updated_at,
			bnet_characters (
				name,
				realm,
				realm_slug,
				class_id,
				level,
				thumbnail_url
			)
		`,
		)
		.eq("season_name", seasonName)
		.order("created_at", { ascending: true });

	return (data || []).map((entry: any) => {
		const linked = entry.bnet_characters;

		return {
			id: entry.id,
			season_name: entry.season_name,
			user_id: entry.user_id,
			bnet_character_id: entry.bnet_character_id,
			main_spec: entry.main_spec,
			off_spec: entry.off_spec,
			profession_1: entry.profession_1,
			profession_2: entry.profession_2,
			created_at: entry.created_at,
			updated_at: entry.updated_at,
			character_name: entry.character_name ?? linked?.name ?? "",
			realm: linked?.realm ?? entry.realm_slug ?? "",
			realm_slug: entry.realm_slug ?? linked?.realm_slug ?? "",
			class_id: entry.class_id ?? linked?.class_id ?? 0,
			level: linked?.level ?? 80,
			thumbnail_url: linked?.thumbnail_url ?? null,
		};
	});
}

/** Class names map (class_id → "Guerrero", "Paladín"…) */
export async function getClassNames(): Promise<Record<number, string>> {
	const { data } = await supabaseAdmin
		.from("game_constants")
		.select("key, value")
		.eq("category", "wow_class");

	const map: Record<number, string> = {};
	for (const row of data || []) {
		map[Number(row.key)] = row.value;
	}
	return map;
}

/** Every spec grouped by class_key for client-side filtering */
export async function getAllSpecsByClass(): Promise<ClassSpecsMap> {
	const { data } = await supabaseAdmin
		.from("spec_rules")
		.select("class_key, spec_name, role")
		.order("class_key", { ascending: true })
		.order("spec_name", { ascending: true });

	const byClass: ClassSpecsMap = {};
	for (const row of data || []) {
		if (!byClass[row.class_key]) byClass[row.class_key] = [];
		byClass[row.class_key].push({
			spec_name: row.spec_name,
			role: row.role,
		});
	}
	return byClass;
}

// ──────────────────────────────────────────────
// Raider.IO thumbnails
// ──────────────────────────────────────────────

const RAIDER_IO_CACHE = new Map<string, string | null>();

async function fetchRaiderIoThumbnail(
	region: string,
	realm: string,
	name: string,
): Promise<string | null> {
	const cacheKey = `${region}:${realm}:${name.toLowerCase()}`;
	const cached = RAIDER_IO_CACHE.get(cacheKey);
	if (cached !== undefined) return cached;

	try {
		const res = await fetch(
			`https://raider.io/api/v1/characters/profile?region=${region}&realm=${realm}&name=${name}`,
			{ next: { revalidate: 3600 } },
		);

		if (!res.ok) {
			RAIDER_IO_CACHE.set(cacheKey, null);
			return null;
		}

		const data = await res.json();
		const thumb = data?.thumbnail_url ?? null;
		RAIDER_IO_CACHE.set(cacheKey, thumb);
		return thumb;
	} catch {
		RAIDER_IO_CACHE.set(cacheKey, null);
		return null;
	}
}

/** Enrich roster entries with Raider.IO thumbnails */
export async function enrichWithRaiderIoThumbnails(
	entries: RosterEntry[],
): Promise<RosterEntry[]> {
	const results = await Promise.allSettled(
		entries.map((entry) =>
			fetchRaiderIoThumbnail("eu", entry.realm_slug, entry.character_name).then(
				(thumb) => ({ id: entry.id, thumb }),
			),
		),
	);

	const thumbMap = new Map<string, string | null>();
	for (const result of results) {
		if (result.status === "fulfilled") {
			thumbMap.set(result.value.id, result.value.thumb);
		}
	}

	return entries.map((entry) => ({
		...entry,
		thumbnail_url: thumbMap.get(entry.id) ?? entry.thumbnail_url,
	}));
}
