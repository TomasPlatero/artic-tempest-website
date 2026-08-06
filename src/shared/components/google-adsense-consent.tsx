"use client";

import { useEffect, useSyncExternalStore } from "react";
import { hasMarketingConsent } from "@/shared/adsense/marketing-consent";
import { isAdsenseEnabled } from "@/shared/adsense/adsense-config";

/**
 * Subscribes to consent changes from both vanilla-cookieconsent (cc-consent-updated)
 * and Cookiebot (CookiebotOnAccept / CookiebotOnDecline).
 */
function subscribeToConsentChanges(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("cc-consent-updated", onStoreChange);
  window.addEventListener("CookiebotOnAccept", onStoreChange);
  window.addEventListener("CookiebotOnDecline", onStoreChange);

  return () => {
    window.removeEventListener("cc-consent-updated", onStoreChange);
    window.removeEventListener("CookiebotOnAccept", onStoreChange);
    window.removeEventListener("CookiebotOnDecline", onStoreChange);
  };
}

/**
 * GoogleAdsenseConsent
 *
 * Carga el script de AdSense en producción.
 *
 * El CMP (Consent Management Platform) de Google viene incorporado
 * en el propio script adsbygoogle.js. Cuando hay un mensaje de
 * privacidad publicado en AdSense → Privacidad y mensajes, el
 * script muestra automáticamente el diálogo de consentimiento.
 *
 * Los defaults de Consent Mode v2 se establecen ANTES de cargar
 * este script mediante un script inline en el <head> del layout,
 * para que AdSense respete el estado "denied" por defecto hasta
 * que el usuario dé su consentimiento.
 */
export function GoogleAdsenseConsent({
  clientId,
  enabled,
}: {
  clientId?: string;
  enabled: boolean;
}) {
  const marketingConsentGranted = useSyncExternalStore(
    subscribeToConsentChanges,
    hasMarketingConsent,
    () => false,
  );

  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !isAdsenseEnabled() ||
      !clientId ||
      !enabled ||
      !marketingConsentGranted
    ) {
      return;
    }

    const scriptId = "google-adsense-loader";
    if (document.getElementById(scriptId)) return;

    const script = document.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;

    document.body.appendChild(script);
  }, [clientId, enabled, marketingConsentGranted]);

  return null;
}
