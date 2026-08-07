export function getLiveBossActivityScore(
	bosses: Array<{
		isDefeated?: boolean;
		pullStartedAt?: string | null;
		pullEndedAt?: string | null;
		pullCount?: number;
		bestPercent?: number;
	}> = [],
) {
	return bosses.reduce((score, boss) => {
		if (boss.isDefeated) return score + 1000;
		if (boss.pullStartedAt || boss.pullEndedAt) return score + 100;
		if ((boss.pullCount ?? 0) > 0) return score + (boss.pullCount ?? 0);
		if ((boss.bestPercent ?? 0) > 0 && (boss.bestPercent ?? 0) < 100)
			return score + 10;
		return score;
	}, 0);
}

export function hasMeaningfulBossActivity(
	bosses: Array<{
		isDefeated?: boolean;
		pullStartedAt?: string | null;
		pullEndedAt?: string | null;
		pullCount?: number;
		bestPercent?: number;
	}> = [],
) {
	return bosses.some(
		(boss) =>
			Boolean(boss.isDefeated) ||
			(boss.pullCount ?? 0) > 0 ||
			Boolean(boss.pullStartedAt) ||
			Boolean(boss.pullEndedAt) ||
			((boss.bestPercent ?? 0) > 0 && (boss.bestPercent ?? 0) < 100),
	);
}

export function getRaidStartDate(
	raids: {
		raids: { slug: string; starts?: Record<string, string | null> }[];
	} | null,
	raidSlug: string,
) {
	const raid = raids?.raids.find((entry) => entry.slug === raidSlug);
	const start = raid?.starts?.eu || raid?.starts?.us || null;
	if (!start) return null;
	const timestamp = new Date(start).getTime();
	return Number.isNaN(timestamp) ? null : timestamp;
}
