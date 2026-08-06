import { randomUUID } from 'crypto';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import { validateBearerTokenValue } from '@/shared/api/public-auth';
import { extractBearerToken } from '@/shared/api/bearer';

const DEFAULT_TTL = Number(process.env.DESKTOP_SESSION_TTL ?? '3600');
const ISSUER = 'guildboard-desktop';
const shouldLogDesktopAuth =
  process.env.NODE_ENV !== 'production' ||
  process.env.DEBUG_DESKTOP_AUTH === 'true';

type DesktopSessionBase = {
  sub: string;
  discordId: string;
  roleLevel: string;
  scope: string[];
  type: 'desktop_session';
};

export type DesktopSessionClaims = JWTPayload & DesktopSessionBase;

let secretKey: Uint8Array | null = null;

function logDesktopAuth(event: string, details?: Record<string, unknown>) {
  if (!shouldLogDesktopAuth) return;
  console.info('[DesktopAuth]', event, details ?? {});
}

function extractTrimmedHeader(request: NextRequest, name: string) {
  const value = request.headers.get(name)?.trim();
  return value?.length ? value : null;
}

function extractDesktopSessionToken(request: NextRequest) {
  return (
    extractTrimmedHeader(request, 'x-desktop-session-token') ??
    extractBearerToken(request.headers.get('authorization'))
  );
}

function getDesktopSecretKey() {
  if (secretKey) return secretKey;
  const secret =
    process.env.DESKTOP_SESSION_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      'Missing DESKTOP_SESSION_SECRET (or NEXTAUTH_SECRET fallback).',
    );
  }
  secretKey = new TextEncoder().encode(secret);
  return secretKey;
}

export async function createDesktopSessionToken(params: {
  userId: string;
  discordId: string;
  roleLevel: string;
  scope?: string[];
  ttlSeconds?: number;
}) {
  const ttl = params.ttlSeconds ?? DEFAULT_TTL;
  const token = await new SignJWT({
    sub: params.userId,
    discordId: params.discordId,
    roleLevel: params.roleLevel,
    scope: params.scope ?? ['desktop'],
    type: 'desktop_session',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setJti(randomUUID())
    .setExpirationTime(`${ttl}s`)
    .setIssuer(ISSUER)
    .sign(getDesktopSecretKey() as Uint8Array);

  return { token, expiresIn: ttl };
}

async function verifyDesktopSessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(
      token,
      getDesktopSecretKey() as Uint8Array,
      { issuer: ISSUER },
    );

    const claims = payload as DesktopSessionClaims;
    if (claims.type !== 'desktop_session') {
      return null;
    }

    return claims;
  } catch (error) {
    logDesktopAuth('desktop_session_token_rejected', {
      reason: error instanceof Error ? error.message : 'unknown_error',
      tokenLength: token.length,
    });
    return null;
  }
}

export type DesktopAuthSuccess =
  | { kind: 'desktop'; claims: DesktopSessionClaims }
  | { kind: 'integration' };

export async function enforceDesktopOrIntegrationAuth(
  request: NextRequest,
): Promise<DesktopAuthSuccess | NextResponse> {
  const header = request.headers.get('authorization');
  const token = extractDesktopSessionToken(request);

  logDesktopAuth('auth_header_received', {
    pathname: request.nextUrl.pathname,
    hasAuthorizationHeader: Boolean(header),
    isBearerToken: Boolean(token),
    tokenLength: token?.length ?? 0,
  });

  if (!token) {
    logDesktopAuth('auth_rejected_missing_bearer', {
      pathname: request.nextUrl.pathname,
    });
    return NextResponse.json(
      { error: 'Missing bearer token', code: 'MISSING_BEARER_TOKEN' },
      { status: 401 },
    );
  }

  const desktopClaims = await verifyDesktopSessionToken(token);
  if (desktopClaims) {
    logDesktopAuth('auth_accepted_desktop_session', {
      pathname: request.nextUrl.pathname,
      sub: desktopClaims.sub,
      roleLevel: desktopClaims.roleLevel,
      iss: desktopClaims.iss,
    });
    return { kind: 'desktop', claims: desktopClaims };
  }

  const validation = await validateBearerTokenValue(token);
  if (!validation.ok) {
    logDesktopAuth('auth_rejected_integration_token', {
      pathname: request.nextUrl.pathname,
    });
    return validation.response;
  }

  logDesktopAuth('auth_accepted_integration_token', {
    pathname: request.nextUrl.pathname,
  });
  return { kind: 'integration' };
}

export async function enforceDesktopSessionAuth(
  request: NextRequest,
): Promise<DesktopSessionClaims | NextResponse> {
  const token = extractDesktopSessionToken(request);

  if (!token) {
    return NextResponse.json(
      { error: 'Missing bearer token', code: 'MISSING_BEARER_TOKEN' },
      { status: 401 },
    );
  }

  const desktopClaims = await verifyDesktopSessionToken(token);
  if (!desktopClaims) {
    return NextResponse.json(
      {
        error: 'Desktop session required',
        code: 'DESKTOP_SESSION_REQUIRED',
      },
      { status: 403 },
    );
  }

  return desktopClaims;
}
