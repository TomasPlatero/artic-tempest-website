// src/app/api/guild/sync/route.ts
// POST — Sync guild roster from WoWAudit API
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { fetchWowauditCharacters, normalizeText } from '@/shared/integrations/wowaudit/wowaudit-client';
import { buildWowauditRosterRows } from '@/shared/integrations/wowaudit/wowaudit-roster';
import { ensureAppPermission } from '@/shared/auth/permissions';
import {
  markWowauditRosterSyncSuccess,
} from '@/shared/integrations/wowaudit/roster-sync';
import { reconcileRemovedGuildMembers } from '@/shared/integrations/bnet/roster-sync';
import { fetchWowauditRanks } from '@/shared/integrations/wowaudit/wowaudit-ranks.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const { data: guild, error: guildError } = await supabaseAdmin
    .from('settings')
    .select('name, realm, region, guild_id')
    .eq('id', 1)
    .maybeSingle();

  if (guildError || !guild) {
    return NextResponse.json(
      { error: 'No se encontró la hermandad en la base de datos' },
      { status: 404 },
    );
  }

  await ensureAppPermission('roster', 'edit');

  try {
    // 3. Fetch roster and reference data from WoWAudit / DB
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

    if (!characters.length) {
      return NextResponse.json(
        { error: 'El roster está vacío o WoWAudit no devolvió personajes' },
        { status: 404 },
      );
    }

    const classIdByName: Record<string, number> = {};
    classConstants.data?.forEach((row) => {
      classIdByName[normalizeText(row.value)] = Number(row.key);
    });

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
      console.error('Upsert error:', upsertError);
      return NextResponse.json(
        { error: 'Error al guardar el roster', details: upsertError.message },
        { status: 500 },
      );
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

    return NextResponse.json({
      success: true,
      imported: rows.length,
      removed: reconciliation.removed,
      guild: `${guild.name} (${guild.realm} - ${(guild.region ?? 'eu').toUpperCase()})`,
      syncedAt,
    });
  } catch (err) {
    console.error('Sync error:', err);
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json(
      { error: 'Error al sincronizar con WoWAudit', details: message },
      { status: 500 },
    );
  }
}
