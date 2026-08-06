import { NextResponse, type NextRequest } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { getGuildCredentials } from '@/shared/auth/credentials';
import { ensureAppPermission } from '@/shared/auth/permissions';
import { RAIDER_RULES_VERSION } from '@/shared/constants/raider-rules';
import {
  getRaiderRulesAcceptance,
  getRaiderRulesProfile,
  markRaiderRulesAcceptanceState,
  tryAssignRaiderVerifiedRole,
} from '@/shared/lib/raider-rules.server';
import { z } from 'zod';

export const runtime = 'nodejs';

const btagRe = /^[A-Za-z\u00C0-\u024F][A-Za-z\u00C0-\u024F0-9]{1,11}#\d{4,6}$/;

const patchSchema = z.object({
  battlenet_battletag: z.string().max(20).regex(btagRe, 'Formato BattleTag inválido').optional().nullable(),
  officer_notes: z.string().max(5000).optional().nullable(),
  tokens_invalidated: z.boolean().optional(),
  main_character_id: z.uuid().optional().nullable(),
  force_raider_rules_accepted: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
    const session = await ensureAppPermission('settings-accounts', 'manage');
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { userId } = await params;
    if (!userId || !z.uuid().safeParse(userId).success) {
      return NextResponse.json({ error: 'userId es requerido y debe ser un UUID válido' }, { status: 400 });
    }

    try {
      const body = await req.json();
      const parsed = patchSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });
      }

      const {
        battlenet_battletag,
        officer_notes,
        tokens_invalidated,
        main_character_id,
        force_raider_rules_accepted,
      } = parsed.data;
      const updates: Record<string, any> = {};

    if (battlenet_battletag !== undefined) {
      updates.battlenet_battletag = battlenet_battletag || null;
    }
    if (officer_notes !== undefined) {
      updates.officer_notes = officer_notes || null;
    }
    if (typeof tokens_invalidated === 'boolean') {
      updates.tokens_invalidated = tokens_invalidated;
    }

    if (main_character_id !== undefined) {
      if (main_character_id) {
        const { data: character, error: characterError } = await supabaseAdmin
          .from('bnet_characters')
          .select('id')
          .eq('id', main_character_id)
          .eq('user_id', userId)
          .maybeSingle();

        if (characterError) {
          return NextResponse.json(
            {
              error: 'No se pudo validar el personaje',
            },
            { status: 500 },
          );
        }

        if (!character) {
          return NextResponse.json(
            { error: 'El personaje no pertenece a esta cuenta' },
            { status: 404 },
          );
        }
      }

      updates.main_character_id = main_character_id || null;
    }

    if (Object.keys(updates).length === 0) {
      if (!force_raider_rules_accepted) {
        return NextResponse.json(
          { error: 'No hay cambios para aplicar' },
          { status: 400 },
        );
      }
    }

    let data = null;
    if (Object.keys(updates).length > 0) {
      const result = await supabaseAdmin
        .from('profiles')
        .update(updates)
        .eq('user_id', userId)
        .select('*')
        .single();
      data = result.data;
      if (result.error) throw result.error;
    } else {
      const result = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      data = result.data;
      if (result.error) throw result.error;
    }

    let raiderRulesAcceptance = null;

    if (force_raider_rules_accepted) {
      const profile = await getRaiderRulesProfile(userId);
      if (!profile) {
        return NextResponse.json(
          { error: 'Perfil no encontrado' },
          { status: 404 },
        );
      }

      const acceptedAt = new Date().toISOString();
      let roleAttempt: { ok: true } | { ok: false; error: string } | null =
        null;

      if (
        (profile.role_level ?? '').toLowerCase() === 'trial' &&
        profile.discord_user_id
      ) {
        const creds = await getGuildCredentials();
        if (creds.discord_bot_token && creds.discord_guild_id) {
          roleAttempt = await tryAssignRaiderVerifiedRole({
            discordUserId: profile.discord_user_id,
            guildId: creds.discord_guild_id,
            botToken: creds.discord_bot_token,
          });
        }
      }

      await markRaiderRulesAcceptanceState({
        userId,
        acceptedAt,
        acceptedVersion: RAIDER_RULES_VERSION,
        roleAssignedAt: roleAttempt?.ok ? acceptedAt : null,
        roleStatus:
          roleAttempt === null ? null : roleAttempt.ok ? 'assigned' : 'pending',
        roleError: roleAttempt && !roleAttempt.ok ? roleAttempt.error : null,
        roleLastAttemptAt: acceptedAt,
      });

      raiderRulesAcceptance = await getRaiderRulesAcceptance(userId);
    }

    return NextResponse.json({
      success: true,
      profile: data,
      raiderRulesAcceptance,
    });
  } catch (error: any) {
    console.error('[accounts.update]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
