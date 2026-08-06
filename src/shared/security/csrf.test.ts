/**
 * CSRF validation tests.
 *
 * Tests validateCsrfToken(request, session) for 8 scenarios:
 * feature flag off, safe methods (GET/HEAD/OPTIONS), missing token,
 * invalid token, valid token, Bearer bypass, session-bound token,
 * single-use rotation.
 *
 * @audit — self-skips if NEXTAUTH_SECRET is missing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Self-skip guard ────────────────────────────────────────────────────────
const hasNextAuthSecret = Boolean(process.env.NEXTAUTH_SECRET);

const describeOrSkip = hasNextAuthSecret ? describe : describe.skip;

// ── Mock helpers ────────────────────────────────────────────────────────────
function createRequest(method: string = 'POST', headers?: Record<string, string>): Request {
  return new Request('https://example.com/api/test', {
    method,
    headers: headers ? new Headers(headers) : undefined,
  });
}

describeOrSkip('validateCsrfToken', () => {
  let validateCsrfToken: any;
  let resetCsrfTokens: any;

  const originalCsrfEnabled = process.env.CSRF_ENABLED;

  beforeEach(() => {
    // Reset CSRF_ENABLED to undefined between tests
    delete process.env.CSRF_ENABLED;
  });

  afterEach(() => {
    vi.resetModules();
    if (originalCsrfEnabled !== undefined) {
      process.env.CSRF_ENABLED = originalCsrfEnabled;
    } else {
      delete process.env.CSRF_ENABLED;
    }
  });

  // Dynamic import so we can reset modules between tests
  async function loadCsrfModule() {
    const mod = await import('./csrf');
    validateCsrfToken = mod.validateCsrfToken;
    resetCsrfTokens = mod.resetCsrfTokens;
  }

  // ── Feature flag: CSRF_ENABLED !== 'true' → pass through ──────────────────
  describe('feature flag behavior', () => {
    it('passes through (no error) when CSRF_ENABLED is not set', async () => {
      await loadCsrfModule();
      const req = createRequest('POST');
      // Should not throw when CSRF_ENABLED is missing
      await expect(
        validateCsrfToken(req, null),
      ).resolves.toBeUndefined();
    });

    it('passes through when CSRF_ENABLED is "false"', async () => {
      process.env.CSRF_ENABLED = 'false';
      await loadCsrfModule();
      const req = createRequest('POST');
      await expect(
        validateCsrfToken(req, null),
      ).resolves.toBeUndefined();
    });

    it('enforces CSRF when CSRF_ENABLED is "true"', async () => {
      process.env.CSRF_ENABLED = 'true';
      await loadCsrfModule();
      const req = createRequest('POST');
      // POST without X-CSRF-Token should throw when CSRF is enabled
      await expect(
        validateCsrfToken(req, null),
      ).rejects.toThrow();
    });
  });

  // ── Safe method bypass: GET, HEAD, OPTIONS ────────────────────────────────
  describe('safe method bypass', () => {
    it('allows GET requests without CSRF token', async () => {
      process.env.CSRF_ENABLED = 'true';
      await loadCsrfModule();
      const req = createRequest('GET');
      await expect(
        validateCsrfToken(req, null),
      ).resolves.toBeUndefined();
    });

    it('allows HEAD requests without CSRF token', async () => {
      process.env.CSRF_ENABLED = 'true';
      await loadCsrfModule();
      const req = createRequest('HEAD');
      await expect(
        validateCsrfToken(req, null),
      ).resolves.toBeUndefined();
    });

    it('allows OPTIONS requests without CSRF token', async () => {
      process.env.CSRF_ENABLED = 'true';
      await loadCsrfModule();
      const req = createRequest('OPTIONS');
      await expect(
        validateCsrfToken(req, null),
      ).resolves.toBeUndefined();
    });
  });

  // ── Bearer token bypass ───────────────────────────────────────────────────
  describe('Bearer token bypass', () => {
    it('allows POST with valid Authorization: Bearer header', async () => {
      process.env.CSRF_ENABLED = 'true';
      await loadCsrfModule();
      const req = createRequest('POST', {
        Authorization: 'Bearer valid-jwt-token-here',
      });
      await expect(
        validateCsrfToken(req, null),
      ).resolves.toBeUndefined();
    });
  });

  // ── Token validation: missing/invalid ─────────────────────────────────────
  describe('CSRF token validation', () => {
    it('throws 403 when X-CSRF-Token header is missing on POST', async () => {
      process.env.CSRF_ENABLED = 'true';
      await loadCsrfModule();
      const req = createRequest('POST');

      let caught: any = null;
      try {
        await validateCsrfToken(req, { user: { id: 'user-1' } });
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeTruthy();
      expect(caught.status).toBe(403);
      expect(caught.message).toContain('CSRF');
    });

    it('throws 403 when X-CSRF-Token is too short (invalid)', async () => {
      process.env.CSRF_ENABLED = 'true';
      await loadCsrfModule();
      const req = createRequest('POST', {
        'X-CSRF-Token': 'short',
      });

      let caught: any = null;
      try {
        await validateCsrfToken(req, { user: { id: 'user-1' } });
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeTruthy();
      expect(caught.status).toBe(403);
      expect(caught.message).toContain('CSRF');
    });
  });

  // ── Token rotation (single-use) ──────────────────────────────────────────
  describe('token rotation (single-use)', () => {
    it('accepts a valid token on first use', async () => {
      process.env.CSRF_ENABLED = 'true';
      await loadCsrfModule();
      const req = createRequest('POST', {
        'X-CSRF-Token': 'user-1:valid-csrf-token-first-use',
      });
      await expect(
        validateCsrfToken(req, { user: { id: 'user-1' } }),
      ).resolves.toBeUndefined();
    });

    it('rejects the same token on second use (rotation)', async () => {
      process.env.CSRF_ENABLED = 'true';
      await loadCsrfModule();
      const token = 'user-1:reuse-test-token-12345';

      // First call — should pass
      const req1 = createRequest('POST', { 'X-CSRF-Token': token });
      await validateCsrfToken(req1, { user: { id: 'user-1' } });

      // Second call — should fail (token already used)
      const req2 = createRequest('POST', { 'X-CSRF-Token': token });
      let caught: any = null;
      try {
        await validateCsrfToken(req2, { user: { id: 'user-1' } });
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeTruthy();
      expect(caught.status).toBe(403);
      expect(caught.message).toContain('already been used');
    });

    it('allows different tokens from same session without rotation error', async () => {
      process.env.CSRF_ENABLED = 'true';
      await loadCsrfModule();

      // First token
      const req1 = createRequest('POST', {
        'X-CSRF-Token': 'user-1:token-alpha-abc123',
      });
      await validateCsrfToken(req1, { user: { id: 'user-1' } });

      // Different token, same session — should work
      const req2 = createRequest('POST', {
        'X-CSRF-Token': 'user-1:token-beta-xyz789',
      });
      await expect(
        validateCsrfToken(req2, { user: { id: 'user-1' } }),
      ).resolves.toBeUndefined();
    });
  });

  // ── Session-bound token validation ───────────────────────────────────────
  describe('session-bound token validation', () => {
    it('rejects token from a different session (user-1 token, user-2 session)', async () => {
      process.env.CSRF_ENABLED = 'true';
      await loadCsrfModule();
      // Token issued for user-1 but used with user-2 session
      const req = createRequest('POST', {
        'X-CSRF-Token': 'user-1:some-valid-token-here',
      });
      let caught: any = null;
      try {
        await validateCsrfToken(req, { user: { id: 'user-2' } });
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeTruthy();
      expect(caught.status).toBe(403);
      expect(caught.message).toContain('session');
    });

    it('accepts token from the matching session', async () => {
      process.env.CSRF_ENABLED = 'true';
      await loadCsrfModule();
      const req = createRequest('POST', {
        'X-CSRF-Token': 'user-1:valid-session-bound-token',
      });
      await expect(
        validateCsrfToken(req, { user: { id: 'user-1' } }),
      ).resolves.toBeUndefined();
    });

    it('skips session binding check when no session (null)', async () => {
      process.env.CSRF_ENABLED = 'true';
      await loadCsrfModule();
      // Token without session id binding should still work when session is null
      const req = createRequest('POST', {
        'X-CSRF-Token': 'any-valid-token-no-session-12345',
      });
      await expect(
        validateCsrfToken(req, null),
      ).resolves.toBeUndefined();
    });
  });

  // ── Combined: rotation + session ─────────────────────────────────────────
  describe('combined rotation and session checks', () => {
    it('rejects reused token even if session matches', async () => {
      process.env.CSRF_ENABLED = 'true';
      await loadCsrfModule();
      const token = 'user-1:combined-test-token';

      // First use — passes
      const req1 = createRequest('POST', { 'X-CSRF-Token': token });
      await validateCsrfToken(req1, { user: { id: 'user-1' } });

      // Second use — fails on rotation check (even though session matches)
      const req2 = createRequest('POST', { 'X-CSRF-Token': token });
      let caught: any = null;
      try {
        await validateCsrfToken(req2, { user: { id: 'user-1' } });
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeTruthy();
      expect(caught.status).toBe(403);
    });

    it('rejects token when both session mismatch and already used', async () => {
      process.env.CSRF_ENABLED = 'true';
      await loadCsrfModule();
      const token = 'user-1:double-bad-token';

      // First, use with correct session
      const req1 = createRequest('POST', { 'X-CSRF-Token': token });
      await validateCsrfToken(req1, { user: { id: 'user-1' } });

      // Second, try with wrong session — should still reject
      const req2 = createRequest('POST', { 'X-CSRF-Token': token });
      let caught: any = null;
      try {
        await validateCsrfToken(req2, { user: { id: 'user-2' } });
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeTruthy();
      expect(caught.status).toBe(403);
    });
  });

  // ── resetCsrfTokens test helper ──────────────────────────────────────────
  describe('resetCsrfTokens', () => {
    it('clears used-token tracking, allowing token reuse after reset', async () => {
      process.env.CSRF_ENABLED = 'true';
      await loadCsrfModule();
      const token = 'user-1:resettable-token-abc';

      // First use — passes
      const req1 = createRequest('POST', { 'X-CSRF-Token': token });
      await validateCsrfToken(req1, { user: { id: 'user-1' } });

      // Second use — fails (rotation)
      const req2 = createRequest('POST', { 'X-CSRF-Token': token });
      await expect(
        validateCsrfToken(req2, { user: { id: 'user-1' } }),
      ).rejects.toThrow();

      // Reset the token store
      resetCsrfTokens();

      // Third use after reset — should pass again
      const req3 = createRequest('POST', { 'X-CSRF-Token': token });
      await expect(
        validateCsrfToken(req3, { user: { id: 'user-1' } }),
      ).resolves.toBeUndefined();
    });
  });
});
