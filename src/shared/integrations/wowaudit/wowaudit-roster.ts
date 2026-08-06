import { normalizeRosterRole } from "@/shared/lib/roster-role";
import { normalizeText } from "@/shared/integrations/wowaudit/wowaudit-client";
import {
  type WowauditRankRow,
  resolveWowauditRank,
} from "@/shared/integrations/wowaudit/wowaudit-ranks";

export { resolveWowauditRank };

type ExistingGuildMember = {
  id: string;
  wowaudit_character_id?: string | number | null;
  wowaudit_rank_name?: string | null;
  character_name: string;
  realm_slug: string;
  rank: number;
  level?: number | null;
  race_id?: number | null;
  role?: string | null;
  note?: string | null;
};

export function slugifyRealm(value: string) {
  return normalizeText(value).replace(/\s+/g, "-");
}

export function resolveWowauditClassId(
  className: string | null | undefined,
  classIdByName: Record<string, number>,
) {
  const normalized = normalizeText(className);
  if (!normalized) return null;

  const CLASS_ALIASES: Record<string, number> = {
    warrior: 1,
    guerrero: 1,
    paladin: 2,
    hunter: 3,
    cazador: 3,
    rogue: 4,
    picaro: 4,
    priest: 5,
    sacerdote: 5,
    "death knight": 6,
    "caballero de la muerte": 6,
    shaman: 7,
    chaman: 7,
    mage: 8,
    mago: 8,
    warlock: 9,
    brujo: 9,
    monk: 10,
    monje: 10,
    druid: 11,
    druida: 11,
    "demon hunter": 12,
    "cazador de demonios": 12,
    evoker: 13,
    evocador: 13,
  };

  return classIdByName[normalized] ?? CLASS_ALIASES[normalized] ?? null;
}

export function buildWowauditRosterRows(params: {
  characters: Array<{
    id: number;
    name: string;
    realm: string;
    class: string | null;
    role: string | null;
    rank: string | null;
    note?: string | null;
  }>;
  existingMembers: ExistingGuildMember[];
  classIdByName: Record<string, number>;
  wowauditRanks: WowauditRankRow[];
  syncedAt: string;
  defaultLevel?: number;
}) {
  const existingMap = new Map(
    params.existingMembers.map((member) => [
      `${normalizeText(member.character_name)}:${normalizeText(member.realm_slug)}`,
      member,
    ]),
  );

  return params.characters.map((character) => {
    const realmSlug = slugifyRealm(character.realm);
    const key = `${normalizeText(character.name)}:${normalizeText(realmSlug)}`;
    const existing = existingMap.get(key);

    return {
      character_name: character.name.trim(),
      wowaudit_character_id: character.id,
      wowaudit_rank_name: character.rank,
      realm_slug: realmSlug,
      realm_name: character.realm.trim() || null,
      class_id: resolveWowauditClassId(character.class, params.classIdByName),
      race_id: existing?.race_id ?? null,
      level: existing?.level ?? params.defaultLevel ?? 80,
      rank: resolveWowauditRank(character.rank, {
        existingRank: existing?.rank,
        ranks: params.wowauditRanks,
      }),
      role: normalizeRosterRole(character.role) || existing?.role || null,
      note: existing?.note ?? character.note ?? null,
      synced_at: params.syncedAt,
    };
  });
}
