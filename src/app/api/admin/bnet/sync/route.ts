import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, supabaseAdmin } from '@/shared/auth/auth-options';
import { bnet } from '@/shared/integrations/bnet/client';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max execution time for Vercel/Next.js

// Valid instance IDs inside Midnight (tier 516)
// 1307: La Aguja del Vacío (Voidspire)
// 1308: Marcha a Quel'Danas
// 1314: La Falla Onírica (Dreamwell/Dreamrift)
const MIDNIGHT_INSTANCES = [1307, 1308, 1314];
const V2_DIFFICULTIES = ['lfr', 'normal', 'heroic', 'mythic'] as const;
const MIDNIGHT_S1_ILVL = {
  lfr: { base: 233, mid: 237, final: 240 },
  normal: { base: 246, mid: 250, final: 253 },
  heroic: { base: 259, mid: 263, final: 269 },
  mythic: { base: 272, mid: 279, final: 282 },
} as const;

const CLASS_KEY_BY_ID: Record<number, string> = {
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

const CLASS_WEAPON_RULES: Record<
  number,
  {
    weaponTypes: string[];
    handTypes: string[];
  }
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

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
}

function mapRole(role: string | null | undefined) {
  switch ((role || '').toLowerCase()) {
    case 'tank':
      return 'tank';
    case 'heal':
      return 'heal';
    case 'melee':
      return 'melee_dps';
    case 'ranged':
      return 'ranged_dps';
    default:
      return 'ranged_dps';
  }
}

function mapArmorType(itemClassId?: number | null, subclassId?: number | null) {
  if (itemClassId !== 4) {
    return null;
  }

  switch (subclassId) {
    case 1:
      return 'cloth';
    case 2:
      return 'leather';
    case 3:
      return 'mail';
    case 4:
      return 'plate';
    default:
      return null;
  }
}

function mapWeaponType(
  itemClassId?: number | null,
  subclassId?: number | null,
  inventoryType?: string | null,
) {
  if ((inventoryType || '').toUpperCase() === 'SHIELD') {
    return 'shield';
  }

  if (itemClassId !== 2) {
    if ((inventoryType || '').toUpperCase() === 'HOLDABLE') {
      return 'offhand_frill';
    }

    return null;
  }

  switch (subclassId) {
    case 0:
    case 1:
      return 'axe';
    case 4:
    case 5:
      return 'mace';
    case 6:
      return 'polearm';
    case 7:
    case 8:
      return 'sword';
    case 10:
      return 'staff';
    case 13:
      return 'fist';
    case 14:
      return 'glaive';
    case 15:
      return 'dagger';
    case 18:
      return 'crossbow';
    case 19:
      return 'wand';
    default:
      return null;
  }
}

function mapHandType(
  inventoryType?: string | null,
  itemClassId?: number | null,
  itemSubclassId?: number | null,
) {
  if (
    itemClassId === 2 &&
    [1, 5, 6, 8, 10, 18].includes(Number(itemSubclassId))
  ) {
    return 'two_hand';
  }

  switch ((inventoryType || '').toUpperCase()) {
    case '2HWEAPON':
    case 'RANGEDRIGHT':
      return 'two_hand';
    case 'WEAPON':
    case 'WEAPONMAINHAND':
      return 'main_hand';
    case 'WEAPONOFFHAND':
    case 'HOLDABLE':
    case 'SHIELD':
      return 'off_hand';
    case 'THROWN':
      return 'main_hand';
    default:
      return 'one_hand';
  }
}

function mapSlot(inventoryType?: string | null) {
  switch ((inventoryType || '').toUpperCase()) {
    case 'HEAD':
      return 'head';
    case 'NECK':
      return 'neck';
    case 'SHOULDER':
      return 'shoulder';
    case 'CLOAK':
      return 'back';
    case 'CHEST':
    case 'ROBE':
      return 'chest';
    case 'WRIST':
      return 'wrist';
    case 'HAND':
      return 'hands';
    case 'WAIST':
      return 'waist';
    case 'LEGS':
      return 'legs';
    case 'FEET':
      return 'feet';
    case 'FINGER':
      return 'finger';
    case 'TRINKET':
      return 'trinket';
    case 'SHIELD':
    case 'HOLDABLE':
    case 'WEAPONOFFHAND':
      return 'offhand';
    default:
      return 'weapon';
  }
}

