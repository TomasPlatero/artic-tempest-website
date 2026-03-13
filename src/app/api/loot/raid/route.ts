import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/auth/auth-options';

const MIDNIGHT_INSTANCE_IDS = [1307, 1308, 1314];
const CLASS_ID_BY_KEY: Record<string, number> = {
  WARRIOR: 1,
  PALADIN: 2,
  HUNTER: 3,
  ROGUE: 4,
  PRIEST: 5,
  DEATHKNIGHT: 6,
  SHAMAN: 7,
  MAGE: 8,
  WARLOCK: 9,
  MONK: 10,
  DRUID: 11,
  DEMONHUNTER: 12,
  EVOKER: 13,
};

type LegacyLootRow = {
  id: number;
  name: string;
  icon: string | null;
  quality: string | null;
  item_level: number | null;
  inventory_type: string | null;
  item_class_id: number | null;
  item_subclass_id: number | null;
  main_stat: string | null;
  stats: unknown;
  is_tier: boolean | null;
  class_restrictions: string[] | null;
  difficulty: string | null;
  bnet_encounter_loot: Array<{
    bnet_encounters: Array<{
      id: number;
      name: string;
      instance_id: number;
      bnet_instances: Array<{
        id: number;
        name: string;
      }>;
    }>;
  }>;
};

function normalizeInstanceContext(instanceIdStr: string) {
  if (instanceIdStr === 'all') {
    return {
      selectedInstanceId: 0,
      selectedInstanceName: 'Temporada 1',
      isAllInstances: true,
    };
  }

  const numericInstanceId = parseInt(instanceIdStr, 10);

  return {
    selectedInstanceId: Number.isNaN(numericInstanceId) ? 0 : numericInstanceId,
    selectedInstanceName: null as string | null,
    isAllInstances: false,
  };
}

function sourceMatchesInstance(source: any, instanceIdStr: string) {
  const raidBnetId = Number(source?.bosses?.raids?.bnet_instance_id ?? 0);

  if (!raidBnetId) {
    return false;
  }

  if (instanceIdStr === 'all') {
    return MIDNIGHT_INSTANCE_IDS.includes(raidBnetId);
  }

  return String(raidBnetId) === instanceIdStr;
}

function formatSlotDisplay(
  slot: string | null | undefined,
  handType?: string | null,
) {
  if (slot === 'tier_token') {
    return 'Token de tier';
  }

  if (slot === 'weapon') {
    if (handType === 'two_hand') return 'Arma de 2 manos';
    if (handType === 'off_hand') return 'Mano izquierda';
    if (handType === 'main_hand') return 'Mano derecha';
    return 'Arma de 1 mano';
  }

  if (slot === 'offhand') {
    return 'Mano izquierda';
  }

  switch (slot) {
    case 'head':
      return 'Cabeza';
    case 'neck':
      return 'Cuello';
    case 'shoulder':
      return 'Hombros';
    case 'back':
      return 'Espalda';
    case 'chest':
      return 'Pecho';
    case 'wrist':
      return 'Muñecas';
    case 'hands':
      return 'Manos';
    case 'waist':
      return 'Cintura';
    case 'legs':
      return 'Piernas';
    case 'feet':
      return 'Pies';
    case 'finger':
      return 'Anillo';
    case 'trinket':
      return 'Abalorio';
    default:
      return slot || 'Desconocido';
  }
}

function extractPrimaryStatsFromRaw(rawStats: any[] | undefined) {
  const values = new Set<string>();

  for (const stat of rawStats || []) {
    const token = stat?.type?.type ?? stat?.type ?? stat?.id;
    const normalized = String(token ?? '').toUpperCase();
    const numericId = Number(token);

    if (normalized.includes('STRENGTH') || numericId === 4) {
      values.add('strength');
    }

    if (normalized.includes('AGILITY') || numericId === 3) {
      values.add('agility');
    }

    if (normalized.includes('INTELLECT') || numericId === 5) {
      values.add('intellect');
    }

    if (numericId === 72 || numericId === 73) {
      values.add('agility');
      values.add('intellect');
    }

    if (numericId === 74) {
      values.add('strength');
      values.add('intellect');
    }
  }

  return Array.from(values);
}

