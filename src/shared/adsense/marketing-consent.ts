const COOKIE_CONSENT_KEY = "artictempest_cookie_consent";
const COOKIEYES_CONSENT_KEY = "cookieyes-consent";

type ConsentCookiePayload = {
	categories?: string[];
};

/** Events emitted by the active CMP when the stored consent changes. */
const CONSENT_CHANGE_EVENTS = [
	"cc-consent-updated",
	"cookieyes_consent_update",
	"cookieyes_banner_load",
] as const;

function getCookieValue(name: string): string | null {
	if (typeof window === "undefined") return null;
	const match = document.cookie.match(
		new RegExp(`(^|;)\\s*${name}\\s*=\\s*([^;]+)`),
	);
	return match ? decodeURIComponent(match[2]) : null;
}

function readVanillaConsent(): ConsentCookiePayload | null {
	const raw = getCookieValue(COOKIE_CONSENT_KEY);
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw) as ConsentCookiePayload;
		return parsed;
	} catch {
		return null;
	}
}

/**
 * CookieYes stores the decision in a single first-party cookie as a
 * comma-separated list of `key:value` pairs, e.g.
 * `consentid:abc,consent:yes,necessary:yes,functional:no,analytics:yes,advertisement:no`.
 */
function readCookieyesConsent(): Record<string, string> | null {
	const raw = getCookieValue(COOKIEYES_CONSENT_KEY);
	if (!raw) return null;
	const consent: Record<string, string> = {};
	for (const pair of raw.split(",")) {
		const separator = pair.indexOf(":");
		if (separator === -1) continue;
		const key = pair.slice(0, separator).trim();
		if (!key) continue;
		consent[key] = pair.slice(separator + 1).trim();
	}
	return consent;
}

function isCookieyesCategoryGranted(category: string): boolean {
	return readCookieyesConsent()?.[category] === "yes";
}

/**
 * Subscribes to consent changes from the active CMP: CookieYes
 * (`cookieyes_consent_update` / `cookieyes_banner_load`) and the legacy
 * vanilla-cookieconsent banner (`cc-consent-updated`).
 */
export function subscribeToConsentChanges(
	onStoreChange: () => void,
): () => void {
	if (typeof window === "undefined") return () => {};
	const notify = () => onStoreChange();
	for (const eventName of CONSENT_CHANGE_EVENTS) {
		window.addEventListener(eventName, notify);
		document.addEventListener(eventName, notify);
	}
	return () => {
		for (const eventName of CONSENT_CHANGE_EVENTS) {
			window.removeEventListener(eventName, notify);
			document.removeEventListener(eventName, notify);
		}
	};
}

/**
 * Checks if the user has given marketing consent via either
 * vanilla-cookieconsent or CookieYes.
 */
export function hasMarketingConsent(): boolean {
	const vanilla = readVanillaConsent();
	if (
		Array.isArray(vanilla?.categories) &&
		vanilla.categories.includes("marketing")
	) {
		return true;
	}
	return isCookieyesCategoryGranted("advertisement");
}

/**
 * Checks if the user has given analytics/statistics consent via either
 * vanilla-cookieconsent or CookieYes.
 */
export function hasAnalyticsConsent(): boolean {
	const vanilla = readVanillaConsent();
	if (
		Array.isArray(vanilla?.categories) &&
		vanilla.categories.includes("analytics")
	) {
		return true;
	}
	return (
		isCookieyesCategoryGranted("analytics") ||
		isCookieyesCategoryGranted("performance")
	);
}
