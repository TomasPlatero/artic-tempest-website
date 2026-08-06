"use client";

import React, { useEffect, useRef, useSyncExternalStore } from "react";
import {
	getAdsenseZonesForRoute,
	type AdsenseZoneId,
	type AdsenseRouteZone,
	isAdsenseEligibleRoute,
} from "@/shared/adsense/route-scoped-zones";
import { hasMarketingConsent } from "@/shared/adsense/marketing-consent";
import { useAdblockDetection } from "@/shared/adsense/adblock-detection";
import { isAdsenseEnabled } from "@/shared/adsense/adsense-config";

declare global {
	interface Window {
		adsbygoogle?: unknown[];
	}
}

function resolveZone(
	pathname: string,
	zoneId: AdsenseZoneId,
): AdsenseRouteZone | null {
	const zones = getAdsenseZonesForRoute(pathname);
	return zones.find((zone) => zone.id === zoneId) ?? null;
}

export function RouteScopedAdsenseSlot({
	pathname,
	zoneId,
	adSlot,
	adClient,
	className,
}: {
	pathname: string;
	zoneId: AdsenseZoneId;
	adSlot?: string;
	adClient?: string;
	className?: string;
}) {
	const hasRequestedRef = useRef(false);
	const adblockDetected = useAdblockDetection();
	const consentGranted = useSyncExternalStore(
		(onStoreChange) => {
			if (typeof window === "undefined") return () => {};
			window.addEventListener("cc-consent-updated", onStoreChange);
			window.addEventListener("CookiebotOnAccept", onStoreChange);
			window.addEventListener("CookiebotOnDecline", onStoreChange);
			return () => {
				window.removeEventListener("cc-consent-updated", onStoreChange);
				window.removeEventListener("CookiebotOnAccept", onStoreChange);
				window.removeEventListener("CookiebotOnDecline", onStoreChange);
			};
		},
		hasMarketingConsent,
		() => false,
	);

	const zone = resolveZone(pathname, zoneId);
	const routeEligible = isAdsenseEligibleRoute(pathname);
	const adsenseEnabled = isAdsenseEnabled();
	const canRender =
		adsenseEnabled &&
		Boolean(zone) &&
		routeEligible &&
		Boolean(adSlot) &&
		consentGranted &&
		!adblockDetected;
	const showAdblockWarning =
		adsenseEnabled &&
		Boolean(zone) &&
		routeEligible &&
		consentGranted &&
		adblockDetected;

	const pushAd = React.useEffectEvent(() => {
		try {
			(window.adsbygoogle = window.adsbygoogle || []).push({});
			hasRequestedRef.current = true;
		} catch {
			// Dejar el contenedor reservado sin romper la UI si AdSense falla.
		}
	});

	useEffect(() => {
		if (
			!canRender ||
			hasRequestedRef.current ||
			process.env.NODE_ENV !== "production"
		)
			return;
		pushAd();
	}, [canRender]);

	if (!adsenseEnabled || !zone || !routeEligible) return null;

	const reservedStyle = {
		minHeight: `${zone.mobileMinHeightPx}px`,
	} as const;

	return (
		<section
			aria-label="Publicidad"
			data-adsense-zone={zone.id}
			data-adsense-pathname={pathname}
			data-adsense-consent={consentGranted ? "granted" : "denied"}
			data-adsense-adblock={adblockDetected ? "detected" : "clear"}
			data-adsense-slot-state={
				canRender
					? "ad-request-enabled"
					: showAdblockWarning
						? "adblock-warning"
						: "reserved-only"
			}
			className={className}
		>
			<div
				className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 md:p-4"
				style={reservedStyle}
			>
				<div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
					Publicidad
				</div>

				{showAdblockWarning ? (
					<div
						aria-live="polite"
						aria-atomic="true"
						className="flex h-full min-h-[inherit] flex-col items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-6 text-center"
					>
						<div className="text-sm font-semibold text-amber-200">
							Bloqueador de anuncios detectado
						</div>
						<p className="mt-2 max-w-md text-xs leading-5 text-zinc-300">
							Si quieres apoyar el sitio, desactiva el bloqueador para Artic
							Tempest o añade la web a tu lista blanca.
						</p>
					</div>
				) : canRender ? (
					<ins
						className="adsbygoogle block w-full overflow-hidden"
						style={{ minHeight: `${zone.minHeightPx}px` }}
						data-ad-client={adClient}
						data-ad-format="auto"
						data-full-width-responsive="true"
						data-ad-slot={adSlot}
					/>
				) : (
					<div
						aria-hidden="true"
						className="w-full rounded-xl border border-dashed border-white/10"
						style={{ minHeight: `${zone.minHeightPx}px` }}
					/>
				)}
			</div>
		</section>
	);
}
