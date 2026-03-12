import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/auth/auth-options';
import { invalidateCredentialsCache } from '@/shared/auth/credentials';
import {
  ensureAuthenticatedSession,
  getAppPermission,
} from '@/shared/auth/permissions';

export async function PATCH(req: Request) {
  try {
    const session = await ensureAuthenticatedSession();

    const body = await req.json();
    const {
      discord_client_id,
      discord_client_secret,
      discord_app_id,
      discord_bot_token,
      discord_public_key,
      discord_guild_id,
      bnet_client_id,
      bnet_client_secret,
      wcl_client_id,
      wcl_client_secret,
    } = body;

    const MASK = '••••••••••••••••';
    const permissionChecks = await Promise.all([
      getAppPermission(
        session.user.roleLevel ?? 'invitado',
        'settings-discord',
      ),
      getAppPermission(session.user.roleLevel ?? 'invitado', 'settings-bnet'),
      getAppPermission(session.user.roleLevel ?? 'invitado', 'settings-api'),
    ]);
    const [discordPermission, bnetPermission, apiPermission] = permissionChecks;

    const hasDiscordFields = [
      discord_client_id,
      discord_client_secret,
      discord_app_id,
      discord_bot_token,
      discord_public_key,
      discord_guild_id,
    ].some((value) => value !== undefined);
    const hasBnetFields = [bnet_client_id, bnet_client_secret].some(
      (value) => value !== undefined,
    );
    const hasApiFields = [wcl_client_id, wcl_client_secret].some(
      (value) => value !== undefined,
    );

    if (hasDiscordFields && !discordPermission.canEdit) {
      return new NextResponse('Sin permisos para credenciales de Discord', {
        status: 403,
      });
    }
    if (hasBnetFields && !bnetPermission.canEdit) {
      return new NextResponse('Sin permisos para credenciales de Battle.net', {
        status: 403,
      });
    }
    if (hasApiFields && !apiPermission.canEdit) {
      return new NextResponse('Sin permisos para credenciales API', {
        status: 403,
      });
    }

    // Build update object, skipping masked secrets (user didn't change them)
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // IDs always update (not secrets)
    if (discord_client_id !== undefined)
      updates.discord_client_id = discord_client_id || null;
    if (discord_app_id !== undefined)
      updates.discord_app_id = discord_app_id || null;
    if (discord_guild_id !== undefined)
      updates.discord_guild_id = discord_guild_id || null;
    if (bnet_client_id !== undefined)
      updates.bnet_client_id = bnet_client_id || null;
    if (wcl_client_id !== undefined)
      updates.wcl_client_id = wcl_client_id || null;

    // Secrets only update if not masked
    if (discord_client_secret !== undefined && discord_client_secret !== MASK) {
      updates.discord_client_secret = discord_client_secret || null;
    }
    if (discord_bot_token !== undefined && discord_bot_token !== MASK) {
      updates.discord_bot_token = discord_bot_token || null;
    }
    if (discord_public_key !== undefined && discord_public_key !== MASK) {
      updates.discord_public_key = discord_public_key || null;
    }
    if (bnet_client_secret !== undefined && bnet_client_secret !== MASK) {
      updates.bnet_client_secret = bnet_client_secret || null;
    }
    if (wcl_client_secret !== undefined && wcl_client_secret !== MASK) {
      updates.wcl_client_secret = wcl_client_secret || null;
    }

    const { error } = await supabaseAdmin
      .from('guilds_managed')
      .update(updates)
      .neq('guild_id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.error(error);
      return new NextResponse('Error de base de datos', { status: 500 });
    }

    // Clear the in-memory credentials cache so next read picks up new values
    invalidateCredentialsCache();

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Error saving credentials:', e.message);
    return new NextResponse('Error interno', { status: 500 });
  }
}
