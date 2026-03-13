type SelectionDifficulty =
  | 'lfr'
  | 'normal'
  | 'heroic'
  | 'mythic'
  | string
  | null
  | undefined;

export type ExportItemMetadata = {
  ilvl: number;
  bonusIds: number[];
  upgradeTrack: string | null;
  upgradeCurrent: number | null;
  upgradeMax: number | null;
};

const LEGACY_TRACK_BONUS_MAP: Record<
  number,
  { track: string; current: number; max: number; ilvl?: number }
> = {
  12797: { track: 'Hero', current: 1, max: 6, ilvl: 263 },
  12798: { track: 'Hero', current: 2, max: 6, ilvl: 265 },
  12799: { track: 'Hero', current: 3, max: 6, ilvl: 267 },
  12800: { track: 'Hero', current: 4, max: 6, ilvl: 270 },
  12801: { track: 'Hero', current: 5, max: 6, ilvl: 273 },
  12802: { track: 'Hero', current: 6, max: 6, ilvl: 276 },
  12897: { track: 'Myth', current: 1, max: 6, ilvl: 276 },
  12898: { track: 'Myth', current: 2, max: 6, ilvl: 279 },
  12899: { track: 'Myth', current: 3, max: 6, ilvl: 281 },
  12900: { track: 'Myth', current: 4, max: 6, ilvl: 283 },
  12901: { track: 'Myth', current: 5, max: 6, ilvl: 286 },
  12902: { track: 'Myth', current: 6, max: 6, ilvl: 289 },
};

const KNOWN_DIFFICULTY_BONUS_IDS: Record<string, number[]> = {
  heroic: [12250, 12112],
};

const KNOWN_DIFFICULTY_ILVL: Record<string, number> = {
  lfr: 233,
  normal: 246,
  heroic: 259,
  mythic: 272,
};

const KNOWN_DIFFICULTY_TRACK_FALLBACKS: Record<
  string,
  { track: string; current: number; max: number; bonusId: number }
> = {
  heroic: { track: 'Adventurer', current: 6, max: 6, bonusId: 12140 },
};

export function normalizeBonusIds(input: unknown): number[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
}

export function parseUpgradeTrack(track: string | null | undefined): {
  upgradeTrack: string | null;
  upgradeCurrent: number | null;
  upgradeMax: number | null;
} {
  if (!track) {
    return {
      upgradeTrack: null,
      upgradeCurrent: null,
      upgradeMax: null,
    };
  }

  const normalizedTrack = track.trim();
  const match = normalizedTrack.match(/^(.*?)\s+(\d+)\s*\/\s*(\d+)$/);

  if (!match) {
    return {
      upgradeTrack: normalizedTrack,
      upgradeCurrent: null,
      upgradeMax: null,
    };
  }

  return {
    upgradeTrack: match[1],
    upgradeCurrent: parseInt(match[2], 10),
    upgradeMax: parseInt(match[3], 10),
  };
}

function inferFromBonusIds(bonusIds: number[]): {
  ilvl: number | null;
  upgradeTrack: string | null;
  upgradeCurrent: number | null;
  upgradeMax: number | null;
} {
  for (const bonusId of bonusIds) {
    const legacyMatch = LEGACY_TRACK_BONUS_MAP[bonusId];
    if (legacyMatch) {
      return {
        ilvl: legacyMatch.ilvl ?? null,
        upgradeTrack: legacyMatch.track,
        upgradeCurrent: legacyMatch.current,
        upgradeMax: legacyMatch.max,
      };
    }
  }

  if (bonusIds.includes(12140)) {
    return {
      ilvl: 259,
      upgradeTrack: 'Adventurer',
      upgradeCurrent: 6,
      upgradeMax: 6,
    };
  }

  return {
    ilvl: null,
    upgradeTrack: null,
    upgradeCurrent: null,
    upgradeMax: null,
  };
}

function inferFromDifficulty(
  difficulty: SelectionDifficulty,
  ilvl: number,
): ExportItemMetadata | null {
  const normalizedDifficulty = (difficulty || '').toLowerCase();
  const fallback = KNOWN_DIFFICULTY_TRACK_FALLBACKS[normalizedDifficulty];
  const difficultyBonusIds = KNOWN_DIFFICULTY_BONUS_IDS[normalizedDifficulty];
  const fallbackIlvl = KNOWN_DIFFICULTY_ILVL[normalizedDifficulty] || 0;
  const resolvedIlvl = ilvl || fallbackIlvl;

  if (!fallback || !difficultyBonusIds || resolvedIlvl <= 0) {
    return null;
  }

  return {
    ilvl: resolvedIlvl,
    bonusIds: [...difficultyBonusIds, fallback.bonusId],
    upgradeTrack: fallback.track,
    upgradeCurrent: fallback.current,
    upgradeMax: fallback.max,
  };
}

export function resolveExportItemMetadata(params: {
  difficulty?: SelectionDifficulty;
  ilvl?: number | null;
  bonusIds?: unknown;
  upgradeTrack?: string | null;
}): ExportItemMetadata {
  const bonusIds = normalizeBonusIds(params.bonusIds);
  const parsedTrack = parseUpgradeTrack(params.upgradeTrack);
  const ilvlFromInput = params.ilvl || 0;
  const inferredFromBonusIds = inferFromBonusIds(bonusIds);

  let ilvl = ilvlFromInput || inferredFromBonusIds.ilvl || 0;
  let upgradeTrack =
    parsedTrack.upgradeTrack || inferredFromBonusIds.upgradeTrack || null;
  let upgradeCurrent =
    parsedTrack.upgradeCurrent ?? inferredFromBonusIds.upgradeCurrent ?? null;
  let upgradeMax =
    parsedTrack.upgradeMax ?? inferredFromBonusIds.upgradeMax ?? null;
  let resolvedBonusIds = bonusIds;

  if (
    resolvedBonusIds.length === 0 ||
    !upgradeTrack ||
    upgradeCurrent === null ||
    upgradeMax === null
  ) {
    const inferredFromDifficulty = inferFromDifficulty(params.difficulty, ilvl);
    if (inferredFromDifficulty) {
      ilvl = ilvl || inferredFromDifficulty.ilvl;
      if (resolvedBonusIds.length === 0) {
        resolvedBonusIds = inferredFromDifficulty.bonusIds;
      }
      if (!upgradeTrack) {
        upgradeTrack = inferredFromDifficulty.upgradeTrack;
      }
      if (upgradeCurrent === null) {
        upgradeCurrent = inferredFromDifficulty.upgradeCurrent;
      }
      if (upgradeMax === null) {
        upgradeMax = inferredFromDifficulty.upgradeMax;
      }
    }
  }

  return {
    ilvl,
    bonusIds: resolvedBonusIds,
    upgradeTrack,
    upgradeCurrent,
    upgradeMax,
  };
}
