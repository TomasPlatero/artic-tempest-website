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

type SlotState = "ad-request-enabled" | "adblock-warning" | "reserved-only";

type SlotVisibility = {
	visible: boolean;
	canRender: boolean;
	showAdblockWarning: boolean;
	slotState: SlotState;
};

function resolveZone(
	pathname: string,
	zoneId: AdsenseZoneId,
): AdsenseRouteZone | null {
	const zones = getAdsenseZonesForRoute(pathname);
	return zones.find((zone) => zone.id === zoneId) ?? null;
}

function resolveSlotVisibility({
	adsenseEnabled,
	hasZone,
	routeEligible,
	hasAdSlot,
	consentGranted,
	adblockDetected,
}: {
	adsenseEnabled: boolean;
	hasZone: boolean;
	routeEligible: boolean;
	hasAdSlot: boolean;
	consentGranted: boolean;
	adblockDetected: boolean;
}): SlotVisibility {
	if (!adsenseEnabled || !hasZone || !routeEligible) {
		return {
			visible: false,
			canRender: false,
			showAdblockWarning: false,
			slotState: "reserved-only",
		};
	}

	const canRender = hasAdSlot && consentGranted && !adblockDetected;
	const showAdblockWarning = !canRender && consentGranted && adblockDetected;
	const slotState: SlotState = canRender
		? "ad-request-enabled"
		: showAdblockWarning
			? "adblock-warning"
			: "reserved-only";

	return { visible: true, canRender, showAdblockWarning, slotState };
}

function AdblockWarning() {
	return (
		<div
			aria-live="polite"
			aria-atomic="true"
			className="flex h-full min-h-[inherit] flex-col items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-6 text-center"
		>
			<div className="text-sm font-semibold text-amber-200">
				Bloqueador de anuncios detectado
			</div>
			<p className="mt-2 max-w-md text-xs leading-5 text-zinc-300">
				Si quieres apoyar el sitio, desactiva el bloqueador para Artic Tempest o
				añade la web a tu lista blanca.
			</p>
		</div>
	);
}

function AdsenseUnit({
	adClient,
	adSlot,
	minHeightPx,
}: {
	adClient?: string;
	adSlot?: string;
	minHeightPx: number;
}) {
	return (
		<ins
			className="adsbygoogle block w-full overflow-hidden"
			style={{ minHeight: `${minHeightPx}px` }}
			data-ad-client={adClient}
			data-ad-format="auto"
			data-full-width-responsive="true"
			data-ad-slot={adSlot}
		/>
	);
}

function ReservedAdSlot({ minHeightPx }: { minHeightPx: number }) {
	return (
		<div
			aria-hidden="true"
			className="w-full rounded-xl border border-dashed border-white/10"
			style={{ minHeight: `${minHeightPx}px` }}
		/>
	);
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
	const { visible, canRender, showAdblockWarning, slotState } =
		resolveSlotVisibility({
			adsenseEnabled: isAdsenseEnabled(),
			hasZone: Boolean(zone),
			routeEligible: isAdsenseEligibleRoute(pathname),
			hasAdSlot: Boolean(adSlot),
			consentGranted,
			adblockDetected,
		});

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

	if (!visible || !zone) return null;

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
			data-adsense-slot-state={slotState}
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
					<AdblockWarning />
				) : canRender ? (
					<AdsenseUnit
						adClient={adClient}
						adSlot={adSlot}
						minHeightPx={zone.minHeightPx}
					/>
				) : (
					<ReservedAdSlot minHeightPx={zone.minHeightPx} />
				)}
			</div>
		</section>
	);
}
