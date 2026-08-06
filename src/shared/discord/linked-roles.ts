import type { AuthzSnapshot } from '@/shared/types/auth';

export const DISCORD_LINKED_ROLES_STATE_COOKIE = 'discord_linked_roles_state';

export function getDiscordLinkedRolesVerificationUrl(request: Request) {
  return new URL('/discord/roles-vinculados', request.url).toString();
}

export function getDiscordLinkedRolesRedirectUri(request: Request) {
  return new URL('/api/discord/roles-vinculados/callback', request.url).toString();
}

export function buildDiscordLinkedRolesMetadata(snapshot: AuthzSnapshot) {
  return {
    raider_verified: snapshot.scope === 'zona_raider' || snapshot.scope === 'internal_admin' ? '1' : '0',
    internal_admin: snapshot.scope === 'internal_admin' ? '1' : '0',
  };
}

export function buildDiscordLinkedRolesMetadataRecords() {
  return [
    {
      key: 'raider_verified',
      name: 'Raider verificado',
      description: 'Permite verificar que la cuenta pertenece a Zona Raider.',
      type: 7,
    },
    {
      key: 'internal_admin',
      name: 'Staff interno',
      description: 'Permite verificar acceso de administración interna.',
      type: 7,
    },
  ] as const;
}