function extractTokenMetadata(itemData: any) {
  const spellDescriptions = (itemData?.preview_item?.spells || [])
    .map((entry: any) => String(entry?.description || ''))
    .filter(Boolean);
  const combinedDescription = spellDescriptions.join(' ').toLowerCase();
  const itemName = String(
    itemData?.name || itemData?.name?.es_ES || itemData?.name?.en_US || '',
  ).toLowerCase();
  const itemClassId = Number(itemData?.item_class?.id || 0);
  const inventoryType = String(
    itemData?.inventory_type?.type || '',
  ).toUpperCase();

  let tokenSlot: string | null = null;
  if (
    combinedDescription.includes(' shoulder item') ||
    combinedDescription.includes('objeto de hombros')
  )
    tokenSlot = 'shoulder';
  else if (
    combinedDescription.includes(' chest item') ||
    combinedDescription.includes('objeto de torso') ||
    combinedDescription.includes('objeto de pecho')
  )
    tokenSlot = 'chest';
  else if (
    combinedDescription.includes(' hand item') ||
    combinedDescription.includes('objeto de manos')
  )
    tokenSlot = 'hands';
  else if (
    combinedDescription.includes(' leg item') ||
    combinedDescription.includes('objeto de piernas')
  )
    tokenSlot = 'legs';
  else if (
    combinedDescription.includes(' helm item') ||
    combinedDescription.includes(' head item') ||
    combinedDescription.includes('objeto de cabeza')
  )
    tokenSlot = 'head';

  const playableClasses =
    itemData?.preview_item?.requirements?.playable_classes?.links || [];
  const allowableClasses = playableClasses
    .map((entry: any) => Number(entry?.id))
    .filter(Boolean);

  const isTierToken =
    combinedDescription.includes('synthesize a soulbound set') ||
    combinedDescription.includes('sintetiza un objeto') ||
    combinedDescription.includes('set item appropriate for your class') ||
    combinedDescription.includes('apropiado para tu clase') ||
    combinedDescription.includes('class set') ||
    combinedDescription.includes('conjunto de clase') ||
    combinedDescription.includes('tier set') ||
    itemName.includes('core') ||
    itemName.includes('nucleo') ||
    itemName.includes('núcleo') ||
    itemName.includes('riftbloom') ||
    itemName.includes('flor de falla') ||
    (tokenSlot !== null && allowableClasses.length > 0) ||
    (inventoryType === 'NON_EQUIP' &&
      allowableClasses.length > 0 &&
      (itemClassId === 15 || itemClassId === 20));

  return {
    isToken: isTierToken,
    tokenSlot,
    allowableClasses,
    spellDescriptions,
  };
}

function mapPrimaryStats(itemData: any) {
  const stats = itemData?.preview_item?.stats || itemData?.stats || [];
  const values = new Set<string>();

  for (const stat of stats) {
    const token = stat?.type?.type ?? stat?.type ?? stat?.id;
    const type = String(token || '').toUpperCase();
    const numericId = Number(token);

    if (type.includes('STRENGTH') || numericId === 4 || numericId === 74) {
      values.add('strength');
    }

    if (
      type.includes('AGILITY') ||
      numericId === 3 ||
      numericId === 72 ||
      numericId === 73
    ) {
      values.add('agility');
    }

    if (
      type.includes('INTELLECT') ||
      numericId === 5 ||
      numericId === 72 ||
      numericId === 73 ||
      numericId === 74
    ) {
      values.add('intellect');
    }
  }

  return values.size > 0 ? Array.from(values) : ['none'];
}

