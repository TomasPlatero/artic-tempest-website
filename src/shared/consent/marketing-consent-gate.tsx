"use client";

import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";
import {
	hasMarketingConsent,
	subscribeToConsentChanges,
} from "@/shared/adsense/marketing-consent";

/**
 * Renderiza su contenido solo cuando el usuario ha consentido cookies de
 * marketing. Se usa para que ninguna creatividad ni script de afiliado haga
 * peticiones a terceros antes del consentimiento.
 */
export function MarketingConsentGate({ children }: { children: ReactNode }) {
	const marketingConsent = useSyncExternalStore(
		subscribeToConsentChanges,
		hasMarketingConsent,
		() => false,
	);

	if (!marketingConsent) return null;

	return <>{children}</>;
}