function analyzeRawPrimaryStats(rawStats: any[] | undefined) {
  const positive = new Set<string>();
  const negated = new Set<string>();

  for (const stat of rawStats || []) {
    const token = stat?.type?.type ?? stat?.type ?? stat?.id;
    const normalized = String(token ?? '').toUpperCase();
    const numericId = Number(token);
    const target = stat?.is_negated ? negated : positive;

    if (normalized.includes('STRENGTH') || numericId === 4) {
      target.add('strength');
    }

    if (normalized.includes('AGILITY') || numericId === 3) {
      target.add('agility');
    }

    if (normalized.includes('INTELLECT') || numericId === 5) {
      target.add('intellect');
    }

    if (numericId === 72 || numericId === 73) {
      positive.add('agility');
      positive.add('intellect');
    }

    if (numericId === 74) {
      positive.add('strength');
      positive.add('intellect');
    }
  }

  return {
    positive: Array.from(positive),
    negated: Array.from(negated),
  };
}

function resolveItemPrimaryStats(item: any) {
  const values = new Set<string>();

  for (const stat of item.primary_stats || []) {
    if (typeof stat === 'string' && stat !== 'none') {
      values.add(stat.toLowerCase());
    }
  }

  const structuredStats = item.item_stats || {};
  if ((structuredStats.strength || 0) > 0) values.add('strength');
  if ((structuredStats.agility || 0) > 0) values.add('agility');
  if ((structuredStats.intellect || 0) > 0) values.add('intellect');

  if (values.size > 0) {
    return Array.from(values);
  }

  const rawStats = Array.isArray(item.raw?.stats) ? item.raw.stats : [];
  for (const stat of extractPrimaryStatsFromRaw(rawStats)) {
    values.add(stat);
  }

  return Array.from(values);
}

function itemMatchesSpecPrimaryStats(item: any, spec: any) {
  const slot = item.slot;
  const itemPrimaries = resolveItemPrimaryStats(item);
  const rawPrimaryStats = analyzeRawPrimaryStats(
    Array.isArray(item.raw?.stats) ? item.raw.stats : [],
  );
  const specPrimaries = (spec.primary_stats || []).map((stat: string) =>
    stat.toLowerCase(),
  );

  if (slot === 'neck' || slot === 'back' || slot === 'finger') {
    return true;
  }

  if (itemPrimaries.length === 0) {
    return true;
  }

  if (specPrimaries.length === 0) {
    return true;
  }

  if (itemPrimaries.some((primary) => specPrimaries.includes(primary))) {
    return true;
  }

  if (
    rawPrimaryStats.negated.some((primary) => specPrimaries.includes(primary))
  ) {
    return true;
  }

  return false;
}

function itemMatchesSpecList(item: any, spec: any) {
  const specList = Array.isArray(item.raw?.specs) ? item.raw.specs : [];

  if (specList.length === 0) {
    return true;
  }

  return specList.includes(Number(spec.spec_key));
}

function isGenericTrinketWithoutSpecMetadata(item: any) {
  if (item.slot !== 'trinket') {
    return false;
  }

  const specList = Array.isArray(item.raw?.specs) ? item.raw.specs : [];
  const primaries = resolveItemPrimaryStats(item);

  return (
    specList.length === 0 &&
    (primaries.length === 0 || primaries.every((value) => value === 'none'))
  );
}

function getResolvedPrimaryStats(item: any) {
  return resolveItemPrimaryStats(item).filter(
    (value) => value && value !== 'none',
  );
}

