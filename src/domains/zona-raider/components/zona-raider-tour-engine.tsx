"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
	IconArrowRight,
	IconPlayerPause,
	IconX,
} from "@/shared/ui/tabler-icons";

import { Button } from "@/shared/ui/button";
import { ZonaRaiderTourCharacterImage } from "./zona-raider-tour-character-image";
import {
	desktopZonaRaiderTourSteps,
	type ZonaRaiderTourStep,
} from "./zona-raider-tour.config";
import { normalizeZonaRaiderPath } from "@/shared/lib/zona-raider-path";
import {
	getScrollBehavior,
	usePrefersReducedMotion,
} from "@/shared/lib/use-prefers-reduced-motion";
import { filterByRoleAndPermissions } from "./zona-raider-tour-utils";

type StoredTourState = {
	status: "in_progress" | "paused" | "completed" | "skipped";
	stepIndex: number;
	updatedAt: number;
};

const STORAGE_KEY = "artic-tempest-zona-raider-tour-state:v2";

const formatDateToken = (date: Date) => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

const toStoredState = (
	status: StoredTourState["status"],
	stepIndex: number,
): StoredTourState => ({
	status,
	stepIndex,
	updatedAt: Date.now(),
});

const readTourState = (): StoredTourState | null => {
	if (typeof window === "undefined") return null;
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		return raw ? (JSON.parse(raw) as StoredTourState) : null;
	} catch {
		return null;
	}
};

const writeTourState = (state: StoredTourState) => {
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch {
		// ignore persistence failures
	}
};

const routePath = (route: string) => route.split("?")[0];

const routeSearch = (route: string) =>
	route.includes("?") ? `?${route.split("?")[1]}` : "";

const resolveRoute = (route: string) => {
	const today = formatDateToken(new Date());
	const nextRaidDate =
		typeof document !== "undefined"
			? document.querySelector<HTMLElement>("[data-tour-next-raid-date]")
					?.dataset.tourNextRaidDate || today
			: today;
	const nextCreateRaidDate =
		typeof document !== "undefined"
			? document.querySelector<HTMLElement>("[data-tour-next-create-raid-date]")
					?.dataset.tourNextCreateRaidDate || today
			: today;
	const nextEventId =
		typeof document !== "undefined"
			? document.querySelector<HTMLElement>("[data-tour-next-event-id]")
					?.dataset.tourNextEventId || ""
			: "";

	if (route.includes("{{nextEventId}}") && !nextEventId) return null;
	if (route.includes("{{nextRaidDate}}") && !nextRaidDate) return null;
	if (route.includes("{{nextCreateRaidDate}}") && !nextCreateRaidDate)
		return null;

	return route
		.replaceAll("{{today}}", today)
		.replaceAll("{{nextRaidDate}}", nextRaidDate)
		.replaceAll("{{nextCreateRaidDate}}", nextCreateRaidDate)
		.replaceAll("{{nextEventId}}", nextEventId);
};

const waitForElement = async (
	selector: string,
	timeoutMs = 2500,
	signal?: AbortSignal,
): Promise<HTMLElement | null> => {
	const started = Date.now();
	return await new Promise((resolve) => {
		const tick = () => {
			if (signal?.aborted) return resolve(null);
			const el = document.querySelector(selector);
			if (el instanceof HTMLElement) return resolve(el);
			if (Date.now() - started > timeoutMs) return resolve(null);
			window.requestAnimationFrame(tick);
		};
		tick();
	});
};

