import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const sb = createClient(url, key);

const nameMap: Record<string, string> = {
    "Rallying Cry": "Grito de convocación",
    "Ravager": "Devastador",
    "Shattering Throw": "Lanzamiento destrozador",
    "Spell Reflection": "Reflejo de hechizos",
    "Die by the Sword": "Muerte a espada",
    "Shield Wall": "Muro de escudos",
    "Enraged Regeneration": "Regeneración enfurecida",
    "Bladestorm": "Filotormenta",
    "Avatar": "Avatar",
    "Recklessness": "Temeridad",
    "Divine Toll": "Estrago divino",
    "Avenging Wrath": "Cólera vengativa",
    "Aura Mastery": "Maestría en auras",
    "Blessing of Sacrifice": "Bendición de sacrificio",
    "Avenging Crusader": "Cruzado vengativo",
    "Divine Shield": "Escudo divino",
    "Blessing of Protection": "Bendición de protección",
    "Lay on Hands": "Imposición de manos",
    "Blessing of Spellwarding": "Bendición de resguardo de hechizos",
    "Divine Protection": "Protección divina",
    "Exhilaration": "Excitación",
    "Aspect of the Turtle": "Aspecto de la tortuga",
    "Harpoon": "Arpón",
    "Survival of the Fittest": "Supervivencia del más fuerte",
    "Roar of Sacrifice": "Rugido de sacrificio",
    "Aspect of the Cheetah": "Aspecto del guepardo",
    "Feint": "Amago",
    "Shroud of Concealment": "Embozo de encubrimiento",
    "Cheat Death": "Burlar a la muerte",
    "Voidform": "Forma del Vacío",
    "Desperate Prayer": "Rezo desesperado",
    "Power Word: Barrier": "Palabra de poder: barrera",
    "Divine Hymn": "Himno divino",
    "Power Infusion": "Infusión de poder",
    "Apotheosis": "Apoteosis",
    "Ultimate Penitence": "Penitencia definitiva",
    "Halo": "Halo",
    "Symbol of Hope": "Símbolo de esperanza",
    "Guardian Spirit": "Espíritu guardián",
    "Dispersion": "Dispersión",
    "Pain Suppression": "Supresión de dolor",
    "Evangelism": "Evangelismo",
    "Wraith Walk": "Paso espectral",
    "Pillar of Frost": "Pilar de escarcha",
    "Lichborne": "Exánime nato",
    "Army of the Dead": "Ejército de muertos",
    "Breath of Sindragosa": "Aliento de Sindragosa",
    "Carga de la Muerte": "Carga de la muerte",
    "Anti-Magic Zone": "Zona antimagia",
    "Icebound Fortitude": "Entereza ligada al hielo",
    "Raise Dead": "Levantar a los muertos",
    "Anti-Magic Shell": "Caparazón antimagia",
    "Guardia de la Tormenta": "Guardia de la Tormenta",
    "Gracia del caminaespritus": "Gracia del caminaespíritus",
    "Spirit Link Totem": "Tótem Enlace de Espíritu",
    "Vientos de fatalidad": "Vientos de fatalidad",
    "Ascensin": "Ascensión",
    "Ttem de Marea de sanacin": "Tótem de Marea de sanación",
    "Ttem de Carga de viento": "Tótem de Carga de viento",
    "Cambio astral": "Cambio astral",
    "Ttem de Proteccin ancestral": "Tótem de Protección ancestral",
    "Capacidad primordial": "Capacidad primordial",
    "Elemental de Tierra": "Elemental de Tierra",
    "Ice Block": "Bloque de hielo",
    "Dominacin vil": "Dominación vil",
    "Pacto oscuro": "Pacto oscuro",
    "Malevolencia": "Malevolencia",
    "Resolucin inagotable": "Resolución inagotable",
    "Summon Doomguard": "Invocar guardia apocalíptico",
    "Invocar miradaoscura": "Invocar miradaoscura",
    "Invocar infernal": "Invocar infernal",
    "Portal demonaco": "Portal demoníaco",
    "Grimorio: Devastador vil": "Grimorio: Devastador vil",
    "Grimorio: Seor de los diablillos": "Grimorio: Señor de los diablillos",
    "Invocar tirano demonaco": "Invocar tirano demoníaco",
    "Dark Harvest": "Cosecha oscura",
    "Mitigar dao": "Mitigar daño",
    "Fortifying Brew": "Brebaje reconstituyente",
    "Diffuse Magic": "Difuminar magia",
    "Crislida vital": "Crisálida vital",
    "Toque de karma": "Toque de karma",
    "Transcendence": "Trascendencia",
    "Reanimacin": "Reanimación",
    "Anillo de paz": "Anillo de paz",
    "Invocar a Chi-Ji, la Grulla Roja": "Invocar a Chi-Ji, la Grulla Roja",
    "Corteza de hierro": "Corteza de hierro",
    "Fuerza de la Naturaleza": "Fuerza de la Naturaleza",
    "Carga salvaje": "Carga salvaje",
    "Encarnacin: Elegido de Elune": "Encarnación: Elegido de Elune",
    "Rugido de estampida": "Rugido de estampida",
    "Instintos de supervivencia": "Instintos de supervivencia",
    "Barkskin": "Piel de corteza",
    "Celestial Alignment": "Alineación celestial",
    "Furia de Elune": "Furia de Elune",
    "Encarnacin: rbol de vida": "Encarnación: Árbol de vida",
    "Tranquilidad": "Tranquilidad",
    "Forma de oso": "Forma de oso",
    "Innervate": "Estimular",
    "Berserk": "Rabia",
    "Convoke the Spirits": "Convocar a los espíritus",
    "Ironfur": "Pelaje de hierro",
    "Tiger Dash": "Carrerilla del tigre",
    "Demon Spikes": "Púas demoníacas",
    "Sigil of Spite": "Sello de inquina",
    "Vengeful Retreat": "Retirada vengativa",
    "The Hunt": "La Caza",
    "Sigil of Chains": "Sello de cadenas",
    "Fiery Brand": "Marca ígnea",
    "Soul Carver": "Rajatallador de almas",
    "Metamorphosis": "Metamorfosis",
    "Darkness": "Oscuridad",
    "Blur": "Desenfoque",
    "Rescue": "Rescate",
    "Rewind": "Rebobinar",
    "Tip the Scales": "Inclinar la balanza",
    "Renewing Blaze": "Llama renovadora",
    "Dream Flight": "Vuelo onírico",
    "Escamas obsidiana": "Escamas de obsidiana",
    "Emerald Communion": "Comunión esmeralda",
    "Stasis": "Éxtasis",
    "Spatial Paradox": "Paradoja espacial",
    "Zephyr": "Céfiro",
    "Time Spiral": "Espiral temporal",
    "Time Dilation": "Dilatación temporal",
    "Death's Advance": "Avance de la muerte",
    "Frostwyrm's Fury": "Furia de la vermis de escarcha",
    "Champion's Spear": "Lanza del campeón"
};

async function run() {
    // Update in DB
    const { data, error } = await sb.from('cooldown_definitions').select('id, name');
    if (error) {
        console.error("DB Error:", error);
        return;
    }
    let count = 0;
    for (const item of data) {
        let oldName = item.name.trim();
        let translated = nameMap[oldName];
        if (translated) {
            await sb.from('cooldown_definitions').update({ name: translated }).eq('id', item.id);
            count++;
        }
    }
    console.log(`Updated ${count} cooldowns in the database.`);

    // Update in route.ts
    const routePath = 'src/app/api/cd-planner/cooldowns/seed/route.ts';
    let routeText = fs.readFileSync(routePath, 'utf8');
    let fileCount = 0;
    for (const [eng, span] of Object.entries(nameMap)) {
        const regex = new RegExp(`name:\\s*'${eng.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`, 'g');
        if (routeText.match(regex)) {
            routeText = routeText.replace(regex, `name: '${span}'`);
            fileCount++;
        }
    }
    fs.writeFileSync(routePath, routeText, 'utf8');
    console.log(`Updated ${fileCount} names in the seed route.`);
}

run();
