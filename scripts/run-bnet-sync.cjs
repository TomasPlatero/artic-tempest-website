require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const MIDNIGHT_INSTANCES = [1307, 1308, 1314];
const V2_DIFFICULTIES = ["lfr", "normal", "heroic", "mythic"];
const MIDNIGHT_S1_ILVL = {
  lfr: { base: 233, final: 240 },
  normal: { base: 246, final: 253 },
  heroic: { base: 259, final: 269 },
  mythic: { base: 272, final: 282 },
};
const CLASS_KEY_BY_ID = {
  1: "warrior",
  2: "paladin",
  3: "hunter",
  4: "rogue",
  5: "priest",
  6: "deathknight",
  7: "shaman",
  8: "mage",
  9: "warlock",
  10: "monk",
  11: "druid",
  12: "demonhunter",
  13: "evoker",
};
const CLASS_WEAPON_RULES = {
  1: {
    weaponTypes: [
      "axe",
      "sword",
      "mace",
      "dagger",
      "polearm",
      "staff",
      "fist",
      "shield",
    ],
    handTypes: ["one_hand", "two_hand", "main_hand", "off_hand"],
  },
  2: {
    weaponTypes: ["axe", "sword", "mace", "shield"],
    handTypes: ["one_hand", "two_hand", "main_hand", "off_hand"],
  },
  3: {
    weaponTypes: [
      "axe",
      "sword",
      "polearm",
      "staff",
      "dagger",
      "fist",
      "bow",
      "gun",
      "crossbow",
    ],
    handTypes: ["one_hand", "two_hand", "main_hand"],
  },
  4: {
    weaponTypes: ["axe", "sword", "mace", "dagger", "fist", "glaive"],
    handTypes: ["one_hand", "main_hand", "off_hand"],
  },
  5: {
    weaponTypes: ["mace", "dagger", "staff", "wand", "offhand_frill"],
    handTypes: ["one_hand", "two_hand", "main_hand", "off_hand"],
  },
  6: {
    weaponTypes: ["axe", "sword", "mace", "polearm"],
    handTypes: ["one_hand", "two_hand", "main_hand"],
  },
  7: {
    weaponTypes: ["axe", "mace", "dagger", "staff", "fist", "shield"],
    handTypes: ["one_hand", "two_hand", "main_hand", "off_hand"],
  },
  8: {
    weaponTypes: ["sword", "dagger", "staff", "wand", "offhand_frill"],
    handTypes: ["one_hand", "two_hand", "main_hand", "off_hand"],
  },
  9: {
    weaponTypes: ["sword", "dagger", "staff", "wand", "offhand_frill"],
    handTypes: ["one_hand", "two_hand", "main_hand", "off_hand"],
  },
  10: {
    weaponTypes: ["axe", "mace", "sword", "staff", "fist", "offhand_frill"],
    handTypes: ["one_hand", "two_hand", "main_hand", "off_hand"],
  },
  11: {
    weaponTypes: [
      "mace",
      "sword",
      "dagger",
      "polearm",
      "staff",
      "fist",
      "offhand_frill",
    ],
    handTypes: ["one_hand", "two_hand", "main_hand", "off_hand"],
  },
  12: {
    weaponTypes: ["axe", "sword", "fist", "glaive"],
    handTypes: ["one_hand", "main_hand", "off_hand"],
  },
  13: {
    weaponTypes: [
      "axe",
      "mace",
      "sword",
      "dagger",
      "staff",
      "fist",
      "offhand_frill",
    ],
    handTypes: ["one_hand", "two_hand", "main_hand", "off_hand"],
  },
};

const {
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  BNET_CLIENT_ID,
  BNET_CLIENT_SECRET,
} = process.env;

if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase environment variables");
}

if (!BNET_CLIENT_ID || !BNET_CLIENT_SECRET) {
  throw new Error("Missing Battle.net environment variables");
}

const supabase = createClient(
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false },
  },
);

let accessToken = null;
let accessTokenExpiresAt = 0;

