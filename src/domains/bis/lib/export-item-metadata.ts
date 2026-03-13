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
  12785: { track: 'Campeon', current: 1, max: 6, ilvl: 246 },
  12786: { track: 'Campeon', current: 2, max: 6, ilvl: 249 },
  12787: { track: 'Campeon', current: 3, max: 6, ilvl: 252 },
  12788: { track: 'Campeon', current: 4, max: 6, ilvl: 256 },
  12789: { track: 'Campeon', current: 5, max: 6, ilvl: 259 },
  12790: { track: 'Campeon', current: 6, max: 6, ilvl: 262 },
  12793: { track: 'Heroico', current: 1, max: 6, ilvl: 259 },
  12794: { track: 'Heroico', current: 2, max: 6, ilvl: 262 },
  12795: { track: 'Heroico', current: 3, max: 6, ilvl: 265 },
  12796: { track: 'Heroico', current: 4, max: 6, ilvl: 269 },
  12797: { track: 'Heroico', current: 5, max: 6, ilvl: 272 },
  12798: { track: 'Heroico', current: 6, max: 6, ilvl: 275 },
  12801: { track: 'Mitico', current: 1, max: 6, ilvl: 272 },
  12802: { track: 'Mitico', current: 2, max: 6, ilvl: 275 },
  12803: { track: 'Mitico', current: 3, max: 6, ilvl: 278 },
  12804: { track: 'Mitico', current: 4, max: 6, ilvl: 282 },
  12805: { track: 'Mitico', current: 5, max: 6, ilvl: 285 },
  12806: { track: 'Mitico', current: 6, max: 6, ilvl: 288 },
};

const DIFFICULTY_TRACK_STEPS: Record<
  string,
  {
    track: string;
    steps: Array<{ current: number; ilvl: number; bonusId: number }>;
  }
> = {
  normal: {
    track: 'Campeon',
    steps: [
      { current: 1, ilvl: 246, bonusId: 12785 },
      { current: 2, ilvl: 249, bonusId: 12786 },
      { current: 3, ilvl: 252, bonusId: 12787 },
      { current: 4, ilvl: 256, bonusId: 12788 },
      { current: 5, ilvl: 259, bonusId: 12789 },
      { current: 6, ilvl: 262, bonusId: 12790 },
    ],
  },
  heroic: {
    track: 'Heroico',
    steps: [
      { current: 1, ilvl: 259, bonusId: 12793 },
      { current: 2, ilvl: 262, bonusId: 12794 },
      { current: 3, ilvl: 265, bonusId: 12795 },
      { current: 4, ilvl: 269, bonusId: 12796 },
      { current: 5, ilvl: 272, bonusId: 12797 },
      { current: 6, ilvl: 275, bonusId: 12798 },
    ],
  },
  mythic: {
    track: 'Mitico',
    steps: [
      { current: 1, ilvl: 272, bonusId: 12801 },
      { current: 2, ilvl: 275, bonusId: 12802 },
      { current: 3, ilvl: 278, bonusId: 12803 },
      { current: 4, ilvl: 282, bonusId: 12804 },
      { current: 5, ilvl: 285, bonusId: 12805 },
      { current: 6, ilvl: 288, bonusId: 12806 },
    ],
  },
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
  const trackData = DIFFICULTY_TRACK_STEPS[normalizedDifficulty];

  if (!trackData) {
    return null;
  }

  const resolvedIlvl = ilvl || trackData.steps[0]?.ilvl || 0;
  if (resolvedIlvl <= 0) {
    return null;
  }

  const matchedStep =
    trackData.steps.find((step) => step.ilvl === resolvedIlvl) ||
    trackData.steps[0];

  return {
    ilvl: resolvedIlvl,
    bonusIds: [matchedStep.bonusId],
    upgradeTrack: trackData.track,
    upgradeCurrent: matchedStep.current,
    upgradeMax: 6,
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
