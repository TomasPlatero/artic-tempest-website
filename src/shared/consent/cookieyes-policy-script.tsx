"use client";

import { useEffect, useRef } from "react";
import { COOKIEYES_POLICY_SCRIPT_URL } from "@/shared/consent/cookieyes";

/**
 * CookieYes renders the policy —and the cookie inventory table— by inserting a
 * container right after its own script tag, which it resolves from
 * `#cky-cookie-policy`. React never executes `<script>` tags it renders, so the
 * tag is appended imperatively inside this wrapper: the injected markup then
 * lands in the place we control and never collides with hydration.
 */
const POLICY_SCRIPT_ID = "cky-cookie-policy";
const POLICY_CONTAINER_ID = "cky-policy-container";

const POLICY_WRAPPER_CLASSES =
	"[&_#cky-policy-container]:!space-y-4 [&_.cookie-policy-date-container]:!text-xs [&_.cookie-policy-date-container]:!text-white/40 [&_h2]:!text-lg [&_h2]:!font-semibold [&_h2]:!text-white [&_h2]:!uppercase [&_h2]:!tracking-tight [&_h3]:!text-base [&_h3]:!font-semibold [&_h3]:!text-white/80 [&_p]:!text-zinc-300 [&_a]:!text-blue-400 [&_.cky-cookie-audit-table]:!text-xs [&_.cky-cookie-audit-table_th]:!border-white/[0.08] [&_.cky-cookie-audit-table_th]:!bg-white/[0.06] [&_.cky-cookie-audit-table_th]:!text-white/50 [&_.cky-cookie-audit-table_td]:!border-white/[0.06] [&_.cky-cookie-audit-table_td]:!bg-transparent [&_.cky-cookie-audit-table_td]:!text-zinc-300 [&_a.cky-banner-element]:!w-fit [&_a.cky-banner-element]:!rounded-full [&_a.cky-banner-element]:!border [&_a.cky-banner-element]:!border-amber-500/30 [&_a.cky-banner-element]:!bg-amber-500/10 [&_a.cky-banner-element]:!text-amber-400";

declare global {
	interface Window {
		/**
		 * Función global que publica el script de CookieYes: monta la política.
		 * Solo se usa cuando el script llega después del evento `load`, porque en
		 * ese caso su propio listener ya no se dispara.
		 */
		windowLoadHandler?: () => void;
	}
}

export function CookieYesPolicyScript() {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		let script = container.querySelector<HTMLScriptElement>(
			`#${POLICY_SCRIPT_ID}`,
		);
		if (!script) {
			script = document.createElement("script");
			script.id = POLICY_SCRIPT_ID;
			// Evita que la política añada un segundo <h1>: la página ya tiene el suyo.
			script.title = "false";
			script.src = COOKIEYES_POLICY_SCRIPT_URL;
			container.appendChild(script);
		}

		// CookieYes solo monta la política en `window.load`; si el script llega con
		// la página ya cargada hay que invocarlo a mano, y solo si aún no está.
		const mountPolicy = () => {
			if (
				document.readyState === "complete" &&
				!document.getElementById(POLICY_CONTAINER_ID)
			) {
				window.windowLoadHandler?.();
			}
		};

		script.addEventListener("load", mountPolicy);
		mountPolicy();

		return () => script?.removeEventListener("load", mountPolicy);
	}, []);

	return <div ref={containerRef} className={POLICY_WRAPPER_CLASSES} />;
}
