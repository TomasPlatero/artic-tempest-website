// src/domains/bis/lib/item-filter-service.ts
import { LootItem } from '@/domains/bis/components/bis-client';

// Midnight Expansion Constants
const SHIELD_CLASSES = new Set([1, 2, 7]); // Warrior, Paladin, Shaman

// Main Stat Filtering
// 1 = Strength, 2 = Agility, 4 = Intellect
export const CLASS_SPEC_STAT: Record<number, Record<string, number>> = {
  1: { Arms: 1, Fury: 1, Protection: 1 }, // Warrior
  2: { Holy: 4, Protection: 1, Retribution: 1 }, // Paladin
  3: { 'Beast Mastery': 2, Marksmanship: 2, Survival: 2 }, // Hunter
  4: { Assassination: 2, Outlaw: 2, Subtlety: 2 }, // Rogue
  5: { Discipline: 4, Holy: 4, Shadow: 4 }, // Priest
  6: { Blood: 1, Frost: 1, Unholy: 1 }, // DK
  7: { Elemental: 4, Enhancement: 2, Restoration: 4 }, // Shaman
  8: { Arcane: 4, Fire: 4, Frost: 4 }, // Mage
  9: { Affliction: 4, Demonology: 4, Destruction: 4 }, // Warlock
  10: { Brewmaster: 2, Mistweaver: 4, Windwalker: 2 }, // Monk
  11: { Balance: 4, Feral: 2, Guardian: 2, Restoration: 4 }, // Druid
  12: { Havoc: 2, Vengeance: 2, Devourer: 2 }, // DH (Midnight)
  13: { Devastation: 4, Preservation: 4, Augmentation: 4 }, // Evoker
};

export const CLASS_ARMOR: Record<number, number> = {
  1: 4,
  2: 4,
  6: 4, // Warrior, Paladin, DK → Plate
  3: 3,
  7: 3,
  13: 3, // Hunter, Shaman, Evoker → Mail
  4: 2,
  10: 2,
  11: 2,
  12: 2, // Rogue, Monk, Druid, DH → Leather
  5: 1,
  8: 1,
  9: 1, // Priest, Mage, Warlock → Cloth
};

// Midnight Season 1 Item Levels
export const RAID_ILVL: Record<string, number> = {
  lfr: 250,
  normal: 263,
  heroic: 276,
  mythic: 289,
};

export const CLASS_WEAPONS: Record<number, number[]> = {
  1: [0, 1, 4, 5, 6, 7, 8, 13, 15], // Warrior
  2: [0, 1, 4, 5, 6, 7, 8], // Paladin
  3: [0, 1, 2, 3, 6, 7, 8, 10, 13, 15, 18], // Hunter
  4: [0, 4, 7, 13, 15], // Rogue
  5: [4, 10, 15, 19], // Priest
  6: [0, 1, 4, 5, 6, 7, 8], // Death Knight
  7: [0, 1, 4, 5, 10, 13, 15], // Shaman
  8: [7, 10, 15, 19], // Mage
  9: [7, 10, 15, 19], // Warlock
  10: [0, 4, 6, 7, 10, 13], // Monk
  11: [4, 5, 6, 10, 13, 15], // Druid
  12: [0, 7, 9, 13], // Demon Hunter
  13: [0, 4, 7, 10, 13, 15], // Evoker
};

