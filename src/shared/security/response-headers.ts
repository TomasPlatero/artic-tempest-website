/**
 * Security header values shared by every layer that emits them: next.config.ts
 * for regular responses and the proxy (src/proxy.ts) for the ones it returns
 * directly — redirects, rate-limit and maintenance responses included.
 *
 * Keeping a single source here stops the two layers from drifting apart, which
 * is how Referrer-Policy ended up advertised with two different values (ATW-23).
 */
export const SECURITY_HEADER_VALUES = {
 "X-Frame-Options": "DENY",
 "X-Content-Type-Options": "nosniff",
 "Referrer-Policy": "strict-origin-when-cross-origin",
 "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
} as const;

type SecurityHeaderName = keyof typeof SECURITY_HEADER_VALUES;

/**
 * Applies {@link SECURITY_HEADER_VALUES} to a Headers instance, in place.
 * Returns the same instance so it can be used inline.
 */
export function applySecurityHeaders(headers: Headers): Headers {
 const names = Object.keys(SECURITY_HEADER_VALUES) as SecurityHeaderName[];

 for (const name of names) {
  headers.set(name, SECURITY_HEADER_VALUES[name]);
 }

 return headers;
}
