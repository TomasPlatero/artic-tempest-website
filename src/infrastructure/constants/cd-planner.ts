export type Cooldown = {
    id: string
    name: string
    icon: string
    duration: number // CD in seconds
    classId: number
    color: string
}

export const RAID_COOLDOWNS: Cooldown[] = [
    // Warrior (Class 1) - Brown (#C79C6E)
    { id: "war_rally", name: "Rallying Cry", icon: "https://wow.zamimg.com/images/wow/icons/large/ability_warrior_rallyingcry.jpg", duration: 180, classId: 1, color: "#C79C6E" },

    // Paladin (Class 2) - Pink (#F58CBA)
    { id: "pala_wings", name: "Avenging Wrath", icon: "https://wow.zamimg.com/images/wow/icons/large/spell_holy_avenginewrath.jpg", duration: 120, classId: 2, color: "#F58CBA" },
    { id: "pala_am", name: "Aura Mastery", icon: "https://wow.zamimg.com/images/wow/icons/large/spell_holy_auramastery.jpg", duration: 180, classId: 2, color: "#F58CBA" },
    { id: "pala_bop", name: "Blessing of Protection", icon: "https://wow.zamimg.com/images/wow/icons/large/spell_holy_sealofprotection.jpg", duration: 300, classId: 2, color: "#F58CBA" },
    { id: "pala_sac", name: "Blessing of Sacrifice", icon: "https://wow.zamimg.com/images/wow/icons/large/spell_holy_sealofsacrifice.jpg", duration: 120, classId: 2, color: "#F58CBA" },

    // Priest (Class 5) - White (#FFFFFF)
    { id: "priest_hymn", name: "Divine Hymn", icon: "https://wow.zamimg.com/images/wow/icons/large/spell_holy_divinehymn.jpg", duration: 180, classId: 5, color: "#FFFFFF" },
    { id: "priest_salv", name: "Holy Word: Salvation", icon: "https://wow.zamimg.com/images/wow/icons/large/ability_priest_archangel.jpg", duration: 720, classId: 5, color: "#FFFFFF" },
    { id: "priest_barrier", name: "Power Word: Barrier", icon: "https://wow.zamimg.com/images/wow/icons/large/spell_holy_powerwordbarrier.jpg", duration: 180, classId: 5, color: "#FFFFFF" },
    { id: "priest_rapture", name: "Rapture", icon: "https://wow.zamimg.com/images/wow/icons/large/spell_holy_rapture.jpg", duration: 90, classId: 5, color: "#FFFFFF" },
    { id: "priest_pain", name: "Pain Suppression", icon: "https://wow.zamimg.com/images/wow/icons/large/spell_holy_painsupression.jpg", duration: 180, classId: 5, color: "#FFFFFF" },

    // Death Knight (Class 6) - Red (#C41F3B)
    { id: "dk_amz", name: "Anti-Magic Zone", icon: "https://wow.zamimg.com/images/wow/icons/large/spell_deathknight_antimagiczone.jpg", duration: 120, classId: 6, color: "#C41F3B" },

    // Shaman (Class 7) - Blue (#0070DE)
    { id: "shaman_link", name: "Spirit Link Totem", icon: "https://wow.zamimg.com/images/wow/icons/large/spell_shaman_spiritlink.jpg", duration: 180, classId: 7, color: "#0070DE" },
    { id: "shaman_tide", name: "Healing Tide Totem", icon: "https://wow.zamimg.com/images/wow/icons/large/ability_shaman_healingtide.jpg", duration: 180, classId: 7, color: "#0070DE" },
    { id: "shaman_ag", name: "Ancestral Guidance", icon: "https://wow.zamimg.com/images/wow/icons/large/ability_shaman_ancestralguidance.jpg", duration: 120, classId: 7, color: "#0070DE" },

    // Monk (Class 10) - Jade Green (#00FF96)
    { id: "monk_revival", name: "Revival", icon: "https://wow.zamimg.com/images/wow/icons/large/spell_monk_revival.jpg", duration: 180, classId: 10, color: "#00FF96" },
    { id: "monk_yulon", name: "Invoke Yu'lon", icon: "https://wow.zamimg.com/images/wow/icons/large/ability_monk_dragonkick.jpg", duration: 180, classId: 10, color: "#00FF96" },
    { id: "monk_cocoon", name: "Life Cocoon", icon: "https://wow.zamimg.com/images/wow/icons/large/ability_monk_chicocoon.jpg", duration: 120, classId: 10, color: "#00FF96" },

    // Druid (Class 11) - Orange (#FF7D0A)
    { id: "druid_tranq", name: "Tranquility", icon: "https://wow.zamimg.com/images/wow/icons/large/spell_nature_tranquility.jpg", duration: 180, classId: 11, color: "#FF7D0A" },
    { id: "druid_tree", name: "Incarnation: Tree of Life", icon: "https://wow.zamimg.com/images/wow/icons/large/ability_druid_improvedtreeform.jpg", duration: 180, classId: 11, color: "#FF7D0A" },
    { id: "druid_convoke", name: "Convoke the Spirits", icon: "https://wow.zamimg.com/images/wow/icons/large/ability_ardenweald_druid.jpg", duration: 120, classId: 11, color: "#FF7D0A" },
    { id: "druid_bark", name: "Ironbark", icon: "https://wow.zamimg.com/images/wow/icons/large/spell_druid_ironbark.jpg", duration: 90, classId: 11, color: "#FF7D0A" },

    // Demon Hunter (Class 12) - Magenta (#A330C9)
    { id: "dh_darkness", name: "Darkness", icon: "https://wow.zamimg.com/images/wow/icons/large/ability_demonhunter_darkness.jpg", duration: 180, classId: 12, color: "#A330C9" },

    // Evoker (Class 13) - Teal (#33937F)
    { id: "evoker_rewind", name: "Rewind", icon: "https://wow.zamimg.com/images/wow/icons/large/ability_evoker_rewind.jpg", duration: 240, classId: 13, color: "#33937F" },
    { id: "evoker_dream", name: "Dream Flight", icon: "https://wow.zamimg.com/images/wow/icons/large/ability_evoker_dreamflight.jpg", duration: 120, classId: 13, color: "#33937F" },
    { id: "evoker_communion", name: "Emerald Communion", icon: "https://wow.zamimg.com/images/wow/icons/large/ability_evoker_green_01.jpg", duration: 180, classId: 13, color: "#33937F" },
    { id: "evoker_zephyr", name: "Zephyr", icon: "https://wow.zamimg.com/images/wow/icons/large/ability_evoker_hoverblack.jpg", duration: 120, classId: 13, color: "#33937F" },
]

