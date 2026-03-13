import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/auth/auth-options';
import {
  parseUpgradeTrack,
  resolveExportItemMetadata,
} from '@/domains/bis/lib/export-item-metadata';

// We make this route fully public and dynamic because it's called from a raw script
export const dynamic = 'force-dynamic';

type ExportedWishlistItem = {
  isBis: boolean;
  ilvl: number;
  priority: number;
  quality: string | null;
  bonusIds: number[];
  upgradeTrack: string | null;
  upgradeCurrent: number | null;
  upgradeMax: number | null;
};

const BOSS_UPGRADE_STEP: Record<string, number> = {
  'imperator averzian': 1,
  vorasius: 2,
  'fallen-king salhadaar': 2,
  'rey caido salhadaar': 2,
  'rey caído salhadaar': 2,
  'chimaerus the undreamt god': 2,
  'chimaerus, el dios no sonado': 2,
  'chimaerus, el dios no soñado': 2,
  'vaelgor & ezzorak': 3,
  'vaelgor y ezzorak': 3,
  'lightblinded vanguard': 3,
  'vanguardia cegada por la luz': 3,
  "belo'ren, child of al'ar": 3,
  "belo'ren, vastago de al'ar": 3,
  "belo'ren, vástago de al'ar": 3,
  'crown of the cosmos': 4,
  'corona del cosmos': 4,
  "l'ura": 4,
  "caida de medianoche (l'ura)": 4,
  "caída de medianoche (l'ura)": 4,
};

function normalizeBossKey(value: string | null | undefined) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function getExportUpgradeTrackLabel(difficulty: string | null | undefined) {
  switch (String(difficulty || '').toLowerCase()) {
    case 'normal':
      return 'Campeon';
    case 'heroic':
      return 'Heroico';
    case 'mythic':
      return 'Mitico';
    case 'lfr':
      return 'Buscador';
    default:
      return null;
  }
}

function getDifficultyBonusIds(
  difficulty: string | null | undefined,
  ilvl: number,
) {
  const normalizedDifficulty = String(difficulty || '').toLowerCase();
  const steps: Record<string, Array<{ ilvl: number; bonusId: number }>> = {
    normal: [
      { ilvl: 246, bonusId: 12785 },
      { ilvl: 249, bonusId: 12786 },
      { ilvl: 252, bonusId: 12787 },
      { ilvl: 256, bonusId: 12788 },
      { ilvl: 259, bonusId: 12789 },
      { ilvl: 262, bonusId: 12790 },
    ],
    heroic: [
      { ilvl: 259, bonusId: 12793 },
      { ilvl: 262, bonusId: 12794 },
      { ilvl: 265, bonusId: 12795 },
      { ilvl: 269, bonusId: 12796 },
      { ilvl: 272, bonusId: 12797 },
      { ilvl: 275, bonusId: 12798 },
    ],
    mythic: [
      { ilvl: 272, bonusId: 12801 },
      { ilvl: 275, bonusId: 12802 },
      { ilvl: 278, bonusId: 12803 },
      { ilvl: 282, bonusId: 12804 },
      { ilvl: 285, bonusId: 12805 },
      { ilvl: 288, bonusId: 12806 },
    ],
  };

  const match = steps[normalizedDifficulty]?.find((step) => step.ilvl === ilvl);
  return match ? [match.bonusId] : undefined;
}

function getDifficultyUpgradeStep(
  difficulty: string | null | undefined,
  ilvl: number,
) {
  const normalizedDifficulty = String(difficulty || '').toLowerCase();
  const steps: Record<
    string,
    Array<{ ilvl: number; current: number; max: number }>
  > = {
    normal: [
      { ilvl: 246, current: 1, max: 6 },
      { ilvl: 249, current: 2, max: 6 },
      { ilvl: 252, current: 3, max: 6 },
      { ilvl: 256, current: 4, max: 6 },
      { ilvl: 259, current: 5, max: 6 },
      { ilvl: 262, current: 6, max: 6 },
    ],
    heroic: [
      { ilvl: 259, current: 1, max: 6 },
      { ilvl: 262, current: 2, max: 6 },
      { ilvl: 265, current: 3, max: 6 },
      { ilvl: 269, current: 4, max: 6 },
      { ilvl: 272, current: 5, max: 6 },
      { ilvl: 275, current: 6, max: 6 },
    ],
    mythic: [
      { ilvl: 272, current: 1, max: 6 },
      { ilvl: 275, current: 2, max: 6 },
      { ilvl: 278, current: 3, max: 6 },
      { ilvl: 282, current: 4, max: 6 },
      { ilvl: 285, current: 5, max: 6 },
      { ilvl: 288, current: 6, max: 6 },
    ],
  };

  return (
    steps[normalizedDifficulty]?.find((step) => step.ilvl === ilvl) || null
  );
}

