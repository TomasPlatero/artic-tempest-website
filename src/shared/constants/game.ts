// src/shared/constants/game.ts
// Shared WoW game constants used across multiple files

export const MIDNIGHT_INSTANCE_IDS: number[] = [1307, 1308, 1314];

export const MIDNIGHT_S1_ILVL: Record<
  string,
  { base: number; mid: number; final: number }
> = {
  lfr: { base: 233, mid: 237, final: 240 },
  normal: { base: 246, mid: 250, final: 253 },
  heroic: { base: 259, mid: 263, final: 269 },
  mythic: { base: 272, mid: 279, final: 282 },
};

export const CLASS_KEY_BY_ID: Record<number, string> = {
  1: 'warrior',
  2: 'paladin',
  3: 'hunter',
  4: 'rogue',
  5: 'priest',
  6: 'deathknight',
  7: 'shaman',
  8: 'mage',
  9: 'warlock',
  10: 'monk',
  11: 'druid',
  12: 'demonhunter',
  13: 'evoker',
};

export const CLASS_WEAPON_RULES: Record<
  number,
  { weaponTypes: string[]; handTypes: string[] }
> = {
  1: {
    weaponTypes: [
      'axe',
      'sword',
      'mace',
      'dagger',
      'polearm',
      'staff',
      'fist',
      'shield',
    ],
    handTypes: ['one_hand', 'two_hand', 'main_hand', 'off_hand'],
  },
  2: {
    weaponTypes: ['axe', 'sword', 'mace', 'shield'],
    handTypes: ['one_hand', 'two_hand', 'main_hand', 'off_hand'],
  },
  3: {
    weaponTypes: [
      'axe',
      'sword',
      'polearm',
      'staff',
      'dagger',
      'fist',
      'bow',
      'gun',
      'crossbow',
    ],
    handTypes: ['one_hand', 'two_hand', 'main_hand'],
  },
  4: {
    weaponTypes: ['axe', 'sword', 'mace', 'dagger', 'fist', 'glaive'],
    handTypes: ['one_hand', 'main_hand', 'off_hand'],
  },
  5: {
    weaponTypes: ['mace', 'dagger', 'staff', 'wand', 'offhand_frill'],
    handTypes: ['one_hand', 'two_hand', 'main_hand', 'off_hand'],
  },
  6: {
    weaponTypes: ['axe', 'sword', 'mace', 'polearm'],
    handTypes: ['one_hand', 'two_hand', 'main_hand'],
  },
  7: {
    weaponTypes: ['axe', 'mace', 'dagger', 'staff', 'fist', 'shield'],
    handTypes: ['one_hand', 'two_hand', 'main_hand', 'off_hand'],
  },
  8: {
    weaponTypes: ['sword', 'dagger', 'staff', 'wand', 'offhand_frill'],
    handTypes: ['one_hand', 'two_hand', 'main_hand', 'off_hand'],
  },
  9: {
    weaponTypes: ['sword', 'dagger', 'staff', 'wand', 'offhand_frill'],
    handTypes: ['one_hand', 'two_hand', 'main_hand', 'off_hand'],
  },
  10: {
    weaponTypes: ['axe', 'mace', 'sword', 'staff', 'fist', 'offhand_frill'],
    handTypes: ['one_hand', 'two_hand', 'main_hand', 'off_hand'],
  },
  11: {
    weaponTypes: [
      'mace',
      'sword',
      'dagger',
      'polearm',
      'staff',
      'fist',
      'offhand_frill',
    ],
    handTypes: ['one_hand', 'two_hand', 'main_hand', 'off_hand'],
  },
  12: {
    weaponTypes: ['axe', 'sword', 'fist', 'glaive'],
    handTypes: ['one_hand', 'main_hand', 'off_hand'],
  },
  13: {
    weaponTypes: [
      'axe',
      'mace',
      'sword',
      'dagger',
      'staff',
      'fist',
      'offhand_frill',
    ],
    handTypes: ['one_hand', 'two_hand', 'main_hand', 'off_hand'],
  },
};
