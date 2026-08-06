import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { bnet } from '@/shared/integrations/bnet/client';
import {
  MIDNIGHT_INSTANCE_IDS as MIDNIGHT_INSTANCES,
  MIDNIGHT_S1_ILVL,
  CLASS_KEY_BY_ID,
  CLASS_WEAPON_RULES,
} from '@/shared/constants/game';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max execution time for Vercel/Next.js

const V2_DIFFICULTIES = ['lfr', 'normal', 'heroic', 'mythic'] as const;
const MIDNIGHT_INSTANCE_SET = new Set(MIDNIGHT_INSTANCES);

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
  const twoHandSubclassIds = new Set([1, 5, 6, 8, 10, 18]);

  if (itemClassId === 2 && twoHandSubclassIds.has(Number(itemSubclassId))) {
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
  const spellDescriptions = (itemData?.preview_item?.spells || []).flatMap(
    (entry: any) => {
      const description = String(entry?.description || '');
      return description ? [description] : [];
    },
  );
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
  const allowableClasses = playableClasses.flatMap((entry: any) => {
    const classId = Number(entry?.id);
    return classId ? [classId] : [];
  });

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
  const strengthIds = new Set([4, 74]);
  const agilityIds = new Set([3, 72, 73]);
  const intellectIds = new Set([5, 72, 73, 74]);

  for (const stat of stats) {
    const token = stat?.type?.type ?? stat?.type ?? stat?.id;
    const type = String(token || '').toUpperCase();
    const numericId = Number(token);

    if (/\bSTRENGTH\b/.test(type) || strengthIds.has(numericId)) {
      values.add('strength');
    }

    if (/\bAGILITY\b/.test(type) || agilityIds.has(numericId)) {
      values.add('agility');
    }

    if (/\bINTELLECT\b/.test(type) || intellectIds.has(numericId)) {
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
    if (/\bSTRENGTH\b/.test(type)) output.strength = value;
    else if (/\bAGILITY\b/.test(type)) output.agility = value;
    else if (/\bINTELLECT\b/.test(type)) output.intellect = value;
    else if (/\bSTAMINA\b/.test(type)) output.stamina = value;
    else if (/\bCRIT\b/.test(type)) output.crit = value;
    else if (/\bHASTE\b/.test(type)) output.haste = value;
    else if (/\bMASTERY\b/.test(type)) output.mastery = value;
    else if (/\bVERS\b/.test(type)) output.versatility = value;
    else if (/\bLEECH\b/.test(type)) output.leech = value;
    else if (/\bAVOIDANCE\b/.test(type)) output.avoidance = value;
    else if (/\bSPEED\b/.test(type)) output.speed = value;
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
    const classRows = classes.reduce<Array<{
      class_key: string;
      armor_proficiency: string;
      default_roles: string[];
    }>>((acc, wowClass) => {
      const classKey = CLASS_KEY_BY_ID[wowClass.id];
      const armorProficiency = String(wowClass.armor_type || '').toLowerCase();
      if (!classKey || !armorProficiency) return acc;

      const defaultRoles = Array.from(
        new Set(
          (specs || []).reduce<string[]>((roles, spec) => {
            if (spec.class_id === wowClass.id) {
              roles.push(mapRole(spec.role));
            }
            return roles;
          }, []),
        ),
      );

      acc.push({
        class_key: classKey,
        armor_proficiency: armorProficiency,
        default_roles: defaultRoles,
      });
      return acc;
    }, []);

    if (classRows.length) {
      await supabaseAdmin.from('class_rules').upsert(classRows, {
        onConflict: 'class_key',
      });
    }
  }

  if (specs?.length) {
    const specRows = specs.flatMap((spec) => {
      const classKey = CLASS_KEY_BY_ID[spec.class_id];
      const weaponRules = CLASS_WEAPON_RULES[spec.class_id];
      if (!classKey || !weaponRules) return [];

      const specName = String(spec.name || '');
      const allowsShield =
        (spec.class_id === 1 && specName === 'Protection') ||
        (spec.class_id === 2 &&
          (specName === 'Protection' || specName === 'Holy')) ||
        (spec.class_id === 7 &&
          (specName === 'Elemental' || specName === 'Restoration'));

      return [
        {
          spec_key: String(spec.id),
          class_key: classKey,
          spec_name: specName,
          role: mapRole(spec.role),
          primary_stats: [String(spec.main_stat || 'none').toLowerCase()],
          allowed_weapon_types: weaponRules.weaponTypes,
          allowed_hand_types: weaponRules.handTypes,
          allows_shield: allowsShield,
        },
      ];
    });

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
    MIDNIGHT_INSTANCE_SET.has(i.id),
  );

  // Process all instances in parallel
  const instanceResults = await Promise.all(
    relevantInstances.map(async (instRef: any) => {
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

      // Process all encounters for this instance in parallel
      const encounterResults = await Promise.all(
        encounters.map(async (encRef: any, x: number) => {
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
          log(
            `        [⏳] Detectados ${items.length} objetos en la tabla de botín. Analizando...`,
          );

          // Process all items for this encounter in parallel
          const itemResults = await Promise.all(
            items.map(async (itemRef: any) => {
              const itemId = itemRef.item.id;

              try {
                const [itemResult, mediaResult] = await Promise.allSettled([
                  bnet.getItem(itemId),
                  bnet.getItemMedia(itemId),
                ]);

                if (itemResult.status !== 'fulfilled') {
                  throw itemResult.reason;
                }

                const itemData = itemResult.value;
                let iconUrl = null;

                if (mediaResult.status === 'fulfilled') {
                  const mediaData = mediaResult.value;
                  if (mediaData.assets && mediaData.assets.length > 0) {
                    let iconAssetValue: string | null = null;
                    for (const asset of mediaData.assets) {
                      if (asset?.key === 'icon') {
                        iconAssetValue = asset?.value || null;
                        break;
                      }
                    }
                    iconUrl = iconAssetValue || mediaData.assets[0].value;
                  }
                }

                const itemName =
                  typeof itemData.name === 'string'
                    ? itemData.name
                    : itemData.name?.es_ES || itemData.name?.en_US;

                await Promise.all([
                  supabaseAdmin.from('bnet_items').upsert({
                    id: itemData.id,
                    name: itemName,
                    quality: itemData.quality.type,
                    item_level: itemData.level,
                    required_level: itemData.required_level,
                    icon: iconUrl,
                    item_class_id: itemData.item_class.id,
                    item_subclass_id: itemData.item_subclass.id,
                    inventory_type: itemData.inventory_type.type,
                  }),
                  supabaseAdmin.from('bnet_encounter_loot').upsert({
                    encounter_id: encData.id,
                    item_id: itemData.id,
                  }),
                ]);

                await Promise.all(
                  V2_DIFFICULTIES.map(async (difficulty) => {
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
                  }),
                );

                log(`        [✔] Procesado objeto ${itemId}`);
                return 1;
              } catch (e: any) {
                log(`        [!] Error al procesar objeto ${itemId}: ${e.message}`);
                return 0;
              }
            }),
          );

          return itemResults.reduce((sum: number, count: number) => sum + count, 0);
        }),
      );

      const instanceItemsSynced = encounterResults.reduce(
        (sum: number, count: number) => sum + count,
        0,
      );
      log(`  [✔] Instancia ${instRefName}: ${instanceItemsSynced} objetos procesados`);
      return instanceItemsSynced;
    }),
  );

  const totalItemsSynced = instanceResults.reduce(
    (sum: number, count: number) => sum + count,
    0,
  );

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
    const session = await auth();
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