function isIntellectOnlyItem(item: any) {
  const primaries = getResolvedPrimaryStats(item);
  return (
    primaries.length > 0 && primaries.every((value) => value === 'intellect')
  );
}

function isHealingOnlyTrinketText(text: string) {
  const hasHealing =
    text.includes('healing') ||
    text.includes('sanacion') ||
    text.includes('sanación') ||
    text.includes('heals') ||
    text.includes('sana');

  const hasDamage = text.includes('damage') || text.includes('daño');

  return hasHealing && !hasDamage;
}

function getTrinketSpellText(item: any) {
  const spellTexts = Array.isArray(item.raw?.spells) ? item.raw.spells : [];
  return spellTexts.join(' ').toLowerCase();
}

function isTankTrinketHeuristic(item: any) {
  if (item.slot !== 'trinket') {
    return false;
  }

  const text = getTrinketSpellText(item);
  if (!text) {
    return false;
  }

  return [
    'absor',
    'absorb',
    'escudo',
    'shield',
    'daño recibido',
    'damage taken',
    'armadura',
    'armor',
    'bloque',
    'block',
    'parry',
    'esquivar',
    'dodge',
  ].some((keyword) => text.includes(keyword));
}

function isGeneralPurposeTrinket(item: any, spec: any) {
  if (item.slot !== 'trinket') {
    return false;
  }

  const text = getTrinketSpellText(item);
  if (!text) {
    return false;
  }

  if (
    text.includes('primary stat') ||
    text.includes('estadistica principal') ||
    text.includes('estadística principal')
  ) {
    return true;
  }

  if (spec.role === 'heal') {
    return (
      text.includes('healing') ||
      text.includes('sanacion') ||
      text.includes('sanación') ||
      text.includes('intellect') ||
      text.includes('intelecto') ||
      text.includes('spell') ||
      text.includes('spells') ||
      text.includes('hechizo') ||
      text.includes('hechizos') ||
      text.includes('casting') ||
      text.includes('lanzar') ||
      text.includes('absor') ||
      text.includes('absorb') ||
      text.includes('escudo') ||
      text.includes('shield')
    );
  }

  if (spec.role === 'tank') {
    return false;
  }

  if (isHealingOnlyTrinketText(text) || isIntellectOnlyItem(item)) {
    return false;
  }

  return (
    text.includes('damage and healing') ||
    text.includes('daño y sanación') ||
    text.includes('daño y sanacion') ||
    text.includes('spells and abilities') ||
    text.includes('hechizos y facultades') ||
    text.includes('ataques, hechizos y facultades') ||
    text.includes('attacks, spells, and abilities')
  );
}

function itemMatchesTrinketRules(item: any, spec: any) {
  if (item.slot !== 'trinket') {
    return true;
  }

  const hasExplicitSpecMetadata = Array.isArray(item.raw?.specs)
    ? item.raw.specs.length > 0
    : false;

  if (hasExplicitSpecMetadata) {
    return itemMatchesSpecList(item, spec);
  }

  if (
    spec.role === 'tank' &&
    isTankTrinketHeuristic(item) &&
    !isIntellectOnlyItem(item)
  ) {
    return true;
  }

  if (isGenericTrinketWithoutSpecMetadata(item)) {
    return isGeneralPurposeTrinket(item, spec);
  }

  return itemMatchesSpecPrimaryStats(item, spec);
}

function itemMatchesOffhandRules(item: any, spec: any) {
  if (item.slot !== 'offhand') {
    return true;
  }

  if (item.weapon_type === 'shield') {
    return Boolean(spec.allows_shield);
  }

  if (String(spec.class_key || '').toUpperCase() === 'PALADIN') {
    const rawInventoryType = String(
      item.inventory_type ?? item.raw?.inventoryType ?? '',
    ).toUpperCase();

    if (
      Number(spec.spec_key) === 65 &&
      (item.weapon_type === 'offhand_frill' || rawInventoryType === 'HOLDABLE')
    ) {
      return true;
    }
  }

  const allowedWeaponTypes = Array.isArray(spec.allowed_weapon_types)
    ? spec.allowed_weapon_types
    : [];

  if (item.weapon_type) {
    return allowedWeaponTypes.includes(item.weapon_type);
  }

  return false;
}