export type BossAbility = {
    time: number // Time in seconds from start
    name: string
}

/** Metadata for boss abilities: icon URL + color per ability name */
export const BOSS_ABILITY_META: Record<string, { icon: string; color: string; nameEs?: string }> = {
    // Imperator Averzian
    "Dark Upheaval": { icon: "https://wow.zamimg.com/images/wow/icons/large/spell_shadow_shadowfury.jpg", color: "#a855f7", nameEs: "Agitación Oscura" },
    "Shadow's Advance": { icon: "https://wow.zamimg.com/images/wow/icons/large/spell_shadow_shadowbolt.jpg", color: "#8b5cf6", nameEs: "Avance de las Sombras" },
    "Void Marked": { icon: "https://wow.zamimg.com/images/wow/icons/large/spell_priest_voidtendrils.jpg", color: "#c084fc", nameEs: "Marca del Vacío" },
    "Umbral Collapse": { icon: "https://wow.zamimg.com/images/wow/icons/large/spell_shadow_gathershadows.jpg", color: "#f43f5e", nameEs: "Colapso Umbrío" },
    "Void Rupture": { icon: "https://wow.zamimg.com/images/wow/icons/large/ability_creature_cursed_04.jpg", color: "#ec4899", nameEs: "Ruptura del Vacío" },
    "Cosmic Eruption": { icon: "https://wow.zamimg.com/images/wow/icons/large/spell_arcane_starfire.jpg", color: "#f59e0b", nameEs: "Erupción Cósmica" },
    "Void Fall": { icon: "https://wow.zamimg.com/images/wow/icons/large/spell_shadow_detectlesserinvisibility.jpg", color: "#6366f1", nameEs: "Caída del Vacío" },
    "Oblivion's Wrath": { icon: "https://wow.zamimg.com/images/wow/icons/large/spell_shadow_shadesofdarkness.jpg", color: "#ef4444", nameEs: "Ira del Olvido" },
    // Vorasius
    "Primordial Roar": { icon: "https://wow.zamimg.com/images/wow/icons/large/ability_hunter_aspectoftheviper.jpg", color: "#22c55e", nameEs: "Rugido Primordial" },
    "Smashing Frenzy": { icon: "https://wow.zamimg.com/images/wow/icons/large/ability_warrior_rampage.jpg", color: "#ef4444", nameEs: "Frenesí Aplastante" },
    "Crystalline Eruption": { icon: "https://wow.zamimg.com/images/wow/icons/large/inv_misc_gem_amethyst_02.jpg", color: "#c084fc", nameEs: "Erupción Cristalina" },
    "Parasite Expulsion": { icon: "https://wow.zamimg.com/images/wow/icons/large/spell_shadow_plaguecloud.jpg", color: "#84cc16", nameEs: "Expulsión de Parásitos" },
    "Blistercreep": { icon: "https://wow.zamimg.com/images/wow/icons/large/spell_nature_corrosivebreath.jpg", color: "#a3e635", nameEs: "Reptador Purulento" },
    "Void Breath": { icon: "https://wow.zamimg.com/images/wow/icons/large/spell_shadow_shadowandflame.jpg", color: "#a855f7", nameEs: "Aliento del Vacío" },
    // Vaelgor y Ezzorak
    "Vaelwing": { icon: "https://wow.zamimg.com/images/wow/icons/large/ability_creature_cursed_02.jpg", color: "#a855f7", nameEs: "Ala de Vael" },
    "Tail Lash": { icon: "https://wow.zamimg.com/images/wow/icons/large/ability_hunter_pet_devilsaur.jpg", color: "#ef4444", nameEs: "Latigazo de Cola" },
    "Rakfang": { icon: "https://wow.zamimg.com/images/wow/icons/large/ability_druid_ferociousbite.jpg", color: "#f97316", nameEs: "Colmillo Rak" },
    "Dread Breath": { icon: "https://wow.zamimg.com/images/wow/icons/large/spell_shadow_shadowandflame.jpg", color: "#c084fc", nameEs: "Aliento Pavoroso" },
    "Nullbeam": { icon: "https://wow.zamimg.com/images/wow/icons/large/spell_arcane_arcane04.jpg", color: "#6366f1", nameEs: "Haz Nulo" },
    "Void Howl": { icon: "https://wow.zamimg.com/images/wow/icons/large/spell_shadow_psychichorrors.jpg", color: "#8b5cf6", nameEs: "Aullido del Vacío" },
    // Rey Caído Salhadaar
    "Desperate Measures": { icon: "https://wow.zamimg.com/images/wow/icons/large/spell_shadow_unholyfrenzy.jpg", color: "#ef4444", nameEs: "Medidas Desesperadas" },
    "Twisting Obscurity": { icon: "https://wow.zamimg.com/images/wow/icons/large/spell_shadow_twilight.jpg", color: "#8b5cf6", nameEs: "Oscuridad Retorcida" },
    "Despotic Command": { icon: "https://wow.zamimg.com/images/wow/icons/large/spell_shadow_charm.jpg", color: "#f59e0b", nameEs: "Mandato Despótico" },
    "Fractured Projection": { icon: "https://wow.zamimg.com/images/wow/icons/large/spell_arcane_mindmastery.jpg", color: "#c084fc", nameEs: "Proyección Fracturada" },
    "Torturous Residue": { icon: "https://wow.zamimg.com/images/wow/icons/large/spell_shadow_gathershadows.jpg", color: "#22c55e", nameEs: "Residuo Tortuoso" },
    "Shattering Twilight": { icon: "https://wow.zamimg.com/images/wow/icons/large/spell_shadow_twilight.jpg", color: "#a855f7", nameEs: "Crepúsculo Devastador" },
    "Twilight Spikes": { icon: "https://wow.zamimg.com/images/wow/icons/large/ability_creature_cursed_03.jpg", color: "#f43f5e", nameEs: "Púas Crepusculares" },
    // Vanguardia Cegada por la Luz
    "Exorcism": { icon: "https://wow.zamimg.com/images/wow/icons/large/spell_holy_excorcism_02.jpg", color: "#fbbf24", nameEs: "Exorcismo" },
    "Blinding Light": { icon: "https://wow.zamimg.com/images/wow/icons/large/ability_paladin_blindinglight.jpg", color: "#fef08a", nameEs: "Luz Cegadora" },
    "Tyr's Wrath": { icon: "https://wow.zamimg.com/images/wow/icons/large/spell_holy_weaponmastery.jpg", color: "#f59e0b", nameEs: "Ira de Tyr" },
    "Elekk Charge": { icon: "https://wow.zamimg.com/images/wow/icons/large/ability_mount_ridingelekk.jpg", color: "#ef4444", nameEs: "Carga de Elekk" },
    "Sacred Shield": { icon: "https://wow.zamimg.com/images/wow/icons/large/ability_paladin_blessedmending.jpg", color: "#fbbf24", nameEs: "Escudo Sagrado" },
    // Corona del Cosmos
    "Dark Arrow": { icon: "https://wow.zamimg.com/images/wow/icons/large/ability_theblackarrow.jpg", color: "#8b5cf6", nameEs: "Flecha Oscura" },
    "Void Eruption": { icon: "https://wow.zamimg.com/images/wow/icons/large/spell_priest_void-blast.jpg", color: "#a855f7", nameEs: "Erupción del Vacío" },
    "Shadow Step": { icon: "https://wow.zamimg.com/images/wow/icons/large/ability_rogue_shadowstep.jpg", color: "#6366f1", nameEs: "Paso de las Sombras" },
    "Alleria's Judgement": { icon: "https://wow.zamimg.com/images/wow/icons/large/spell_holy_righteousfury.jpg", color: "#fbbf24", nameEs: "Sentencia de Alleria" },
}

