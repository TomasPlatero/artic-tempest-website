// src/domains/bis/lib/wishlist-service.ts
import { supabaseAdmin } from '@/shared/auth/auth-options';
import { RaidbotsParserService } from './raidbots-parser-service';
import { ItemFilterService } from './item-filter-service';
import {
  fetchCharacterEquipment,
  fetchItemData,
} from '@/shared/integrations/bnet/bnet-client';
import { WishlistItem, Wishlist, WoWItem } from './types';

export class WishlistService {
  /**
   * Creates or updates a wishlist from a Raidbots report URL.
   */
  static async importFromRaidbots(
    memberId: string,
    raidbotsUrl: string,
  ): Promise<Wishlist> {
    // 1. Fetch Report Data
    const reportId = raidbotsUrl.match(/report\/([a-zA-Z0-9]+)/)?.[1];
    if (!reportId) throw new Error('Invalid Raidbots URL');

    const res = await fetch(
      `https://www.raidbots.com/simbot/report/${reportId}/data.json`,
    );
    if (!res.ok) throw new Error('Failed to fetch Raidbots data');
    const data = await res.json();

    // 2. Parse items
    const parsed = RaidbotsParserService.parseReport(data);

    // 3. Get Character Context (for filtering and current equipment)
    const { data: member } = await supabaseAdmin
      .from('guild_members')
      .select('character_name, realm_slug, class_id, spec_name')
      .eq('id', memberId)
      .single();

    if (!member) throw new Error('Member not found');

    // 4. Fetch Current Equipment
    const equipment = await fetchCharacterEquipment(
      member.realm_slug,
      member.character_name.toLowerCase(),
    );
    const equippedMap = new Map<string, WoWItem>();

    if (equipment?.equipped_items) {
      equipment.equipped_items.forEach((item: any) => {
        const slot = item.slot?.type;
        if (slot) {
          const bonusIds = item.bonus_list || [];
          const translation = RaidbotsParserService.translateBonusIds(bonusIds);
          equippedMap.set(slot, {
            id: item.item.id,
            name: item.name,
            itemLevel: item.level?.value || 0,
            bonusIds: bonusIds,
            upgradeTrack: translation.track,
          });
        }
      });
    }

    // 5. Build full wishlist with comparisons
    const wishlistItems: WishlistItem[] = [];

    // For each parsed item, we augment it with current equipment and filter it
    for (const pItem of parsed.items) {
      // Fetch more item data from Blizzard for strict filtering (Main Stat, etc)
      const bnetItem = await fetchItemData(pItem.wish!.id);

      if (
        bnetItem &&
        !ItemFilterService.canSpecUseItem(
          member.class_id,
          member.spec_name,
          bnetItem,
        )
      ) {
        // Skip if not suitable for spec
        continue;
      }

      const equipped = equippedMap.get(pItem.slot);
      wishlistItems.push({
        ...pItem,
        equipped,
        status: 'needed',
      });
    }

    // 6. Persist to Database
    const { data: wishlist, error: wlError } = await supabaseAdmin
      .from('wishlists')
      .upsert({
        member_id: memberId,
        total_dps_gain: parsed.dpsGain,
        total_percent_gain: parsed.percentGain,
        last_raidbots_import: new Date().toISOString(),
      })
      .select()
      .single();

    if (wlError) throw wlError;

    // Save items
    // First delete old items for this wishlist? Or update?
    // Wowaudit usually overwrites on import.
    await supabaseAdmin
      .from('wishlist_items')
      .delete()
      .eq('wishlist_id', wishlist.id);

    const itemsToInsert = wishlistItems.map((item) => ({
      wishlist_id: wishlist.id,
      slot: item.slot,
      equipped_item_id: item.equipped?.id,
      equipped_item_name: item.equipped?.name,
      equipped_item_level: item.equipped?.itemLevel,
      equipped_bonus_ids: item.equipped?.bonusIds,
      equipped_upgrade_track: item.equipped?.upgradeTrack,
      wish_item_id: item.wish?.id,
      wish_item_name: item.wish?.name,
      wish_item_icon: item.wish?.icon,
      wish_item_level: item.wish?.itemLevel,
      wish_bonus_ids: item.wish?.bonusIds,
      wish_upgrade_track: item.wish?.upgradeTrack,
      wish_loot_source: item.lootSource,
      wish_loot_source_type: item.lootSourceType,
      dps_gain: item.dpsGain,
      percent_gain: item.percentGain,
      status: item.status,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('wishlist_items')
      .insert(itemsToInsert);
    if (itemsError) throw itemsError;

    return {
      memberId,
      items: wishlistItems,
      totalDpsGain: parsed.dpsGain,
      totalPercentGain: parsed.percentGain,
    };
  }

  static async getWishlist(memberId: string): Promise<Wishlist | null> {
    const { data: wishlist } = await supabaseAdmin
      .from('wishlists')
      .select('*, items:wishlist_items(*)')
      .eq('member_id', memberId)
      .single();

    if (!wishlist) return null;

    return {
      memberId: wishlist.member_id,
      totalDpsGain: wishlist.total_dps_gain,
      totalPercentGain: wishlist.total_percent_gain,
      items: wishlist.items.map((i: any) => ({
        slot: i.slot,
        dpsGain: i.dps_gain,
        percentGain: i.percent_gain,
        status: i.status as any,
        lootSource: i.wish_loot_source,
        lootSourceType: i.wish_loot_source_type,
        equipped: i.equipped_item_id
          ? {
              id: i.equipped_item_id,
              name: i.equipped_item_name,
              itemLevel: i.equipped_item_level,
              bonusIds: i.equipped_bonus_ids,
              upgradeTrack: i.equipped_upgrade_track,
            }
          : undefined,
        wish: i.wish_item_id
          ? {
              id: i.wish_item_id,
              name: i.wish_item_name,
              icon: i.wish_item_icon,
              itemLevel: i.wish_item_level,
              bonusIds: i.wish_bonus_ids,
              upgradeTrack: i.wish_upgrade_track,
            }
          : undefined,
      })),
    };
  }
}
