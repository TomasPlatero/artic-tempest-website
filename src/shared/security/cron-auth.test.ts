/**
 * Cron auth enforcement tests.
 *
 * Tests requireCronAuth() for 7 scenarios: valid Bearer, missing header,
 * wrong token, Basic auth, query secret fallback, missing CRON_SECRET env,
 * and empty Bearer token.
 *
 * @ci
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Dynamic import to allow env manipulation
let requireCronAuth: any;

beforeEach(async () => {
  // Re-import the module fresh to pick up env changes
  const mod = await import('./cron-auth');
  requireCronAuth = mod.requireCronAuth;
});

describe('requireCronAuth', () => {
  const originalCronSecret = process.env.CRON_SECRET;

  afterEach(() => {
    if (originalCronSecret !== undefined) {
      process.env.CRON_SECRET = originalCronSecret;
    } else {
      delete process.env.CRON_SECRET;
    }
  });

  // ── Helper ──────────────────────────────────────────────────────────────
  function createRequest(authHeader?: string | null, url?: string): Request {
    const headers = new Headers();
    if (authHeader !== undefined && authHeader !== null) {
      headers.set('authorization', authHeader);
    }
    return new Request(url ?? 'https://example.com/api/cron/test', {
      headers,
    });
  }

  // ── Scenario 1: Valid Bearer token ──────────────────────────────────────
  it('returns null (authorized) with valid Bearer token', () => {
    process.env.CRON_SECRET = 'my-secret-token';
    const req = createRequest('Bearer my-secret-token');
    const result = requireCronAuth(req);
    expect(result).toBeNull();
  });

  // ── Scenario 2: Missing Authorization header ────────────────────────────
  it('returns 401 JSON when Authorization header is missing', () => {
    process.env.CRON_SECRET = 'my-secret-token';
    const req = createRequest(null);
    const result = requireCronAuth(req);
    expect(result).not.toBeNull();
    expect(result.status).toBe(401);

    return result.json().then((body: any) => {
      expect(body.error).toBe('Unauthorized');
    });
  });

  // ── Scenario 3: Wrong Bearer token ──────────────────────────────────────
  it('returns 401 JSON with wrong Bearer token', () => {
    process.env.CRON_SECRET = 'my-secret-token';
    const req = createRequest('Bearer wrong-token');
    const result = requireCronAuth(req);
    expect(result).not.toBeNull();
    expect(result.status).toBe(401);
  });

  // ── Scenario 4: Basic auth instead of Bearer ─────────────────────────────
  it('returns 401 JSON when Basic auth is used instead of Bearer', () => {
    process.env.CRON_SECRET = 'my-secret-token';
    const req = createRequest('Basic dXNlcjpwYXNz');
    const result = requireCronAuth(req);
    expect(result).not.toBeNull();
    expect(result.status).toBe(401);
  });

  // ── Scenario 5: Query secret fallback ───────────────────────────────────
  it('authorizes via query secret when allowQuerySecret is true', () => {
    process.env.CRON_SECRET = 'my-secret-token';
    const req = createRequest(
      null,
      'https://example.com/api/cron/test?secret=my-secret-token',
    );
    const result = requireCronAuth(req, { allowQuerySecret: true });
    expect(result).toBeNull();
  });

  it('rejects query secret when allowQuerySecret is not set (defaults false)', () => {
    process.env.CRON_SECRET = 'my-secret-token';
    const req = createRequest(
      null,
      'https://example.com/api/cron/test?secret=my-secret-token',
    );
    const result = requireCronAuth(req);
    // Query secret fallback is disabled by default
    expect(result).not.toBeNull();
    expect(result.status).toBe(401);
  });

  // ── Scenario 6: CRON_SECRET env var missing ─────────────────────────────
  it('returns 503 Service unavailable when CRON_SECRET env is missing', () => {
    delete process.env.CRON_SECRET;
    const req = createRequest('Bearer anything');
    const result = requireCronAuth(req);
    expect(result).not.toBeNull();
    expect(result.status).toBe(503);

    return result.json().then((body: any) => {
      expect(body.error).toBe('Service unavailable');
    });
  });

  // ── Scenario 7: Empty Bearer token (just "Bearer ") ─────────────────────
  it('returns 401 JSON when Bearer token is empty (just "Bearer ")', () => {
    process.env.CRON_SECRET = 'my-secret-token';
    const req = createRequest('Bearer ');
    const result = requireCronAuth(req);
    expect(result).not.toBeNull();
    expect(result.status).toBe(401);
  });

  // ── Additional: exact CRON_SECRET matching ──────────────────────────────
  it('rejects Bearer token with extra whitespace', () => {
    process.env.CRON_SECRET = 'my-secret-token';
    const req = createRequest('Bearer  my-secret-token');
    const result = requireCronAuth(req);
    // Extra space means it doesn't match exactly
    expect(result).not.toBeNull();
    expect(result.status).toBe(401);
  });
});
