import { getGuildCredentials } from "@/shared/auth/credentials";

export type WowauditCharacter = {
  id: number;
  name: string;
  realm: string;
  class: string | null;
  role: string | null;
  rank: string | null;
  status?: string | null;
  note?: string | null;
  blizzard_id?: number | null;
  tracking_since?: string | null;
};

export type WowauditCharacterUpdate = {
  role?: "Melee" | "Ranged" | "Heal" | "Tank";
  rank?: string;
  note?: string | null;
};

type WowauditResponse =
  | WowauditCharacter[]
  | {
      characters?: WowauditCharacter[];
    };

const DEFAULT_BASE_URL = "https://www.wowaudit.com";

export function getWowauditBaseUrl() {
  return (process.env.WOWAUDIT_API_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

export async function getWowauditApiKey() {
  const creds = await getGuildCredentials();

  if (!creds.wowaudit_api_key) {
    throw new Error(
      "Faltan credenciales de WoWAudit (configúralas en Ajustes > WoWAudit)",
    );
  }

  return creds.wowaudit_api_key;
}

async function fetchWowauditJson(path: string): Promise<WowauditResponse> {
  const apiKey = await getWowauditApiKey();

  const response = await fetch(`${getWowauditBaseUrl()}${path}`, {
    headers: {
      accept: "application/json",
      Authorization: apiKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`WoWAudit API error ${response.status}: ${text}`);
  }

  return response.json();
}

export async function fetchWowauditCharacters() {
  const payload = await fetchWowauditJson("/v1/characters");

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.characters)) {
    return payload.characters;
  }

  return [];
}

export async function findWowauditCharacter(name: string, realm: string) {
  const characters = await fetchWowauditCharacters();
  const normalizedName = normalizeText(name);
  const normalizedRealm = normalizeText(realm);

  return characters.find(
    (character) =>
      normalizeText(character.name) === normalizedName &&
      normalizeText(character.realm) === normalizedRealm,
  );
}

export function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function toWowauditRole(role: string | null | undefined): WowauditCharacterUpdate["role"] {
  const normalized = normalizeText(role);
  if (normalized === "tank") return "Tank";
  if (normalized === "heal" || normalized === "healer") return "Heal";
  if (normalized === "melee" || normalized === "melee dps") return "Melee";
  if (normalized === "ranged" || normalized === "ranged dps") return "Ranged";
  return undefined;
}

export function toWowauditRank(
  rank: string | number | null | undefined,
  fallback?: string | null,
): string | undefined {
  const text = typeof rank === "number" ? String(rank) : normalizeText(rank);
  const normalizedFallback = normalizeText(fallback);

  if (text === "0" || normalizedFallback === "guild master") return "Guild Master";
  if (text === "1" || normalizedFallback === "oficial") return "Oficial";
  if (text === "2" || normalizedFallback === "alter oficial") return "Artic Mod";
  if (text === "3" || normalizedFallback === "raid leader") return "Raid Leader";
  if (text === "4" || normalizedFallback === "artic raider") return "Artic Raider";
  if (text === "5" || normalizedFallback === "raider") return "Raider";
  if (text === "6" || normalizedFallback === "trial") return "Trial";
  if (text === "7" || normalizedFallback === "alter raider") return "Alter Raider";
  if (text === "8" || text === "9" || normalizedFallback === "backup" || normalizedFallback === "member") return "Backup";
  return "Raider";
}

export function buildWowauditCharacterUpdate(character: WowauditCharacterUpdate) {
  return {
    ...(character.role ? { role: character.role } : {}),
    ...(character.rank ? { rank: character.rank } : {}),
    ...(character.note !== undefined ? { note: character.note } : {}),
  };
}

export async function updateWowauditCharacter(
  id: string | number,
  character: WowauditCharacterUpdate,
) {
  const apiKey = await getWowauditApiKey();
  const response = await fetch(`${getWowauditBaseUrl()}/v1/characters/${id}`, {
    method: "PUT",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({ character: buildWowauditCharacterUpdate(character) }),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`WoWAudit API error ${response.status}: ${text}`);
  }

  return response.json();
}

export async function deleteWowauditCharacter(id: string | number) {
  const apiKey = await getWowauditApiKey();
  const response = await fetch(`${getWowauditBaseUrl()}/v1/characters/${id}`, {
    method: "DELETE",
    headers: {
      accept: "application/json",
      Authorization: apiKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`WoWAudit API error ${response.status}: ${text}`);
  }

  return response.json();
}
