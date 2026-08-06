const COOKIE_CONSENT_KEY = "artictempest_cookie_consent";
const COOKIEBOT_CONSENT_KEY = "CookieConsent";

type ConsentCookiePayload = {
  categories?: string[];
};

type CookiebotConsentPayload = {
  necessary?: boolean;
  preferences?: boolean;
  statistics?: boolean;
  marketing?: boolean;
};

function getCookieValue(name: string): string | null {
  if (typeof window === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^|;)\\s*${name}\\s*=\\s*([^;]+)`));
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

function readCookiebotConsent(): CookiebotConsentPayload | null {
  const raw = getCookieValue(COOKIEBOT_CONSENT_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CookiebotConsentPayload;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Checks if user has given marketing consent via either
 * vanilla-cookieconsent or Cookiebot.
 */
export function hasMarketingConsent(): boolean {
  const vanilla = readVanillaConsent();
  if (Array.isArray(vanilla?.categories) && vanilla.categories.includes("marketing")) {
    return true;
  }

  const cookiebot = readCookiebotConsent();
  if (cookiebot?.marketing === true) {
    return true;
  }

  return false;
}

/**
 * Checks if user has given analytics/statistics consent via either
 * vanilla-cookieconsent or Cookiebot.
 */
export function hasAnalyticsConsent(): boolean {
  const vanilla = readVanillaConsent();
  if (Array.isArray(vanilla?.categories) && vanilla.categories.includes("analytics")) {
    return true;
  }

  const cookiebot = readCookiebotConsent();
  if (cookiebot?.statistics === true) {
    return true;
  }

  return false;
}
