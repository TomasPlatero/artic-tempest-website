// ──────────────────────────────────────────────
// Spec name translations (EN → ES)
// Internal values stay in English; these are for display only.
// ──────────────────────────────────────────────
export const SPEC_TRANSLATIONS: Record<string, string> = {
	// Warrior
	Arms: "Armas",
	Fury: "Furia",
	Protection: "Protección",
	// Paladin
	Holy: "Sagrado",
	Retribution: "Reprensión",
	// Hunter
	"Beast Mastery": "Bestias",
	Marksmanship: "Puntería",
	Survival: "Supervivencia",
	// Rogue
	Assassination: "Asesinato",
	Outlaw: "Forajido",
	Subtlety: "Sutileza",
	// Priest
	Discipline: "Disciplina",
	Shadow: "Sombras",
	// Death Knight
	Blood: "Sangre",
	Frost: "Escarcha",
	Unholy: "Profano",
	// Shaman
	Elemental: "Elemental",
	Enhancement: "Mejora",
	Restoration: "Restauración",
	// Mage
	Fire: "Fuego",
	Arcane: "Arcano",
	// Warlock
	Affliction: "Aflicción",
	Demonology: "Demonología",
	Destruction: "Destrucción",
	// Monk
	Brewmaster: "Maestro cervecero",
	Mistweaver: "Tejedor de niebla",
	Windwalker: "Viajero del viento",
	// Druid
	Balance: "Equilibrio",
	Feral: "Feral",
	Guardian: "Guardián",
	// Demon Hunter
	Havoc: "Devastación",
	Vengeance: "Venganza",
	Devourer: "Devorador",
	// Evoker
	Devastation: "Devastación",
	Preservation: "Preservación",
	Augmentation: "Aumento",
};

/** Return the Spanish display name for a spec, falling back to the English name */
export function getSpecDisplayName(specName: string): string {
	return SPEC_TRANSLATIONS[specName] ?? specName;
}

// ──────────────────────────────────────────────
// Class ID → Class Key mapping for spec_rules
// ──────────────────────────────────────────────
export const CLASS_ID_TO_KEY: Record<number, string> = {
	1: "WARRIOR",
	2: "PALADIN",
	3: "HUNTER",
	4: "ROGUE",
	5: "PRIEST",
	6: "DEATHKNIGHT",
	7: "SHAMAN",
	8: "MAGE",
	9: "WARLOCK",
	10: "MONK",
	11: "DRUID",
	12: "DEMONHUNTER",
	13: "EVOKER",
};

// ──────────────────────────────────────────────
// Spec name → icon key (from WoW)
// ──────────────────────────────────────────────
export const SPEC_ICONS: Record<string, string> = {
	// Warrior
	Warrior·Arms: "ability_warrior_savageblow",
	Warrior·Fury: "ability_warrior_innerrage",
	Warrior·Protection: "ability_warrior_defensivestance",
	// Paladin
	Paladin·Holy: "spell_holy_holybolt",
	Paladin·Protection: "ability_paladin_shieldofthetemplar",
	Paladin·Retribution: "spell_holy_auraoflight",
	// Hunter
	"Hunter·Beast Mastery": "ability_hunter_bestialdiscipline",
	Hunter·Marksmanship: "ability_hunter_focusedaim",
	Hunter·Survival: "ability_hunter_camouflage",
	// Rogue
	Rogue·Assassination: "ability_rogue_deadlybrew",
	Rogue·Outlaw: "ability_rogue_waylay",
	Rogue·Subtlety: "ability_stealth",
	// Priest
	Priest·Discipline: "spell_holy_powerwordshield",
	Priest·Holy: "spell_holy_guardianspirit",
	Priest·Shadow: "spell_shadow_shadowwordpain",
	// Death Knight
	DeathKnight·Blood: "spell_deathknight_bloodpresence",
	DeathKnight·Frost: "spell_deathknight_frostpresence",
	DeathKnight·Unholy: "spell_deathknight_unholypresence",
	// Shaman
	Shaman·Elemental: "spell_nature_lightning",
	Shaman·Enhancement: "spell_shaman_improvedstormstrike",
	Shaman·Restoration: "spell_nature_magicimmunity",
	// Mage
	Mage·Fire: "spell_fire_firebolt02",
	Mage·Frost: "spell_frost_frostbolt02",
	Mage·Arcane: "spell_holy_magicalsentry",
	// Warlock
	Warlock·Affliction: "spell_shadow_deathcoil",
	Warlock·Demonology: "spell_shadow_metamorphosis",
	Warlock·Destruction: "spell_shadow_rainoffire",
	// Monk
	Monk·Brewmaster: "spell_monk_brewmaster_spec",
	Monk·Mistweaver: "spell_monk_mistweaver_spec",
	Monk·Windwalker: "spell_monk_windwalker_spec",
	// Druid
	Druid·Balance: "spell_nature_starfall",
	Druid·Feral: "ability_druid_catform",
	Druid·Guardian: "ability_racial_bearform",
	Druid·Restoration: "spell_nature_healingtouch",
	// Demon Hunter
	DemonHunter·Havoc: "ability_demonhunter_specdps",
	DemonHunter·Vengeance: "ability_demonhunter_spectank",
	DemonHunter·Devourer: "classicon_demonhunter_void",
	// Evoker
	Evoker·Devastation: "classicon_evoker_devastation",
	Evoker·Preservation: "classicon_evoker_preservation",
	Evoker·Augmentation: "classicon_evoker_augmentation",
};

