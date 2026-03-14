// src/app/api/cron/sync-boss-abilities/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/auth/auth-options';
import { fetchEncounterAbilities } from '@/shared/integrations/bnet/bnet-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // 1. Secret validation (Vercel Cron security or manual trigger)
    const authHeader = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    if (!force && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        // 2. Get all bosses with bnet_encounter_id
        const { data: bosses, error: bossesError } = await supabaseAdmin
            .from('bosses')
            .select('id, name, bnet_encounter_id')
            .not('bnet_encounter_id', 'is', null);

        if (bossesError || !bosses) {
            console.error('Cron Error: No bosses found in DB', bossesError);
            return NextResponse.json({ error: 'No bosses found' }, { status: 404 });
        }

        let totalSynced = 0;
        const results = [];

        // 3. Sync each boss
        for (const boss of bosses) {
            console.log(`Syncing abilities for boss: ${boss.name} (${boss.bnet_encounter_id})`);
            
            // Fetch English (default) and Spanish
            const dataEn = await fetchEncounterAbilities(boss.bnet_encounter_id, 'eu', 'en_US');
            const dataEs = await fetchEncounterAbilities(boss.bnet_encounter_id, 'eu', 'es_ES');

            if (!dataEn || !dataEn.sections) {
                console.warn(`Boss ${boss.name} has no encounter journal data`);
                continue;
            }

            // Map sections (abilities)
            // Sections can be nested (firstChildSectionID, siblingSectionID)
            // For now, we flatten the top-level sections which usually contain the main abilities
            const abilitiesToUpsert = dataEn.sections.map((section: any, index: number) => {
                const sectionEs = dataEs?.sections?.find((s: any) => s.id === section.id);
                
                return {
                    boss_id: boss.id,
                    bnet_spell_id: section.spell?.id || section.id, // Fallback to section ID if no spell attached
                    name_en: section.title,
                    name_es: sectionEs?.title || section.title,
                    icon_url: section.spell?.id 
                        ? `https://wow.zamimg.com/images/wow/icons/large/${section.title.toLowerCase().replace(/ /g, '_')}.jpg` // Placeholder if icon is missing but usually we get it from spell
                        : null,
                    description_en: section.body_text || '',
                    description_es: sectionEs?.body_text || section.body_text || '',
                    updated_at: new Date().toISOString()
                };
            });

            // If it's a spell, we can try to get a better icon via the spell icon if available
            // Blizzard API journal-encounter sections sometimes have ability_icon fileDataId
            // But let's refine the mapping based on what Blizzard returns.
            // In the addon skill, EJ_GetSectionInfo returns abilityIcon.
            // In REST it might be different. Let's assume section.spell.id or dedicated icon fields.
            
            for (const ability of abilitiesToUpsert) {
                // Try to guess icon from WoW icons if we have spell_id
                // Note: Better would be a direct media request but let's stick to basics for now
                if (ability.bnet_spell_id > 1000) {
                     // We don't have a direct icon URL from the Journal Encounter REST endpoint easily 
                     // unless we fetch item/spell media. For now, let's just use the name-based placeholders 
                     // or wait for real data to see.
                }
            }

            const { error: upsertError } = await supabaseAdmin
                .from('boss_abilities')
                .upsert(abilitiesToUpsert, { onConflict: 'boss_id,bnet_spell_id' });

            if (upsertError) {
                console.error(`Error upserting abilities for boss ${boss.name}:`, upsertError);
            } else {
                totalSynced += abilitiesToUpsert.length;
                results.push({ boss: boss.name, abilities: abilitiesToUpsert.length });
            }
        }

        return NextResponse.json({
            success: true,
            total_bosses: bosses.length,
            total_abilities_synced: totalSynced,
            details: results
        });

    } catch (err) {
        console.error('Boss Sync Error:', err);
        return NextResponse.json(
            { error: 'Sync failed', details: err instanceof Error ? err.message : 'Unknown error' },
            { status: 500 },
        );
    }
}