function itemMatchesWeaponRules(item: any, spec: any) {
  if (item.slot !== 'weapon') {
    return true;
  }

  const allowedWeaponTypes = Array.isArray(spec.allowed_weapon_types)
    ? spec.allowed_weapon_types
    : [];
  const allowedHandTypes = Array.isArray(spec.allowed_hand_types)
    ? spec.allowed_hand_types
    : [];

  if (
    allowedWeaponTypes.length > 0 &&
    !allowedWeaponTypes.includes(item.weapon_type)
  ) {
    return false;
  }

  const compatibleHandTypes = new Set<string>(allowedHandTypes);

  if (compatibleHandTypes.has('one_hand')) {
    compatibleHandTypes.add('main_hand');
  }

  if (
    compatibleHandTypes.size > 0 &&
    !compatibleHandTypes.has(item.hand_type)
  ) {
    return false;
  }

  return true;
}

function isTierTokenItem(item: any) {
  const name = String(item.name || '').toLowerCase();
  const rawItemClass = Number(item.item_class_id ?? item.raw?.itemClass ?? 0);
  const rawInventoryType = String(
    item.inventory_type ?? item.raw?.inventoryType ?? '',
  ).toUpperCase();
  const allowedClasses = Array.isArray(item.raw?.allowableClasses)
    ? item.raw.allowableClasses.filter(Boolean)
    : [];

  return Boolean(
    item.is_tier_piece ||
    item.raw?.isToken ||
    item.raw?.tokenSlot ||
    item.raw?.contains ||
    name.includes('core') ||
    name.includes('nucleo') ||
    name.includes('núcleo') ||
    name.includes('riftbloom') ||
    name.includes('flor de falla') ||
    (rawInventoryType === 'NON_EQUIP' &&
      allowedClasses.length > 0 &&
      (rawItemClass === 15 || rawItemClass === 20)),
  );
}

function itemMatchesTierTokenAccess(item: any, spec: any) {
  if (!isTierTokenItem(item)) {
    return true;
  }

  const classId =
    CLASS_ID_BY_KEY[String(spec.class_key || '').toUpperCase()] || 0;
  const allowedClasses = Array.isArray(item.raw?.allowableClasses)
    ? item.raw.allowableClasses.map((value: unknown) => Number(value))
    : [];

  if (allowedClasses.length > 0 && !allowedClasses.includes(classId)) {
    return false;
  }

  const allowedSpecs = Array.isArray(item.raw?.specs)
    ? item.raw.specs.map((value: unknown) => Number(value))
    : [];

  if (
    allowedSpecs.length > 0 &&
    !allowedSpecs.includes(Number(spec.spec_key))
  ) {
    return false;
  }

  return true;
}

function isTrophyTokenItem(item: any) {
  const name = String(item.name || '').toLowerCase();
  const rawItemClass = Number(item.raw?.itemClass);
  const rawInventoryType = String(item.raw?.inventoryType || '').toUpperCase();

  return (
    name.includes('trofeo') &&
    (rawItemClass === 20 || rawInventoryType === 'NON_EQUIP')
  );
}

