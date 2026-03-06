// src/infrastructure/wishlist/types.ts

export type UpgradeTrack = 'Adventurer' | 'Veteran' | 'Champion' | 'Hero' | 'Myth' | 'Other';

export interface WoWItem {
    id: number;
    name: string;
    icon?: string;
    itemLevel: number;
    bonusIds: number[];
    upgradeTrack?: string; // e.g. "Hero 6/6"
    quality?: string;
    enchant?: number;
    gems?: number[];
}

export interface WishlistItem {
    id?: string;
    slot: string;

    equipped?: WoWItem;
    wish?: WoWItem;

    lootSource?: string;
    lootSourceType?: 'raid' | 'dungeon' | 'crafting' | 'vault' | 'other';

    dpsGain?: number;
    percentGain?: number;
    isBis?: boolean;
    status: 'needed' | 'obtained';
}

export interface Wishlist {
    memberId: string;
    items: WishlistItem[];
    totalDpsGain: number;
    totalPercentGain: number;
}
