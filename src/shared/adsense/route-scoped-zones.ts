export type AdsenseZoneId =
  | "home-inline-1"
  | "news-list-inline-1"
  | "news-article-inline-1"
  | "recruitment-inline-1";

export type AdsenseRouteZone = {
  id: AdsenseZoneId;
  minHeightPx: number;
  mobileMinHeightPx: number;
};

const ADSENSE_ALLOWED_ROUTE_PATTERNS = ["/", "/noticias", "/noticias/*", "/reclutamiento"] as const;
const ADSENSE_ALLOWED_ROUTE_SET = new Set<string>(ADSENSE_ALLOWED_ROUTE_PATTERNS);

const ADSENSE_ROUTE_ZONE_MAP: Record<string, AdsenseRouteZone[]> = {
  "/": [{ id: "home-inline-1", minHeightPx: 280, mobileMinHeightPx: 250 }],
  "/noticias": [{ id: "news-list-inline-1", minHeightPx: 280, mobileMinHeightPx: 250 }],
  "/noticias/*": [{ id: "news-article-inline-1", minHeightPx: 280, mobileMinHeightPx: 250 }],
  "/reclutamiento": [{ id: "recruitment-inline-1", minHeightPx: 280, mobileMinHeightPx: 250 }],
};

/**
 * Guardrails de configuración (verificación ligera sin test runner):
 * - Cada patrón permitido debe tener zonas
 * - No puede haber rutas en el mapa fuera de allowlist
 * - Cada zona debe reservar altura válida para CLS móvil/escritorio
 */
function validateAdsenseRouteScopeConfig(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (const pattern of ADSENSE_ALLOWED_ROUTE_PATTERNS) {
    const zones = ADSENSE_ROUTE_ZONE_MAP[pattern];
    if (!zones || zones.length === 0) {
      errors.push(`Missing AdSense zone configuration for pattern: ${pattern}`);
      continue;
    }

    for (const zone of zones) {
      if (zone.mobileMinHeightPx <= 0 || zone.minHeightPx <= 0) {
        errors.push(`Invalid reserved height in zone: ${zone.id}`);
      }
      if (zone.minHeightPx < zone.mobileMinHeightPx) {
        errors.push(`Desktop minHeight must be >= mobile minHeight for zone: ${zone.id}`);
      }
    }
  }

  for (const mappedPattern of Object.keys(ADSENSE_ROUTE_ZONE_MAP)) {
    if (!ADSENSE_ALLOWED_ROUTE_SET.has(mappedPattern)) {
      errors.push(`Route pattern not in explicit allowlist: ${mappedPattern}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Allowlist explícita para AdSense.
 * No reutiliza `isPublicSeoRoute` para evitar fugas a rutas públicas no aprobadas.
 */
export function isAdsenseEligibleRoute(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname === "/noticias") return true;
  if (pathname.startsWith("/noticias/") && pathname.length > "/noticias/".length) return true;
  if (pathname === "/reclutamiento") return true;

  return false;
}

export function getAdsenseZonesForRoute(pathname: string): AdsenseRouteZone[] {
  if (pathname === "/") return ADSENSE_ROUTE_ZONE_MAP["/"];
  if (pathname === "/noticias") return ADSENSE_ROUTE_ZONE_MAP["/noticias"];
  if (pathname.startsWith("/noticias/") && pathname.length > "/noticias/".length) {
    return ADSENSE_ROUTE_ZONE_MAP["/noticias/*"];
  }
  if (pathname === "/reclutamiento") return ADSENSE_ROUTE_ZONE_MAP["/reclutamiento"];

  return [];
}

const adsenseScopeValidation = validateAdsenseRouteScopeConfig();
if (!adsenseScopeValidation.valid) {
  const details = adsenseScopeValidation.errors.join(" | ");
  if (process.env.NODE_ENV === "production") {
    throw new Error(`Invalid AdSense route scope config: ${details}`);
  }
  console.warn(`[AdSense] Route scope config issues: ${details}`);
}
