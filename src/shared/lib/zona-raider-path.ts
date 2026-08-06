const CANONICAL_RAIDER_PREFIX = "/zona-raider";

function withLeadingSlash(pathname: string) {
  const value = pathname.trim();
  if (!value) return "/";
  const withoutQuery = value.split("?")[0]?.split("#")[0] ?? value;
  return withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`;
}

export function normalizeZonaRaiderPath(pathname: string) {
  const value = withLeadingSlash(pathname);
  return value.replace(/\/+/g, "/");
}

export function toZonaRaiderPath(pathname: string) {
  return normalizeZonaRaiderPath(pathname);
}

export function isZonaRaiderPath(pathname: string) {
  const value = normalizeZonaRaiderPath(pathname);
  return value === CANONICAL_RAIDER_PREFIX || value.startsWith(`${CANONICAL_RAIDER_PREFIX}/`);
}
