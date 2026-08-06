"use client";

import { useEffect, useReducer } from "react";
import { LandingNavigation } from "@/domains/landing/components/navigation";
import { LandingHero } from "@/domains/landing/components/hero";
import { LazySection } from "@/shared/components/lazy-section";
import { useApiQuery } from "@/shared/hooks/use-api-query";
import { cn } from "@/shared/tailwind/tailwind-utils";
import {
	getScrollBehavior,
	usePrefersReducedMotion,
} from "@/shared/lib/use-prefers-reduced-motion";
import { Separator } from "@/shared/ui/separator";
import { PUBLIC_SECTION_REVEAL_CLASSES } from "@/shared/components/public-motion";
import {
	NewsSectionSkeleton,
	ProgresoSkeleton,
	StreamersSkeleton,
	RecruitmentSkeleton,
} from "@/domains/landing/components/home-skeletons";
import { LandingFooter } from "@/domains/landing/components/footer";
import { LandingNoticias } from "@/domains/landing/components/noticias";
import { WantedClasses } from "@/domains/landing/components/wanted-classes";
import { ProgresoSection } from "@/domains/landing/components/progreso-section";
import { HistoriaSection } from "@/domains/landing/components/historia-section";
import { LandingStreamers } from "@/domains/landing/components/streamers";

interface RaidProgression {
	name: string;
	tier?: string;
	expansion?: string;
	progress: string;
	rank: string;
	status: string;
	imageUrl?: string;
}

interface HomePageClientProps {
	initialProgression?: RaidProgression[];
	initialNews?: any[];
	initialRecruitment?: any[];
	initialHasApplied?: boolean;
	initialStreamers?: any[];
	initialApplyStatus?: string | null;
	publicLogoUrl?: string | null;
	adsenseClientId?: string;
	adsenseSlotHome?: string;
}

type LandingViewportState = {
	activeSectionId: string;
	heroVisible: boolean;
	heroScrollProgress: number;
};

type LandingViewportAction =
	| {
			type: "viewport";
			activeSectionId: string;
			heroVisible: boolean;
			heroScrollProgress: number;
	  }
	| { type: "heroVisible"; value: boolean }
	| { type: "heroScrollProgress"; value: number };

const INITIAL_LANDING_VIEWPORT_STATE: LandingViewportState = {
	activeSectionId: "",
	heroVisible: true,
	heroScrollProgress: 0,
};

function hasLandingProgressionActivity(raid: RaidProgression) {
	return !raid.progress.startsWith("0/") || raid.status !== "Próximamente";
}

function landingViewportReducer(
	prev: LandingViewportState,
	action: LandingViewportAction,
): LandingViewportState {
	switch (action.type) {
		case "heroVisible":
			return prev.heroVisible === action.value
				? prev
				: { ...prev, heroVisible: action.value };

		case "heroScrollProgress": {
			const clamped = Math.min(Math.max(action.value, 0), 1);
			if (Math.abs(prev.heroScrollProgress - clamped) < 0.005) return prev;
			return { ...prev, heroScrollProgress: clamped };
		}

		case "viewport": {
			const next: LandingViewportState = {
				activeSectionId:
					prev.activeSectionId === action.activeSectionId
						? prev.activeSectionId
						: action.activeSectionId,
				heroVisible:
					prev.heroVisible === action.heroVisible
						? prev.heroVisible
						: action.heroVisible,
				heroScrollProgress:
					Math.abs(prev.heroScrollProgress - action.heroScrollProgress) < 0.005
						? prev.heroScrollProgress
						: action.heroScrollProgress,
			};

			return next.activeSectionId === prev.activeSectionId &&
				next.heroVisible === prev.heroVisible &&
				next.heroScrollProgress === prev.heroScrollProgress
				? prev
				: next;
		}

		default:
			return prev;
	}
}

export function HomePageClient(props: HomePageClientProps) {
	const prefersReducedMotion = usePrefersReducedMotion();

	return useHomePageClient(props, prefersReducedMotion);
}

