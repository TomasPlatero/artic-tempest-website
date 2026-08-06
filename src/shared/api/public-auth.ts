import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { extractBearerToken } from '@/shared/api/bearer';

type TokenCache = {
  hashes: Set<string>;
  loadedAt: number;
};

const CACHE_TTL_MS = 60_000;
const allowMissing =
  process.env.NODE_ENV !== 'production' &&
  process.env.ALLOW_PUBLIC_API_WITHOUT_TOKEN === 'true';

let cache: TokenCache | null = null;
let loadingPromise: Promise<void> | null = null;

function markTokenUsage(tokenHash: string) {
  void (async () => {
    try {
      await supabaseAdmin
        .from('public_api_tokens')
        .update({ last_used_at: new Date().toISOString() })
        .eq('token_hash', tokenHash)
        .limit(1);
    } catch (error) {
      console.error('[PUBLIC API] Error recording token usage', error);
    }
  })();
}

async function hydrateTokens(): Promise<Set<string>> {
  const shouldUseCache =
    cache !== null && Date.now() - cache.loadedAt < CACHE_TTL_MS;

  if (shouldUseCache) {
    return cache!.hashes;
  }

  if (!loadingPromise) {
    loadingPromise = (async () => {
      try {
        const { data, error } = await supabaseAdmin
          .from('public_api_tokens')
          .select('token_hash')
          .is('revoked_at', null);

        if (error) {
          throw error;
        }

        cache = {
          hashes: new Set((data ?? []).map((row) => row.token_hash)),
          loadedAt: Date.now(),
        };
      } catch (error) {
        console.error('[PUBLIC API] Error loading Bearer tokens', error);
        if (!cache) {
          cache = { hashes: new Set(), loadedAt: Date.now() };
        }
      }
    })().finally(() => {
      loadingPromise = null;
    });
  }

  const promise = loadingPromise;
  if (promise !== null) {
    await promise;
  }

  return cache?.hashes ?? new Set<string>();
}

async function isTokenHashActive(tokenHash: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('public_api_tokens')
      .select('token_hash')
      .eq('token_hash', tokenHash)
      .is('revoked_at', null)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[PUBLIC API] Error validating Bearer token hash', error);
      return false;
    }

    return Boolean(data?.token_hash);
  } catch (error) {
    console.error('[PUBLIC API] Unexpected token hash validation error', error);
    return false;
  }
}

export async function refreshBearerTokens() {
  cache = null;
  await hydrateTokens();
}

export function hashBearerToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export type BearerValidationResult =
  | { ok: true }
  | { ok: false; response: NextResponse };

function missingTokenResponse() {
  return NextResponse.json(
    { error: 'Missing bearer token', code: 'MISSING_BEARER_TOKEN' },
    { status: 401 },
  );
}

function misconfiguredResponse() {
  return NextResponse.json(
    { error: 'Bearer tokens not configured', code: 'TOKEN_CONFIG_MISSING' },
    { status: 500 },
  );
}

export async function validateBearerTokenValue(
  token?: string | null,
): Promise<BearerValidationResult> {
  const tokens = await hydrateTokens();

  if (!tokens.size) {
    if (allowMissing) {
      return { ok: true };
    }
    return { ok: false, response: misconfiguredResponse() };
  }

  if (!token) {
    return { ok: false, response: missingTokenResponse() };
  }

  const hashed = hashBearerToken(token);

  const knownInCache = tokens.has(hashed);
  const activeInDatabase = await isTokenHashActive(hashed);

  if (!activeInDatabase) {
    if (knownInCache) {
      tokens.delete(hashed);
    }
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Invalid token', code: 'INVALID_BEARER_TOKEN' },
        { status: 403 },
      ),
    };
  }

  if (!knownInCache) {
    tokens.add(hashed);
  }

  markTokenUsage(hashed);
  return { ok: true };
}

export async function enforceBearerToken(
  request: NextRequest,
  options?: { token?: string | null },
) {
  const token =
    options?.token ?? extractBearerToken(request.headers.get('authorization'));

  const result = await validateBearerTokenValue(token);
  return result.ok ? null : result.response;
}
