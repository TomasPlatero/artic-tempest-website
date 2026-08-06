import type { RaidProgression } from '@/shared/integrations/raiderio/raiderio-client';

type RecruitmentRaidConfig = {
  name: string;
  seasonLabel: string;
  sortOrder: number;
  groups: string[];
};

export const RECRUITMENT_RAID_CONFIG: Record<string, RecruitmentRaidConfig> = {
  'tier-mn-1': {
    name: 'Midnight',
    seasonLabel: 'Midnight S1',
    sortOrder: 350,
    groups: ['midnight'],
  },
  sporefall: {
    name: 'Sporefall',
    seasonLabel: 'Midnight S1',
    sortOrder: 349,
    groups: ['midnight'],
  },
  voidspire: {
    name: 'Voidspire',
    seasonLabel: 'Midnight S2',
    sortOrder: 348,
    groups: ['midnight'],
  },
  dreamrift: {
    name: 'Dreamrift',
    seasonLabel: 'Midnight S3',
    sortOrder: 347,
    groups: ['midnight'],
  },
  'march-on-queldanas': {
    name: "March on Quel'Danas",
    seasonLabel: 'Midnight S4',
    sortOrder: 346,
    groups: ['midnight'],
  },
  'manaforge-omega': {
    name: 'Manaforge Omega',
    seasonLabel: 'The War Within S3',
    sortOrder: 340,
    groups: ['tww'],
  },
  'liberation-of-undermine': {
    name: 'Liberation of Undermine',
    seasonLabel: 'The War Within S2',
    sortOrder: 330,
    groups: ['tww'],
  },
  'blackrock-depths': {
    name: 'Blackrock Depths',
    seasonLabel: 'The War Within S2',
    sortOrder: 329,
    groups: ['tww'],
  },
  'nerubar-palace': {
    name: 'Nerub-ar Palace',
    seasonLabel: 'The War Within S1',
    sortOrder: 320,
    groups: ['tww'],
  },
  'amirdrassil-the-dreams-hope': {
    name: 'Amirdrassil',
    seasonLabel: 'Dragonflight S3',
    sortOrder: 310,
    groups: ['dragonflight'],
  },
  'aberrus-the-shadowed-crucible': {
    name: 'Aberrus',
    seasonLabel: 'Dragonflight S2',
    sortOrder: 300,
    groups: ['dragonflight'],
  },
  'vault-of-the-incarnates': {
    name: 'Vault of the Incarnates',
    seasonLabel: 'Dragonflight S1',
    sortOrder: 290,
    groups: ['dragonflight'],
  },
  'sepulcher-of-the-first-ones': {
    name: 'Sepulcher of the First Ones',
    seasonLabel: 'Shadowlands S3',
    sortOrder: 280,
    groups: ['shadowlands'],
  },
  'sanctum-of-domination': {
    name: 'Sanctum of Domination',
    seasonLabel: 'Shadowlands S2',
    sortOrder: 270,
    groups: ['shadowlands'],
  },
  'castle-nathria': {
    name: 'Castle Nathria',
    seasonLabel: 'Shadowlands S1',
    sortOrder: 260,
    groups: ['shadowlands'],
  },
  'nyalotha-the-waking-city': {
    name: "Ny'alotha",
    seasonLabel: 'Battle for Azeroth S4',
    sortOrder: 250,
    groups: ['bfa'],
  },
  'the-eternal-palace': {
    name: 'The Eternal Palace',
    seasonLabel: 'Battle for Azeroth S3',
    sortOrder: 240,
    groups: ['bfa'],
  },
  'crucible-of-storms': {
    name: 'Crucible of Storms',
    seasonLabel: 'Battle for Azeroth S2',
    sortOrder: 230,
    groups: ['bfa'],
  },
  'battle-of-dazaralor': {
    name: 'Battle of Dazar\'alor',
    seasonLabel: 'Battle for Azeroth S2',
    sortOrder: 229,
    groups: ['bfa'],
  },
  uldir: {
    name: 'Uldir',
    seasonLabel: 'Battle for Azeroth S1',
    sortOrder: 220,
    groups: ['bfa'],
  },
};

type RaidProgressionMap = Record<string, RaidProgression>;

