"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconArrowUp, IconHelp, IconRefresh } from "@/shared/ui/tabler-icons";

import { Button } from "@/shared/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { isZonaRaiderPath } from "@/shared/lib/zona-raider-path";
import { useApiQuery } from "@/shared/hooks/use-api-query";
import {
	getScrollBehavior,
	usePrefersReducedMotion,
} from "@/shared/lib/use-prefers-reduced-motion";

export function FloatingActions() {
	const pathname = usePathname();
	const [showBackToTop, setShowBackToTop] = React.useState(false);
	const isRaiderPath = isZonaRaiderPath(pathname);
	const prefersReducedMotion = usePrefersReducedMotion();

	const { data: onboardingData } = useApiQuery<{ tourEnabled?: boolean }>(
		isRaiderPath ? "/api/zona-raider/onboarding-status" : null,
	);
	const tourEnabled = onboardingData?.tourEnabled ?? true;
	const showHelpButton = isRaiderPath && tourEnabled;

	React.useEffect(() => {
		const updateVisibility = () => {
			setShowBackToTop(window.scrollY > 320);
		};

		updateVisibility();
		window.addEventListener("scroll", updateVisibility, { passive: true });

		return () => window.removeEventListener("scroll", updateVisibility);
	}, []);

	const scrollToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: getScrollBehavior(prefersReducedMotion),
		});
	};

	return (
		<div className="fixed bottom-6 right-6 z-[80] flex flex-col items-end gap-3">
			{showHelpButton && (
				<Popover>
					<PopoverTrigger asChild>
						<Button
							type="button"
							variant="glass"
							size="icon"
							data-tour-step="zona-raider-help-button"
							className="size-12 rounded-full border-blue-500/20 bg-[#0f172a]/95 text-white shadow-2xl shadow-blue-500/10 backdrop-blur-xl hover:border-blue-400/40 hover:bg-[#111c33]"
							aria-label="¿Necesitas ayuda?"
							title="¿Necesitas ayuda?"
						>
							<IconHelp className="size-5 text-blue-400" />
						</Button>
					</PopoverTrigger>

					<PopoverContent
						align="end"
						side="top"
						sideOffset={14}
						className="w-80 rounded-3xl border-white/10 bg-[#0d1220]/95 p-0 shadow-2xl shadow-black/40 backdrop-blur-xl"
					>
						<div className="flex items-start gap-3 border-b border-white/10 p-4">
							<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-500/15 ring-1 ring-blue-400/20">
								<IconHelp className="size-5 text-blue-400" />
							</div>
							<div className="space-y-1">
								<p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
									Ayuda rápida
								</p>
								<p className="text-sm font-semibold leading-relaxed text-white">
									¡Hola!, si necesitas ayuda con la &quot;Zona Raider&quot;,
									puedes o visitar nuestro portal de ayuda o reiniciar el
									tutorial para verlo nuevamente.
								</p>
							</div>
						</div>

						<div className="p-4">
							<div className="flex flex-col gap-2">
								<Button asChild className="h-11 w-full rounded-2xl">
									<Link href="/zona-raider/guia-zona-raider">
										Ir a la ayuda de Zona Raider
									</Link>
								</Button>
								<Button
									asChild
									variant="ghost"
									className="h-11 w-full rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/15 hover:text-white"
								>
									<Link href="/zona-raider?tour=restart">
										<IconRefresh className="size-4" />
										Ver de nuevo el Tutorial
									</Link>
								</Button>
							</div>
						</div>
					</PopoverContent>
				</Popover>
			)}

			{showBackToTop && (
				<Button
					type="button"
					onClick={scrollToTop}
					variant="glass"
					size="icon"
					className="size-12 rounded-full border-white/10 bg-[#0f172a]/95 text-white shadow-2xl shadow-black/20 backdrop-blur-xl hover:border-white/20 hover:bg-[#111c33]"
					aria-label="Subir arriba"
					title="Subir arriba"
				>
					<IconArrowUp className="size-5" />
				</Button>
			)}
		</div>
	);
}