export class ItemFilterService {
  /**
   * Strict filtering for WoW: Midnight
   */
  static canSpecUseItem(classId: number, specName: string, item: any): boolean {
    // 1. Basic Armor/Weapon Type check
    if (!this.canClassUseItem(classId, item)) return false;

    // 2. Strict specialization-specific restrictions for off-hands, shields, and weapon slots
    const slotStr = (
      item.inventory_type?.type ||
      item.slot ||
      item.inventory_type ||
      ''
    )
      .toString()
      .toUpperCase();
    const itemSubclassId = item.item_subclass?.id ?? item.itemSubclassId;
    const itemClassId = item.item_class?.id ?? item.itemClassId;

    const isShield =
      (itemClassId === 4 && itemSubclassId === 6) || slotStr === 'SHIELD';
    const isOffhand = ['OFF_HAND', 'HELD_IN_OFF_HAND', 'HOLDABLE'].includes(
      slotStr,
    );
    const isTwoHanded =
      itemClassId === 2 &&
      (itemSubclassId === 1 ||
        itemSubclassId === 5 ||
        itemSubclassId === 8 ||
        itemSubclassId === 6 ||
        itemSubclassId === 10 ||
        ['TWOHWEAPON', 'TWO_HAND', 'TWOHHAND'].includes(slotStr));
    const isOneHanded =
      itemClassId === 2 &&
      (itemSubclassId === 0 ||
        itemSubclassId === 4 ||
        itemSubclassId === 7 ||
        itemSubclassId === 13 ||
        itemSubclassId === 15 ||
        ['ONE_HAND', 'MAIN_HAND', 'ONEHWEAPON'].includes(slotStr));

    if (isShield) {
      // Only specific specs use shields
      const canUseShield =
        (classId === 1 && specName === 'Protection') || // Warrior
        (classId === 2 && (specName === 'Protection' || specName === 'Holy')) || // Paladin
        (classId === 7 &&
          (specName === 'Elemental' || specName === 'Restoration')); // Shaman
      if (!canUseShield) return false;
    }

    if (isOffhand) {
      // Only specific classes/specs use off-hands
      const canUseOffhand =
        [8, 9, 5, 13].includes(classId) || // Mage, Warlock, Priest, Evoker (all specs)
        (classId === 11 &&
          (specName === 'Balance' || specName === 'Restoration')) || // Druid
        (classId === 7 &&
          (specName === 'Elemental' || specName === 'Restoration')) || // Shaman
        (classId === 10 && specName === 'Mistweaver') || // Monk
        (classId === 2 && specName === 'Holy'); // Paladin
      if (!canUseOffhand) return false;
    }

    // Weapon Strict Filtering (1H vs 2H)
    if (itemClassId === 2) {
      // Specs that ONLY use 2H weapons
      const onlyTwoHandedSpecs = [
        'Retribution',
        'Arms',
        'Blood',
        'Unholy',
        'Survival',
        'Balance',
        'Feral',
        'Guardian',
      ];
      if (onlyTwoHandedSpecs.includes(specName) && isOneHanded) {
        // Exceptional check: Paladins (Ret) should NOT see 1H weapons for DPS per WowAudit
        if (classId === 2) return false;
        // Druid: Feral/Guardian should see 2H. Balance/Resto can use 1H/Offhand.
      }

      // Specs that ONLY use 1H weapons (usually with shield/offhand)
      const onlyOneHandedSpecs = [
        'Protection',
        'Holy',
        'Assassination',
        'Outlaw',
        'Subtlety',
        'Fire',
        'Frost',
        'Arcane',
        'Restoration',
        'Elemental',
        'Mistweaver',
        'Augmentation',
        'Devastation',
        'Preservation',
      ];
      if (onlyOneHandedSpecs.includes(specName) && isTwoHanded) {
        // Paladin Tank/Holy SHOULD NOT see 2H.
        if (classId === 2 && (specName === 'Protection' || specName === 'Holy'))
          return false;
        if (classId === 1 && specName === 'Protection') return false;
      }

      // Special Case: Fury Warrior (usually 2H but can use 1H) - defaulted to 2H for BIS
      if (specName === 'Fury' && isOneHanded) return false;
    }

    // 3. Main Stat Check (Strict for Jewelry/Armor, surgical for Weapons)
    const requiredStat = CLASS_SPEC_STAT[Number(classId)]?.[specName];

    // Items with NO primary stats (cosmetic gems, etc.) should always pass the stat check
    const stats = item.stats || {};
    const hasPrimaryStats =
      stats.strength > 0 ||
      stats.agility > 0 ||
      stats.intellect > 0 ||
      (item.primary_stats && item.primary_stats.length > 0) ||
      (item.main_stat && item.main_stat.length > 0) ||
      (Array.isArray(stats) &&
        stats.some((s: any) =>
          [3, 4, 5, 'AGILITY', 'STRENGTH', 'INTELLECT'].includes(
            s.stat || s.type?.type || s.type,
          ),
        ));

    if (!hasPrimaryStats) return true;

    if (requiredStat) {
      // Check formatted stats object (Preferred for API)
      if (stats && typeof stats === 'object' && !Array.isArray(stats)) {
        if (requiredStat === 1 && stats.strength > 0) return true;
        if (requiredStat === 2 && stats.agility > 0) return true;
        if (requiredStat === 4 && stats.intellect > 0) return true;

        // If we have stats but NO match for the required stat, it's a mismatch
        if (stats.strength > 0 || stats.agility > 0 || stats.intellect > 0)
          return false;
      }

      // Fallback: Check formatted stats array
      if (Array.isArray(item.stats) && item.stats.length > 0) {
        const hasMatch = item.stats.some((s: any) => {
          const type = s.stat || s.type?.type || s.type;
          if (requiredStat === 1) return type === 4 || type === 'STRENGTH';
          if (requiredStat === 2) return type === 3 || type === 'AGILITY';
          if (requiredStat === 4) return type === 5 || type === 'INTELLECT';
          return false;
        });
        if (!hasMatch) return false;
      }
      // Fallback: Check simplified primary_stats array (from DB)
      else if (item.primary_stats && Array.isArray(item.primary_stats)) {
        const hasMatch = item.primary_stats.some((s: string) => {
          if (requiredStat === 1) return s.toLowerCase() === 'strength';
          if (requiredStat === 2) return s.toLowerCase() === 'agility';
          if (requiredStat === 4) return s.toLowerCase() === 'intellect';
          return false;
        });
        if (!hasMatch) return false;
      }
    }

    // Druid: Enforce Intellect for Balance/Resto weapons, Agility for Feral/Guardian weapons
    if (classId === 11 && itemClassId === 2) {
      const statStr = (item.main_stat || '').toString();
      if (
        ['Balance', 'Restoration'].includes(specName) &&
        !statStr.includes('Intellect')
      )
        return false;
      if (
        ['Feral', 'Guardian'].includes(specName) &&
        !statStr.includes('Agility')
      )
        return false;
    }

    return true;
  }

