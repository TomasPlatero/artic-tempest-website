"use client";

import * as React from "react";

import { usePathname, useRouter } from "next/navigation";
import {
	IconArrowRight,
	IconBook2,
	IconPlayerPlay,
	IconUsers,
} from "@/shared/ui/tabler-icons";

import { Button } from "@/shared/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/dialog";
import { ZonaRaiderTourCharacterImage } from "./zona-raider-tour-character-image";

const ZONA_RAIDER_TOUR_STATE_KEY = "artic-tempest-zona-raider-tour-state:v2";

const writeSkippedTourState = () => {
	try {
		window.localStorage.setItem(
			ZONA_RAIDER_TOUR_STATE_KEY,
			JSON.stringify({
				status: "skipped",
				stepIndex: 0,
				updatedAt: Date.now(),
			}),
		);
	} catch {
		// ignore persistence failures
	}
};

function RaiderTourOnboardingContent({ enabled }: { enabled: boolean }) {
	const router = useRouter();
	const pathname = usePathname();

	const [promptOpen, setPromptOpen] = React.useState(() => {
		if (!enabled) return false;
		if (typeof window === "undefined") return false;
		return (
			new URLSearchParams(window.location.search).get("tourPrompt") === "1"
		);
	});
	const [reminderOpen, setReminderOpen] = React.useState(false);
	const closingPromptRef = React.useRef<"start" | "dismiss" | null>(null);

	const clearPromptQuery = () => {
		const params = new URLSearchParams(
			typeof window === "undefined" ? "" : window.location.search,
		);
		params.delete("tourPrompt");
		const query = params.toString();
		router.replace(query ? `${pathname}?${query}` : pathname, {
			scroll: false,
		});
	};

	const startTour = () => {
		closingPromptRef.current = "start";
		setPromptOpen(false);
		router.replace("/zona-raider?tour=start", { scroll: false });
	};

	const dismissTour = () => {
		closingPromptRef.current = "dismiss";
		setPromptOpen(false);
		setReminderOpen(true);
		writeSkippedTourState();
		clearPromptQuery();
	};

	return (
		<>
			<Dialog
				open={promptOpen}
				onOpenChange={(open) => {
					if (!open && !closingPromptRef.current) dismissTour();
					if (!open) closingPromptRef.current = null;
				}}
			>
				<DialogContent
					className="border-white/10 bg-[#0d1220] text-white shadow-2xl shadow-black/50 sm:max-w-xl"
					showCloseButton={false}
				>
					<DialogHeader className="text-left">
						<div className="flex items-center gap-3 text-cyan-300">
							<span className="flex size-10 items-center justify-center rounded-2xl bg-cyan-500/10">
								<IconBook2 className="size-5" />
							</span>
							<div>
								<p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-300/80">
									Zona Raider
								</p>
								<DialogTitle className="mt-1 text-xl font-semibold uppercase tracking-tight text-white">
									¿Quieres visitar el tour de la Zona Raider?
								</DialogTitle>
							</div>
						</div>
						<DialogDescription className="pt-2 text-sm leading-relaxed text-white/65">
							Te enseñamos lo básico para orientarte rápido: tu cuenta, los
							accesos principales y dónde encontrar las piezas clave de la Zona
							Raider.
						</DialogDescription>
					</DialogHeader>

					<div className="grid gap-4 sm:grid-cols-[160px_1fr] sm:items-center rounded-3xl border border-white/10 bg-white/[0.03] p-3">
						<ZonaRaiderTourCharacterImage
							src="/assets/images/tour/gnome-talking.webp"
							alt="Gnomito del tour"
							className="h-[160px]"
						/>
						<div className="space-y-2">
							<p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-300/70">
								Gnomito guía
							</p>
							<p className="text-sm leading-relaxed text-white/70">
								Te acompaño un momento para que veas dónde está cada cosa y no
								tengas que ir perdido por la Zona Raider.
							</p>
						</div>
					</div>

					<DialogFooter className="gap-3 sm:justify-between">
						<Button
							type="button"
							variant="ghost"
							onClick={dismissTour}
							className="w-full sm:w-auto"
						>
							Ahora no
						</Button>
						<Button
							type="button"
							onClick={startTour}
							className="w-full gap-2 sm:w-auto"
						>
							Hacer tour
							<IconPlayerPlay className="size-4" />
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={reminderOpen} onOpenChange={setReminderOpen}>
				<DialogContent className="border-white/10 bg-[#0d1220] text-white shadow-2xl shadow-black/50 sm:max-w-lg">
					<DialogHeader className="text-left">
						<div className="flex items-center gap-3 text-amber-300">
							<span className="flex size-10 items-center justify-center rounded-2xl bg-amber-500/10">
								<IconUsers className="size-5" />
							</span>
							<div>
								<p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-rose-300/80">
									Obligatorio
								</p>
								<DialogTitle className="mt-1 text-lg font-semibold uppercase tracking-tight text-white">
									Vincula tus personajes y marca tu main
								</DialogTitle>
							</div>
						</div>
						<DialogDescription className="pt-2 text-sm leading-relaxed text-white/65">
							Debes tener tus personajes vinculados y seleccionar tu personaje
							principal. Sin eso, la Zona Raider no puede reconocerte
							correctamente ni mostrarte la información adecuada.
						</DialogDescription>
					</DialogHeader>

					<div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-white/70">
						Hazlo ahora en tu cuenta antes de continuar.
					</div>

					<DialogFooter className="gap-3 sm:justify-between">
						<Button
							type="button"
							variant="ghost"
							onClick={() => setReminderOpen(false)}
							className="w-full sm:w-auto"
						>
							Cerrar
						</Button>
						<Button
							type="button"
							className="w-full gap-2 sm:w-auto"
							onClick={() => {
								setReminderOpen(false);
								router.push("/zona-raider/cuenta");
							}}
						>
							Ir a Cuenta
							<IconArrowRight className="size-4" />
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

export function RaiderTourOnboarding(props: { enabled: boolean }) {
	return (
		<React.Suspense fallback={null}>
			<RaiderTourOnboardingContent {...props} />
		</React.Suspense>
	);
}
