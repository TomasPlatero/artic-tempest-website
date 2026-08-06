import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { auth } from '@/auth';
import { getGuildCredentials } from '@/shared/auth/credentials';
import {
  DISCORD_LINKED_ROLES_STATE_COOKIE,
  getDiscordLinkedRolesRedirectUri,
} from '@/shared/discord/linked-roles';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
      return NextResponse.redirect(
        new URL('/login?redirectPath=/discord/roles-vinculados', request.url),
      );
  }

  const creds = await getGuildCredentials();
  const clientId = creds.discord_client_id || creds.discord_app_id;
  const redirectUri = getDiscordLinkedRolesRedirectUri(request);

  if (!clientId) {
    return NextResponse.json({ error: 'Discord no está configurado' }, { status: 500 });
  }

  const state = randomUUID();
  const authUrl = new URL('https://discord.com/api/oauth2/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', 'identify role_connections.write');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('prompt', 'consent');

  const response = NextResponse.redirect(authUrl);
  response.cookies.set(DISCORD_LINKED_ROLES_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 10 * 60,
  });
  return response;
}