async function fetchLegacyLoot(instanceIdStr: string, difficulty: string) {
  const context = normalizeInstanceContext(instanceIdStr);

  const { data: items, error } = await supabaseAdmin.from('bnet_items').select(
    `
            id,
            name,
            icon,
            quality,
            item_level,
            inventory_type,
            item_class_id,
            item_subclass_id,
            main_stat,
            stats,
            is_tier,
            class_restrictions,
            difficulty,
            bnet_encounter_loot (
                bnet_encounters (
                    id,
                    name,
                    instance_id,
                    bnet_instances (
                        id,
                        name
                    )
                )
            )
        `,
  );

  if (error) {
    throw error;
  }

  const bossesMap = new Map<
    number,
    { id: number; name: string; order: number; items: any[] }
  >();
  let resolvedInstanceName = context.selectedInstanceName;

  for (const item of (items || []) as unknown as LegacyLootRow[]) {
    const itemDifficulty = (item.difficulty || 'heroic').toLowerCase();
    if (itemDifficulty !== difficulty.toLowerCase()) continue;

    const sources = (item.bnet_encounter_loot || []).filter((source) => {
      const encounter = source.bnet_encounters?.[0];
      if (!encounter) return false;

      if (context.isAllInstances) {
        return MIDNIGHT_INSTANCE_IDS.includes(encounter.instance_id);
      }

      return encounter.instance_id === context.selectedInstanceId;
    });

    if (sources.length === 0) continue;

    const encounter = sources[0].bnet_encounters?.[0];
    if (!encounter) continue;
    const instanceName = encounter.bnet_instances?.[0]?.name || null;
    if (!resolvedInstanceName && instanceName) {
      resolvedInstanceName = instanceName;
    }

    if (!bossesMap.has(encounter.id)) {
      bossesMap.set(encounter.id, {
        id: encounter.id,
        name: encounter.name,
        order: bossesMap.size,
        items: [],
      });
    }

    bossesMap.get(encounter.id)?.items.push({
      id: item.id,
      name: item.name,
      icon: item.icon,
      slot: item.inventory_type || 'UNKNOWN',
      slotDisplay: formatSlotDisplay(
        normalizeLegacySlot(item.inventory_type),
        item.inventory_type === 'SHIELD' || item.inventory_type === 'HOLDABLE'
          ? 'off_hand'
          : null,
      ),
      quality: item.quality || 'EPIC',
      itemLevel: item.item_level,
      stats: item.stats,
      isTier: Boolean(item.is_tier),
      itemClassId: item.item_class_id,
      itemSubclassId: item.item_subclass_id,
      inventory_type: item.inventory_type || undefined,
      primary_stats: item.main_stat ? [item.main_stat.toLowerCase()] : [],
      raw: {
        classRestrictions: item.class_restrictions || [],
        difficulty: item.difficulty,
      },
    });
  }

  return {
    bosses: Array.from(bossesMap.values()),
    instanceId: context.selectedInstanceId,
    instanceName: resolvedInstanceName,
    v2: false,
  };
}

async function fetchLegacyLootSafe(instanceIdStr: string, difficulty: string) {
  try {
    return await fetchLegacyLoot(instanceIdStr, difficulty);
  } catch (error: any) {
    const message = String(error?.message || '');

    if (
      message.includes("Could not find the table 'public.bnet_items'") ||
      message.includes('Could not find the relation') ||
      message.includes('schema cache')
    ) {
      const context = normalizeInstanceContext(instanceIdStr);
      return {
        bosses: [],
        instanceId: context.selectedInstanceId,
        instanceName: context.selectedInstanceName,
        v2: false,
        unavailable: true,
      };
    }

    throw error;
  }
}

type SpecOverrideRow = {
  item_id: string;
  allowed: boolean;
  spec_key: string;
  class_key: string;
};

