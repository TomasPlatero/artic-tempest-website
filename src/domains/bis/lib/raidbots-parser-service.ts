// src/domains/bis/lib/raidbots-parser-service.ts
import { WishlistItem, WoWItem } from './types';

export class RaidbotsParserService {
  /**
   * Translates a list of bonus IDs to a human-readable upgrade track in Midnight.
   */
  static translateBonusIds(bonusIds: number[]): {
    track: string;
    ilvl?: number;
  } {
    // Midnight Season 1 Mapping (6-step tracks)
    if (bonusIds.includes(12802)) return { track: 'Hero 6/6', ilvl: 276 };
    if (bonusIds.includes(12801)) return { track: 'Hero 5/6', ilvl: 273 };
    if (bonusIds.includes(12800)) return { track: 'Hero 4/6', ilvl: 270 };
    if (bonusIds.includes(12799)) return { track: 'Hero 3/6', ilvl: 267 };
    if (bonusIds.includes(12798)) return { track: 'Hero 2/6', ilvl: 265 };
    if (bonusIds.includes(12797)) return { track: 'Hero 1/6', ilvl: 263 };

    // Myth Track (Dawncrests)
    if (bonusIds.includes(12902)) return { track: 'Myth 6/6', ilvl: 289 };
    if (bonusIds.includes(12901)) return { track: 'Myth 5/6', ilvl: 286 };
    if (bonusIds.includes(12900)) return { track: 'Myth 4/6', ilvl: 283 };
    if (bonusIds.includes(12899)) return { track: 'Myth 3/6', ilvl: 281 };
    if (bonusIds.includes(12898)) return { track: 'Myth 2/6', ilvl: 279 };
    if (bonusIds.includes(12897)) return { track: 'Myth 1/6', ilvl: 276 };

    return { track: 'Normal' };
  }

  /**
   * Parses a Raidbots JSON report (Droptimizer or Top Gear)
   */
  static parseReport(data: any): {
    items: WishlistItem[];
    dpsGain: number;
    percentGain: number;
  } {
    if (!data.sim || !data.sim.profilesets) {
      throw new Error('Invalid Raidbots report format');
    }

    const baselineDps =
      data.sim.statistics?.raid_dps?.mean || data.sim.dps?.mean || 0;
    const profilesets = data.sim.profilesets.results || [];

    const items: WishlistItem[] = [];
    const bestGainBySlot = new Map<string, number>();

    profilesets.forEach((ps: any) => {
      if (ps.name.toLowerCase().includes('baseline')) return;

      const dpsGain = (ps.mean || 0) - baselineDps;
      if (dpsGain <= 0) return;

      // Extract item info from the profileset name or items array
      // Format usually: "Slot/ItemID/Ilvl/..."
      const itemData = ps.items?.[0] || {};
      const itemId = itemData.id || this.extractIdFromName(ps.name);
      const slot =
        itemData.slot || this.extractSlotFromName(ps.name) || 'Unknown';
      const bonusIds = itemData.bonus_id || [];

      const translation = this.translateBonusIds(bonusIds);

      const wishItem: WoWItem = {
        id: itemId,
        name: itemData.name || 'Unknown Item',
        itemLevel: itemData.itemLevel || translation.ilvl || 0,
        bonusIds: bonusIds,
        upgradeTrack: translation.track,
        icon: itemData.icon || null,
        enchant: itemData.enchant,
        gems: itemData.gems || (itemData.gem ? [itemData.gem] : []),
      };

      const normalizedSlot = slot.toUpperCase().replace(/[0-9]/g, '');

      // Track best in slot
      if (
        !bestGainBySlot.has(normalizedSlot) ||
        dpsGain > (bestGainBySlot.get(normalizedSlot) || 0)
      ) {
        bestGainBySlot.set(normalizedSlot, dpsGain);

        // Add or update item in the list
        const existingIndex = items.findIndex((i) => i.slot === normalizedSlot);
        const wishItemEntry: WishlistItem = {
          slot: normalizedSlot,
          wish: wishItem,
          dpsGain: Math.round(dpsGain),
          percentGain:
            baselineDps > 0
              ? Number(((dpsGain / baselineDps) * 100).toFixed(2))
              : 0,
          status: 'needed',
          lootSource: ps.bossName || 'Raid',
          lootSourceType: 'raid',
        };

        if (existingIndex >= 0) {
          items[existingIndex] = wishItemEntry;
        } else {
          items.push(wishItemEntry);
        }
      }
    });

    // Calculate total potential gain
    let totalDpsGain = 0;
    bestGainBySlot.forEach((gain) => (totalDpsGain += gain));

    // If Top Gear, the actual "best combination" might be provided differently
    if (data.sim?.options?.type === 'topgear') {
      const bestResult = profilesets.sort(
        (a: any, b: any) => (b.mean || 0) - (a.mean || 0),
      )[0];
      totalDpsGain = (bestResult?.mean || baselineDps) - baselineDps;
    }

    return {
      items,
      dpsGain: Math.round(totalDpsGain),
      percentGain:
        baselineDps > 0
          ? Number(((totalDpsGain / baselineDps) * 100).toFixed(2))
          : 0,
    };
  }

  private static extractIdFromName(name: string): number {
    const match = name.match(/\/([0-9]{5,7})\//);
    return match ? parseInt(match[1]) : 0;
  }

  private static extractSlotFromName(name: string): string | null {
    // e.g. "back/249296/..."
    const parts = name.split('/');
    return parts.length > 0 ? parts[0] : null;
  }
}
