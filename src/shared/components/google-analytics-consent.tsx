"use client";

import { useEffect, useSyncExternalStore } from "react";
import Script from "next/script";
import {
	hasAnalyticsConsent,
	hasMarketingConsent,
} from "@/shared/adsense/marketing-consent";

declare global {
	interface Window {
		dataLayer?: unknown[];
		gtag?: (...args: unknown[]) => void;
	}
}

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
 * GoogleAnalyticsConsent
 *
 * Gestiona el consentimiento analítico y publicitario mediante
 * vanilla-cookieconsent o Cookiebot. Este componente:
 *  - Lee la cookie real de consentimiento (soporta ambos formatos)
 *  - Actualiza analytics_storage cuando el usuario da/deniega analytics
 *  - Actualiza ad_storage / ad_user_data / ad_personalization cuando
 *    el usuario da/deniega marketing (publicidad)
 *  - Carga Google Analytics / Google Tag Manager solo si hay consentimiento analítico
 *  - NO depende del CMP de Google (sin listener google-ads-consent-change)
 *
 * Los defaults de Consent Mode v2 se establecen en el <head> del layout
 * (script inline ANTES de cualquier script de Google). Este componente
 * solo actualiza el consentimiento cuando el usuario interactúa con el banner.
 */
export function GoogleAnalyticsConsent({
	gaId,
	gtmId,
	consentEnabled = true,
}: {
	gaId?: string;
	gtmId?: string;
	consentEnabled?: boolean;
}) {
	// --- Analytics consent ---
	const consentGiven = useSyncExternalStore(
		subscribeToConsentChanges,
		hasAnalyticsConsent,
		() => false,
	);
	const analyticsAllowed = consentEnabled ? consentGiven : true;

	useEffect(() => {
		if (typeof window === "undefined") return;
		window.gtag?.("consent", "update", {
			analytics_storage: analyticsAllowed ? "granted" : "denied",
		});
	}, [analyticsAllowed]);

	// --- Marketing / Ad consent ---
	const marketingAllowed = useSyncExternalStore(
		subscribeToConsentChanges,
		hasMarketingConsent,
		() => false,
	);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const granted = consentEnabled && marketingAllowed ? "granted" : "denied";
		window.gtag?.("consent", "update", {
			ad_storage: granted,
			ad_user_data: granted,
			ad_personalization: granted,
		});
	}, [marketingAllowed, consentEnabled]);

	// --- Carga de scripts ---
	if (!analyticsAllowed || (!gaId && !gtmId)) {
		return null;
	}

	return (
		<>
			{gtmId ? (
				<>
					<Script
						id="google-tag-manager"
						strategy="lazyOnload"
						data-cfasync="false"
					>
						{`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${gtmId}');
            `}
					</Script>
					<noscript>
						<iframe
							src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
							height="0"
							width="0"
							sandbox=""
							style={{ display: "none", visibility: "hidden" }}
							title="Google Tag Manager"
						/>
					</noscript>
				</>
			) : null}

			{gaId ? (
				<>
					<Script
						strategy="lazyOnload"
						data-cfasync="false"
						src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
					/>
					<Script
						id="google-analytics"
						strategy="lazyOnload"
						data-cfasync="false"
					>
						{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}', {
                page_path: window.location.pathname,
              });
            `}
					</Script>
				</>
			) : null}
		</>
	);
}
