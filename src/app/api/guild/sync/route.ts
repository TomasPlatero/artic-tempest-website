// src/app/api/guild/sync/route.ts
// POST — Sync guild roster from Battle.net API
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, sb } from '@/infrastructure/auth/auth-options';
import { fetchGuildRoster, toSlug } from '@/infrastructure/bnet/bnet-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  // 1. Auth check — only GM/Officer
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = session.user?.roleLevel;
  if (role !== 'gm' && role !== 'officer') {
    return NextResponse.json(
      { error: 'Solo GM y Officers pueden sincronizar el roster' },
      { status: 403 },
    );
  }

  // 2. Get guild info from DB
  const { data: guild, error: guildError } = await sb
    .from('guilds_managed')
    .select('name, realm, region')
    .limit(1)
    .single();

  if (guildError || !guild) {
    return NextResponse.json(
      { error: 'No se encontró la hermandad en la base de datos' },
      { status: 404 },
    );
  }

  const realmSlug = toSlug(guild.realm);
  const guildSlug = toSlug(guild.name);
  const region = guild.region ?? 'eu';

  try {
    // 3. Fetch roster from Blizzard
    const members = await fetchGuildRoster(realmSlug, guildSlug, region);

    if (!members.length) {
      return NextResponse.json(
        { error: 'El roster está vacío o la hermandad no se encontró' },
        { status: 404 },
      );
    }

    // 6. Upsert to DB
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
      console.error('Upsert error:', upsertError);
      return NextResponse.json(
        { error: 'Error al guardar el roster', details: upsertError.message },
        { status: 500 },
      );
    }

    // 7. Auto-upgrade profile permissions based on WoW ranks
    const { data: linkedProfiles } = await sb
      .from('profiles')
      .select('user_id, role_level, character_name, character_realm')
      .not('character_name', 'is', null)

    const { data: ranksConfig } = await sb
      .from('guild_ranks')
      .select('rank, app_role')

    const ROLE_RANKS = { gm: 3, officer: 2, raider: 1, member: 0 }

    if (linkedProfiles && ranksConfig) {
      for (const profile of linkedProfiles) {
        const member = members.find(
          (m) => m.character.name === profile.character_name &&
            m.character.realm.slug === profile.character_realm
        )

        if (member) {
          const rankConfig = ranksConfig.find(r => r.rank === member.rank)
          if (rankConfig) {
            const currentLevel = ROLE_RANKS[profile.role_level as keyof typeof ROLE_RANKS] || 1
            const newLevel = ROLE_RANKS[rankConfig.app_role as keyof typeof ROLE_RANKS] || 1

            if (newLevel > currentLevel) {
              await sb
                .from('profiles')
                .update({ role_level: rankConfig.app_role })
                .eq('user_id', profile.user_id)
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      imported: rows.length,
      guild: `${guild.name} (${guild.realm} - ${region.toUpperCase()})`,
    });
  } catch (err) {
    console.error('Sync error:', err);
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json(
      { error: 'Error al sincronizar con Battle.net', details: message },
      { status: 500 },
    );
  }
}
