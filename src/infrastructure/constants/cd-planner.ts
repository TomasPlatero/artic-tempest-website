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
    { id: "war_rally", name: "Rallying Cry", icon: "https://render.worldofwarcraft.com/eu/icons/56/ability_warrior_rallyingcry.jpg", duration: 180, classId: 1, color: "#C79C6E" },

    // Paladin (Class 2) - Pink (#F58CBA)
    { id: "pala_wings", name: "Avenging Wrath", icon: "https://render.worldofwarcraft.com/eu/icons/56/spell_holy_avenginwrath.jpg", duration: 120, classId: 2, color: "#F58CBA" },
    { id: "pala_am", name: "Aura Mastery", icon: "https://render.worldofwarcraft.com/eu/icons/56/spell_holy_auramastery.jpg", duration: 180, classId: 2, color: "#F58CBA" },
    { id: "pala_bop", name: "Blessing of Protection", icon: "https://render.worldofwarcraft.com/eu/icons/56/spell_holy_sealofprotection.jpg", duration: 300, classId: 2, color: "#F58CBA" },
    { id: "pala_sac", name: "Blessing of Sacrifice", icon: "https://render.worldofwarcraft.com/eu/icons/56/spell_holy_sealofsacrifice.jpg", duration: 120, classId: 2, color: "#F58CBA" },

    // Priest (Class 5) - White (#FFFFFF)
    { id: "priest_hymn", name: "Divine Hymn", icon: "https://render.worldofwarcraft.com/eu/icons/56/spell_holy_divinehymn.jpg", duration: 180, classId: 5, color: "#FFFFFF" },
    { id: "priest_salv", name: "Holy Word: Salvation", icon: "https://render.worldofwarcraft.com/eu/icons/56/ability_priest_archangel.jpg", duration: 720, classId: 5, color: "#FFFFFF" },
    { id: "priest_barrier", name: "Power Word: Barrier", icon: "https://render.worldofwarcraft.com/eu/icons/56/spell_holy_powerwordbarrier.jpg", duration: 180, classId: 5, color: "#FFFFFF" },
    { id: "priest_rapture", name: "Rapture", icon: "https://render.worldofwarcraft.com/eu/icons/56/spell_holy_rapture.jpg", duration: 90, classId: 5, color: "#FFFFFF" },
    { id: "priest_pain", name: "Pain Suppression", icon: "https://render.worldofwarcraft.com/eu/icons/56/spell_holy_painsupression.jpg", duration: 180, classId: 5, color: "#FFFFFF" },

    // Death Knight (Class 6) - Red (#C41F3B)
    { id: "dk_amz", name: "Anti-Magic Zone", icon: "https://render.worldofwarcraft.com/eu/icons/56/spell_deathknight_antimagiczone.jpg", duration: 120, classId: 6, color: "#C41F3B" },

    // Shaman (Class 7) - Blue (#0070DE)
    { id: "shaman_link", name: "Spirit Link Totem", icon: "https://render.worldofwarcraft.com/eu/icons/56/spell_shaman_spiritlink.jpg", duration: 180, classId: 7, color: "#0070DE" },
    { id: "shaman_tide", name: "Healing Tide Totem", icon: "https://render.worldofwarcraft.com/eu/icons/56/ability_shaman_healingtide.jpg", duration: 180, classId: 7, color: "#0070DE" },
    { id: "shaman_ag", name: "Ancestral Guidance", icon: "https://render.worldofwarcraft.com/eu/icons/56/ability_shaman_ancestralguidance.jpg", duration: 120, classId: 7, color: "#0070DE" },

    // Monk (Class 10) - Jade Green (#00FF96)
    { id: "monk_revival", name: "Revival", icon: "https://render.worldofwarcraft.com/eu/icons/56/spell_monk_revival.jpg", duration: 180, classId: 10, color: "#00FF96" },
    { id: "monk_yulon", name: "Invoke Yu'lon", icon: "https://render.worldofwarcraft.com/eu/icons/56/ability_monk_dragonkick.jpg", duration: 180, classId: 10, color: "#00FF96" },
    { id: "monk_cocoon", name: "Life Cocoon", icon: "https://render.worldofwarcraft.com/eu/icons/56/ability_monk_chicocoon.jpg", duration: 120, classId: 10, color: "#00FF96" },

    // Druid (Class 11) - Orange (#FF7D0A)
    { id: "druid_tranq", name: "Tranquility", icon: "https://render.worldofwarcraft.com/eu/icons/56/spell_nature_tranquility.jpg", duration: 180, classId: 11, color: "#FF7D0A" },
    { id: "druid_tree", name: "Incarnation: Tree of Life", icon: "https://render.worldofwarcraft.com/eu/icons/56/ability_druid_improvedtreeform.jpg", duration: 180, classId: 11, color: "#FF7D0A" },
    { id: "druid_convoke", name: "Convoke the Spirits", icon: "https://render.worldofwarcraft.com/eu/icons/56/ability_ardenweald_druid.jpg", duration: 120, classId: 11, color: "#FF7D0A" },
    { id: "druid_bark", name: "Ironbark", icon: "https://render.worldofwarcraft.com/eu/icons/56/spell_druid_ironbark.jpg", duration: 90, classId: 11, color: "#FF7D0A" },

    // Demon Hunter (Class 12) - Magenta (#A330C9)
    { id: "dh_darkness", name: "Darkness", icon: "https://render.worldofwarcraft.com/eu/icons/56/ability_demonhunter_darkness.jpg", duration: 180, classId: 12, color: "#A330C9" },

    // Evoker (Class 13) - Teal (#33937F)
    { id: "evoker_rewind", name: "Rewind", icon: "https://render.worldofwarcraft.com/eu/icons/56/ability_evoker_rewind.jpg", duration: 240, classId: 13, color: "#33937F" },
    { id: "evoker_dream", name: "Dream Flight", icon: "https://render.worldofwarcraft.com/eu/icons/56/ability_evoker_dreamflight.jpg", duration: 120, classId: 13, color: "#33937F" },
    { id: "evoker_communion", name: "Emerald Communion", icon: "https://render.worldofwarcraft.com/eu/icons/56/ability_evoker_green_01.jpg", duration: 180, classId: 13, color: "#33937F" },
    { id: "evoker_zephyr", name: "Zephyr", icon: "https://render.worldofwarcraft.com/eu/icons/56/ability_evoker_hoverblack.jpg", duration: 120, classId: 13, color: "#33937F" },
]

export type BossAbility = {
    time: number // Time in seconds from start
    name: string
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
    // Imperator Averzian
    "IMPERATOR AVERZIAN": [
        { time: 6, name: "Dark Upheaval" },
        { time: 17, name: "Shadow's Advance" },
        { time: 23, name: "Void Marked" },
        { time: 32, name: "Umbral Collapse" },
        { time: 37, name: "Umbral Collapse" },
        { time: 45, name: "Umbral Collapse" },
        { time: 54, name: "Dark Upheaval" },
        { time: 63, name: "Oblivion's Wrath" },
        { time: 81, name: "Oblivion's Wrath" },
        { time: 90, name: "Dark Upheaval" },
        { time: 97, name: "Shadow's Advance" },
        { time: 103, name: "Void Marked" },
        { time: 112, name: "Umbral Collapse" },
        { time: 192, name: "Dark Upheaval" },
        { time: 203, name: "Shadow's Advance" },
    ],
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
