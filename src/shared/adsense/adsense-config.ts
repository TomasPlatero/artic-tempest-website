export function isAdsenseEnabled() {
  return process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true";
}
