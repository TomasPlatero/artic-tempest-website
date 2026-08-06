// src/app/api/cron/sync-roster/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { fetchWowauditCharacters, normalizeText } from '@/shared/integrations/wowaudit/wowaudit-client';
import { buildWowauditRosterRows } from '@/shared/integrations/wowaudit/wowaudit-roster';
import {
  markWowauditRosterSyncSuccess,
} from '@/shared/integrations/wowaudit/roster-sync';
import { requireCronAuth } from '@/shared/security/cron-auth';
import { reconcileRemovedGuildMembers } from '@/shared/integrations/bnet/roster-sync';
import { fetchWowauditRanks } from '@/shared/integrations/wowaudit/wowaudit-ranks.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authError = requireCronAuth(request);
  if (authError) {
    return authError;
  }

  // 2. Get guild info from DB
  const { data: guild, error: guildError } = await supabaseAdmin
    .from('settings')
    .select('name, realm, region, guild_id')
    .eq('id', 1)
    .maybeSingle();

  if (guildError || !guild) {
    console.error('Cron Error: No guild found in DB', guildError);
    return NextResponse.json({ error: 'No guild found' }, { status: 404 });
  }

  try {
    // 3. Fetch roster from WoWAudit
    console.log(`Cron: Starting sync for ${guild.name} (${guild.realm})`);
    const [characters, existingMembers, classConstants, wowauditRanks] = await Promise.all([
      fetchWowauditCharacters(),
      supabaseAdmin
        .from('guild_members')
        .select('id, wowaudit_character_id, wowaudit_rank_name, character_name, realm_slug, rank, level, race_id, role, note'),
      supabaseAdmin
        .from('game_constants')
        .select('category, key, value')
        .eq('category', 'wow_class'),
      fetchWowauditRanks(),
    ]);

    const classIdByName: Record<string, number> = {};
    classConstants.data?.forEach((row) => {
      classIdByName[normalizeText(row.value)] = Number(row.key);
    });

    if (!characters.length) {
      return NextResponse.json(
        { error: 'Roster empty or WoWAudit did not return characters' },
        { status: 404 },
      );
    }

    // 4. Upsert to DB
    const syncedAt = new Date().toISOString();
    const rows = buildWowauditRosterRows({
      characters,
      existingMembers: existingMembers.data ?? [],
      classIdByName,
      wowauditRanks,
      syncedAt,
      defaultLevel: 80,
    });

    const { error: upsertError } = await supabaseAdmin
      .from('guild_members')
      .upsert(rows, { onConflict: 'character_name,realm_slug' });

    if (upsertError) {
      throw upsertError;
    }

    const reconciliation = await reconcileRemovedGuildMembers({
      existingMembers: (existingMembers.data || []).map((member) => ({
        id: member.id,
        wowaudit_character_id: member.wowaudit_character_id,
        wowaudit_rank_name: member.wowaudit_rank_name,
        character_name: member.character_name,
        realm_slug: member.realm_slug,
      })),
      activeMembers: rows.map((row) => ({
        character_name: row.character_name,
        realm_slug: row.realm_slug,
      })),
    });

    await markWowauditRosterSyncSuccess({ syncedAt });

    console.log(`Cron: Successfully synced ${rows.length} members`);

    return NextResponse.json({
      success: true,
      imported: rows.length,
      removed: reconciliation.removed,
      guild: `${guild.name} (${guild.realm})`,
      syncedAt,
    });
  } catch (err) {
    console.error('Cron Sync Error:', err);
    return NextResponse.json(
      {
        error: 'Sync failed',
      },
      { status: 500 },
    );
  }
}
