const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

/**
 * True only for absolute `http`/`https` URLs.
 *
 * Values that reach the UI from the database or from configuration (image URLs,
 * external profile links, ...) must never be able to redirect the user to
 * `javascript:`, `data:` or any other scheme.
 */
export function isSafeExternalUrl(url: string | null | undefined): url is string {
	if (typeof url !== "string" || url.length === 0) return false;
	try {
		return ALLOWED_PROTOCOLS.has(new URL(url).protocol);
	} catch {
		return false;
	}
}

/**
 * Opens an external URL in a new tab, but only after validating that it is a
 * well-formed absolute `http`/`https` address. Anything else (relative paths,
 * `javascript:`, `data:`, malformed strings, `null`/`undefined`) is dropped, so
 * no value coming from the database or from configuration can send the user to
 * an attacker-controlled location.
 *
 * The validated URL is opened through a `<a rel="noopener noreferrer">` click
 * and never handed straight to `window.open`.
 */
export function openExternalUrl(
	url: string | null | undefined,
	target = "_blank",
): void {
	if (typeof url !== "string" || url.length === 0) return;
	let safeUrl: URL;
	try {
		safeUrl = new URL(url);
	} catch {
		return;
	}
	if (!ALLOWED_PROTOCOLS.has(safeUrl.protocol)) return;

	const anchor = document.createElement("a");
	anchor.href = safeUrl.href;
	anchor.target = target;
	anchor.rel = "noopener noreferrer";
	anchor.click();
}
