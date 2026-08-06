/**
 * Error response security tests.
 *
 * Verifies apiErrorResponse() and parseJsonBody() prevent information leaking
 * (no stack traces in production, Zod errors flattened, generic 500 messages).
 *
 * @ci
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { z } from 'zod';
import {
  apiErrorResponse,
  parseJsonBody,
  unauthorized,
  forbidden,
} from './errors';

// ── Helpers ────────────────────────────────────────────────────────────────
function extractJsonBody(response: Response): any {
  return response.json();
}

function buildRequest(body?: Record<string, unknown>): Request {
  return new Request('http://localhost/api/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

// ── apiErrorResponse tests ──────────────────────────────────────────────────
describe('apiErrorResponse — error leaking prevention', () => {
  describe('ApiError handling', () => {
    it('returns correct status, code, and message via unauthorized()', async () => {
      const error = unauthorized('No session', 'NO_SESSION');
      const res = apiErrorResponse(error);
      expect(res.status).toBe(401);

      const body = await extractJsonBody(res);
      expect(body.error).toBe('No session');
      expect(body.code).toBe('NO_SESSION');
    });

    it('returns correct status via forbidden()', async () => {
      const error = forbidden('Account banned', 'ACCOUNT_BANNED');
      const res = apiErrorResponse(error);
      expect(res.status).toBe(403);

      const body = await extractJsonBody(res);
      expect(body.error).toBe('Account banned');
      expect(body.code).toBe('ACCOUNT_BANNED');
    });

    it('includes details when ApiError has details (unauthorized with extra context)', async () => {
      const error = unauthorized('IP blocked', 'IP_BLOCKED', {
        ip: '192.168.1.1',
      });
      const res = apiErrorResponse(error);
      const body = await extractJsonBody(res);
      expect(body.details).toEqual({ ip: '192.168.1.1' });
    });

    it('does NOT include details when ApiError has no details', async () => {
      const error = unauthorized();
      const res = apiErrorResponse(error);
      const body = await extractJsonBody(res);
      expect(body.details).toBeUndefined();
    });
  });

  describe('ZodError handling', () => {
    it('returns 400 with code VALIDATION_ERROR and flattened issues', async () => {
      const schema = z.object({ name: z.string() });
      let zodError: z.ZodError | null = null;
      try {
        schema.parse({ name: 123 });
      } catch (e) {
        zodError = e as z.ZodError;
      }

      expect(zodError).toBeTruthy();
      const res = apiErrorResponse(zodError!);
      expect(res.status).toBe(400);

      const body = await extractJsonBody(res);
      expect(body.error).toBe('Validation failed');
      expect(body.code).toBe('VALIDATION_ERROR');
      expect(body.issues).toBeDefined();
      // issues should be flattened, not raw
      expect(body.issues.formErrors).toBeDefined();
      expect(body.issues.fieldErrors).toBeDefined();
    });
  });

  describe('unknown Error handling', () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('returns generic 500 message in production (no error.message exposed)', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      const error = new Error('Sensitive DB connection string: postgres://...');
      const res = apiErrorResponse(error, 'Internal server error');
      expect(res.status).toBe(500);

      const body = await extractJsonBody(res);
      expect(body.error).toBe('Internal server error');
      expect(body.code).toBe('INTERNAL_SERVER_ERROR');
      // The original sensitive message must NOT be exposed
      expect(body.error).not.toContain('Sensitive');
      expect(body.error).not.toContain('postgres');
      // No stack trace in body
      expect(body.stack).toBeUndefined();
    });

    it('exposes original error message in non-production (dev)', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      const error = new Error('Dev mode stack trace info');
      const res = apiErrorResponse(error, 'Internal server error');
      const body = await extractJsonBody(res);
      expect(body.error).toBe('Dev mode stack trace info');
      expect(body.code).toBe('INTERNAL_SERVER_ERROR');
    });

    it('uses fallback message for non-Error throwables', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      const res = apiErrorResponse('just a string error');
      const body = await extractJsonBody(res);
      expect(body.error).toBe('Internal server error');
      expect(res.status).toBe(500);
    });

    it('uses custom fallback message when provided', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      const res = apiErrorResponse(
        new Error('anything'),
        'Service temporarily unavailable',
      );
      const body = await extractJsonBody(res);
      expect(body.error).toBe('Service temporarily unavailable');
    });
  });
});

// ── parseJsonBody tests ─────────────────────────────────────────────────────
describe('parseJsonBody — input validation', () => {
  const testSchema = z.object({
    name: z.string(),
    age: z.number().optional(),
  });

  it('returns parsed data for valid JSON body', async () => {
    const req = buildRequest({ name: 'Test', age: 30 });
    const result = await parseJsonBody(req, testSchema);
    expect(result).toEqual({ name: 'Test', age: 30 });
  });

  it('throws ApiError with INVALID_JSON_BODY when request body is missing', async () => {
    const req = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // No body — request.json() will reject; .catch(() => undefined)
      body: undefined,
    });

    try {
      await parseJsonBody(req, testSchema);
      expect.unreachable('Should have thrown');
    } catch (e: any) {
      expect(e.status).toBe(400);
      expect(e.code).toBe('INVALID_JSON_BODY');
      expect(e.message).toBe('JSON body inválido');
    }
  });

  it('throws ZodError when body does not match schema', async () => {
    const req = buildRequest({ name: 123, extraField: true });

    try {
      await parseJsonBody(req, testSchema);
      expect.unreachable('Should have thrown');
    } catch (e: any) {
      expect(e.constructor.name).toBe('ZodError');
    }
  });

  it('ZodError from parseJsonBody produces correct apiErrorResponse', async () => {
    const req = buildRequest({ name: 123 });

    try {
      await parseJsonBody(req, testSchema);
      expect.unreachable('Should have thrown');
    } catch (e) {
      const res = apiErrorResponse(e);
      expect(res.status).toBe(400);

      const body = await extractJsonBody(res);
      expect(body.code).toBe('VALIDATION_ERROR');
      expect(body.issues).toBeDefined();
    }
  });
});
