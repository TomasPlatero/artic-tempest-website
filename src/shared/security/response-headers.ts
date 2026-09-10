/**
 * Runtime security headers applied by the proxy (src/proxy.ts).
 *
 * They cannot live only in next.config.ts: the proxy has to set them on every
 * response it returns, including redirects, rate-limit and maintenance
 * responses that never reach a route handler.
 *
 * Keeping the values here instead of inline in the middleware closure makes
 * them directly assertable — see response-headers.test.ts.
 */
export const PROXY_SECURITY_HEADERS = {
	"X-Frame-Options": "DENY",
	"X-Content-Type-Options": "nosniff",
	"Referrer-Policy": "origin-when-cross-origin",
	"Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
} as const;

type ProxySecurityHeaderName = keyof typeof PROXY_SECURITY_HEADERS;

/**
 * Applies {@link PROXY_SECURITY_HEADERS} to a Headers instance, in place.
 * Returns the same instance so it can be used inline.
 */
export function applySecurityHeaders(headers: Headers): Headers {
	const names = Object.keys(PROXY_SECURITY_HEADERS) as ProxySecurityHeaderName[];

	for (const name of names) {
		headers.set(name, PROXY_SECURITY_HEADERS[name]);
	}

	return headers;
}
