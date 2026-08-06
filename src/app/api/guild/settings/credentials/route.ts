import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { invalidateCredentialsCache } from '@/shared/auth/credentials';
import { getAuthzSnapshot } from '@/shared/auth/authz';
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
      discord_streams_channel_id,
      discord_recruitment_channel_id,
      discord_requested_scopes,
      bnet_client_id,
      bnet_client_secret,
      wowaudit_api_key,
      wcl_client_id,
      wcl_client_secret,
    } = body;

    const MASK = '••••••••••••••••';
    const authz = await getAuthzSnapshot(session);
    const permissionChecks = await Promise.all([
      getAppPermission(authz.roleSlug ?? session.user?.roleLevel ?? 'invitado', 'settings-discord'),
      getAppPermission(authz.roleSlug ?? session.user?.roleLevel ?? 'invitado', 'settings-bnet'),
      getAppPermission(authz.roleSlug ?? session.user?.roleLevel ?? 'invitado', 'settings-api'),
    ]);
    const [discordPermission, bnetPermission, apiPermission] = permissionChecks;

    const hasDiscordFields = [
      discord_client_id,
      discord_client_secret,
      discord_app_id,
      discord_bot_token,
      discord_public_key,
      discord_guild_id,
      discord_streams_channel_id,
      discord_recruitment_channel_id,
      discord_requested_scopes,
    ].some((value) => value !== undefined);
    const hasBnetFields = [bnet_client_id, bnet_client_secret].some(
      (value) => value !== undefined,
    );
    const hasWowauditFields = [wowaudit_api_key].some(
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
    if (hasWowauditFields && !bnetPermission.canEdit) {
      return new NextResponse('Sin permisos para credenciales de WoWAudit', {
        status: 403,
      });
    }
    if (hasApiFields && !apiPermission.canEdit) {
      return new NextResponse('Sin permisos para credenciales API', {
        status: 403,
      });
    }

    // Build update object, skipping masked secrets (user didn't change them)
    const discordUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // Discord auth/token settings now live in app_discord
    if (discord_client_id !== undefined)
      discordUpdates.discord_client_id = discord_client_id || null;
    if (discord_app_id !== undefined)
      discordUpdates.discord_app_id = discord_app_id || null;
    if (discord_guild_id !== undefined)
      discordUpdates.discord_guild_id = discord_guild_id || null;
    if (discord_streams_channel_id !== undefined)
      discordUpdates.discord_streams_channel_id = discord_streams_channel_id || null;
    if (discord_recruitment_channel_id !== undefined)
      discordUpdates.discord_recruitment_channel_id = discord_recruitment_channel_id || null;
    if (discord_requested_scopes !== undefined)
      discordUpdates.discord_requested_scopes = discord_requested_scopes || null;

    // Secrets only update if not masked
    if (discord_client_secret !== undefined && discord_client_secret !== MASK) {
      discordUpdates.discord_client_secret = discord_client_secret || null;
    }
    if (discord_bot_token !== undefined && discord_bot_token !== MASK) {
      discordUpdates.discord_bot_token = discord_bot_token || null;
    }
    if (discord_public_key !== undefined && discord_public_key !== MASK) {
      discordUpdates.discord_public_key = discord_public_key || null;
    }

    if (hasDiscordFields) {
      const { error: discordError } = await supabaseAdmin
        .from('app_discord')
        .upsert(
          { id: 1, ...discordUpdates },
          { onConflict: 'id' },
        );

      if (discordError) {
        console.error(discordError);
        return new NextResponse('Error de base de datos (discord)', { status: 500 });
      }
    }

    if (bnet_client_id !== undefined || bnet_client_secret !== undefined) {
      const { error: bnetError } = await supabaseAdmin
        .from('app_battlenet')
        .upsert(
          {
            id: 1,
            updated_at: new Date().toISOString(),
            ...(bnet_client_id !== undefined ? { bnet_client_id: bnet_client_id || null } : {}),
            ...(bnet_client_secret !== undefined && bnet_client_secret !== MASK
              ? { bnet_client_secret: bnet_client_secret || null }
              : {}),
          },
          { onConflict: 'id' },
        );

      if (bnetError) {
        console.error(bnetError);
        return new NextResponse('Error de base de datos (battle.net)', { status: 500 });
      }
    }

    if (wowaudit_api_key !== undefined) {
      const { error: wowauditError } = await supabaseAdmin
        .from('app_wowaudit')
        .upsert(
          {
            id: 1,
            updated_at: new Date().toISOString(),
            wowaudit_api_key: wowaudit_api_key === MASK ? null : wowaudit_api_key || null,
          },
          { onConflict: 'id' },
        );

      if (wowauditError) {
        console.error(wowauditError);
        return new NextResponse('Error de base de datos (wowaudit)', { status: 500 });
      }
    }

    if (wcl_client_id !== undefined || wcl_client_secret !== undefined) {
      const { error: wclError } = await supabaseAdmin
        .from('app_wcl')
        .upsert(
          {
            id: 1,
            updated_at: new Date().toISOString(),
            ...(wcl_client_id !== undefined ? { wcl_client_id: wcl_client_id || null } : {}),
            ...(wcl_client_secret !== undefined && wcl_client_secret !== MASK
              ? { wcl_client_secret: wcl_client_secret || null }
              : {}),
          },
          { onConflict: 'id' },
        );

      if (wclError) {
        console.error(wclError);
        return new NextResponse('Error de base de datos (wcl)', { status: 500 });
      }
    }

    // Clear the in-memory credentials cache so next read picks up new values
    invalidateCredentialsCache();
    revalidatePath('/zona-raider/configuracion/wowaudit');

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Error saving credentials:', e.message);
    return new NextResponse('Error interno', { status: 500 });
  }
}
