// src/app/api/guild/sync/route.ts
// POST — Sync guild roster from Battle.net API
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, supabaseAdmin } from '@/infrastructure/auth/auth-options';
import { fetchGuildRoster, fetchGuildSummary, toSlug } from '@/infrastructure/bnet/bnet-client';

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
  const { data: guild, error: guildError } = await supabaseAdmin.from('guilds_managed')
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
    // 3. Fetch Game Constants for Mappings
    const { data: constantRows } = await supabaseAdmin.from('game_constants')
      .select('category, key, value')
      .eq('category', 'spec_role');

    const specRoleMapping: Record<string, string> = {};
    constantRows?.forEach((row) => {
      specRoleMapping[row.key] = row.value;
    });

    // 4. Fetch roster and summary from Blizzard
    const [members, summary] = await Promise.all([
      fetchGuildRoster(realmSlug, guildSlug, region, "es_ES", specRoleMapping),
      fetchGuildSummary(realmSlug, guildSlug, region, "es_ES")
    ]);

    if (!members.length) {
      return NextResponse.json(
        { error: 'El roster está vacío o la hermandad no se encontró' },
        { status: 404 },
      );
    }

    // Update guild faction if summary is available
    if (summary?.faction?.type) {
      await supabaseAdmin.from('guilds_managed')
        .update({ faction: summary.faction.type.toLowerCase() })
        .eq('name', guild.name);
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

    const { error: upsertError } = await supabaseAdmin.from('guild_members')
      .upsert(rows, { onConflict: 'character_name,realm_slug' });

    if (upsertError) {
      console.error('Upsert error:', upsertError);
      return NextResponse.json(
        { error: 'Error al guardar el roster', details: upsertError.message },
        { status: 500 },
      );
    }

    // 6b. PROPAGATION: Update roles in event_signups for members whose roles were just synced
    // We fetch current members IDs for these names (since we need UUIDs for event_signups)
    const { data: updatedMembers } = await supabaseAdmin.from('guild_members')
      .select('id, character_name, realm_slug, role')
      .in('character_name', rows.map(r => r.character_name));

    if (updatedMembers) {
      for (const m of updatedMembers) {
        if (m.role) {
          await supabaseAdmin.from('event_signups')
            .update({ event_role: m.role.toLowerCase() })
            .eq('member_id', m.id);
        }
      }
    }

    // 7. Auto-update profile permissions based on WoW ranks
    // Fetch all members with a linked profile
    const { data: linkedMembers } = await supabaseAdmin.from('guild_members')
      .select('profile_id, rank, profiles(role_level)')
      .not('profile_id', 'is', null);

    const { data: ranksConfig } = await supabaseAdmin.from('guild_ranks')
      .select('rank, app_role');

    if (linkedMembers && ranksConfig) {
      for (const member of linkedMembers) {
        if (!member.profile_id || !member.profiles) continue;

        const rankConfig = ranksConfig.find(r => r.rank === member.rank);
        if (rankConfig) {
          const currentLevel = (member.profiles as any).role_level;
          const targetLevel = rankConfig.app_role;

          // Update if they differ
          if (currentLevel !== targetLevel) {
            console.log(`Syncing profile ${member.profile_id} permission: ${currentLevel} -> ${targetLevel} (Was Rank ${member.rank})`);
            await supabaseAdmin.from('profiles')
              .update({ role_level: targetLevel })
              .eq('user_id', member.profile_id);
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
