// src/app/api/cron/sync-roster/route.ts
import { NextResponse } from 'next/server';
import { sb } from '@/infrastructure/auth/auth-options';
import { fetchGuildRoster, toSlug } from '@/infrastructure/bnet/bnet-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // 1. Secret validation (Vercel Cron security)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    // 2. Get guild info from DB
    const { data: guild, error: guildError } = await sb
        .from('guilds_managed')
        .select('name, realm, region, guild_id')
        .limit(1)
        .single();

    if (guildError || !guild) {
        console.error('Cron Error: No guild found in DB', guildError);
        return NextResponse.json({ error: 'No guild found' }, { status: 404 });
    }

    const realmSlug = toSlug(guild.realm);
    const guildSlug = toSlug(guild.name);
    const region = guild.region ?? 'eu';

    try {
        // 3. Fetch roster from Blizzard
        console.log(`Cron: Starting sync for ${guild.name} (${guild.realm})`);
        const members = await fetchGuildRoster(realmSlug, guildSlug, region);

        if (!members.length) {
            return NextResponse.json({ error: 'Roster empty or guild not found' }, { status: 404 });
        }

        // 4. Upsert to DB
        const rows = members.map((m) => ({
            character_name: m.character.name,
            realm_slug: m.character.realm.slug,
            realm_name: m.character.realm.name,
            class_id: m.character.playable_class.id,
            race_id: m.character.playable_race.id,
            level: m.character.level,
            rank: m.rank,
            role: m.role || null,
            synced_at: new Date().toISOString(),
        }));

        const { error: upsertError } = await sb
            .from('guild_members')
            .upsert(rows, { onConflict: 'character_name,realm_slug' });

        if (upsertError) {
            throw upsertError;
        }

        // 5. Update last bnet sync in guild metadata
        await sb
            .from('guilds_managed')
            .update({ last_bnet_sync: new Date().toISOString() })
            .eq('guild_id', guild.guild_id);

        console.log(`Cron: Successfully synced ${rows.length} members`);

        return NextResponse.json({
            success: true,
            imported: rows.length,
            guild: `${guild.name} (${guild.realm})`,
        });
    } catch (err) {
        console.error('Cron Sync Error:', err);
        return NextResponse.json(
            { error: 'Sync failed', details: err instanceof Error ? err.message : 'Unknown error' },
            { status: 500 },
        );
    }
}