export const BOSS_TIMELINES: Record<string, BossAbility[]> = {
    // Vaelgor y Ezzorak
    "VAELGOR Y EZZORAK": [
        { time: 7, name: "Vaelwing" },
        { time: 8, name: "Tail Lash" },
        { time: 13, name: "Rakfang" },
        { time: 17, name: "Dread Breath" },
        { time: 22, name: "Nullbeam" },
        { time: 28, name: "Void Howl" },
        { time: 64, name: "Nullbeam" },
        { time: 73, name: "Void Howl" },
        { time: 114, name: "Dread Breath" },
    ],
    // Vorasius
    "VORASIUS": [
        { time: 11, name: "Primordial Roar" },
        { time: 17, name: "Smashing Frenzy" },
        { time: 22, name: "Crystalline Eruption" },
        { time: 27, name: "Smashing Frenzy" },
        { time: 32, name: "Smashing Frenzy" },
        { time: 59, name: "Parasite Expulsion" },
        { time: 66, name: "Blistercreep" },
        { time: 102, name: "Void Breath" },
        { time: 131, name: "Primordial Roar" },
        { time: 182, name: "Parasite Expulsion" },
        { time: 188, name: "Blistercreep" },
    ],
    // Imperator Averzian (from Viserio - full fight ~9:15)
    "IMPERATOR AVERZIAN": [
        // Dark Upheaval
        { time: 7, name: "Dark Upheaval" },
        { time: 55, name: "Dark Upheaval" },
        { time: 91, name: "Dark Upheaval" },
        { time: 137, name: "Dark Upheaval" },
        { time: 193, name: "Dark Upheaval" },
        { time: 241, name: "Dark Upheaval" },
        { time: 277, name: "Dark Upheaval" },
        { time: 370, name: "Dark Upheaval" },
        { time: 427, name: "Dark Upheaval" },
        { time: 463, name: "Dark Upheaval" },
        // Shadow's Advance
        { time: 17, name: "Shadow's Advance" },
        { time: 67, name: "Shadow's Advance" },
        { time: 77, name: "Shadow's Advance" },
        { time: 97, name: "Shadow's Advance" },
        { time: 142, name: "Shadow's Advance" },
        { time: 189, name: "Shadow's Advance" },
        { time: 209, name: "Shadow's Advance" },
        { time: 283, name: "Shadow's Advance" },
        { time: 289, name: "Shadow's Advance" },
        { time: 389, name: "Shadow's Advance" },
        { time: 417, name: "Shadow's Advance" },
        { time: 469, name: "Shadow's Advance" },
        // Void Marked
        { time: 23, name: "Void Marked" },
        { time: 103, name: "Void Marked" },
        { time: 125, name: "Void Marked" },
        { time: 205, name: "Void Marked" },
        { time: 311, name: "Void Marked" },
        // Umbral Collapse
        { time: 32, name: "Umbral Collapse" },
        { time: 45, name: "Umbral Collapse" },
        { time: 125, name: "Umbral Collapse" },
        { time: 171, name: "Umbral Collapse" },
        { time: 189, name: "Umbral Collapse" },
        { time: 244, name: "Umbral Collapse" },
        { time: 311, name: "Umbral Collapse" },
        { time: 319, name: "Umbral Collapse" },
        { time: 357, name: "Umbral Collapse" },
        { time: 425, name: "Umbral Collapse" },
        { time: 497, name: "Umbral Collapse" },
        // Void Rupture
        { time: 54, name: "Void Rupture" },
        { time: 58, name: "Void Rupture" },
        { time: 133, name: "Void Rupture" },
        { time: 138, name: "Void Rupture" },
        { time: 244, name: "Void Rupture" },
        { time: 324, name: "Void Rupture" },
        // Cosmic Eruption
        { time: 168, name: "Cosmic Eruption" },
        { time: 244, name: "Cosmic Eruption" },
        { time: 249, name: "Cosmic Eruption" },
        { time: 352, name: "Cosmic Eruption" },
        { time: 430, name: "Cosmic Eruption" },
        { time: 505, name: "Cosmic Eruption" },
        // Void Fall
        { time: 46, name: "Void Fall" },
        { time: 249, name: "Void Fall" },
        { time: 267, name: "Void Fall" },
        // Oblivion's Wrath
        { time: 63, name: "Oblivion's Wrath" },
        { time: 81, name: "Oblivion's Wrath" },
        { time: 249, name: "Oblivion's Wrath" },
        { time: 267, name: "Oblivion's Wrath" },
        { time: 435, name: "Oblivion's Wrath" },
        { time: 453, name: "Oblivion's Wrath" },
    ].sort((a, b) => a.time - b.time),
    // Rey Caído Salhadaar
    "REY CAÍDO SALHADAAR": [
        { time: 12, name: "Desperate Measures" },
        { time: 16, name: "Twisting Obscurity" },
        { time: 24, name: "Despotic Command" },
        { time: 26, name: "Fractured Projection" },
        { time: 36, name: "Torturous Residue" },
        { time: 50, name: "Shattering Twilight" },
        { time: 52, name: "Twilight Spikes" },
        { time: 70, name: "Despotic Command" },
        { time: 72, name: "Fractured Projection" },
        { time: 83, name: "Torturous Residue" },
    ],
    // War Chaplain Senn / Vanguardia Cegada por la Luz
    "VANGUARDIA CEGADA POR LA LUZ": [
        { time: 15, name: "Exorcism" },
        { time: 25, name: "Blinding Light" },
        { time: 45, name: "Tyr's Wrath" },
        { time: 60, name: "Elekk Charge" },
        { time: 90, name: "Sacred Shield" },
    ],
    // Alleria Windrunner / Corona del Cosmos 
    "CORONA DEL COSMOS": [
        { time: 12, name: "Dark Arrow" },
        { time: 25, name: "Void Eruption" },
        { time: 40, name: "Shadow Step" },
        { time: 70, name: "Alleria's Judgement" },
    ]
}