function ZonaRaiderTourOverlay({
	currentStep,
	stepIndex,
	steps,
	targetRect,
	popupLeft,
	popupTop,
	estimatedRange,
	progressText,
	launchMode,
	pauseTour,
	skipTour,
	goBack,
	goNext,
}: {
	currentStep: ZonaRaiderTourStep;
	stepIndex: number;
	steps: ZonaRaiderTourStep[];
	targetRect: DOMRect | null;
	popupLeft: number;
	popupTop: number;
	estimatedRange: string;
	progressText: string;
	launchMode: "auto" | "restart" | null;
	pauseTour: () => void;
	skipTour: () => void;
	goBack: () => void;
	goNext: () => void;
}) {
	return (
		<div className="fixed inset-0 z-[90] pointer-events-none">
			{targetRect ? (
				<>
					<div
						className="fixed bg-zinc-950/70 backdrop-blur-[1px]"
						style={{
							top: 0,
							left: 0,
							right: 0,
							height: Math.max(0, targetRect.top - 10),
						}}
					/>
					<div
						className="fixed bg-zinc-950/70 backdrop-blur-[1px]"
						style={{
							top: Math.max(0, targetRect.top - 10),
							left: 0,
							width: Math.max(0, targetRect.left - 10),
							height: targetRect.height + 20,
						}}
					/>
					<div
						className="fixed bg-zinc-950/70 backdrop-blur-[1px]"
						style={{
							top: Math.max(0, targetRect.top - 10),
							left: targetRect.right + 10,
							right: 0,
							height: targetRect.height + 20,
						}}
					/>
					<div
						className="fixed bg-zinc-950/70 backdrop-blur-[1px]"
						style={{
							top: targetRect.bottom + 10,
							left: 0,
							right: 0,
							bottom: 0,
						}}
					/>
					<div
						className="fixed z-[91] rounded-3xl ring-2 ring-cyan-300 shadow-[0_0_0_1px_rgba(0,0,0,0.4),0_0_48px_rgba(34,211,238,0.28)]"
						style={{
							left: targetRect.left - 10,
							top: targetRect.top - 10,
							width: targetRect.width + 20,
							height: targetRect.height + 20,
						}}
					/>
				</>
			) : (
				<div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-[1px]" />
			)}

			<div
				className="pointer-events-auto fixed z-[92] w-[min(92vw,44rem)] rounded-3xl border border-white/10 bg-[#0d1220]/95 p-4 text-white shadow-2xl shadow-black/50 backdrop-blur-xl"
				style={{ left: popupLeft, top: popupTop }}
			>
				<div className="flex items-start justify-between gap-3">
					<div>
						<p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-300/80">
							Tour guiado
						</p>
						<h3 className="mt-1 text-lg font-semibold uppercase tracking-tight">
							{currentStep.title}
						</h3>
					</div>
					<button
						type="button"
						onClick={pauseTour}
						className="rounded-full p-2 text-white/60 transition-colors hover:bg-white/5 hover:text-white"
						aria-label="Pausar tutorial"
					>
						<IconX className="size-4" />
					</button>
				</div>

				<div className="mt-4 flex flex-col gap-4 sm:flex-row">
					<div className="sm:w-[8.75rem] sm:shrink-0">
						<ZonaRaiderTourCharacterImage
							src="/assets/images/tour/gnome-talking.webp"
							alt="Personaje estático del tour"
							className="h-full min-h-[180px]"
						/>
					</div>

					<div className="min-w-0 flex-1">
						<p className="text-sm leading-relaxed text-white/70">
							{currentStep.description}
						</p>

						<div className="mt-4 space-y-3">
							<div className="space-y-1">
								<div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
									{progressText}
								</div>
								<div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
									Duración estimada: {estimatedRange}
								</div>
							</div>

							<div className="flex flex-wrap items-center justify-end gap-2">
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={goBack}
									disabled={stepIndex === 0}
								>
									Atrás
								</Button>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={skipTour}
								>
									Omitir
								</Button>
								<Button type="button" size="sm" onClick={goNext}>
									{stepIndex >= steps.length - 1 ? "Terminar" : "Siguiente"}
									<IconArrowRight className="size-4" />
								</Button>
							</div>
						</div>
					</div>
				</div>

				{launchMode === "restart" && (
					<button
						type="button"
						onClick={skipTour}
						className="mt-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/40 transition-colors hover:text-white/70"
					>
						Cerrar tutorial
					</button>
				)}

				<button
					type="button"
					onClick={pauseTour}
					className="mt-3 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/40 transition-colors hover:text-white/70"
				>
					<IconPlayerPause className="size-3.5" />
					Pausar y reanudar más tarde
				</button>
			</div>
		</div>
	);
}

