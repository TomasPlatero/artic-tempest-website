/**
 * Synchronous CSP nonce generator.
 *
 * Generates a random nonce without calling `headers()`, so it does not
 * force dynamic rendering on the root layout.
 *
 * In production (Vercel) the CSP header set in next.config.ts uses
 * `'unsafe-inline'` for scripts, so the nonce is not strictly needed
 * for CSP enforcement — but tools like Cookiebot benefit from having it.
 */
export function getSynchronousNonce(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return Math.random().toString(36).slice(2, 15);
}
