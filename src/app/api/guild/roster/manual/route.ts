// src/app/api/guild/roster/manual/route.ts
// POST — Manually add a character to the roster
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/auth/auth-options';
import { fetchCharacterProfile, fetchCharacterRole, getAccessToken } from '@/shared/integrations/bnet/bnet-client';
import { ensureAppPermission } from '@/shared/auth/permissions';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    // 1. Auth check
    await ensureAppPermission('roster', 'edit');

    const { realm, name } = await req.json();

    if (!realm || !name) {
      return NextResponse.json({ error: 'Reino y nombre son obligatorios' }, { status: 400 });
    }

    const token = await getAccessToken();
    const nameSlug = name.toLowerCase().trim();

    // 2. Check if already exists in DB
    const { data: existingMember } = await supabaseAdmin.from('guild_members')
      .select('id')
      .eq('character_name', name)
      .eq('realm_slug', realm)
      .maybeSingle();

    if (existingMember) {
      return NextResponse.json({ error: 'El personaje ya se encuentra en el roster' }, { status: 409 });
    }

    // 3. Fetch Character Profile
    const charProfile = await fetchCharacterProfile(realm, name);
    if (!charProfile) {
      return NextResponse.json({ error: 'No se encontró el personaje en Battle.net' }, { status: 404 });
    }

    // 4. Verify Guild Membership
    // Fetch our managed guild info
    const { data: guildSetting } = await supabaseAdmin.from('guilds_managed')
      .select('guild_name, realm_slug')
      .single();

    if (!guildSetting) {
      return NextResponse.json({ error: 'La hermandad no está configurada en los ajustes' }, { status: 500 });
    }

    const isSameGuild = charProfile.guild && 
      charProfile.guild.name.toLowerCase() === guildSetting.guild_name?.toLowerCase() &&
      charProfile.guild.realm.slug === guildSetting.realm_slug;

    if (!isSameGuild) {
      const charGuildName = charProfile.guild?.name || 'Ninguna';
      return NextResponse.json({ 
        error: `El personaje no pertenece a la hermandad configurada. Está en: ${charGuildName}.`,
        details: 'El personaje debe estar en la hermandad del sistema antes de ser añadido manualmente.' 
      }, { status: 400 });
    }

    // 5. Fetch Game Constants for Role Mapping
    const { data: constantRows } = await supabaseAdmin.from('game_constants')
      .select('key, value')
      .eq('category', 'spec_role');

    const specRoleMapping: Record<string, string> = {};
    constantRows?.forEach((row) => {
      specRoleMapping[row.key] = row.value;
    });

    // 6. Fetch Role (Spec)
    const role = await fetchCharacterRole(
      charProfile.realm.slug,
      charProfile.name.toLowerCase(),
      'eu',
      token,
      specRoleMapping
    );

    // 7. Upsert to DB
    const row = {
      character_name: charProfile.name,
      realm_slug: charProfile.realm.slug,
      realm_name: charProfile.realm.name,
      class_id: charProfile.playable_class.id,
      race_id: charProfile.playable_race.id,
      level: charProfile.level,
      rank: 9, // Default rank (Social/Manual)
      role: role || null,
      synced_at: new Date().toISOString(),
    };

    const { data, error: upsertError } = await supabaseAdmin.from('guild_members')
      .upsert(row, { onConflict: 'character_name,realm_slug' })
      .select()
      .single();

    if (upsertError) {
      console.error('Upsert error:', upsertError);
      return NextResponse.json({ error: 'Error al guardar el personaje', details: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      character: data
    });
  } catch (err) {
    console.error('Manual roster sync error:', err);
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: 'Error al añadir el personaje', details: message }, { status: 500 });
  }
}
