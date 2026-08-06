import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { fetchCharacterRIO } from '@/shared/integrations/raiderio/raiderio-client';
import type {
  CharacterPerformancePayload,
  PerformanceMetric,
} from '@/domains/stats/types/performance';

const MAIN_CHARACTER_COOKIE = 'artic-tempest-main-character-id';
const WCL_TIMEOUT_MS = 8000;

type CharacterRow = {
  id: string;
  name: string;
  realm: string;
  realm_slug: string | null;
  class_id: number | null;
  level: number | null;
  spec: string | null;
  item_level: number | null;
  thumbnail_url: string | null;
};

function normalizeRealmSlug(realm: string | null | undefined) {
  return (realm ?? '').toLowerCase().trim().replace(/\s+/g, '-');
}

function parseNumericValue(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const compact = raw.replace(/\s+/g, '').trim();
  if (!compact) return null;

  let normalized = compact;

  if (compact.includes('.') && compact.includes(',')) {
    normalized = compact.replace(/,/g, '');
  } else if (compact.includes(',') && !compact.includes('.')) {
    const parts = compact.split(',');
    normalized =
      parts[parts.length - 1]?.length === 3 ? parts.join('') : parts.join('.');
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildMetric(
  label: string,
  scoreRaw: string | undefined,
  rankRaw: string | undefined,
): PerformanceMetric | null {
  const score = parseNumericValue(scoreRaw);
  const rank = parseNumericValue(rankRaw);

  if (score === null && rank === null) {
    return null;
  }

  return { label, score, rank };
}

function extractWclSummary(pageText: string) {
  const text = pageText.replace(/\u00A0/g, ' ');

  const itemLevelMatch = text.match(/Item Level:\s*([0-9][0-9.,]*)/i);
  const itemLevel = parseNumericValue(itemLevelMatch?.[1]);

  const mythicPlusBlock =
    text.match(/Mythic\+\s*Season[\s\S]{0,1200}/i)?.[0] ?? '';
  const mythicPlusLabelMatch = mythicPlusBlock.match(/Season\s*\d+/i);
  const mythicPlusScoreMatch = mythicPlusBlock.match(
    /(?:Season\s*\d+|All Stars)\s*([0-9][0-9.,]*)/i,
  );
  const mythicPlusRankMatch = mythicPlusBlock.match(
    /Rank[\s\S]{0,120}?([0-9][0-9,]*)/i,
  );
  const mythicPlus = buildMetric(
    mythicPlusLabelMatch?.[0] ?? 'Mythic+',
    mythicPlusScoreMatch?.[1],
    mythicPlusRankMatch?.[1],
  );

  const raidAllStarsMatch = text.match(
    /All Stars[\s\S]{0,120}?([0-9][0-9.,]*)[\s\S]{0,180}?Rank[\s\S]{0,120}?([0-9][0-9,]*)/i,
  );
  const raidAllStars = buildMetric(
    'All Stars',
    raidAllStarsMatch?.[1],
    raidAllStarsMatch?.[2],
  );

  const raidProgressionSection =
    text.match(/Raid Progression[\s\S]{0,900}/i)?.[0] ?? '';
  const raidProgressionMatches = Array.from(
    raidProgressionSection.matchAll(
      /(\d+\s*\/\s*\d+\s*(?:Mythic|Heroic|Normal|LFR))/gi,
    ),
  )
    .flatMap((match) => {
      const val = match[1].replace(/\s+/g, ' ').trim();
      return val ? [val] : [];
    });

  const raidProgression = Array.from(new Set(raidProgressionMatches)).slice(
    0,
    6,
  );

  if (
    !itemLevel &&
    !mythicPlus &&
    !raidAllStars &&
    raidProgression.length === 0
  ) {
    return null;
  }

  return {
    itemLevel,
    mythicPlus,
    raidAllStars,
    raidProgression,
  };
}

async function fetchWclCharacterSummary({
  region,
  realmSlug,
  name,
}: {
  region: string;
  realmSlug: string;
  name: string;
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WCL_TIMEOUT_MS);

  try {
    const url = `https://www.warcraftlogs.com/character/${region}/${realmSlug}/${encodeURIComponent(name.toLowerCase())}`;
    const response = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 1800 },
      headers: {
        'User-Agent': 'ArticTempest/1.0 (+https://artictempest.es)',
      },
    });

    if (!response.ok) {
      return null;
    }

    const pageText = await response.text();
    return extractWclSummary(pageText);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function selectRioRaidSummary(rioData: any): string | null {
  const entries = Object.entries(rioData?.raid_progression ?? {});
  if (!entries.length) return null;

  const preferred =
    entries.find(
      ([key]) => key.includes('tier-mn') || key.includes('current'),
    ) ??
    entries.find(([, value]) => typeof (value as any)?.summary === 'string') ??
    entries[0];

  const summary = (preferred?.[1] as any)?.summary;
  return typeof summary === 'string' && summary.trim() ? summary : null;
}

function _blendScore(
  rioMplusScore: number | null,
  wclMplusScore: number | null,
  wclRaidScore: number | null,
) {
  const normalized = [
    rioMplusScore ? rioMplusScore / 10 : null,
    wclMplusScore,
    wclRaidScore,
  ].filter(
    (value): value is number =>
      typeof value === 'number' && Number.isFinite(value),
  );

  if (!normalized.length) return null;

  const avg =
    normalized.reduce((sum, value) => sum + value, 0) / normalized.length;
  return Math.round(avg);
}

export async function getMainCharacterPerformance(
  userId: string,
): Promise<CharacterPerformancePayload | null> {
  const cookieStore = await cookies();
  const cookieMainCharacterId =
    cookieStore.get(MAIN_CHARACTER_COOKIE)?.value ?? null;

  const [{ data: profile }, { data: guild }, { data: characters }] =
    await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select('main_character_id')
        .eq('user_id', userId)
        .maybeSingle() as any,
      supabaseAdmin
        .from('settings')
        .select('region, realm')
        .eq('id', 1)
        .maybeSingle() as any,
      supabaseAdmin
        .from('bnet_characters')
        .select('*')
        .eq('user_id', userId)
        .order('level', { ascending: false })
        .order('name', { ascending: true }) as any,
    ]);

  const myCharacters = ((characters ?? []) as any[]).map(
    (character): CharacterRow => ({
      id: character.id,
      name: character.name,
      realm: character.realm,
      realm_slug: character.realm_slug ?? null,
      class_id: character.class_id ?? null,
      level: character.level ?? null,
      spec: character.spec ?? character.spec_name ?? null,
      item_level:
        typeof character.item_level === 'number' ? character.item_level : null,
      thumbnail_url: character.thumbnail_url ?? null,
    }),
  );
  if (!myCharacters.length) return null;

  const preferredMainCharacterId =
    profile?.main_character_id || cookieMainCharacterId || null;

  const selectedCharacter =
    myCharacters.find(
      (character) => character.id === preferredMainCharacterId,
    ) ??
    myCharacters.find(
      (character) => character.id === profile?.main_character_id,
    ) ??
    myCharacters[0] ??
    null;

  if (!selectedCharacter) return null;

  const region = (guild?.region?.toLowerCase() ?? 'eu') as string;
  const realmSlug = normalizeRealmSlug(
    selectedCharacter.realm_slug || selectedCharacter.realm || guild?.realm,
  );

  if (!realmSlug || !selectedCharacter.name) return null;

  const [rioData, wclData] = await Promise.all([
    fetchCharacterRIO(selectedCharacter.name, realmSlug, region),
    fetchWclCharacterSummary({
      region,
      realmSlug,
      name: selectedCharacter.name,
    }),
  ]);

  const rioMplusScore =
    rioData?.mythic_plus_scores_by_season?.[0]?.scores?.all ?? null;
  const rioMplusColor =
    rioData?.mythic_plus_scores_by_season?.[0]?.segments?.all?.color ?? null;
  const rioRaidSummary = selectRioRaidSummary(rioData);

  const itemLevel =
    wclData?.itemLevel ??
    parseNumericValue(rioData?.gear?.item_level_equipped?.toString()) ??
    selectedCharacter.item_level ??
    null;

  return {
    character: {
      id: selectedCharacter.id,
      name: selectedCharacter.name,
      realm: selectedCharacter.realm,
      realmSlug,
      region,
      className:
        rioData?.class ??
        (selectedCharacter.class_id
          ? String(selectedCharacter.class_id)
          : null),
      specName: rioData?.active_spec_name ?? selectedCharacter.spec ?? null,
      itemLevel,
    },
    links: {
      raiderIo: `https://raider.io/characters/${region}/${realmSlug}/${encodeURIComponent(selectedCharacter.name)}`,
      warcraftLogs: `https://www.warcraftlogs.com/character/${region}/${realmSlug}/${encodeURIComponent(selectedCharacter.name.toLowerCase())}`,
    },
    rio: rioData
      ? {
          mythicPlusScore: rioMplusScore,
          mythicPlusColor: rioMplusColor,
          raidProgression: rioRaidSummary,
        }
      : null,
    wcl: wclData
      ? {
          itemLevel: wclData.itemLevel,
          mythicPlus: wclData.mythicPlus,
          raidAllStars: wclData.raidAllStars,
          raidProgression: wclData.raidProgression,
        }
      : null,
  };
}
