// src/app/api/cd-planner/boss-abilities/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/auth/auth-options';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const bossName = searchParams.get('boss_name');

    if (!bossName) {
        return NextResponse.json({ error: 'Missing boss_name' }, { status: 400 });
    }

    try {
        // Find boss first
        // We might need fuzzy matching or aliases like in the client
        const { data: boss, error: bossError } = await supabaseAdmin
            .from('bosses')
            .select('id')
            .ilike('name', `%${bossName}%`)
            .limit(1)
            .single();

        if (bossError || !boss) {
             // Fallback: try aliases or just return empty
             return NextResponse.json([]);
        }

        const { data: abilities, error: abilitiesError } = await supabaseAdmin
            .from('boss_abilities')
            .select('*')
            .eq('boss_id', boss.id);

        if (abilitiesError) throw abilitiesError;

        return NextResponse.json(abilities || []);
    } catch (err) {
        console.error('Fetch Boss Abilities Error:', err);
        return NextResponse.json({ error: 'Failed to fetch abilities' }, { status: 500 });
    }
}
