// src/app/api/guild/roster/route.ts
// Handles both Manual Character Addition (POST) and Roster Wipe (DELETE)
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import {
  findWowauditCharacter,
} from '@/shared/integrations/wowaudit/wowaudit-client';
import {
  resolveWowauditClassId,
  resolveWowauditRank,
  slugifyRealm,
} from '@/shared/integrations/wowaudit/wowaudit-roster';
import { normalizeRosterRole } from '@/shared/lib/roster-role';
import { ensureAppPermission } from '@/shared/auth/permissions';
import { fetchWowauditRanks } from '@/shared/integrations/wowaudit/wowaudit-ranks.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 120;

/**
 * GET — Diagnostic endpoint
 */
export async function GET() {
  return NextResponse.json({ message: 'Roster API is active' });
}

/**
 * POST — Manually add a character to the roster
 */
export async function POST(req: Request) {
  try {
    // 1. Auth check
    await ensureAppPermission('roster', 'edit');

    const body = await req.json();
    const { realm, name } = body;

    if (!realm || !name) {
      return NextResponse.json(
        { error: 'Reino y nombre son obligatorios' },
        { status: 400 },
      );
    }

    // 2. Check if already exists in DB
    const { data: existingMember } = await supabaseAdmin
      .from('guild_members')
      .select('id')
      .eq('character_name', name)
      .eq('realm_slug', slugifyRealm(realm))
      .maybeSingle();

    if (existingMember) {
      return NextResponse.json(
        { error: 'El personaje ya se encuentra en el roster' },
        { status: 409 },
      );
    }

    // 3. Fetch character from WoWAudit
    const wowauditCharacter = await findWowauditCharacter(name, realm);
    if (!wowauditCharacter) {
      console.warn(`[ROSTER API] Character not found in WoWAudit: ${name} in ${realm}`);
      return NextResponse.json(
        { error: 'No se encontró el personaje en WoWAudit' },
        { status: 404 },
      );
    }

    const { data: constantRows } = await supabaseAdmin
      .from('game_constants')
      .select('key, value')
      .eq('category', 'wow_class');

    const classIdByName: Record<string, number> = {};
    constantRows?.forEach((row) => {
      classIdByName[row.value.trim().toLowerCase()] = Number(row.key);
    });

    const rankRows = await fetchWowauditRanks();

    const row = {
      wowaudit_character_id: wowauditCharacter.id,
      wowaudit_rank_name: wowauditCharacter.rank,
      character_name: wowauditCharacter.name.trim(),
      realm_slug: slugifyRealm(wowauditCharacter.realm),
      realm_name: wowauditCharacter.realm.trim(),
      class_id: resolveWowauditClassId(wowauditCharacter.class, classIdByName),
      race_id: null,
      level: 80,
      rank: resolveWowauditRank(wowauditCharacter.rank, { ranks: rankRows || [] }),
      role: normalizeRosterRole(wowauditCharacter.role) || null,
      synced_at: new Date().toISOString(),
    };

    const { data, error: upsertError } = await supabaseAdmin
      .from('guild_members')
      .upsert(row, { onConflict: 'character_name,realm_slug' })
      .select()
      .single();

    if (upsertError) {
      console.error('Upsert error:', upsertError);
      return NextResponse.json(
        {
          error: 'Error al guardar el personaje',
          details: upsertError.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      character: data,
    });
  } catch (err) {
    console.error('Manual roster sync error:', err);
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json(
      { error: 'Error al añadir el personaje', details: message },
      { status: 500 },
    );
  }
}

/**
 * DELETE — Wipe all characters from the guild_members table
 */
export async function DELETE() {
  try {
    await ensureAppPermission('roster', 'edit');

    const { error } = await supabaseAdmin
      .from('guild_members')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.error('[ROSTER WIPE] DB Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Roster borrado con éxito',
    });
  } catch (e: any) {
    console.error('[ROSTER WIPE] Fatal Error:', e);
    return NextResponse.json(
      { error: e.message || 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
