import { NextResponse } from 'next/server';
import { getGuildCredentials } from '@/shared/auth/credentials';
import { ensureAppPermission } from '@/shared/auth/permissions';
import { deleteUserAndRelatedData } from '@/shared/lib/delete-user';
import {
  getRaiderRulesProfile,
  tryRemoveRaiderVerifiedRole,
} from '@/shared/lib/raider-rules.server';

export async function DELETE(req: Request) {
  const session = await ensureAppPermission('settings-accounts', 'manage');

  try {
    const { userId } = await req.json();
    if (!userId) throw new Error('userId es requerido');

    // No permitimos que el GM se borre a sí mismo desde aquí por seguridad
    if (userId === session.user.id) {
      return NextResponse.json(
        {
          error:
            "No puedes borrar tu propia cuenta desde este panel. Usa el panel de 'Mis Personajes' si deseas darte de baja.",
        },
        { status: 400 },
      );
    }

    const profile = await getRaiderRulesProfile(userId);
    if (profile?.discord_user_id) {
      const creds = await getGuildCredentials();
      if (creds.discord_bot_token && creds.discord_guild_id) {
        const roleRemoval = await tryRemoveRaiderVerifiedRole({
          discordUserId: profile.discord_user_id,
          guildId: creds.discord_guild_id,
          botToken: creds.discord_bot_token,
        });

        if (!roleRemoval.ok) {
          return NextResponse.json(
            { error: roleRemoval.error },
            { status: 500 },
          );
        }
      }
    }

    await deleteUserAndRelatedData(userId);

    return NextResponse.json({
      success: true,
      message:
        'Usuario y todos sus datos asociados han sido eliminados permanentemente.',
    });
  } catch (error: any) {
    console.error('Admin user delete error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