function extractItemStats(itemData: any) {
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
    const type = String(stat?.type?.type || stat?.type || '').toUpperCase();
    const value =
      Number(stat?.value || stat?.display?.display_string || 0) || 0;
    if (type.includes('STRENGTH')) output.strength = value;
    else if (type.includes('AGILITY')) output.agility = value;
    else if (type.includes('INTELLECT')) output.intellect = value;
    else if (type.includes('STAMINA')) output.stamina = value;
    else if (type.includes('CRIT')) output.crit = value;
    else if (type.includes('HASTE')) output.haste = value;
    else if (type.includes('MASTERY')) output.mastery = value;
    else if (type.includes('VERS')) output.versatility = value;
    else if (type.includes('LEECH')) output.leech = value;
    else if (type.includes('AVOIDANCE')) output.avoidance = value;
    else if (type.includes('SPEED')) output.speed = value;
    else if (type === 'ARMOR') output.armor = value;
  }

  return output;
}

function inferItemLevel(
  difficulty: keyof typeof MIDNIGHT_S1_ILVL,
  isFinalBoss: boolean,
) {
  return isFinalBoss
    ? MIDNIGHT_S1_ILVL[difficulty].final
    : MIDNIGHT_S1_ILVL[difficulty].base;
}

async function seedV2Rules() {
  const [{ data: classes }, { data: specs }] = await Promise.all([
    supabaseAdmin.from('wow_classes').select('id, armor_type'),
    supabaseAdmin
      .from('wow_specializations')
      .select('id, class_id, name, role, main_stat'),
  ]);

  if (classes?.length) {
    const classRows = classes
      .map((wowClass) => ({
        class_key: CLASS_KEY_BY_ID[wowClass.id],
        armor_proficiency: String(wowClass.armor_type || '').toLowerCase(),
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
      await supabaseAdmin.from('class_rules').upsert(classRows, {
        onConflict: 'class_key',
      });

      const classWeaponRows = classes.flatMap((wowClass) => {
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
        await supabaseAdmin.from('class_weapon_rules').upsert(classWeaponRows, {
          onConflict: 'class_key,weapon_type,hand_type',
        });
      }
    }
  }

  if (specs?.length) {
    const specRows = specs
      .map((spec) => {
        const classKey = CLASS_KEY_BY_ID[spec.class_id];
        const weaponRules = CLASS_WEAPON_RULES[spec.class_id];
        if (!classKey || !weaponRules) return null;

        const specName = String(spec.name || '');
        const allowsShield =
          (spec.class_id === 1 && specName === 'Protection') ||
          (spec.class_id === 2 &&
            (specName === 'Protection' || specName === 'Holy')) ||
          (spec.class_id === 7 &&
            (specName === 'Elemental' || specName === 'Restoration'));

        return {
          spec_key: String(spec.id),
          class_key: classKey,
          spec_name: specName,
          role: mapRole(spec.role),
          primary_stats: [String(spec.main_stat || 'none').toLowerCase()],
          allowed_weapon_types: weaponRules.weaponTypes,
          allowed_hand_types: weaponRules.handTypes,
          allows_shield: allowsShield,
        };
      })
      .filter(Boolean);

    if (specRows.length) {
      await supabaseAdmin.from('spec_rules').upsert(specRows as any[], {
        onConflict: 'spec_key',
      });
    }
  }
}

async function upsertV2Raid(instanceId: number, instanceName: string) {
  const { data, error } = await supabaseAdmin
    .from('raids')
    .upsert(
      {
        expansion: 'Midnight',
        bnet_instance_id: instanceId,
        slug: slugify(instanceName),
        name: instanceName,
        content_type: 'raid',
        source: 'blizzard',
        raw: {},
      },
      { onConflict: 'expansion,bnet_instance_id' },
    )
    .select('id')
    .single();

  if (error) throw error;
  return data.id as string;
}

async function upsertV2Boss(
  raidId: string,
  encounterId: number,
  bossName: string,
  orderIndex: number,
  isFinalBoss: boolean,
) {
  const { data, error } = await supabaseAdmin
    .from('bosses')
    .upsert(
      {
        raid_id: raidId,
        bnet_encounter_id: encounterId,
        slug: slugify(bossName),
        name: bossName,
        order_index: orderIndex,
        is_final: isFinalBoss,
        source: 'blizzard',
        raw: {},
      },
      { onConflict: 'raid_id,bnet_encounter_id' },
    )
    .select('id')
    .single();

  if (error) throw error;
  return data.id as string;
}

async function upsertV2Item(
  itemData: any,
  iconUrl: string | null,
  difficulty: (typeof V2_DIFFICULTIES)[number],
  isFinalBoss: boolean,
) {
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
    slot === 'weapon' || slot === 'offhand'
      ? mapHandType(
          itemData?.inventory_type?.type,
          itemClassId,
          itemData?.item_subclass?.id,
        )
      : null;
  const primaryStats = mapPrimaryStats(itemData);
  const itemStats = extractItemStats(itemData);
  const itemName =
    typeof itemData.name === 'string'
      ? itemData.name
      : itemData.name?.es_ES || itemData.name?.en_US || `Item ${itemData.id}`;
  const slug = slugify(itemName);
  const qualityType = String(itemData?.quality?.type || 'EPIC').toLowerCase();
  const itemClassName =
    typeof itemData?.item_class?.name === 'string'
      ? itemData.item_class.name
      : itemData?.item_class?.name?.es_ES ||
        itemData?.item_class?.name?.en_US ||
        null;
  const itemSubclassName =
    typeof itemData?.item_subclass?.name === 'string'
      ? itemData.item_subclass.name
      : itemData?.item_subclass?.name?.es_ES ||
        itemData?.item_subclass?.name?.en_US ||
        null;

  const { data, error } = await supabaseAdmin
    .from('items')
    .upsert(
      {
        bnet_item_id: itemData.id,
        difficulty,
        variant: 'base',
        name: itemName,
        slug,
        quality_type: qualityType,
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
        is_trinket: slot === 'trinket',
        is_tier_piece: tokenMetadata.isToken,
        icon_url: iconUrl,
        media_url: iconUrl,
        api_href: itemData?._links?.self?.href || null,
        source: 'blizzard',
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
      { onConflict: 'bnet_item_id,difficulty,variant' },
    )
    .select('id')
    .single();

  if (error) throw error;

  await supabaseAdmin.from('item_stats').upsert(
    {
      item_id: data.id,
      ...itemStats,
    },
    { onConflict: 'item_id' },
  );

  return data.id as string;
}

export async function runBnetSync(
  tierId: number,
  handlers?: {
    log?: (msg: string) => void;
  },
) {
  const log = handlers?.log || (() => {});

  log(`Starting Battle.net sync for Expansion Tier ${tierId}...`);
  await seedV2Rules();
  log('=> Reglas V2 de clases/especializaciones preparadas.');

  const expData = await bnet.getExpansion(tierId);
  const expName =
    typeof expData.name === 'string'
      ? expData.name
      : expData.name?.es_ES || expData.name?.en_US || 'Unknown Expansion';

  log(`=> Expansión conectada: ${expName}`);

  await supabaseAdmin.from('bnet_expansions').upsert({
    id: expData.id,
    name: expName,
  });

  const instanceRefs = expData.dungeons?.concat(expData.raids || []) || [];
  const relevantInstances = instanceRefs.filter((i: any) =>
    MIDNIGHT_INSTANCES.includes(i.id),
  );

  let totalItemsSynced = 0;

  for (const instRef of relevantInstances) {
    const instRefName =
      typeof instRef.name === 'string'
        ? instRef.name
        : instRef.name?.es_ES || instRef.name?.en_US;
    log(`---> Inspeccionando banda: ${instRefName} (${instRef.id})`);

    const instData = await bnet.getInstance(instRef.id);
    const instName =
      typeof instData.name === 'string'
        ? instData.name
        : instData.name?.es_ES || instData.name?.en_US;

    await supabaseAdmin.from('bnet_instances').upsert({
      id: instData.id,
      name: instName,
      expansion_id: expData.id,
    });

    const v2RaidId = await upsertV2Raid(instData.id, instName);

    const encounters = instData.encounters || [];
    for (let x = 0; x < encounters.length; x++) {
      const encRef = encounters[x];
      const encRefName =
        typeof encRef.name === 'string'
          ? encRef.name
          : encRef.name?.es_ES || encRef.name?.en_US;
      log(
        `-----> Jefe ${x + 1}/${encounters.length}: ${encRefName} (${encRef.id})`,
      );

      const encData = await bnet.getEncounter(encRef.id);
      const encName =
        typeof encData.name === 'string'
          ? encData.name
          : encData.name?.es_ES || encData.name?.en_US;

      await supabaseAdmin.from('bnet_encounters').upsert({
        id: encData.id,
        name: encName,
        instance_id: instData.id,
      });

      const isFinalBoss = x === encounters.length - 1;
      const v2BossId = await upsertV2Boss(
        v2RaidId,
        encData.id,
        encName,
        x,
        isFinalBoss,
      );

      const items = encData.items || [];
      let itemsForBoss = 0;
      log(
        `        [⏳] Detectados ${items.length} objetos en la tabla de botín. Analizando...`,
      );

      for (const itemRef of items) {
        const itemId = itemRef.item.id;

        try {
          const itemData = await bnet.getItem(itemId);
          let iconUrl = null;

          try {
            const mediaData = await bnet.getItemMedia(itemId);
            if (mediaData.assets && mediaData.assets.length > 0) {
              const iconAsset = mediaData.assets.find(
                (asset: any) => asset?.key === 'icon',
              );
              iconUrl = iconAsset?.value || mediaData.assets[0].value;
            }
          } catch {
            // Ignore media failures
          }

          const itemName =
            typeof itemData.name === 'string'
              ? itemData.name
              : itemData.name?.es_ES || itemData.name?.en_US;

          await supabaseAdmin.from('bnet_items').upsert({
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

          await supabaseAdmin.from('bnet_encounter_loot').upsert({
            encounter_id: encData.id,
            item_id: itemData.id,
          });

          for (const difficulty of V2_DIFFICULTIES) {
            const v2ItemId = await upsertV2Item(
              itemData,
              iconUrl,
              difficulty,
              isFinalBoss,
            );

            await supabaseAdmin.from('boss_drops').upsert(
              {
                boss_id: v2BossId,
                item_id: v2ItemId,
                drop_type: 'boss',
              },
              { onConflict: 'boss_id,item_id' },
            );
          }

          itemsForBoss++;
          totalItemsSynced++;

          if (itemsForBoss % 5 === 0 || itemsForBoss === items.length) {
            log(
              `        [✔] ${itemsForBoss}/${items.length} objetos cacheados localmente...`,
            );
          }
        } catch (e: any) {
          log(`        [!] Error al procesar objeto ${itemId}: ${e.message}`);
        }
      }
    }
  }

  const message = `✅ Sincronización completa. Expansión: ${expName}. Instancias: ${relevantInstances.length}. Objetos procesados: ${totalItemsSynced}.`;
  log(message);

  return {
    expName,
    relevantInstances: relevantInstances.length,
    totalItemsSynced,
    message,
  };
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return new NextResponse('No autorizado', { status: 401 });

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role_level')
      .eq('user_id', session.user.id)
      .single();

    const isOfficer =
      profile?.role_level === 'officer' || profile?.role_level === 'gm';
    if (!isOfficer) return new NextResponse('Prohibido', { status: 403 });

    const { tierId } = await req.json();
    if (!tierId)
      return NextResponse.json(
        { error: 'Falta el ID del Tier (ej: 516 para Midnight).' },
        { status: 400 },
      );

    // Create a ReadableStream for Server-Sent Events (SSE)
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const log = (msg: string) => {
          const data = JSON.stringify({ message: msg });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        };
        const logError = (msg: string) => {
          const data = JSON.stringify({ error: msg });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        };

        try {
          const result = await runBnetSync(tierId, { log });

          const doneData = JSON.stringify({
            done: true,
            message: result.message,
          });
          controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));
        } catch (e: any) {
          logError(e.message);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (e: any) {
    console.error('Bnet Sync error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
