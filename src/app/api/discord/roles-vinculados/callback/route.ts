import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/auth';
import { getGuildCredentials } from '@/shared/auth/credentials';
import { getAuthzSnapshot } from '@/shared/auth/authz';
import {
  buildDiscordLinkedRolesMetadata,
  DISCORD_LINKED_ROLES_STATE_COOKIE,
  getDiscordLinkedRolesRedirectUri,
} from '@/shared/discord/linked-roles';

async function exchangeCode(code: string, redirectUri: string) {
  const creds = await getGuildCredentials();
  const clientId = creds.discord_client_id || creds.discord_app_id;
  const clientSecret = creds.discord_client_secret;

  const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error('No se pudo intercambiar el código de Discord');
  }

  return (await tokenResponse.json()) as { access_token?: string };
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/login?redirectPath=/discord/roles-vinculados', request.url));
  }

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(DISCORD_LINKED_ROLES_STATE_COOKIE)?.value ?? null;

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL('/discord/roles-vinculados?error=state', request.url));
  }

  const authz = await getAuthzSnapshot(session);
  const redirectUri = getDiscordLinkedRolesRedirectUri(request);
  if (!redirectUri) {
    return NextResponse.redirect(new URL('/discord/roles-vinculados?error=config', request.url));
  }
  const tokenData = await exchangeCode(code, redirectUri);

  if (!tokenData.access_token) {
    return NextResponse.redirect(new URL('/discord/roles-vinculados?error=token', request.url));
  }

  const meResponse = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!meResponse.ok) {
    return NextResponse.redirect(new URL('/discord/roles-vinculados?error=discord', request.url));
  }

  const me = (await meResponse.json()) as { id?: string; username?: string; global_name?: string };
  if (!me.id || me.id !== session.user.discordId) {
    return NextResponse.redirect(new URL('/discord/roles-vinculados?error=user', request.url));
  }

  const creds = await getGuildCredentials();
  const clientId = creds.discord_client_id || creds.discord_app_id;

  const updateResponse = await fetch(
    `https://discord.com/api/users/@me/applications/${clientId}/role-connection`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        platform_name: 'Artic Tempest',
        platform_username: me.global_name || me.username || 'Artic Tempest',
        metadata: buildDiscordLinkedRolesMetadata(authz),
      }),
    },
  );

  if (!updateResponse.ok) {
    return NextResponse.redirect(new URL('/discord/roles-vinculados?error=update', request.url));
  }

  const response = NextResponse.redirect(new URL('/discord/roles-vinculados?success=1', request.url));
  response.cookies.delete(DISCORD_LINKED_ROLES_STATE_COOKIE);
  return response;
}
