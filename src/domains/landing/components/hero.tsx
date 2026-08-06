"use client";

import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/tailwind/tailwind-utils";
import {
	PUBLIC_PAGE_FADE_IN_CLASSES,
	PUBLIC_STAGGER_DELAY_CLASSES,
} from "@/shared/components/public-motion";
import {
	IconChevronDown,
	IconChevronRight,
	IconSword,
} from "@/shared/ui/tabler-icons";
import Image from "next/image";
import Link from "next/link";
import { blurDataUrls } from "@/shared/images/blur-data-urls";
import { DEFAULT_PUBLIC_LOGO } from "@/shared/guild/guild-constants";

export function LandingHero({
	scrollProgress = 0,
	publicLogoUrl,
}: {
	scrollProgress?: number;
	publicLogoUrl?: string | null;
}) {
	const clampedProgress = Math.min(Math.max(scrollProgress, 0), 1);
	const logoScale = 1 - clampedProgress * 0.28;
	const logoLift = clampedProgress * -56;
	const logoOpacity = 1 - clampedProgress * 0.35;

	return (
		<section
			id="hero"
			className="relative min-h-[100dvh] overflow-hidden bg-zinc-950"
		>
			{/* Mobile background image */}
			<div
				className="absolute inset-0 bg-[url('/assets/images/midnight-battle.webp')] bg-cover bg-center bg-no-repeat md:hidden"
				aria-hidden="true"
			/>

			{/* Desktop background video — media attr prevents download on mobile */}
			<video
				className="absolute inset-0 hidden size-full object-cover md:block"
				aria-hidden="true"
				tabIndex={-1}
				autoPlay
				muted
				loop
				playsInline
				preload="none"
				poster="/assets/images/midnight-battle.webp"
			>
				<source
					src="/assets/video/midnight-hero-background.webm"
					type="video/webm"
					media="(min-width: 768px)"
				/>
			</video>

			{/* Static readability overlays */}
			<div className="absolute inset-0 bg-zinc-950/45" aria-hidden="true" />
			<div
				className="absolute inset-0 bg-linear-to-b from-black/50 via-transparent to-black/75"
				aria-hidden="true"
			/>
			<div
				className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_50%_70%,rgba(0,0,0,0.22),transparent_40%)]"
				aria-hidden="true"
			/>
			<div
				className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-b from-transparent via-[#050814]/80 to-[#050814]"
				aria-hidden="true"
			/>

			<div className="absolute inset-x-0 top-24 bottom-0 z-10 flex items-center justify-center md:top-28">
				<div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
					<div
						className={cn(
							"mb-6 flex justify-center sm:mb-8",
							PUBLIC_PAGE_FADE_IN_CLASSES,
							PUBLIC_STAGGER_DELAY_CLASSES[0],
						)}
					>
						<h1 className="sr-only">Artic Tempest</h1>
						<Image
							src={publicLogoUrl || DEFAULT_PUBLIC_LOGO}
							alt="Artic Tempest"
							width={1200}
							height={320}
							priority
							quality={30}
							fetchPriority="high"
							sizes="(max-width: 768px) 92vw, 64rem"
							placeholder="blur"
							blurDataURL={blurDataUrls.logoTexto}
							className="h-auto w-[min(92vw,72rem)] drop-shadow-[0_16px_40px_rgba(0,0,0,0.85)] // react-doctor-disable-line
// react-doctor-disable-line no-permanent-will-change
will-change-transform"
							style={{
								transform: `translate3d(0, ${logoLift}px, 0) scale(${logoScale})`,
								opacity: logoOpacity,
								transformOrigin: "center top",
							}}
						/>
					</div>
					<div
						className={cn(
							"relative mb-8 inline-block sm:mb-10",
							PUBLIC_PAGE_FADE_IN_CLASSES,
							PUBLIC_STAGGER_DELAY_CLASSES[2],
						)}
					>
						<div className="absolute inset-0 bg-zinc-950/40 blur-2xl rounded-full -m-6" />
						<h1 className="relative mx-auto max-w-2xl text-lg font-bold leading-relaxed text-blue-50/90 drop-shadow-2xl sm:max-w-3xl sm:text-xl md:text-2xl lg:text-2xl">
							Somos una hermandad comprometida con el progreso PvE en dificultad
							Mítica, formada por jugadores con experiencia que comparten el
							objetivo de avanzar juntos y completar el contenido de cada
							temporada.{" "}
						</h1>
					</div>

					<div
						className={cn(
							"flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4",
							PUBLIC_PAGE_FADE_IN_CLASSES,
							PUBLIC_STAGGER_DELAY_CLASSES[4],
						)}
					>
						<Button
							variant="landingPrimary"
							size="landingLg"
							className="w-full max-w-sm sm:w-64"
							asChild
						>
							<Link
								href="/reclutamiento"
								className="group/cta"
								aria-label="Únete a nosotros – Ir a reclutamiento"
							>
								<IconSword className="size-5 mr-2 transition-transform duration-300 group-hover/cta:rotate-12 group-hover/cta:scale-110" />
								Únete a nosotros
								<IconChevronRight className="size-5 ml-1 opacity-50 transition-colors duration-300 group-hover/cta:translate-x-0.5 group-hover/cta:opacity-80" />
							</Link>
						</Button>
						<Button
							variant="landingTinted"
							size="landingLg"
							className="w-full max-w-sm sm:w-64"
							asChild
						>
							<Link
								href="#progreso"
								aria-label="Ver Progreso – Ir a sección de progreso"
							>
								Ver Progreso
							</Link>
						</Button>
					</div>
				</div>
			</div>

			{/* Scroll Indicator */}
			<button
				type="button"
				onClick={() => document.getElementById("noticias")?.scrollIntoView()}
				className="group absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 cursor-pointer flex-col items-center gap-1 p-2 text-white/80 animate-vertical-bounce animate-iteration-count-infinite animate-duration-[3000ms] motion-reduce:animate-none sm:bottom-10 sm:p-4 md:bottom-6"
				aria-label="Explorar hacia abajo"
			>
				<span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-white/90 transition-colors duration-300 group-hover:text-blue-300">
					Explorar
				</span>
				<IconChevronDown className="size-6 text-blue-400 transition-colors duration-300 group-hover:text-blue-200" />
			</button>
		</section>
	);
}
