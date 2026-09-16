/**
 * CookieYes CMP configuration.
 *
 * The banner key travels inside the public `<script src>` URL, so the
 * well-known value is used as a fallback and `NEXT_PUBLIC_COOKIEYES_ID`
 * can override it per environment.
 */
export const COOKIEYES_SITE_ID =
 process.env.NEXT_PUBLIC_COOKIEYES_ID || "58ff6b0d7c1d98efc106750f";

/** Banner script injected on every page by the root layout. */
export const COOKIEYES_BANNER_SCRIPT_URL = `https://cdn-cookieyes.com/client_data/${COOKIEYES_SITE_ID}/script.js`;

/** Cookie policy script embedded in `/cookies`. */
export const COOKIEYES_POLICY_SCRIPT_URL = `https://cdn-cookieyes.com/client_data/${COOKIEYES_SITE_ID}/cookie-policy/script.js`;
