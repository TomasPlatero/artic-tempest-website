// src/infrastructure/wishlist/item-filter-service.ts
import { LootItem } from "@/components/bis/bis-client";

// Midnight Expansion Constants
const SHIELD_CLASSES = new Set([1, 2, 7]); // Warrior, Paladin, Shaman



// Main Stat Filtering
// 1 = Strength, 2 = Agility, 4 = Intellect
export const CLASS_SPEC_STAT: Record<number, Record<string, number>> = {
    1: { "Arms": 1, "Fury": 1, "Protection": 1 }, // Warrior
    2: { "Holy": 4, "Protection": 1, "Retribution": 1 }, // Paladin
    3: { "Beast Mastery": 2, "Marksmanship": 2, "Survival": 2 }, // Hunter
    4: { "Assassination": 2, "Outlaw": 2, "Subtlety": 2 }, // Rogue
    5: { "Discipline": 4, "Holy": 4, "Shadow": 4 }, // Priest
    6: { "Blood": 1, "Frost": 1, "Unholy": 1 }, // DK
    7: { "Elemental": 4, "Enhancement": 2, "Restoration": 4 }, // Shaman
    8: { "Arcane": 4, "Fire": 4, "Frost": 4 }, // Mage
    9: { "Affliction": 4, "Demonology": 4, "Destruction": 4 }, // Warlock
    10: { "Brewmaster": 2, "Mistweaver": 4, "Windwalker": 2 }, // Monk
    11: { "Balance": 4, "Feral": 2, "Guardian": 2, "Restoration": 4 }, // Druid
    12: { "Havoc": 2, "Vengeance": 2, "Devourer": 2 }, // DH (Midnight)
    13: { "Devastation": 4, "Preservation": 4, "Augmentation": 4 }, // Evoker
};

export const CLASS_ARMOR: Record<number, number> = {
    1: 4, 2: 4, 6: 4,             // Warrior, Paladin, DK → Plate
    3: 3, 7: 3, 13: 3,            // Hunter, Shaman, Evoker → Mail
    4: 2, 10: 2, 11: 2, 12: 2,    // Rogue, Monk, Druid, DH → Leather
    5: 1, 8: 1, 9: 1,             // Priest, Mage, Warlock → Cloth
};

// Midnight Season 1 Item Levels
export const RAID_ILVL: Record<string, number> = {
    lfr: 250,
    normal: 263,
    heroic: 276,
    mythic: 289
};

export const CLASS_WEAPONS: Record<number, number[]> = {
    1: [0, 1, 4, 5, 6, 7, 8, 13, 15],          // Warrior
    2: [0, 1, 4, 5, 6, 7, 8],                  // Paladin
    3: [0, 1, 2, 3, 6, 7, 8, 10, 13, 15, 18],  // Hunter
    4: [0, 4, 7, 13, 15],                       // Rogue
    5: [4, 10, 15, 19],                         // Priest
    6: [0, 1, 4, 5, 6, 7, 8],                  // Death Knight
    7: [0, 1, 4, 5, 10, 13, 15],               // Shaman
    8: [7, 10, 15, 19],                         // Mage
    9: [7, 10, 15, 19],                         // Warlock
    10: [0, 4, 6, 7, 10, 13],                   // Monk
    11: [4, 5, 6, 10, 13, 15],                  // Druid
    12: [0, 7, 9, 13],                          // Demon Hunter
    13: [0, 4, 7, 10, 13, 15],                  // Evoker
};

export class ItemFilterService {
    /**
     * Strict filtering for WoW: Midnight
     */
    static canSpecUseItem(classId: number, specName: string, item: any): boolean {
        // 1. Basic Armor/Weapon Type check
        if (!this.canClassUseItem(classId, item)) return false;

        // 2. Strict specialization-specific restrictions for off-hands and shields
        const slotStr = (item.inventory_type?.type || item.slot || item.inventory_type || "").toString().toUpperCase();
        const itemSubclassId = item.item_subclass?.id ?? item.itemSubclassId;
        const isShield = slotStr === "SHIELD" || itemSubclassId === 6;
        const isOffhand = ["OFF_HAND", "HELD_IN_OFF_HAND", "HOLDABLE"].includes(slotStr);

        if (isShield) {
            // Only specific specs use shields
            const canUseShield = (classId === 1 && specName === "Protection") || // Warrior
                (classId === 2 && (specName === "Protection" || specName === "Holy")) || // Paladin
                (classId === 7 && (specName === "Elemental" || specName === "Restoration")); // Shaman
            if (!canUseShield) return false;
        }

        if (isOffhand) {
            // Only specific classes/specs use off-hands
            const canUseOffhand = [8, 9, 5, 13].includes(classId) || // Mage, Warlock, Priest, Evoker (all specs)
                (classId === 11 && (specName === "Balance" || specName === "Restoration")) || // Druid
                (classId === 7 && (specName === "Elemental" || specName === "Restoration")) || // Shaman
                (classId === 10 && specName === "Mistweaver") || // Monk
                (classId === 2 && specName === "Holy"); // Paladin
            if (!canUseOffhand) return false;
        }

        // 3. Main Stat Check (Strict)
        const requiredStat = CLASS_SPEC_STAT[classId]?.[specName];

        if (requiredStat && item.stats && item.stats.length > 0) {
            // Check if any of the primary stats in the item match the required stat
            // Primary stats: 3=Agi, 4=Str, 5=Int
            const primaryStats = item.stats.filter((s: any) => [3, 4, 5].includes(s.stat || s.type));
            if (primaryStats.length > 0) {
                const hasMatch = primaryStats.some((s: any) => {
                    const type = s.stat || s.type;
                    if (requiredStat === 1) return type === 4; // Strength
                    if (requiredStat === 2) return type === 3; // Agility
                    if (requiredStat === 4) return type === 5; // Intellect
                    return false;
                });
                if (!hasMatch) return false;
            }
        }

        return true;
    }

    static canClassUseItem(classId: number, item: any): boolean {
        const itemClassId = item.item_class?.id || item.itemClassId;
        const itemSubclassId = item.item_subclass?.id ?? item.itemSubclassId;

        if (!itemClassId) return true;

        if (itemClassId === 4) {
            if (itemSubclassId === 0) return true; // Miscellaneous
            const playerArmor = CLASS_ARMOR[classId];
            return itemSubclassId === playerArmor;
        }

        if (itemClassId === 2) {
            const allowedWeapons = CLASS_WEAPONS[classId] || [];
            return allowedWeapons.includes(itemSubclassId);
        }

        return false;
    }
}