function getDifficultyBaseIlvl(difficulty: string | null | undefined) {
  switch (String(difficulty || '').toLowerCase()) {
    case 'normal':
      return 246;
    case 'heroic':
      return 259;
    case 'mythic':
      return 272;
    default:
      return 0;
  }
}

function getBossBasedUpgrade(
  difficulty: string | null | undefined,
  bossName: string | null | undefined,
) {
  const step = BOSS_UPGRADE_STEP[normalizeBossKey(bossName)];
  const baseIlvl = getDifficultyBaseIlvl(difficulty);
  const upgradeTrack = getExportUpgradeTrackLabel(difficulty);

  if (!step || !baseIlvl || !upgradeTrack) {
    return null;
  }

  const ilvl = baseIlvl + (step - 1) * 3;
  return {
    ilvl,
    bonusIds: getDifficultyBonusIds(difficulty, ilvl) || [],
    upgradeTrack,
    upgradeCurrent: step,
    upgradeMax: 6,
  };
}

export async function GET() {
  try {
    // Build a set of all valid item IDs currently stored in the active loot table.
    const { data: trackedItems, error: trackedItemsError } = await supabaseAdmin
      .from('items')
      .select(
        'bnet_item_id, difficulty, item_level, quality_type, boss_drops(bosses(name))',
      );

    if (trackedItemsError) throw trackedItemsError;

    const validItemIds = new Set<number>();
    const itemMetadataByDifficulty = new Map<
      string,
      { itemLevel: number; quality: string | null; bossName: string | null }
    >();

    trackedItems?.forEach((item: any) => {
      const itemId = Number(item.bnet_item_id);
      if (!Number.isFinite(itemId) || itemId <= 0) return;

      validItemIds.add(itemId);

      const difficulty = String(item.difficulty || '').toLowerCase();
      if (!difficulty) return;

      itemMetadataByDifficulty.set(`${itemId}:${difficulty}`, {
        itemLevel: Number(item.item_level || 0),
        quality: item.quality_type || null,
        bossName: Array.isArray(item.boss_drops?.[0]?.bosses)
          ? item.boss_drops?.[0]?.bosses?.[0]?.name || null
          : item.boss_drops?.[0]?.bosses?.name || null,
      });
    });

    // Fetch all members with valid realms
    const { data: members, error: membersError } = await supabaseAdmin
      .from('guild_members')
      .select('id, character_name, realm_slug');

    if (membersError) throw membersError;

    // Fetch all BiS selections
    const { data: selections, error: selectionsError } = await supabaseAdmin
      .from('bis_selections')
      .select(
        'id, member_id, item_id, difficulty, ilvl, priority, bonus_ids, upgrade_track',
      );

    if (selectionsError) throw selectionsError;

    // Map members by ID for easy lookup
    const memberMap = new Map();
    members?.forEach((m) => {
      if (m.character_name && m.realm_slug) {
        const realm = m.realm_slug
          .split('-')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join('');
        memberMap.set(m.id, `${m.character_name}-${realm}`);
      }
    });

    // Build the output JSON format
    const timestamp = Math.floor(Date.now() / 1000);
    const exportData: Record<string, Record<string, ExportedWishlistItem>> = {};
    const rowsToBackfill: Array<{
      id: string;
      ilvl: number;
      bonus_ids: number[];
      upgrade_track: string | null;
    }> = [];

    selections?.forEach((selection) => {
      const itemId = parseInt(selection.item_id, 10);

      // Only export items that we track (which means they are from valid raids we synced)
      if (!validItemIds.has(itemId)) return;

      const memberKey = memberMap.get(selection.member_id);
      if (!memberKey) return;

      if (!exportData[memberKey]) {
        exportData[memberKey] = {};
      }

      let suffix = '';
      if (selection.difficulty === 'mythic') {
        suffix = 'M';
      } else if (selection.difficulty === 'heroic') {
        suffix = 'H';
      } else if (selection.difficulty === 'normal') {
        suffix = 'N';
      } else if (selection.difficulty === 'lfr') {
        suffix = 'L';
      }

      const trackedMetadata = itemMetadataByDifficulty.get(
        `${itemId}:${String(selection.difficulty || '').toLowerCase()}`,
      );

      const metadata = resolveExportItemMetadata({
        difficulty: selection.difficulty,
        ilvl: selection.ilvl,
        bonusIds: selection.bonus_ids,
        upgradeTrack: selection.upgrade_track,
      });
      const bossBasedUpgrade = getBossBasedUpgrade(
        selection.difficulty,
        trackedMetadata?.bossName,
      );

      const formattedTrack =
        metadata.upgradeTrack &&
        metadata.upgradeCurrent !== null &&
        metadata.upgradeMax !== null
          ? `${metadata.upgradeTrack} ${metadata.upgradeCurrent}/${metadata.upgradeMax}`
          : metadata.upgradeTrack;

      const parsedTrack = parseUpgradeTrack(formattedTrack);
      const resolvedIlvl =
        bossBasedUpgrade?.ilvl ||
        metadata.ilvl ||
        trackedMetadata?.itemLevel ||
        0;
      const difficultyUpgradeStep = getDifficultyUpgradeStep(
        selection.difficulty,
        resolvedIlvl,
      );
      const fallbackBonusIds =
        bossBasedUpgrade?.bonusIds ||
        getDifficultyBonusIds(selection.difficulty, resolvedIlvl) ||
        (metadata.bonusIds.length > 0 ? metadata.bonusIds : []);
      const fallbackUpgradeTrack =
        bossBasedUpgrade?.upgradeTrack ||
        getExportUpgradeTrackLabel(selection.difficulty) ||
        parsedTrack.upgradeTrack;
      const fallbackUpgradeCurrent =
        bossBasedUpgrade?.upgradeCurrent ??
        difficultyUpgradeStep?.current ??
        parsedTrack.upgradeCurrent ??
        metadata.upgradeCurrent;
      const fallbackUpgradeMax =
        bossBasedUpgrade?.upgradeMax ??
        difficultyUpgradeStep?.max ??
        parsedTrack.upgradeMax ??
        metadata.upgradeMax;

      if (
        selection.id &&
        ((selection.ilvl || 0) !== metadata.ilvl ||
          JSON.stringify(selection.bonus_ids || []) !==
            JSON.stringify(metadata.bonusIds) ||
          selection.upgrade_track !== formattedTrack)
      ) {
        rowsToBackfill.push({
          id: selection.id,
          ilvl: metadata.ilvl,
          bonus_ids: metadata.bonusIds,
          upgrade_track: formattedTrack || null,
        });
      }

      const keyWithSuffix = `${selection.item_id}${suffix}`;
      exportData[memberKey][keyWithSuffix] = {
        isBis: true,
        ilvl: resolvedIlvl,
        priority: selection.priority ?? 2,
        quality: trackedMetadata?.quality || 'epic',
        bonusIds: fallbackBonusIds,
        upgradeTrack: fallbackUpgradeTrack,
        upgradeCurrent: fallbackUpgradeCurrent,
        upgradeMax: fallbackUpgradeMax,
      };
    });

    if (rowsToBackfill.length > 0) {
      await Promise.all(
        rowsToBackfill.map((row) =>
          supabaseAdmin
            .from('bis_selections')
            .update({
              ilvl: row.ilvl,
              bonus_ids: row.bonus_ids,
              upgrade_track: row.upgrade_track,
            })
            .eq('id', row.id),
        ),
      );
    }

    const finalOutput = {
      schemaVersion: 1,
      timestamp,
      data: exportData,
    };

    return NextResponse.json(finalOutput, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=0, max-age=0, must-revalidate',
      },
    });
  } catch (e: any) {
    console.error('BiS Export API Error:', e.message);
    return new NextResponse(`Error interno: ${e.message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
