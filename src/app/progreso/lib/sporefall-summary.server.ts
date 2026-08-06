import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import {
	fetchGuildBossProgress,
	fetchGuildBossKill,
	fetchGuildBossPulls,
	fetchGuildLiveRaidProgress,
	type RaiderIoGuildBossKillRosterEntry,
} from "@/shared/integrations/raiderio/raiderio-client";
import {
	getLiveBossActivityScore,
	hasMeaningfulBossActivity,
} from "./progress.utils";

type Difficulty = "mythic" | "heroic" | "normal";

export type SporefallSummary = {
	name: string;
	difficulty: Difficulty;
	isDefeated: boolean;
	pullCount: number;
	bestPercent: number;
	killDate: string | null;
	killImageUrl: string | null;
	firstSeenAt: string | null;
	lastPullAt: string | null;
	killRoster: RaiderIoGuildBossKillRosterEntry[];
};

export const getSporefallSummary = unstable_cache(
	async (): Promise<SporefallSummary | null> => {
		const { data: guild } = await supabaseAdmin
			.from("settings")
			.select("name, region, realm")
			.eq("id", 1)
			.maybeSingle();

		if (!guild) return null;

		const region = guild.region.toLowerCase();
		const realmSlug = guild.realm.toLowerCase().replace(/\s+/g, "-");
		const raidSlug = "sporefall";
		const progressBossSlug = "latest";
		const killBossSlug = "rotmire";
		const difficulties: Difficulty[] = ["mythic", "heroic", "normal"];

		const liveDataByDifficulty = await Promise.all(
			difficulties.map(async (difficulty) => {
				const data = await fetchGuildLiveRaidProgress({
					realmSlug,
					guildName: guild.name,
					region,
					raidSlug,
					difficulty,
					revalidate: 120,
				});
				return {
					difficulty,
					data,
					activityScore: getLiveBossActivityScore(data?.bosses || []),
				};
			}),
		);

		const activeCandidate = liveDataByDifficulty.find(
			(entry) =>
				Boolean(entry.data?.bosses?.length) &&
				hasMeaningfulBossActivity(entry.data?.bosses || []),
		);
		const candidatesWithBosses = liveDataByDifficulty.filter(
			(entry) => entry.data?.bosses?.length,
		);
		const bestCandidate =
			candidatesWithBosses.length > 0
				? candidatesWithBosses.reduce((best, current) =>
						current.activityScore > best.activityScore ? current : best,
					)
				: undefined;
		const fallbackCandidate = liveDataByDifficulty.find((entry) =>
			Boolean(entry.data?.bosses?.length),
		);
		const selectedCandidate =
			activeCandidate ||
			(bestCandidate && bestCandidate.activityScore > 0
				? bestCandidate
				: fallbackCandidate);

		const resolvedDifficulty = selectedCandidate?.difficulty ?? null;
		const raidData = selectedCandidate?.data ?? null;
		const boss = raidData?.bosses?.[0] ?? null;

		if (!raidData || !resolvedDifficulty || !boss) return null;

		const [progressData, killData, pullsData, killImages] = await Promise.all([
			fetchGuildBossProgress({
				realmSlug,
				guildName: guild.name,
				region,
				raidSlug,
				difficulty: resolvedDifficulty,
				bossSlug: progressBossSlug,
				revalidate: 120,
			}),
			fetchGuildBossKill({
				realmSlug,
				guildName: guild.name,
				region,
				raidSlug,
				difficulty: resolvedDifficulty,
				bossSlug: killBossSlug,
				revalidate: 120,
			}),
			fetchGuildBossPulls({
				realmSlug,
				guildName: guild.name,
				region,
				raidSlug,
				difficulty: resolvedDifficulty,
				bossSlug: progressBossSlug,
				revalidate: 120,
			}),
			supabaseAdmin
				.from("game_constants")
				.select("key, value")
				.eq("category", "wow_raid_kill_images"),
		]);

		const pulls = (pullsData || []).slice().sort((a, b) => {
			const aTime = new Date(a.startedAt || a.endedAt || 0).getTime();
			const bTime = new Date(b.startedAt || b.endedAt || 0).getTime();
			return aTime - bTime;
		});

		const killPull = pulls.find((pull) => pull.isKill);
		const firstSeenAt = pulls[0]?.startedAt || pulls[0]?.endedAt || null;
		const lastPullAt =
			pulls[pulls.length - 1]?.endedAt ||
			pulls[pulls.length - 1]?.startedAt ||
			null;
		const isDefeated = Boolean(
			killData?.kill?.isSuccess ||
				progressData?.isDefeated ||
				boss.isDefeated ||
				killPull,
		);
		const killDate =
			killData?.kill?.defeatedAt ||
			(progressData?.isDefeated
				? progressData.pullEndedAt || progressData.pullStartedAt
				: null) ||
			killPull?.endedAt ||
			killPull?.startedAt ||
			boss.pullEndedAt ||
			boss.pullStartedAt ||
			null;
		const pullCount =
			pulls.length > 0
				? pulls.length
				: (progressData?.pullCount ?? boss.pullCount ?? 0);
		const hasActivity = Boolean(
			isDefeated || pullCount > 0 || firstSeenAt || lastPullAt || killDate,
		);

		if (!hasActivity) return null;

		const killImageMap = Object.fromEntries(
			(killImages.data || []).map((row: any) => [row.key, row.value] as const),
		);

		return {
			name: boss.boss.name || "Sporefall",
			difficulty: resolvedDifficulty,
			isDefeated,
			pullCount,
			bestPercent: progressData?.bestPercent ?? boss.bestPercent ?? 0,
			firstSeenAt,
			lastPullAt,
			killRoster: killData?.roster || [],
			killDate,
			killImageUrl:
				killImageMap[killBossSlug] ||
				killImageMap[raidSlug] ||
				killImageMap[boss.boss.slug] ||
				null,
		};
	},
	["sporefall-summary-v1"],
	{ revalidate: 120 },
);
