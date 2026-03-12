
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/shared/auth/auth-options"

export async function GET(req: Request) {
    try {
        const url = new URL(req.url)
        const difficulty = url.searchParams.get("difficulty") || "heroic"
        const specId = url.searchParams.get("spec_id")
        const instanceIdStr = url.searchParams.get("instance_id") || "all"

        if (!specId || isNaN(parseInt(specId, 10))) {
            return NextResponse.json({ error: "spec_id es requerido" }, { status: 400 })
        }

        // 1. Get Spec & Class Rules
        const { data: spec, error: specErr } = await supabaseAdmin
            .from("spec_rules")
            .select(`
                *,
                class_rules (*)
            `)
            .eq("spec_key", specId)
            .single();

        if (specErr || !spec) {
            return NextResponse.json({ error: "Especialización no encontrada en V2 rules" }, { status: 404 })
        }

        const classRules = spec.class_rules;

        // 2. Fetch Loot with V2 Relational Logic
        // We use a join with boss_drops and bosses
        let query = supabaseAdmin
            .from("items")
            .select(`
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
            `)
            .eq("difficulty", difficulty.toLowerCase());

        // 3. Apply Professional V2 Filtering (SQL-level where possible)
        // a) Armor Proficiency (Plate/Mail/etc) + Jewelry/Cloak fallback
        const armorFilter = `armor_type.eq.${classRules.armor_proficiency},slot.in.(neck,back,finger,trinket,weapon,offhand)`;
        query = query.or(armorFilter);

        // b) Primary Stats (Strength/Agility/Intellect) - Relaxed for Weapons/Offhands
        if (spec.primary_stats && spec.primary_stats.length > 0) {
            const primaryQuery = spec.primary_stats.map((s: string) => `primary_stats.cs.{${s}}`).join(',');
            // Allow items with matching primary stats OR weapons/offhands (which we'll refine manually)
            query = query.or(`primary_stats.eq.{},${primaryQuery},slot.eq.weapon,slot.eq.offhand`);
        }

        const { data: items, error: itemsErr } = await query;

        if (itemsErr) throw itemsErr;

        // 4. Manual Refinement for specific edge cases (Weapon Types, Hand Types, Tier)
        const filteredItems = (items || []).filter(item => {
            // Tier Check
            if (item.is_tier_piece && item.tier_class && item.tier_class !== spec.class_key) {
                return false;
            }

            // Weapon Check
            if (item.slot === 'weapon') {
                if (!spec.allowed_weapon_types.includes(item.weapon_type)) return false;
                if (!spec.allowed_hand_types.includes(item.hand_type)) return false;
            }

            // Offhand/Shield Check
            if (item.slot === 'offhand') {
                if (item.weapon_type === 'shield' && !spec.allows_shield) return false;
            }

            // Primary Stat Check for Weapons/Offhands (surgical)
            if (item.slot === 'weapon' || item.slot === 'offhand') {
                const itemPrimaries = item.primary_stats || [];
                if (itemPrimaries.length > 0 && spec.primary_stats?.length > 0) {
                    const hasMatch = itemPrimaries.some((p: string) => spec.primary_stats.includes(p.toLowerCase()));
                    if (!hasMatch) return false;
                }
            }

            // Instance filtering
            const sources = (item.boss_drops as any[]) || [];
            if (sources.length === 0) return false;

            if (instanceIdStr !== 'all') {
                const hasMatch = sources.some(s => {
                    const raidBnetId = s.bosses?.raids?.bnet_instance_id?.toString();
                    return raidBnetId === instanceIdStr;
                });
                if (!hasMatch) return false;
            }

            return true;
        });

        // 5. Group by Boss
        const bossesMap = new Map();
        for (const item of filteredItems) {
            const dropSources = (item.boss_drops as any[]);
            if (dropSources.length === 0) continue;

            const boss = dropSources[0].bosses;
            if (!bossesMap.has(boss.id)) {
                bossesMap.set(boss.id, {
                    id: boss.id,
                    name: boss.name,
                    order: boss.order_index,
                    items: []
                });
            }

            // Pick the first effect for short-circuiting display
            const effect = (item.item_effects as any[])?.[0];

            bossesMap.get(boss.id).items.push({
                id: item.bnet_item_id,
                db_id: item.id,
                name: item.name,
                icon: item.icon_url,
                slot: item.slot,
                quality: item.quality_type || "EPIC",
                itemLevel: item.item_level,
                stats: item.item_stats,
                isTier: item.is_tier_piece,
                trinketType: item.trinket_type,
                effect_type: effect?.effect_type,
                effect_description: effect?.description,
                // Include raw data and metadata for frontend filtering Fallback
                itemClassId: (item.raw as any)?.itemClass,
                itemSubclassId: (item.raw as any)?.itemSubClass,
                inventory_type: (item.raw as any)?.inventoryType,
                primary_stats: item.primary_stats,
                raw: item.raw
            });
        }

        const sortedBosses = Array.from(bossesMap.values())
            .sort((a, b) => a.order - b.order);

        return NextResponse.json({
            spec: spec.spec_name,
            class: spec.class_key,
            difficulty,
            bosses: sortedBosses,
            v2: true,
            fetchedAt: new Date().toISOString()
        });

    } catch (e: any) {
        console.error("Loot V2 Error:", e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