function useHomePageClient(
	{
		initialProgression,
		initialNews,
		initialRecruitment,
		initialHasApplied,
		initialStreamers,
		initialApplyStatus,
		publicLogoUrl,
		adsenseClientId,
		adsenseSlotHome,
	}: HomePageClientProps,
	prefersReducedMotion: boolean,
) {
	const [state, dispatch] = useReducer(
		landingViewportReducer,
		INITIAL_LANDING_VIEWPORT_STATE,
	);
	const { activeSectionId, heroVisible, heroScrollProgress } = state;
	const { data: progressionData } = useApiQuery<{
		progression: RaidProgression[];
	}>("/api/progression", {
		fallbackData: initialProgression
			? { progression: initialProgression }
			: undefined,
		refreshInterval: 5 * 60 * 1000,
	});

	const progression = progressionData?.progression ?? initialProgression ?? [];

	const nextMidnight: RaidProgression[] = [];
	const nextTww: RaidProgression[] = [];

	for (const raid of progression) {
		if (raid.expansion === "Midnight" && hasLandingProgressionActivity(raid)) {
			nextMidnight.push(raid);
		}
		if (raid.expansion === "The War Within") nextTww.push(raid);
	}

	const midnightProgression = nextMidnight;
	const twwProgression = nextTww;

	useEffect(() => {
		const heroEl = document.getElementById("hero");

		// ── Handle pending scroll target ───────
		const pendingTarget = sessionStorage.getItem("landing-scroll-target");
		if (pendingTarget) {
			sessionStorage.removeItem("landing-scroll-target");
			window.setTimeout(() => {
				document.getElementById(pendingTarget)?.scrollIntoView({
					behavior: getScrollBehavior(prefersReducedMotion),
				});
			}, 100);
		}

		// ── Observers ──────────────────────────
		const sectionIds = [
			"noticias",
			"reclutamiento",
			"progreso",
			"streamers",
			"historia",
		];

		// Cache hero height once, refresh on resize
		let cachedHeroHeight = heroEl
			? Math.max(heroEl.offsetHeight || 0, window.innerHeight)
			: 0;

		/**
		 * Intersección para detectar qué sección está activa.
		 * rootMargin: "-180px 0px 0px 0px" = la sección activa cuando su
		 * parte superior está a menos de 180px del viewport (mismo que triggerLine).
		 * NO usa getBoundingClientRect — el browser maneja el reflow internamente.
		 */
		const sectionObserver = new IntersectionObserver(
			(entries) => {
				// Tomar la primera sección que intersecta (en orden de documento)
				const intersecting = entries
					.filter((e) => e.isIntersecting)
					.sort((a, b) => {
						// Las bounding boxes del observer están en coords del viewport
						// sin forzar reflow porque el observer las calcula internamente
						return (
							sectionIds.indexOf(a.target.id) - sectionIds.indexOf(b.target.id)
						);
					});
				const active = intersecting[0]?.target.id ?? "";

				if (heroEl) {
					// Scroll progress del hero usando scrollY (lectura barata, sin reflow)
					const scrolled = Math.min(
						Math.max(window.scrollY, 0),
						cachedHeroHeight,
					);
					const progress =
						cachedHeroHeight > 0 ? scrolled / cachedHeroHeight : 0;

					dispatch({
						type: "viewport",
						activeSectionId: active,
						heroScrollProgress: progress,
						heroVisible: true, // el observer del hero maneja esto realmente
					});
				} else {
					dispatch({
						type: "viewport",
						activeSectionId: active,
						heroScrollProgress: 0,
						heroVisible: false,
					});
				}
			},
			{ rootMargin: "-180px 0px -40% 0px", threshold: 0 },
		);

		for (const id of sectionIds) {
			const el = document.getElementById(id);
			if (el) sectionObserver.observe(el);
		}

		// Hero Observer for heroVisible (ya existente)
		let heroObserver: IntersectionObserver | null = null;
		if (heroEl && "IntersectionObserver" in window) {
			heroObserver = new IntersectionObserver(
				([entry]) => {
					const nextVisible =
						entry.isIntersecting && entry.intersectionRatio > 0.35;
					dispatch({ type: "heroVisible", value: nextVisible });
				},
				{ threshold: [0, 0.35, 0.6] },
			);
			heroObserver.observe(heroEl);
		}

		// ── Scroll handler barato (solo scrollY, sin reflow) ───
		let rafId = 0;
		let lastScrollProgress = -1;
		const SCROLL_THROTTLE = 0.02; // solo actualizar si cambia >2%
		const handleScroll = () => {
			if (rafId || !heroEl) return;
			rafId = window.requestAnimationFrame(() => {
				const scrolled = Math.min(
					Math.max(window.scrollY, 0),
					cachedHeroHeight,
				);
				const progress = cachedHeroHeight > 0 ? scrolled / cachedHeroHeight : 0;
				// Throttle: solo dispatch si el progreso cambia significativamente
				if (Math.abs(progress - lastScrollProgress) > SCROLL_THROTTLE) {
					lastScrollProgress = progress;
					dispatch({ type: "heroScrollProgress", value: progress });
				}
				rafId = 0;
			});
		};

		window.addEventListener("scroll", handleScroll, { passive: true });

		// ── Resize handler ─────────────────────
		const handleResize = () => {
			if (heroEl) {
				cachedHeroHeight = Math.max(
					heroEl.offsetHeight || 0,
					window.innerHeight,
				);
			}
		};
		window.addEventListener("resize", handleResize, { passive: true });

		return () => {
			window.removeEventListener("scroll", handleScroll);
			window.removeEventListener("resize", handleResize);
			if (rafId) window.cancelAnimationFrame(rafId);
			sectionObserver.disconnect();
			heroObserver?.disconnect();
		};
	}, [prefersReducedMotion]);

	return (
		<>
			<LandingNavigation
				showApplyReminder
				initialApplyStatus={initialApplyStatus}
				activeSectionId={activeSectionId}
				heroVisible={heroVisible}
				heroScrollProgress={heroScrollProgress}
				publicLogoUrl={publicLogoUrl}
			/>
			<main id="main-content">
				<LandingHero
					scrollProgress={heroScrollProgress}
					publicLogoUrl={publicLogoUrl}
				/>
				<div
					aria-hidden="true"
					className="h-24 bg-linear-to-b from-transparent via-[#050814]/90 to-[#050814] md:h-32"
				/>

				<LazySection
					rootMargin="200px"
					id="noticias"
					placeholder={<NewsSectionSkeleton />}
				>
					<section className="px-0 pb-2" data-adsense-home-zone="home-inline-1">
						<LandingNoticias
							initialNews={initialNews}
							adsenseClientId={adsenseClientId}
							adsenseSlot={adsenseSlotHome}
						/>
					</section>
				</LazySection>

				<LazySection
					rootMargin="300px"
					id="reclutamiento"
					className={cn(
						"relative z-10 bg-zinc-950",
						PUBLIC_SECTION_REVEAL_CLASSES,
					)}
					placeholder={<RecruitmentSkeleton />}
				>
					<WantedClasses
						initialClasses={initialRecruitment}
						initialHasApplied={initialHasApplied}
					/>
				</LazySection>

				<LazySection rootMargin="400px">
					<Separator className="bg-white/5 max-w-7xl mx-auto" />
				</LazySection>

				<LazySection
					rootMargin="400px"
					id="progreso"
					placeholder={<ProgresoSkeleton />}
				>
					<ProgresoSection
						midnightProgression={midnightProgression}
						twwProgression={twwProgression}
					/>
				</LazySection>

				<LazySection rootMargin="400px">
					<Separator className="bg-white/5 max-w-7xl mx-auto" />
				</LazySection>

				<LazySection
					rootMargin="400px"
					id="streamers"
					placeholder={<StreamersSkeleton />}
				>
					<LandingStreamers limit={3} initialStreamers={initialStreamers} />
				</LazySection>

				<LazySection rootMargin="400px">
					<Separator className="bg-white/5 max-w-7xl mx-auto" />
				</LazySection>

				<LazySection rootMargin="500px" id="historia">
					<HistoriaSection />
				</LazySection>

				<LazySection rootMargin="500px">
					<LandingFooter publicLogoUrl={publicLogoUrl} />
				</LazySection>
			</main>
		</>
	);
}
