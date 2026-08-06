"use client";

import { useEffect, useReducer } from "react";
import { toast } from "sonner";
import {
	IconDownload,
	IconDeviceMobile,
} from "@/shared/ui/tabler-icons";

type PwaPromptState = {
	deferredPrompt: any;
	isIOS: boolean;
	isStandalone: boolean;
};

type PwaPromptAction =
	| { type: "initialize"; isIOS: boolean; isStandalone: boolean }
	| { type: "setDeferredPrompt"; prompt: any };

const initialState: PwaPromptState = {
	deferredPrompt: null,
	isIOS: false,
	isStandalone: false,
};

function reducer(
	state: PwaPromptState,
	action: PwaPromptAction,
): PwaPromptState {
	switch (action.type) {
		case "initialize":
			return {
				...state,
				isIOS: action.isIOS,
				isStandalone: action.isStandalone,
			};
		case "setDeferredPrompt":
			return { ...state, deferredPrompt: action.prompt };
		default:
			return state;
	}
}

export function PwaPrompt() {
	const [state, dispatch] = useReducer(reducer, initialState);

	useEffect(() => {
		// Register SW
		if ("serviceWorker" in navigator) {
			void navigator.serviceWorker.register("/sw.js").catch((err) => {
				console.error("Service worker registration failed:", err);
			});
		}

		// Check if already in PWA standalone mode
		const isStandaloneMatch = window.matchMedia(
			"(display-mode: standalone)",
		).matches;
		const isIOSStandalone = (window.navigator as any).standalone === true;

		// Check platform
		const userAgent = window.navigator.userAgent.toLowerCase();
		const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
		const isStandalone = isStandaloneMatch || isIOSStandalone;
		dispatch({ type: "initialize", isIOS: isIOSDevice, isStandalone });

		if (isStandalone) {
			return;
		}

		// Listen for standard browser install prompt (Android/Chrome/Edge)
		const handleBeforeInstallPrompt = (e: any) => {
			e.preventDefault();
			dispatch({ type: "setDeferredPrompt", prompt: e });
		};

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

		return () => {
			window.removeEventListener(
				"beforeinstallprompt",
				handleBeforeInstallPrompt,
			);
		};
	}, []);

	useEffect(() => {
		if (state.isStandalone) return; // App already installed

		const hasPrompted = localStorage.getItem("pwa_prompted");
		// To not overwhelm user, if they close the toast they aren't bothered again manually unless they trigger it

		if (state.deferredPrompt && !hasPrompted) {
			toast("Instala Artic Tempest Apps", {
				description:
					"Añade la web a la pantalla de inicio de tu dispositivo para un acceso más rapido.",
				icon: <IconDownload className="text-primary" />,
				action: {
					label: "Instalar",
					onClick: () => {
						void (async () => {
							state.deferredPrompt.prompt();
							const { outcome } = await state.deferredPrompt.userChoice;
							if (outcome === "accepted") {
								console.log("User accepted the install prompt");
							}
							dispatch({ type: "setDeferredPrompt", prompt: null });
							localStorage.setItem("pwa_prompted", "true");
						})();
					},
				},
				cancel: {
					label: "Más tarde",
					onClick: () => localStorage.setItem("pwa_prompted", "true"),
				},
				duration: 10000,
			});
		} else if (state.isIOS && !hasPrompted) {
			toast("Instala Artic Tempest en tu iPhone", {
				description:
					'Pulsa el botón Compartir y luego "Añadir a pantalla de inicio" para instalarla como una App nativa.',
				icon: <IconDeviceMobile className="text-primary" />,
				action: {
					label: "Entendido",
					onClick: () => localStorage.setItem("pwa_prompted", "true"),
				},
				duration: 15000,
			});
		}
	}, [state.deferredPrompt, state.isIOS, state.isStandalone]);

	return null;
}