function log(message) {
  process.stdout.write(`${message}\n`);
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

async function getAccessToken() {
  if (accessToken && Date.now() < accessTokenExpiresAt) {
    return accessToken;
  }

  const authString = Buffer.from(
    `${BNET_CLIENT_ID}:${BNET_CLIENT_SECRET}`,
  ).toString("base64");
  const res = await fetch("https://oauth.battle.net/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${authString}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Battle.net token: ${await res.text()}`);
  }

  const data = await res.json();
  accessToken = data.access_token;
  accessTokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return accessToken;
}

async function fetchBnet(url) {
  const token = await getAccessToken();
  const separator = url.includes("?") ? "&" : "?";
  const finalUrl = `${url}${separator}namespace=static-eu&locale=es_ES`;
  const res = await fetch(finalUrl, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Battle.net API error (${res.status}) on ${finalUrl}`);
  }

  return res.json();
}

function mapRole(role) {
  switch (String(role || "").toLowerCase()) {
    case "tank":
      return "tank";
    case "heal":
      return "heal";
    case "melee":
      return "melee_dps";
    case "ranged":
      return "ranged_dps";
    default:
      return "ranged_dps";
  }
}

function mapArmorType(itemClassId, subclassId) {
  if (itemClassId !== 4) return null;
  if (subclassId === 1) return "cloth";
  if (subclassId === 2) return "leather";
  if (subclassId === 3) return "mail";
  if (subclassId === 4) return "plate";
  return null;
}

function mapWeaponType(itemClassId, subclassId, inventoryType) {
  const inv = String(inventoryType || "").toUpperCase();
  if (inv === "SHIELD") return "shield";
  if (itemClassId !== 2) {
    if (inv === "HOLDABLE") return "offhand_frill";
    return null;
  }
  if (subclassId === 0 || subclassId === 1) return "axe";
  if (subclassId === 4 || subclassId === 5) return "mace";
  if (subclassId === 6) return "polearm";
  if (subclassId === 7 || subclassId === 8) return "sword";
  if (subclassId === 10) return "staff";
  if (subclassId === 13) return "fist";
  if (subclassId === 14) return "glaive";
  if (subclassId === 15) return "dagger";
  if (subclassId === 18) return "crossbow";
  if (subclassId === 19) return "wand";
  return null;
}

function mapHandType(inventoryType, itemClassId, itemSubclassId) {
  if (
    itemClassId === 2 &&
    [1, 5, 6, 8, 10, 18].includes(Number(itemSubclassId))
  ) {
    return "two_hand";
  }

  switch (String(inventoryType || "").toUpperCase()) {
    case "2HWEAPON":
    case "RANGEDRIGHT":
      return "two_hand";
    case "WEAPON":
    case "WEAPONMAINHAND":
      return "main_hand";
    case "WEAPONOFFHAND":
    case "HOLDABLE":
    case "SHIELD":
      return "off_hand";
    default:
      return "one_hand";
  }
}

function mapSlot(inventoryType) {
  switch (String(inventoryType || "").toUpperCase()) {
    case "HEAD":
      return "head";
    case "NECK":
      return "neck";
    case "SHOULDER":
      return "shoulder";
    case "CLOAK":
      return "back";
    case "CHEST":
    case "ROBE":
      return "chest";
    case "WRIST":
      return "wrist";
    case "HAND":
      return "hands";
    case "WAIST":
      return "waist";
    case "LEGS":
      return "legs";
    case "FEET":
      return "feet";
    case "FINGER":
      return "finger";
    case "TRINKET":
      return "trinket";
    case "SHIELD":
    case "HOLDABLE":
    case "WEAPONOFFHAND":
      return "offhand";
    default:
      return "weapon";
  }
}

function extractTokenMetadata(itemData) {
  const spellDescriptions = (itemData?.preview_item?.spells || [])
    .map((entry) => String(entry?.description || ""))
    .filter(Boolean);
  const combinedDescription = spellDescriptions.join(" ").toLowerCase();

  let tokenSlot = null;
  if (
    combinedDescription.includes(" shoulder item") ||
    combinedDescription.includes("objeto de hombros")
  )
    tokenSlot = "shoulder";
  else if (
    combinedDescription.includes(" chest item") ||
    combinedDescription.includes("objeto de torso") ||
    combinedDescription.includes("objeto de pecho")
  )
    tokenSlot = "chest";
  else if (
    combinedDescription.includes(" hand item") ||
    combinedDescription.includes("objeto de manos")
  )
    tokenSlot = "hands";
  else if (
    combinedDescription.includes(" leg item") ||
    combinedDescription.includes("objeto de piernas")
  )
    tokenSlot = "legs";
  else if (
    combinedDescription.includes(" helm item") ||
    combinedDescription.includes(" head item") ||
    combinedDescription.includes("objeto de cabeza")
  )
    tokenSlot = "head";

  const playableClasses =
    itemData?.preview_item?.requirements?.playable_classes?.links || [];
  const allowableClasses = playableClasses
    .map((entry) => Number(entry?.id))
    .filter(Boolean);

  const isTierToken =
    combinedDescription.includes("synthesize a soulbound set") ||
    combinedDescription.includes("sintetiza un objeto") ||
    combinedDescription.includes("set item appropriate for your class") ||
    combinedDescription.includes("apropiado para tu clase");

  return {
    isToken: isTierToken,
    tokenSlot,
    allowableClasses,
    spellDescriptions,
  };
}

function mapPrimaryStats(itemData) {
  const stats = itemData?.preview_item?.stats || itemData?.stats || [];
  const values = new Set();
  for (const stat of stats) {
    const token = stat?.type?.type ?? stat?.type ?? stat?.id;
    const type = String(token || "").toUpperCase();
    const numericId = Number(token);
    if (type.includes("STRENGTH") || numericId === 4 || numericId === 74)
      values.add("strength");
    if (
      type.includes("AGILITY") ||
      numericId === 3 ||
      numericId === 72 ||
      numericId === 73
    )
      values.add("agility");
    if (
      type.includes("INTELLECT") ||
      numericId === 5 ||
      numericId === 72 ||
      numericId === 73 ||
      numericId === 74
    )
      values.add("intellect");
  }
  return values.size > 0 ? Array.from(values) : ["none"];
}

function extractItemStats(itemData) {
  const stats = itemData?.preview_item?.stats || itemData?.stats || [];
  const output = {
    strength: 0,
    agility: 0,
    intellect: 0,
    stamina: 0,
    crit: 0,
    haste: 0,
    mastery: 0,
    versatility: 0,
    leech: 0,
    avoidance: 0,
    speed: 0,
    armor: 0,
    raw: stats,
  };

  for (const stat of stats) {
    const type = String(stat?.type?.type || stat?.type || "").toUpperCase();
    const value =
      Number(stat?.value || stat?.display?.display_string || 0) || 0;
    if (type.includes("STRENGTH")) output.strength = value;
    else if (type.includes("AGILITY")) output.agility = value;
    else if (type.includes("INTELLECT")) output.intellect = value;
    else if (type.includes("STAMINA")) output.stamina = value;
    else if (type.includes("CRIT")) output.crit = value;
    else if (type.includes("HASTE")) output.haste = value;
    else if (type.includes("MASTERY")) output.mastery = value;
    else if (type.includes("VERS")) output.versatility = value;
    else if (type.includes("LEECH")) output.leech = value;
    else if (type.includes("AVOIDANCE")) output.avoidance = value;
    else if (type.includes("SPEED")) output.speed = value;
    else if (type === "ARMOR") output.armor = value;
  }

  return output;
}

function inferItemLevel(difficulty, isFinalBoss) {
  return isFinalBoss
    ? MIDNIGHT_S1_ILVL[difficulty].final
    : MIDNIGHT_S1_ILVL[difficulty].base;
}

async function seedV2Rules() {
  const [{ data: classes }, { data: specs }] = await Promise.all([
    supabase.from("wow_classes").select("id, armor_type"),
    supabase
      .from("wow_specializations")
      .select("id, class_id, name, role, main_stat"),
  ]);

  const classRows = (classes || [])
    .map((wowClass) => ({
      class_key: CLASS_KEY_BY_ID[wowClass.id],
      armor_proficiency: String(wowClass.armor_type || "").toLowerCase(),
      default_roles: Array.from(
        new Set(
          (specs || [])
            .filter((spec) => spec.class_id === wowClass.id)
            .map((spec) => mapRole(spec.role)),
        ),
      ),
    }))
    .filter((row) => row.class_key && row.armor_proficiency);

  if (classRows.length) {
    await supabase
      .from("class_rules")
      .upsert(classRows, { onConflict: "class_key" });
  }

  const classWeaponRows = (classes || []).flatMap((wowClass) => {
    const classKey = CLASS_KEY_BY_ID[wowClass.id];
    const rules = CLASS_WEAPON_RULES[wowClass.id];
    if (!classKey || !rules) return [];
    return rules.weaponTypes.flatMap((weaponType) =>
      rules.handTypes.map((handType) => ({
        class_key: classKey,
        weapon_type: weaponType,
        hand_type: handType,
      })),
    );
  });

  if (classWeaponRows.length) {
    await supabase.from("class_weapon_rules").upsert(classWeaponRows, {
      onConflict: "class_key,weapon_type,hand_type",
    });
  }

  const specRows = (specs || [])
    .map((spec) => {
      const classKey = CLASS_KEY_BY_ID[spec.class_id];
      const weaponRules = CLASS_WEAPON_RULES[spec.class_id];
      if (!classKey || !weaponRules) return null;
      const specName = String(spec.name || "");
      const allowsShield =
        (spec.class_id === 1 && specName === "Protection") ||
        (spec.class_id === 2 &&
          (specName === "Protection" || specName === "Holy")) ||
        (spec.class_id === 7 &&
          (specName === "Elemental" || specName === "Restoration"));
      return {
        spec_key: String(spec.id),
        class_key: classKey,
        spec_name: specName,
        role: mapRole(spec.role),
        primary_stats: [String(spec.main_stat || "none").toLowerCase()],
        allowed_weapon_types: weaponRules.weaponTypes,
        allowed_hand_types: weaponRules.handTypes,
        allows_shield: allowsShield,
      };
    })
    .filter(Boolean);

  if (specRows.length) {
    await supabase
      .from("spec_rules")
      .upsert(specRows, { onConflict: "spec_key" });
  }
}

async function upsertV2Raid(instanceId, instanceName) {
  const { data, error } = await supabase
    .from("raids")
    .upsert(
      {
        expansion: "Midnight",
        bnet_instance_id: instanceId,
        slug: slugify(instanceName),
        name: instanceName,
        content_type: "raid",
        source: "blizzard",
        raw: {},
      },
      { onConflict: "expansion,bnet_instance_id" },
    )
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function upsertV2Boss(
  raidId,
  encounterId,
  bossName,
  orderIndex,
  isFinalBoss,
) {
  const { data, error } = await supabase
    .from("bosses")
    .upsert(
      {
        raid_id: raidId,
        bnet_encounter_id: encounterId,
        slug: slugify(bossName),
        name: bossName,
        order_index: orderIndex,
        is_final: isFinalBoss,
        source: "blizzard",
        raw: {},
      },
      { onConflict: "raid_id,bnet_encounter_id" },
    )
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function upsertV2Item(itemData, iconUrl, difficulty, isFinalBoss) {
  const itemClassId = itemData?.item_class?.id || null;
  const tokenMetadata = extractTokenMetadata(itemData);
  const slot =
    tokenMetadata.tokenSlot || mapSlot(itemData?.inventory_type?.type);
  const weaponType = mapWeaponType(
    itemClassId,
    itemData?.item_subclass?.id,
    itemData?.inventory_type?.type,
  );
  const armorType = mapArmorType(itemClassId, itemData?.item_subclass?.id);
  const handType =
    slot === "weapon" || slot === "offhand"
      ? mapHandType(
          itemData?.inventory_type?.type,
          itemClassId,
          itemData?.item_subclass?.id,
        )
      : null;
  const primaryStats = mapPrimaryStats(itemData);
  const itemStats = extractItemStats(itemData);
  const itemName =
    typeof itemData.name === "string"
      ? itemData.name
      : itemData.name?.es_ES || itemData.name?.en_US || `Item ${itemData.id}`;
  const itemClassName =
    typeof itemData?.item_class?.name === "string"
      ? itemData.item_class.name
      : itemData?.item_class?.name?.es_ES ||
        itemData?.item_class?.name?.en_US ||
        null;
  const itemSubclassName =
    typeof itemData?.item_subclass?.name === "string"
      ? itemData.item_subclass.name
      : itemData?.item_subclass?.name?.es_ES ||
        itemData?.item_subclass?.name?.en_US ||
        null;

  const { data, error } = await supabase
    .from("items")
    .upsert(
      {
        bnet_item_id: itemData.id,
        difficulty,
        variant: "base",
        name: itemName,
        slug: slugify(itemName),
        quality_type: String(itemData?.quality?.type || "EPIC").toLowerCase(),
        item_level: inferItemLevel(difficulty, isFinalBoss),
        required_level: itemData.required_level || 0,
        slot,
        inventory_type: itemData?.inventory_type?.type || slot.toUpperCase(),
        item_class_id: itemClassId,
        item_class_name: itemClassName,
        item_subclass_id: itemData?.item_subclass?.id || null,
        item_subclass_name: itemSubclassName,
        armor_type: armorType,
        weapon_type: weaponType,
        hand_type: handType,
        primary_stats: primaryStats,
        is_trinket: slot === "trinket",
        is_tier_piece: tokenMetadata.isToken,
        icon_url: iconUrl,
        media_url: iconUrl,
        api_href: itemData?._links?.self?.href || null,
        source: "blizzard",
        raw: {
          itemClass: itemClassId,
          itemSubClass: itemData?.item_subclass?.id || null,
          inventoryType: itemData?.inventory_type?.type || null,
          stats: itemData?.preview_item?.stats || itemData?.stats || [],
          isToken: tokenMetadata.isToken,
          tokenSlot: tokenMetadata.tokenSlot,
          allowableClasses: tokenMetadata.allowableClasses,
          spells: tokenMetadata.spellDescriptions,
        },
      },
      { onConflict: "bnet_item_id,difficulty,variant" },
    )
    .select("id")
    .single();
  if (error) throw error;

  await supabase
    .from("item_stats")
    .upsert({ item_id: data.id, ...itemStats }, { onConflict: "item_id" });
  return data.id;
}

async function main() {
  const tierId = Number(process.argv[2] || "516");
  log(`Starting standalone Battle.net sync for tier ${tierId}...`);

  await seedV2Rules();
  log("=> Reglas V2 listas.");

  const expansion = await fetchBnet(
    `https://eu.api.blizzard.com/data/wow/journal-expansion/${tierId}`,
  );
  const expansionName =
    typeof expansion.name === "string"
      ? expansion.name
      : expansion.name?.es_ES || expansion.name?.en_US || "Unknown Expansion";

  await supabase
    .from("bnet_expansions")
    .upsert({ id: expansion.id, name: expansionName });

  const instanceRefs = (expansion.dungeons || [])
    .concat(expansion.raids || [])
    .filter((item) => MIDNIGHT_INSTANCES.includes(item.id));
  let totalItems = 0;

  for (const instRef of instanceRefs) {
    const instData = await fetchBnet(
      `https://eu.api.blizzard.com/data/wow/journal-instance/${instRef.id}`,
    );
    const instName =
      typeof instData.name === "string"
        ? instData.name
        : instData.name?.es_ES || instData.name?.en_US;
    log(`---> ${instName} (${instData.id})`);

    await supabase
      .from("bnet_instances")
      .upsert({ id: instData.id, name: instName, expansion_id: expansion.id });
    const raidId = await upsertV2Raid(instData.id, instName);

    const encounters = instData.encounters || [];
    for (let index = 0; index < encounters.length; index++) {
      const encounter = await fetchBnet(
        `https://eu.api.blizzard.com/data/wow/journal-encounter/${encounters[index].id}`,
      );
      const encounterName =
        typeof encounter.name === "string"
          ? encounter.name
          : encounter.name?.es_ES || encounter.name?.en_US;
      log(`-----> ${encounterName} (${encounter.id})`);

      await supabase.from("bnet_encounters").upsert({
        id: encounter.id,
        name: encounterName,
        instance_id: instData.id,
      });
      const bossId = await upsertV2Boss(
        raidId,
        encounter.id,
        encounterName,
        index,
        index === encounters.length - 1,
      );

      const lootItems = encounter.items || [];
      let processedForBoss = 0;
      for (const lootRef of lootItems) {
        try {
          const itemId = lootRef.item.id;
          const itemData = await fetchBnet(
            `https://eu.api.blizzard.com/data/wow/item/${itemId}`,
          );
          let iconUrl = null;
          try {
            const mediaData = await fetchBnet(
              `https://eu.api.blizzard.com/data/wow/media/item/${itemId}`,
            );
            iconUrl = mediaData.assets?.[0]?.value || null;
          } catch {}

          const itemName =
            typeof itemData.name === "string"
              ? itemData.name
              : itemData.name?.es_ES || itemData.name?.en_US;
          await supabase.from("bnet_items").upsert({
            id: itemData.id,
            name: itemName,
            quality: itemData.quality.type,
            item_level: itemData.level,
            required_level: itemData.required_level,
            icon: iconUrl,
            item_class_id: itemData.item_class.id,
            item_subclass_id: itemData.item_subclass.id,
            inventory_type: itemData.inventory_type.type,
          });
          await supabase
            .from("bnet_encounter_loot")
            .upsert({ encounter_id: encounter.id, item_id: itemData.id });

          for (const difficulty of V2_DIFFICULTIES) {
            const v2ItemId = await upsertV2Item(
              itemData,
              iconUrl,
              difficulty,
              index === encounters.length - 1,
            );
            await supabase
              .from("boss_drops")
              .upsert(
                { boss_id: bossId, item_id: v2ItemId, drop_type: "boss" },
                { onConflict: "boss_id,item_id" },
              );
          }

          processedForBoss += 1;
          totalItems += 1;
          if (
            processedForBoss % 5 === 0 ||
            processedForBoss === lootItems.length
          ) {
            log(
              `        [✔] ${processedForBoss}/${lootItems.length} objetos cacheados...`,
            );
          }
        } catch (error) {
          log(`        [!] ${error.message}`);
        }
      }
    }
  }

  log(
    `✅ Sync completada. Expansión: ${expansionName}. Instancias: ${instanceRefs.length}. Objetos procesados: ${totalItems}.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
