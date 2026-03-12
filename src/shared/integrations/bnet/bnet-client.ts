// src/shared/integrations/bnet/bnet-client.ts
// Blizzard Battle.net API client using client_credentials OAuth2

import { getGuildCredentials } from '@/shared/auth/credentials';

/** Cached token */
let cachedToken: { token: string; expiresAt: number } | null = null;

/** Get OAuth2 access token via client_credentials */
export async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const creds = await getGuildCredentials();
  if (!creds.bnet_client_id || !creds.bnet_client_secret) {
    throw new Error(
      'Faltan credenciales de Battle.net (configúralas en Ajustes > General)',
    );
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: creds.bnet_client_id,
    client_secret: creds.bnet_client_secret,
  });

  const res = await fetch('https://oauth.battle.net/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Battle.net OAuth error ${res.status}: ${text}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000, // refresh 1 min before expiry
  };

  return cachedToken.token;
}

/** Fetch a single character's active spec and deduce their role */
export async function fetchCharacterRole(
  realmSlug: string,
  characterNameSlug: string,
  region: string,
  token: string,
  specRoleMapping?: Record<string, string>,
): Promise<string | null> {
  if (!specRoleMapping) return null;

  const url = `https://${region}.api.blizzard.com/profile/wow/character/${realmSlug}/${characterNameSlug}?namespace=profile-${region}&locale=en_US`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;

    const data = await res.json();
    const specName = data.active_spec?.name as string;
    if (!specName) return null;

    // Handle collision: Frost can be Mage (Ranged) or DK (Melee).
    if (specName === 'Frost') {
      return data.character_class?.id === 8 /* Mage */ ? 'ranged' : 'melee';
    }

    return specRoleMapping[specName] || null;
  } catch {
    return null;
  }
}

export async function fetchCharacterSpec(
  realmSlug: string,
  characterNameSlug: string,
  region: string,
  token: string,
): Promise<string | null> {
  const url = `https://${region}.api.blizzard.com/profile/wow/character/${realmSlug}/${characterNameSlug}?namespace=profile-${region}&locale=en_US`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;

    const data = await res.json();
    return data.active_spec?.name || null;
  } catch {
    return null;
  }
}

/** Fetch a character's item level from Battle.net */
export async function fetchCharacterItemLevel(
  realmSlug: string,
  characterNameSlug: string,
  region: string = 'eu',
): Promise<{ equipped: number; average: number } | null> {
  const token = await getAccessToken();
  const url = `https://${region}.api.blizzard.com/profile/wow/character/${realmSlug}/${characterNameSlug}?namespace=profile-${region}&locale=en_US`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;

    const data = await res.json();
    return {
      equipped: data.equipped_item_level || 0,
      average: data.average_item_level || 0,
    };
  } catch {
    return null;
  }
}

export type GuildMemberRaw = {
  character: {
    name: string;
    id: number;
    realm: { slug: string; name: string };
    level: number;
    playable_class: { id: number };
    playable_race: { id: number };
  };
  rank: number;
  role?: string; // dynamically fetched
};

type GuildRosterResponse = {
  members: GuildMemberRaw[];
};

/** Fetch guild roster from Blizzard API */
export async function fetchGuildRoster(
  realmSlug: string,
  guildNameSlug: string,
  region: string = 'eu',
  locale: string = 'es_ES',
  specRoleMapping?: Record<string, string>,
): Promise<GuildMemberRaw[]> {
  const token = await getAccessToken();

  const url = `https://${region}.api.blizzard.com/data/wow/guild/${realmSlug}/${guildNameSlug}/roster?namespace=profile-${region}&locale=${locale}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Blizzard API ${res.status}: ${text}`);
  }

  const data: GuildRosterResponse = await res.json();
  const members = data.members ?? [];

  // Fetch active specs in chunks to avoid overwhelming the server/connections
  const CHUNK_SIZE = 20;
  for (let i = 0; i < members.length; i += CHUNK_SIZE) {
    const chunk = members.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map(async (m: GuildMemberRaw) => {
        const role = await fetchCharacterRole(
          m.character.realm.slug,
          m.character.name.toLowerCase(),
          region,
          token,
          specRoleMapping,
        );
        if (role) {
          m.role = role;
        }
      }),
    );
  }

  return members;
}

/** Fetch guild summary (faction, achievement points, etc.) from Blizzard API */
export async function fetchGuildSummary(
  realmSlug: string,
  guildNameSlug: string,
  region: string = 'eu',
  locale: string = 'es_ES',
): Promise<any> {
  const token = await getAccessToken();
  const url = `https://${region}.api.blizzard.com/data/wow/guild/${realmSlug}/${guildNameSlug}?namespace=profile-${region}&locale=${locale}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Fetch character equipment from Battle.net */
export async function fetchCharacterEquipment(
  realmSlug: string,
  characterNameSlug: string,
  region: string = 'eu',
): Promise<any> {
  const token = await getAccessToken();
  const url = `https://${region}.api.blizzard.com/profile/wow/character/${realmSlug}/${characterNameSlug}/equipment?namespace=profile-${region}&locale=en_US`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Fetch a single item's data (for filtering purposes) */
export async function fetchItemData(
  itemId: number,
  region: string = 'eu',
): Promise<any> {
  const token = await getAccessToken();
  const url = `https://${region}.api.blizzard.com/data/wow/item/${itemId}?namespace=static-${region}&locale=en_US`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Convert guild name to slug (lowercase, hyphens, no special chars) */
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
