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

export async function GET() {
  try {
    // Build a set of all valid Item IDs currently stored in our Battle.net cache
    const { data: encounterLoot, error: lootErr } = await supabaseAdmin
      .from('bnet_encounter_loot')
      .select('item_id');

    if (lootErr) throw lootErr;

    const validItemIds = new Set<number>();
    encounterLoot?.forEach((l) => validItemIds.add(l.item_id));

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

    const itemIds = Array.from(
      new Set((selections || []).map((selection) => Number(selection.item_id))),
    ).filter((itemId) => Number.isFinite(itemId));

    const { data: cachedItems, error: cachedItemsError } = await supabaseAdmin
      .from('bnet_items')
      .select('id, quality')
      .in('id', itemIds);

    if (cachedItemsError) throw cachedItemsError;

    const itemMetadataMap = new Map<number, { quality: string | null }>();
    cachedItems?.forEach((item) => {
      itemMetadataMap.set(Number(item.id), {
        quality: item.quality || null,
      });
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

      // Append difficulty suffix: N (Normal), H (Heroic), M (Mythic)
      let suffix = '';
      if (selection.difficulty === 'mythic') {
        suffix = 'M';
      } else if (selection.difficulty === 'heroic') {
        suffix = 'H';
      } else if (selection.difficulty === 'normal') {
        suffix = 'N';
      }

      const metadata = resolveExportItemMetadata({
        difficulty: selection.difficulty,
        ilvl: selection.ilvl,
        bonusIds: selection.bonus_ids,
        upgradeTrack: selection.upgrade_track,
      });

      const formattedTrack =
        metadata.upgradeTrack &&
        metadata.upgradeCurrent !== null &&
        metadata.upgradeMax !== null
          ? `${metadata.upgradeTrack} ${metadata.upgradeCurrent}/${metadata.upgradeMax}`
          : metadata.upgradeTrack;

      const parsedTrack = parseUpgradeTrack(formattedTrack);
      const fallbackBonusIds =
        metadata.bonusIds.length > 0
          ? metadata.bonusIds
          : selection.difficulty === 'heroic' && metadata.ilvl === 259
            ? [12250, 12112, 12140]
            : [];
      const fallbackUpgradeTrack =
        parsedTrack.upgradeTrack ||
        (selection.difficulty === 'heroic' && metadata.ilvl === 259
          ? 'Adventurer'
          : null);
      const fallbackUpgradeCurrent =
        parsedTrack.upgradeCurrent ??
        (selection.difficulty === 'heroic' && metadata.ilvl === 259 ? 6 : null);
      const fallbackUpgradeMax =
        parsedTrack.upgradeMax ??
        (selection.difficulty === 'heroic' && metadata.ilvl === 259 ? 6 : null);

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
        ilvl: metadata.ilvl,
        priority: selection.priority ?? 2,
        quality: itemMetadataMap.get(itemId)?.quality || 'EPIC',
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