  static canClassUseItem(classId: number, item: any): boolean {
    const slotStr = (
      item.inventory_type?.type ||
      item.slot ||
      item.inventory_type ||
      ''
    )
      .toString()
      .toUpperCase();
    const itemClassId = item.item_class?.id
      ? Number(item.item_class.id)
      : item.itemClassId
        ? Number(item.itemClassId)
        : null;
    const itemSubclassId =
      item.item_subclass?.id !== undefined
        ? Number(item.item_subclass.id)
        : item.itemSubclassId !== undefined
          ? Number(item.itemSubclassId)
          : null;

    if (itemClassId === null) return true;

    if (
      [
        'NECK',
        'FINGER',
        'TRINKET',
        'CLOAK',
        'BACK',
        'SHIRT',
        'TABARD',
      ].includes(slotStr)
    ) {
      return true;
    }

    const isShield =
      slotStr === 'SHIELD' || (itemClassId === 4 && itemSubclassId === 6);

    if (isShield) {
      return SHIELD_CLASSES.has(Number(classId));
    }

    if (
      slotStr === 'HOLDABLE' ||
      slotStr === 'OFF_HAND' ||
      slotStr === 'WEAPONOFFHAND'
    ) {
      return true;
    }

    if (itemClassId === 4) {
      if (itemSubclassId === 0) return true; // Miscellaneous
      const playerArmor = CLASS_ARMOR[Number(classId)];
      return itemSubclassId === playerArmor;
    }

    if (itemClassId === 2) {
      const allowedWeapons = CLASS_WEAPONS[Number(classId)] || [];
      return allowedWeapons.includes(itemSubclassId as number);
    }

    return true;
  }
}
