import { expect } from "vitest";

/**
 * Asserts the security headers that next.config.ts applies at build time.
 *
 * X-Frame-Options is intentionally NOT checked here: since 8e55a18a (v1.10.9) it
 * is set by the proxy (see response-headers.ts) on every response, redirects
 * included. Clickjacking stays covered here through the CSP frame-ancestors
 * directive asserted below.
 */
export function assertSecurityHeaders(headers: Headers) {
  // Content-Security-Policy
  const csp = headers.get("Content-Security-Policy");
  expect(csp, "Content-Security-Policy header missing").toBeTruthy();
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).toContain("base-uri 'self'");
  expect(csp).toContain("form-action 'self'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("upgrade-insecure-requests");

  // In production, unsafe-eval should NOT be present
  if (process.env.NODE_ENV === "production") {
    expect(csp).not.toContain("'unsafe-eval'");
  }

  // X-Content-Type-Options
  expect(
    headers.get("X-Content-Type-Options"),
    "X-Content-Type-Options header missing",
  ).toBe("nosniff");

  // Referrer-Policy
  expect(headers.get("Referrer-Policy"), "Referrer-Policy header missing").toBe(
    "strict-origin-when-cross-origin",
  );

  // Strict-Transport-Security
  expect(
    headers.get("Strict-Transport-Security"),
    "Strict-Transport-Security header missing",
  ).toBe("max-age=31536000; includeSubDomains; preload");

  // Permissions-Policy
  const pp = headers.get("Permissions-Policy");
  expect(pp, "Permissions-Policy header missing").toBeTruthy();
  expect(pp).toContain("camera=()");
  expect(pp).toContain("microphone=()");
  expect(pp).toContain("geolocation=()");

  // Cross-Origin-Opener-Policy
  expect(
    headers.get("Cross-Origin-Opener-Policy"),
    "Cross-Origin-Opener-Policy header missing",
  ).toBe("same-origin-allow-popups");

  // Cross-Origin-Resource-Policy
  expect(
    headers.get("Cross-Origin-Resource-Policy"),
    "Cross-Origin-Resource-Policy header missing",
  ).toBe("same-origin");
}

/**
 * Parses a Set-Cookie string and asserts a specific attribute has the expected value.
 *
 * Example: assertCookieAttribute('sid=abc; HttpOnly; SameSite=Lax', 'HttpOnly', 'true')
 */
export function assertCookieAttribute(
  setCookie: string,
  attr: string,
  value: string,
) {
  const parts = setCookie.split(";").map((s) => s.trim());
  const attrLower = attr.toLowerCase();
  const found = parts.find(
    (p) =>
      p.toLowerCase() === attrLower ||
      p.toLowerCase().startsWith(`${attrLower}=`),
  );
  expect(
    found,
    `Cookie attribute '${attr}' not found in: ${setCookie}`,
  ).toBeTruthy();

  if (value === "true" || value === "false") {
    // Boolean attributes like HttpOnly or Secure — just check presence/absence
    // value='true' means present, value='false' means absent
    if (value === "false") {
      expect(
        parts.some((p) => p.toLowerCase() === attrLower),
        `Cookie attribute '${attr}' should NOT be present in: ${setCookie}`,
      ).toBe(false);
    }
  } else {
    // Key=value attributes like SameSite=Lax, Max-Age=0, Path=/
    const expected = attr.endsWith("=")
      ? `${attr}${value}`
      : `${attr}=${value}`;
    expect(
      parts.some((p) => p.toLowerCase() === expected.toLowerCase()),
      `Expected '${expected}' in: ${setCookie}`,
    ).toBe(true);
  }
}

/**
 * Creates a minimal mock Request object for testing.
 */
function _createMockRequest(
  method: string = "GET",
  headers?: Record<string, string>,
): Request {
  return new Request("https://example.com/api/test", {
    method,
    headers: headers ? new Headers(headers) : undefined,
  });
}