// ──────────────────────────────────────────────
// Profession icon URLs (from Blizzard/WoWHead)
// ──────────────────────────────────────────────
export const PROFESSION_ICONS: Record<string, string> = {
	Alquimia: "trade_alchemy",
	Herrería: "trade_blacksmithing",
	Encantamiento: "trade_engraving",
	Ingeniería: "trade_engineering",
	Herboristería: "trade_herbalism",
	Inscripción: "inv_inscription_tradeskill01",
	Joyería: "inv_misc_gem_01",
	Peletería: "inv_misc_armorkit_17",
	Minería: "trade_mining",
	Desuello: "inv_misc_pelt_wolf_01",
	Sastrería: "trade_tailoring",
	Cocina: "inv_misc_food_15",
	Pesca: "trade_fishing",
	Arqueología: "trade_archaeology",
};

// ──────────────────────────────────────────────
// Class colors (WoW canonical)
// ──────────────────────────────────────────────
export const CLASS_COLORS: Record<number, string> = {
	1: "#C69B6D", // Warrior
	2: "#F48CBA", // Paladin
	3: "#AAD372", // Hunter
	4: "#FFF468", // Rogue
	5: "#FFFFFF", // Priest
	6: "#C41E3A", // Death Knight
	7: "#0070DD", // Shaman
	8: "#3FC7EB", // Mage
	9: "#8788EE", // Warlock
	10: "#00FF98", // Monk
	11: "#FF7C0A", // Druid
	12: "#A330C9", // Demon Hunter
	13: "#33937F", // Evoker
};

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type RosterEntry = {
	id: string;
	season_name: string;
	user_id: string;
	bnet_character_id: string | null;
	main_spec: string;
	off_spec: string | null;
	profession_1: string | null;
	profession_2: string | null;
	character_name: string;
	realm: string;
	realm_slug: string;
	class_id: number;
	level: number;
	thumbnail_url: string | null;
	created_at: string;
	updated_at: string;
};

export type BnetCharacter = {
	id: string;
	name: string;
	realm: string;
	realm_slug: string;
	class_id: number;
	level: number;
	thumbnail_url: string | null;
};

export type SpecOption = {
	spec_name: string;
	role: string;
};

export type ClassSpecsMap = Record<string, SpecOption[]>;

export type SaveResult = { ok: true } | { ok: false; error: string };

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

export const PROFESSION_LIST = [
	"Alquimia",
	"Herrería",
	"Encantamiento",
	"Ingeniería",
	"Herboristería",
	"Inscripción",
	"Joyería",
	"Peletería",
	"Minería",
	"Desuello",
	"Sastrería",
	"Cocina",
	"Pesca",
	"Arqueología",
] as const;

export const SEASON_NAME = "Season 2 Midnight";

/** Build a Blizzard CDN URL for an icon key */
export function iconUrl(iconKey: string): string {
	return `https://render.worldofwarcraft.com/us/icons/56/${iconKey}.jpg`;
}

/** Look up spec icon by class name (English) + spec name */

const CLASS_ICON_NAME: Record<string, string> = {
	WARRIOR: "Warrior",
	PALADIN: "Paladin",
	HUNTER: "Hunter",
	ROGUE: "Rogue",
	PRIEST: "Priest",
	DEATHKNIGHT: "DeathKnight",
	SHAMAN: "Shaman",
	MAGE: "Mage",
	WARLOCK: "Warlock",
	MONK: "Monk",
	DRUID: "Druid",
	DEMONHUNTER: "DemonHunter",
	EVOKER: "Evoker",
};

export function getSpecIconKey(
	classId: number,
	specName: string,
): string | undefined {
	const classKey = CLASS_ID_TO_KEY[classId];
	if (!classKey) return undefined;
	const className = CLASS_ICON_NAME[classKey];
	if (!className) return undefined;
	return SPEC_ICONS[`${className}·${specName}`];
}

/** Look up the zamimg URL for a spec icon */
export function getSpecIconUrl(
	classId: number,
	specName: string,
): string | undefined {
	const key = getSpecIconKey(classId, specName);
	if (!key) return undefined;
	return iconUrl(key);
}

/** Build profession icon zamimg URL */
export function getProfessionIconUrl(professionName: string): string {
	const key = PROFESSION_ICONS[professionName];
	if (!key) return iconUrl("inv_misc_questionmark");
	return iconUrl(key);
}

/** Build Blizzard render URL for character avatar */
export function getCharacterAvatarUrl(
	realmSlug: string,
	characterName: string,
): string {
	return `https://render.worldofwarcraft.blizzard.com/character/${realmSlug}/${characterName.toLowerCase()}`;
}