function computePopupPosition(targetRect: DOMRect | null | undefined) {
	const popupWidth = 704;
	const popupHeight = 340;
	const viewportWidth =
		typeof window !== "undefined" ? window.innerWidth : popupWidth;
	const viewportHeight =
		typeof window !== "undefined" ? window.innerHeight : popupHeight;

	const popupLeft = targetRect
		? Math.min(
				Math.max(16, targetRect.left + targetRect.width / 2 - popupWidth / 2),
				Math.max(16, viewportWidth - popupWidth - 16),
			)
		: Math.max(16, viewportWidth - popupWidth - 16);

	const popupTop = targetRect
		? targetRect.bottom + 16 + popupHeight < viewportHeight
			? targetRect.bottom + 16
			: Math.max(16, targetRect.top - popupHeight - 16)
		: Math.max(16, viewportHeight - popupHeight - 16);

	return { popupLeft, popupTop };
}

const EMPTY_APP_IDS: string[] = [];

// ──────────────────────────────────────────────
// Highlight & scroll effect for tour step element
// ──────────────────────────────────────────────

function useTourHighlight(
	currentStep: ZonaRaiderTourStep | undefined,
	isOpen: boolean,
	enabled: boolean,
	prefersReducedMotion: boolean,
	setTargetRect: (rect: DOMRect | null) => void,
	goNext: () => void,
) {
	React.useEffect(() => {
		if (!enabled || !isOpen || !currentStep) return;

		const controller = new AbortController();
		let cancelled = false;

		void waitForElement(currentStep.selector, 2500, controller.signal).then(
			(node) => {
				if (cancelled) return;
				if (!node) {
					goNext();
					return;
				}
				node.scrollIntoView({
					block: "center",
					behavior: getScrollBehavior(prefersReducedMotion),
				});
				setTargetRect(node.getBoundingClientRect());
			},
		);

		const onResize = () => {
			const el = document.querySelector(currentStep.selector);
			if (el instanceof HTMLElement) setTargetRect(el.getBoundingClientRect());
		};

		window.addEventListener("resize", onResize);
		window.addEventListener("scroll", onResize, { passive: true });

		return () => {
			cancelled = true;
			controller.abort();
			window.removeEventListener("resize", onResize);
			window.removeEventListener("scroll", onResize);
		};
	}, [
		enabled,
		currentStep,
		goNext,
		isOpen,
		prefersReducedMotion,
		setTargetRect,
	]);
}

// ──────────────────────────────────────────────
// Keyboard navigation for tour
// ──────────────────────────────────────────────