function humanizeRaidSlug(slug: string) {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getSeasonGroup(seasonId: string) {
  const normalized = seasonId.toLowerCase();

  if (
    normalized === 'current' ||
    normalized === 'previous' ||
    normalized.includes('mn') ||
    normalized.includes('midnight')
  ) {
    return 'midnight';
  }

  if (normalized.includes('tww') || normalized.includes('war-within')) {
    return 'tww';
  }

  if (normalized.includes('df') || normalized.includes('dragonflight')) {
    return 'dragonflight';
  }

  if (normalized.includes('sl') || normalized.includes('shadowlands')) {
    return 'shadowlands';
  }

  if (normalized.includes('bfa')) {
    return 'bfa';
  }

  return 'other';
}

function getRaidSeasonLabelFromSeasonId(seasonId: string) {
  const normalized = seasonId.toLowerCase();

  if (normalized === 'current' || normalized === 'previous') {
    return 'Midnight S1';
  }

  const match = normalized.match(/^season-([a-z]+)-(\d+)$/);
  if (!match) return null;

  const [, expansion, seasonNumber] = match;
  const labels: Record<string, string> = {
    mn: 'Midnight',
    tww: 'The War Within',
    df: 'Dragonflight',
    sl: 'Shadowlands',
    bfa: 'Battle for Azeroth',
  };

  const expansionLabel = labels[expansion];
  if (!expansionLabel) return null;

  return `${expansionLabel} S${seasonNumber}`;
}

function getRaidSortOrder(slug: string) {
  return RECRUITMENT_RAID_CONFIG[slug]?.sortOrder ?? 0;
}

export function getRecruitmentRaidName(slug: string) {
  return RECRUITMENT_RAID_CONFIG[slug]?.name ?? humanizeRaidSlug(slug);
}

export function getRecruitmentRaidSeasonLabel(slug: string) {
  return RECRUITMENT_RAID_CONFIG[slug]?.seasonLabel ?? humanizeRaidSlug(slug);
}

export function formatRecruitmentRaidSummary(raid: RaidProgression) {
  const summary = raid.summary?.trim();
  if (summary) return summary;
  return `0/${raid.total_bosses ?? 0} N`;
}

function isMeaningfulRecruitmentRaid(raid: RaidProgression) {
  return Boolean(raid.summary?.trim()) ||
    raid.mythic_bosses_killed > 0 ||
    raid.heroic_bosses_killed > 0 ||
    raid.normal_bosses_killed > 0;
}

export function getRecruitmentDiscordRaidProgress(
  raidProgression?: RaidProgressionMap | null,
) {
  const entries = Object.entries(raidProgression ?? {}) as Array<
    [string, RaidProgression]
  >;

  if (!entries.length) return 'N/A';

  const meaningfulEntries = entries.filter(([, raid]) =>
    isMeaningfulRecruitmentRaid(raid),
  );

  const sortedEntries = (meaningfulEntries.length ? meaningfulEntries : entries)
    .sort(([leftSlug], [rightSlug]) => getRaidSortOrder(rightSlug) - getRaidSortOrder(leftSlug));

  const latestSeasonLabel = sortedEntries[0]
    ? getRecruitmentRaidSeasonLabel(sortedEntries[0][0])
    : null;

  const visibleEntries = latestSeasonLabel
    ? sortedEntries.filter(
        ([slug]) => getRecruitmentRaidSeasonLabel(slug) === latestSeasonLabel,
      )
    : sortedEntries;

  return visibleEntries
    .map(
      ([slug, raid]) =>
        `${getRecruitmentRaidSeasonLabel(slug)} • ${getRecruitmentRaidName(slug)}: ${formatRecruitmentRaidSummary(raid)}`,
    )
    .join('\n');
}

export function getRecruitmentRaidsForSeason(
  raidProgression: RaidProgressionMap | undefined | null,
  seasonId: string,
) {
  const seasonGroup = getSeasonGroup(seasonId);
  const seasonLabel = getRaidSeasonLabelFromSeasonId(seasonId);
  const entries = Object.entries(raidProgression ?? {}) as Array<
    [string, RaidProgression]
  >;

  const exactLabelMatches = seasonLabel
    ? entries.filter(([slug]) => {
        const config = RECRUITMENT_RAID_CONFIG[slug];
        return config?.seasonLabel === seasonLabel;
      })
    : [];

  if (exactLabelMatches.length > 0) {
    return exactLabelMatches.sort(
      ([leftSlug], [rightSlug]) =>
        getRaidSortOrder(rightSlug) - getRaidSortOrder(leftSlug),
    );
  }

  return entries
    .filter(([slug]) => {
      const config = RECRUITMENT_RAID_CONFIG[slug];
      if (!config) return false;

      const groupSet = new Set(config.groups);
      return groupSet.has(seasonGroup);
    })
    .sort(([leftSlug], [rightSlug]) => getRaidSortOrder(rightSlug) - getRaidSortOrder(leftSlug));
}
