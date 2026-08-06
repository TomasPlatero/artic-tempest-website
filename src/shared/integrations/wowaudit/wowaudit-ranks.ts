import { normalizeText } from "@/shared/integrations/wowaudit/wowaudit-client";

export const WOWAUDIT_RANK_IMAGE_BUCKET = "roster_ranks_images";

export type WowauditRankRow = {
  rank: number;
  name: string;
  color: string | null;
  image_url: string | null;
  roster_section: "main" | "alters";
};

const DEFAULT_WOWAUDIT_RANK_NAMES: string[] = [
  "Guild Master",
  "Oficial",
  "Alter Oficial",
  "Raid Leader",
  "Artic Raider",
  "Raider",
  "Trial",
  "Alter Raider",
  "Backup",
  "Member",
];

const RANK_ALIASES: Record<string, number> = {
  "guild master": 0,
  gm: 0,
  oficial: 1,
  officer: 1,
  "alter oficial": 2,
  "artic mod": 4,
  "raid leader": 3,
  "artic raider": 4,
  raider: 5,
  main: 5,
  trial: 6,
  "alter raider": 7,
  backup: 8,
  alt: 8,
  social: 8,
  member: 9,
};

export function getWowauditRankName(
  rank: number,
  ranks: WowauditRankRow[] = [],
) {
  return (
    ranks.find((entry) => entry.rank === rank)?.name ||
    DEFAULT_WOWAUDIT_RANK_NAMES[rank] ||
    `Rank ${rank}`
  );
}

export function resolveWowauditRank(
  rank: string | null | undefined,
  options?: {
    existingRank?: number | null;
    ranks?: WowauditRankRow[];
  },
) {
  if (options?.existingRank != null) {
    return options.existingRank;
  }

  const normalized = normalizeText(rank);
  if (!normalized) {
    return 6;
  }

  const rankEntry = options?.ranks?.find(
    (entry) => normalizeText(entry.name) === normalized,
  );
  if (rankEntry) {
    return rankEntry.rank;
  }

  return RANK_ALIASES[normalized] ?? 6;
}