function useTourKeyboard(
	isOpen: boolean,
	goBack: () => void,
	goNext: () => void,
	skipTour: () => void,
) {
	const onKeyDown = React.useEffectEvent((event: KeyboardEvent) => {
		const target = event.target as HTMLElement | null;
		const tagName = target?.tagName?.toLowerCase();
		if (
			tagName === "input" ||
			tagName === "textarea" ||
			tagName === "select" ||
			target?.isContentEditable
		)
			return;

		if (event.key === "ArrowLeft") {
			event.preventDefault();
			goBack();
		}
		if (event.key === "ArrowRight") {
			event.preventDefault();
			goNext();
		}
		if (event.key === "Escape") {
			event.preventDefault();
			skipTour();
		}
	});

	React.useEffect(() => {
		if (!isOpen) return;
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [isOpen]);
}

export function ZonaRaiderTourEngine({
	enabled,
	roleLevel,
	allowAutoStart = true,
	viewableAppIds = EMPTY_APP_IDS,
}: {
	enabled: boolean;
	roleLevel: string;
	allowAutoStart?: boolean;
	viewableAppIds?: string[];
}) {
	const pathname = usePathname();
	const prefersReducedMotion = usePrefersReducedMotion();
	const normalizedPathname = normalizeZonaRaiderPath(pathname);

	const steps = React.useMemo(
		() =>
			filterByRoleAndPermissions(
				desktopZonaRaiderTourSteps,
				roleLevel,
				viewableAppIds,
			),
		[roleLevel, viewableAppIds],
	);

	const totalMinutes = React.useMemo(
		() => steps.reduce((sum, step) => sum + step.estimatedMinutes, 0),
		[steps],
	);

	const estimatedRange = React.useMemo(() => {
		const min = Math.max(5, Math.floor(totalMinutes * 0.3));
		const max = Math.max(min + 2, Math.ceil(totalMinutes * 0.45));
		return `${min}–${max} min`;
	}, [totalMinutes]);

	const [stepIndex, setStepIndex] = React.useState(() => {
		if (typeof window === "undefined") return -1;
		const stored = readTourState();
		if (stored?.status === "in_progress" || stored?.status === "paused") {
			const clampedIndex = Math.min(stored.stepIndex, steps.length - 1);
			const step = steps[clampedIndex];
			if (!step) return -1;
			// Only resume when the user is already on the step's page.
			// Otherwise the render-time redirect would yank them away from
			// the page they intentionally navigated to, creating a confusing
			// reload/redirect loop.
			const stepRoute = routePath(resolveRoute(step.route) ?? step.route);
			if (normalizedPathname !== stepRoute) return -1;
			return clampedIndex;
		}
		return -1;
	});
	const [targetRect, setTargetRect] = React.useState<DOMRect | null>(null);
	const redirectAttemptRef = React.useRef<{
		stepId: string;
		targetPath: string;
		fromPath: string;
	} | null>(null);
	const [launchMode, setLaunchMode] = React.useState<"auto" | "restart" | null>(
		() => {
			if (typeof window === "undefined") return null;
			const stored = readTourState();
			if (stored?.status === "in_progress" || stored?.status === "paused") {
				return "auto";
			}
			return null;
		},
	);

	const currentStep = stepIndex >= 0 ? steps[stepIndex] : undefined;
	const isOpen = stepIndex >= 0;

	const persist = React.useCallback(
		(status: StoredTourState["status"], index: number) => {
			writeTourState(toStoredState(status, index));
		},
		[],
	);

	const startTour = React.useCallback(
		(restart = false) => {
			if (!enabled || steps.length === 0) return;
			setLaunchMode(restart ? "restart" : "auto");
			setStepIndex(0);
			setTargetRect(null);
			persist("in_progress", 0);
		},
		[enabled, persist, steps.length],
	);

	// Stable ref to avoid re-running effects when startTour identity changes
	const startTourRef = React.useRef(startTour);
	React.useEffect(() => {
		startTourRef.current = startTour;
	});

	const pauseTour = React.useCallback(() => {
		persist("paused", stepIndex);
		setStepIndex(-1);
		setTargetRect(null);
		setLaunchMode(null);
	}, [persist, stepIndex]);

	const skipTour = React.useCallback(() => {
		persist("skipped", stepIndex);
		setStepIndex(-1);
		setTargetRect(null);
		setLaunchMode(null);
	}, [persist, stepIndex]);

	const finishTour = React.useCallback(() => {
		persist("completed", stepIndex);
		setStepIndex(-1);
		setTargetRect(null);
		setLaunchMode(null);
	}, [persist, stepIndex]);

	const goNext = React.useCallback(() => {
		if (stepIndex >= steps.length - 1) {
			finishTour();
			return;
		}
		setStepIndex((value) => value + 1);
		persist("in_progress", Math.min(stepIndex + 1, steps.length - 1));
	}, [finishTour, persist, stepIndex, steps.length]);

	const goBack = React.useCallback(() => {
		setStepIndex((value) => Math.max(0, value - 1));
		persist("in_progress", Math.max(0, stepIndex - 1));
	}, [persist, stepIndex]);

	// Auto-start the tour only when the current page already matches the first
	// step's route.  This prevents a confusing redirect-away when the user lands
	// on a non-home zona-raider page (e.g. /profesiones): without this guard the
	// tour would start at step 0 (/zona-raider), fire a render-time redirect, and
	// repel the user from the page they intentionally navigated to.
	const autoStartIfNeeded = React.useEffectEvent(() => {
		const stored = readTourState();
		if (stored?.status === "completed" || stored?.status === "skipped") {
			return;
		}

		const firstStep = steps[0];
		if (!firstStep) return;

		const firstStepRoute = routePath(
			resolveRoute(firstStep.route) ?? firstStep.route,
		);

		// Only auto-start when the user is already on the first step's page.
		// Otherwise the render-time redirect would yank them away immediately,
		// creating a confusing reload/redirect loop.
		if (normalizedPathname !== firstStepRoute) return;

		// When launched explicitly via ?tour=restart or ?tour=start the onboarding
		// already handles navigation — the guard above does not apply.
		if (allowAutoStart) startTour(false);
	});

	// react-doctor-disable-next-line
	React.useEffect(() => {
		if (!enabled || steps.length === 0) return;

		const requested =
			typeof window === "undefined"
				? null
				: new URLSearchParams(window.location.search).get("tour");

		if (requested === "restart" || requested === "start") {
			startTourRef.current(true);
			return;
		}

		if (stepIndex >= 0) return;

		// react-doctor-disable-next-line
		autoStartIfNeeded();
	}, [enabled, normalizedPathname, stepIndex, steps.length]);

	// Clear redirect attempt ref whenever we change steps.
	React.useEffect(() => {
		redirectAttemptRef.current = null;
	}, [stepIndex]);

	// Detect when a render-time redirect was bounced by a server-side redirect.
	React.useEffect(() => {
		if (!currentStep) return;
		const attempt = redirectAttemptRef.current;
		if (!attempt || attempt.stepId !== currentStep.id) return;

		if (normalizedPathname === attempt.targetPath) {
			redirectAttemptRef.current = null;
		} else {
			redirectAttemptRef.current = null;
			goNext();
		}
	}, [normalizedPathname, stepIndex, currentStep, goNext]);

	// Redirect logic — useLayoutEffect runs after DOM mutations but before paint,
	// keeping the redirect visually seamless while staying within effect boundaries.
	React.useLayoutEffect(() => {
		if (!enabled || !isOpen || !currentStep) return;

		const desiredRoute = resolveRoute(currentStep.route);
		if (!desiredRoute) return;

		const desiredPath = routePath(desiredRoute);
		const desiredSearch = routeSearch(desiredRoute);
		const params =
			typeof window !== "undefined"
				? new URLSearchParams(window.location.search)
				: new URLSearchParams();
		const currentSearchRaw = params.toString();
		const currentSearch = currentSearchRaw ? `?${currentSearchRaw}` : "";

		if (normalizedPathname === desiredPath && currentSearch === desiredSearch)
			return;

		const attempt = redirectAttemptRef.current;
		if (
			attempt &&
			attempt.stepId === currentStep.id &&
			attempt.targetPath === desiredPath
		) {
			return;
		}

		redirectAttemptRef.current = {
			stepId: currentStep.id,
			targetPath: desiredPath,
			fromPath: normalizedPathname,
		};
		// Only allow same-origin paths (tour routes are always internal)
		if (desiredRoute.startsWith("/")) {
			try {
				const safeUrl = new URL(desiredRoute, window.location.origin);
				if (safeUrl.origin === window.location.origin) {
					window.location.assign(safeUrl.toString());
				}
			} catch { /* invalid URL — ignore */ }
		}
	}, [enabled, isOpen, currentStep, normalizedPathname]);

	// Highlight & scroll to step element
	useTourHighlight(
		currentStep,
		isOpen,
		enabled,
		prefersReducedMotion,
		setTargetRect,
		goNext,
	);

	// Body overflow
	React.useEffect(() => {
		if (!isOpen) return;
		const previous = document.body.style.overflow;
		document.body.style.overflow = "auto";
		return () => {
			document.body.style.overflow = previous;
		};
	}, [isOpen]);

	// Keyboard navigation
	useTourKeyboard(isOpen, goBack, goNext, skipTour);

	if (!enabled || !isOpen || steps.length === 0 || !currentStep) return null;

	const { popupLeft, popupTop } = computePopupPosition(targetRect);

	return (
		<ZonaRaiderTourOverlay
			currentStep={currentStep}
			stepIndex={stepIndex}
			steps={steps}
			targetRect={targetRect}
			popupLeft={popupLeft}
			popupTop={popupTop}
			estimatedRange={estimatedRange}
			progressText={`Paso ${stepIndex + 1} de ${steps.length}`}
			launchMode={launchMode}
			pauseTour={pauseTour}
			skipTour={skipTour}
			goBack={goBack}
			goNext={goNext}
		/>
	);
}
