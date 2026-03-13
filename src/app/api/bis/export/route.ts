import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/auth/auth-options';

// We make this route fully public and dynamic because it's called from a raw script
export const dynamic = 'force-dynamic';

function getDifficultySuffix(difficulty: string | null | undefined) {
  switch (String(difficulty || '').toLowerCase()) {
    case 'mythic':
      return 'M';
    case 'heroic':
      return 'H';
    case 'normal':
      return 'N';
    case 'lfr':
      return 'L';
    default:
      return '';
  }
}

function normalizeBonusIds(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const ids = value
    .map((entry) => Number(entry))
    .filter((entry) => Number.isFinite(entry) && entry > 0);

  if (ids.length === 0) {
    return undefined;
  }

  return ids.join(':');
}

export async function GET() {
  try {
    // Build a set of all valid item IDs currently stored in the active loot table.
    // The old bnet_* cache may not exist anymore in this project state.
    const { data: trackedItems, error: itemsErr } = await supabaseAdmin
      .from('items')
      .select('bnet_item_id,difficulty,item_level');

    if (itemsErr) throw itemsErr;

    const validItemIds = new Set<number>();
    const itemLevelMap = new Map<string, number>();
    trackedItems?.forEach((item) => {
      const id = Number(item.bnet_item_id);
      if (!Number.isNaN(id) && id > 0) {
        validItemIds.add(id);
        const difficulty = String(item.difficulty || '').toLowerCase();
        const itemLevel = Number(item.item_level || 0);
        if (difficulty && itemLevel > 0) {
          itemLevelMap.set(`${id}:${difficulty}`, itemLevel);
        }
      }
    });
    const hasTrackedLoot = validItemIds.size > 0;

    // Fetch all members with valid realms
    const { data: members, error: membersError } = await supabaseAdmin
      .from('guild_members')
      .select('id, character_name, realm_slug');

    if (membersError) throw membersError;

    // Fetch all BiS selections
    const { data: selections, error: selectionsError } = await supabaseAdmin
      .from('bis_selections')
      .select('member_id, item_id, difficulty, ilvl, bonus_ids, priority');

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
    const exportData: Record<
      string,
      Record<
        string,
        { isBis: boolean; ilvl?: number; bonusIds?: string; priority?: number }
      >
    > = {};

    selections?.forEach((selection) => {
      const itemId = parseInt(selection.item_id, 10);

      // If legacy loot cache is empty, don't silently drop every current selection.
      if (hasTrackedLoot && !validItemIds.has(itemId)) return;

      const memberKey = memberMap.get(selection.member_id);
      if (!memberKey) return;

      if (!exportData[memberKey]) {
        exportData[memberKey] = {};
      }

      const suffix = getDifficultySuffix(selection.difficulty);

      const keyWithSuffix = `${selection.item_id}${suffix}`;
      const fallbackIlvl =
        itemLevelMap.get(
          `${itemId}:${String(selection.difficulty || '').toLowerCase()}`,
        ) || 0;
      const exportEntry: {
        isBis: boolean;
        ilvl?: number;
        bonusIds?: string;
        priority?: number;
      } = {
        isBis: true,
      };

      const resolvedIlvl = Number(selection.ilvl || 0) || fallbackIlvl;
      if (resolvedIlvl > 0) {
        exportEntry.ilvl = resolvedIlvl;
      }

      const bonusIds = normalizeBonusIds(selection.bonus_ids);
      if (bonusIds) {
        exportEntry.bonusIds = bonusIds;
      }

      const priority = Number(selection.priority || 0);
      if (priority > 0) {
        exportEntry.priority = priority;
      }

      exportData[memberKey][keyWithSuffix] = exportEntry;
    });

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
