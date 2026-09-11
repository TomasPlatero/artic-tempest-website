/**
 * Parses the request URL. Returns null instead of throwing when the incoming
 * URL is malformed, so route handlers can answer with a controlled response.
 */
export function parseRequestUrl(request: Request): URL | null {
	try {
		return new URL(request.url);
	} catch {
		return null;
	}
}
