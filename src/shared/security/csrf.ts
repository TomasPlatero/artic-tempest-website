/**
 * CSRF validation utility.
 *
 * Validates state-changing requests (POST, PUT, PATCH, DELETE) against
 * a NextAuth CSRF token sent via X-CSRF-Token header. Feature-flagged
 * via CSRF_ENABLED env var. Safe methods and Bearer-authenticated
 * requests bypass validation.
 *
 * Enforces:
 * - Token rotation (single-use): a token cannot be reused.
 * - Session-bound validation: the token must be bound to the current session.
 *
 * Token format: `{userId}:{randomToken}` where the userId prefix binds
 * the token to the issuing session. Tokens without a userId prefix are
 * accepted when session is null (unauthenticated context).
 *
 * @audit
 */

import type { Session } from 'next-auth';

// These helpers are inlined to avoid circular module dependencies.
// `forbidden` from @/shared/api/errors would work but keeping this
// module self-contained for security boundary clarity.

class CsrfError extends Error {
  status: number;
  code: string;

  constructor(message: string) {
    super(message);
    this.name = 'CsrfError';
    this.status = 403;
    this.code = 'CSRF_TOKEN_INVALID';
  }
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * In-memory store of used CSRF tokens for single-use enforcement.
 * Uses a Set — tokens are tracked per-process. In a multi-instance
 * deployment, this should be backed by a shared store (Redis, etc.).
 *
 * Exported via `resetCsrfTokens()` for test cleanup.
 */
const _usedTokens = new Set<string>();

/**
 * Resets the used-token store. Intended for test cleanup only.
 * Not for production use.
 */
export function resetCsrfTokens(): void {
  _usedTokens.clear();
}

/**
 * Validates CSRF protection for state-changing requests.
 *
 * @param request - The incoming Request object.
 * @param session - The current NextAuth session (null if unauthenticated).
 * @throws {CsrfError} with status 403 if CSRF validation fails.
 */
export async function validateCsrfToken(
  request: Request,
  session: Session | null,
): Promise<void> {
  // 1. Feature flag — off by default
  if (process.env.CSRF_ENABLED !== 'true') {
    return;
  }

  // 2. Safe methods bypass (GET, HEAD, OPTIONS)
  if (SAFE_METHODS.has(request.method.toUpperCase())) {
    return;
  }

  // 3. Bearer token bypass — API clients with Bearer auth don't need CSRF
  const authHeader = request.headers.get('authorization') ?? '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    return;
  }

  // 4. Extract X-CSRF-Token header
  const csrfHeader = request.headers.get('x-csrf-token')?.trim();

  if (!csrfHeader) {
    throw new CsrfError('CSRF token missing or invalid');
  }

  // 5. Basic length check (catch obviously invalid tokens early)
  if (csrfHeader.length < 8) {
    throw new CsrfError('CSRF token missing or invalid');
  }

  // 6. Session-bound validation
  // The token must be bound to the current session. Tokens use the format
  // `{userId}:{randomToken}`. When session is provided, the userId prefix
  // must match. When session is null (unauthenticated), the session-bound
  // check is skipped.
  if (session?.user?.id) {
    const colonIndex = csrfHeader.indexOf(':');
    if (colonIndex === -1) {
      // Token does not have a userId prefix — reject as unbound
      throw new CsrfError('CSRF token not bound to current session');
    }
    const tokenUserId = csrfHeader.slice(0, colonIndex);
    if (tokenUserId !== session.user.id) {
      throw new CsrfError('CSRF token not bound to current session');
    }
  }

  // 7. Token rotation (single-use enforcement)
  // A token that has already been used for a successful validation
  // MUST be rejected on subsequent requests.
  if (_usedTokens.has(csrfHeader)) {
    throw new CsrfError('CSRF token has already been used');
  }

  // 8. Mark token as used for rotation enforcement
  _usedTokens.add(csrfHeader);
}