function normalizeLegacySlot(inventoryType: string | null | undefined) {
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

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const difficulty = url.searchParams.get('difficulty') || 'heroic';
    const specId = url.searchParams.get('spec_id');
    const instanceIdStr = url.searchParams.get('instance_id') || 'all';

    if (!specId || isNaN(parseInt(specId, 10))) {
      return NextResponse.json(
        { error: 'spec_id es requerido' },
        { status: 400 },
      );
    }

    const instanceContext = normalizeInstanceContext(instanceIdStr);

    // 1. Get Spec & Class Rules
    const { data: spec, error: specErr } = await supabaseAdmin
      .from('spec_rules')
      .select(
        `
                *,
                class_rules (*)
            `,
      )
      .eq('spec_key', specId)
      .single();

    if (specErr || !spec) {
      const legacy = await fetchLegacyLootSafe(instanceIdStr, difficulty);
      return NextResponse.json({
        spec: null,
        class: null,
        difficulty,
        bosses: legacy.bosses,
        instanceId: legacy.instanceId,
        instanceName: legacy.instanceName,
        v2: legacy.v2,
        fallback: 'legacy',
        fetchedAt: new Date().toISOString(),
      });
    }

    const classRules = spec.class_rules;

    // 2. Fetch Loot with V2 Relational Logic
    // We use a join with boss_drops and bosses
    let query = supabaseAdmin
      .from('items')
      .select(
        `
                *,
                item_stats (*),
                item_effects (*),
                boss_drops (
                    bosses (
                        id,
                        bnet_encounter_id,
                        name,
                        order_index,
                        raids (
                            id,
                            bnet_instance_id,
                            name,
                            expansion
                        )
                    )
                )
            `,
      )
      .eq('difficulty', difficulty.toLowerCase());

    // 3. Apply Professional V2 Filtering (SQL-level where possible)
    // a) Armor Proficiency (Plate/Mail/etc) + Jewelry/Cloak fallback
    const armorFilter = `armor_type.eq.${classRules.armor_proficiency},slot.in.(neck,back,finger,trinket,weapon,offhand),is_tier_piece.eq.true,item_class_id.in.(15,20)`;
    query = query.or(armorFilter);

    const { data: items, error: itemsErr } = await query;

    if (itemsErr) throw itemsErr;

    const itemDbIds = (items || []).map((item) => item.id).filter(Boolean);
    let itemOverrideMap = new Map<string, boolean>();

    if (itemDbIds.length > 0) {
      const { data: itemOverrides } = await supabaseAdmin
        .from('item_spec_rules')
        .select('item_id, allowed, spec_key, class_key')
        .in('item_id', itemDbIds)
        .eq('class_key', spec.class_key)
        .in('spec_key', [String(spec.spec_key), '__ALL__']);

      itemOverrideMap = new Map(
        ((itemOverrides || []) as SpecOverrideRow[])
          .sort((a, b) => {
            if (a.spec_key === spec.spec_key && b.spec_key !== spec.spec_key)
              return -1;
            if (a.spec_key !== spec.spec_key && b.spec_key === spec.spec_key)
              return 1;
            return 0;
          })
          .map((override) => [override.item_id, override.allowed]),
      );
    }

    // 4. Manual Refinement for specific edge cases (Weapon Types, Hand Types, Tier)
    const filteredItems = (items || []).filter((item) => {
      const explicitOverride = itemOverrideMap.get(item.id);
      if (explicitOverride === false) {
        return false;
      }

      if (explicitOverride === true) {
        const sources = (item.boss_drops as any[]) || [];
        if (sources.length === 0) return false;
        if (
          !sources.some((source) =>
            sourceMatchesInstance(source, instanceIdStr),
          )
        ) {
          return false;
        }

        return true;
      }

      const rawInventoryType = String(
        item.inventory_type ?? item.raw?.inventoryType ?? '',
      ).toUpperCase();

      if (rawInventoryType === 'NON_EQUIP' && !isTierTokenItem(item)) {
        return false;
      }

      if (isTrophyTokenItem(item)) {
        return false;
      }

      if (!itemMatchesTierTokenAccess(item, spec)) {
        return false;
      }

      if (isTierTokenItem(item)) {
        const sources = (item.boss_drops as any[]) || [];
        if (sources.length === 0) return false;

        if (
          !sources.some((source) =>
            sourceMatchesInstance(source, instanceIdStr),
          )
        ) {
          return false;
        }

        return true;
      }

      // Tier Check
      if (
        item.is_tier_piece &&
        item.tier_class &&
        !isTierTokenItem(item) &&
        item.tier_class !== spec.class_key
      ) {
        return false;
      }

      // Weapon Check
      if (!itemMatchesWeaponRules(item, spec)) {
        return false;
      }

      // Offhand/Shield Check
      if (!itemMatchesOffhandRules(item, spec)) {
        return false;
      }

      if (!itemMatchesTrinketRules(item, spec)) {
        return false;
      }

      if (item.slot !== 'trinket' && !itemMatchesSpecPrimaryStats(item, spec)) {
        return false;
      }

      // Instance filtering
      const sources = (item.boss_drops as any[]) || [];
      if (sources.length === 0) return false;

      if (
        !sources.some((source) => sourceMatchesInstance(source, instanceIdStr))
      ) {
        return false;
      }

      return true;
    });

    // 5. Group by Boss
    const bossesMap = new Map();
    let resolvedInstanceName: string | null =
      instanceContext.selectedInstanceName;
    for (const item of filteredItems) {
      const dropSources = ((item.boss_drops as any[]) || []).filter((source) =>
        sourceMatchesInstance(source, instanceIdStr),
      );
      if (dropSources.length === 0) continue;

      const boss = dropSources[0].bosses;
      if (!resolvedInstanceName && boss?.raids?.name) {
        resolvedInstanceName = boss.raids.name;
      }
      if (!bossesMap.has(boss.id)) {
        bossesMap.set(boss.id, {
          id: boss.id,
          name: boss.name,
          order: boss.order_index,
          items: [],
        });
      }

      // Pick the first effect for short-circuiting display
      const effect = (item.item_effects as any[])?.[0];

      bossesMap.get(boss.id).items.push({
        id: item.bnet_item_id,
        db_id: item.id,
        boss_name: boss.name,
        name: item.name,
        icon: item.icon_url,
        slot: item.slot,
        slotDisplay: formatSlotDisplay(item.slot, item.hand_type),
        quality: item.quality_type || 'EPIC',
        itemLevel: item.item_level,
        stats: item.item_stats,
        isTier: item.is_tier_piece,
        trinketType: item.trinket_type,
        weapon_type: item.weapon_type,
        hand_type: item.hand_type,
        effect_type: effect?.effect_type,
        effect_description: effect?.description,
        // Include raw data and metadata for frontend filtering Fallback
        itemClassId: (item.raw as any)?.itemClass,
        itemSubclassId: (item.raw as any)?.itemSubClass,
        inventory_type: (item.raw as any)?.inventoryType,
        primary_stats: item.primary_stats,
        filtered_by: itemOverrideMap.has(item.id) ? 'override' : 'rules',
        raw: item.raw,
      });
    }

    const sortedBosses = Array.from(bossesMap.values()).sort(
      (a, b) => a.order - b.order,
    );

    if (sortedBosses.length === 0) {
      const legacy = await fetchLegacyLootSafe(instanceIdStr, difficulty);
      return NextResponse.json({
        spec: spec.spec_name,
        class: spec.class_key,
        difficulty,
        bosses: legacy.bosses,
        instanceId: legacy.instanceId,
        instanceName: legacy.instanceName,
        v2: legacy.v2,
        fallback: 'legacy-empty-v2',
        fetchedAt: new Date().toISOString(),
      });
    }

    const instanceName = instanceContext.isAllInstances
      ? 'Temporada 1'
      : resolvedInstanceName;

    return NextResponse.json({
      spec: spec.spec_name,
      class: spec.class_key,
      difficulty,
      bosses: sortedBosses,
      instanceId: instanceContext.selectedInstanceId,
      instanceName,
      authoritativeFiltering: true,
      v2: true,
      fetchedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error('Loot V2 Error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
