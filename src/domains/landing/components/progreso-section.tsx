"use client";

import NextImage from "next/image";
import Link from "next/link";
import { cn } from "@/shared/tailwind/tailwind-utils";
import { Button } from "@/shared/ui/button";
import {
	PUBLIC_CARD_REVEAL_CLASSES,
	PUBLIC_STAGGER_DELAY_CLASSES,
} from "@/shared/components/public-motion";

interface RaidProgression {
	name: string;
	tier?: string;
	expansion?: string;
	progress: string;
	rank: string;
	status: string;
	imageUrl?: string;
}

type ProgresoSectionProps = {
	midnightProgression: RaidProgression[];
	twwProgression: RaidProgression[];
};

function RaidCard({
	raid,
	fullWidth = false,
	priority = false,
}: {
	raid: RaidProgression;
	fullWidth?: boolean;
	priority?: boolean;
}) {
	return (
		<div className="flex flex-col gap-3">
			<p className="text-center text-[10px] font-bold uppercase tracking-[0.4em] text-white/50">
				{raid.tier || raid.expansion}
			</p>
			<div
				className={cn(
					"group relative flex flex-col justify-center overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/40 p-8 backdrop-blur-xl hover:border-blue-500/50",
					fullWidth ? "min-h-[320px]" : "min-h-[300px]",
					PUBLIC_CARD_REVEAL_CLASSES,
				)}
			>
				{raid.imageUrl && (
					<>
						<div className="absolute inset-0 z-0 overflow-hidden">
							<NextImage
								src={raid.imageUrl}
								alt={raid.name}
								width={1600}
								height={900}
								className="absolute inset-0 size-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 grayscale-[0.5] group-hover:grayscale-0 group-hover:opacity-80"
								sizes={
									fullWidth
										? "100vw"
										: "(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
								}
								priority={priority}
							/>
						</div>
						<div className="absolute inset-0 z-[1] bg-linear-to-t from-zinc-950 via-zinc-900/40 to-transparent" />
					</>
				)}

				<div className="relative z-10">
					{raid.progress.startsWith("0/") && (
						<div className="absolute -top-16 right-0 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/5">
							<span className="text-[10px] font-semibold uppercase tracking-widest text-white/90">
								En espera
							</span>
						</div>
					)}
					<h3
						className={cn(
							"mb-4 text-center font-semibold uppercase tracking-[0.18em]",
							fullWidth ? "text-3xl" : "text-2xl",
						)}
					>
						<span className="text-blue-100 drop-shadow-[0_0_24px_rgba(96,165,250,0.35)] [text-shadow:1px_1px_0_#000,-1px_1px_0_#000,1px_-1px_0_#000,-1px_-1px_0_#000]">
							{raid.name}
						</span>
					</h3>
					{raid.progress !== "Season 2" && (
						<div
							className={cn(
								"mb-2 text-center font-semibold tracking-tighter text-white",
								fullWidth ? "text-6xl" : "text-5xl",
							)}
						>
							{raid.progress}
						</div>
					)}
					<p className="text-center text-sm font-medium text-white/90">
						{raid.rank !== "-" ? raid.rank : raid.status}
					</p>
				</div>
			</div>
		</div>
	);
}

export function ProgresoSection({
	midnightProgression,
	twwProgression,
}: ProgresoSectionProps) {
	const season2Raids = midnightProgression.filter(
		(r) => r.progress === "Season 2",
	);
	const season1Raids = midnightProgression.filter(
		(r) => r.progress !== "Season 2",
	);

	return (
		<section
			className={cn(
				"mx-auto max-w-7xl px-6 py-24 text-center",
				"animate-fade-in animate-duration-slow motion-reduce:animate-none",
			)}
			aria-labelledby="progreso-title"
		>
			<h2
				id="progreso-title"
				className="mb-12 text-4xl font-semibold uppercase tracking-[0.18em]"
			>
				<span className="text-blue-100 drop-shadow-[0_0_24px_rgba(96,165,250,0.35)]">
					Progreso en Midnight
				</span>
			</h2>

			{/* Season 2 — full-width above */}
			{season2Raids.length > 0 && (
				<div className="mb-8">
					{season2Raids.map((raid) => (
						<RaidCard key={raid.name} raid={raid} fullWidth priority />
					))}
				</div>
			)}

			{/* Season 1 — grid below */}
			{season1Raids.length > 0 && (
				<div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
					{season1Raids.map((raid, idx) => (
						<div
							key={raid.name}
							className={cn(
								PUBLIC_STAGGER_DELAY_CLASSES[idx] ?? "animate-delay-500",
							)}
						>
							<RaidCard raid={raid} />
						</div>
					))}
				</div>
			)}

			{twwProgression.length > 0 && (
				<div className="mt-16">
					<h3 className="mb-8 text-2xl font-semibold uppercase tracking-[0.18em] text-white/70">
						<span className="text-blue-100 drop-shadow-[0_0_24px_rgba(96,165,250,0.35)]">
							Progreso Pasado (TWW)
						</span>
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						{twwProgression.map((raid, idx) => (
							<div key={raid.name} className="flex flex-col gap-3">
								<p className="text-center text-[10px] font-bold uppercase tracking-[0.4em] text-white/50">
									{raid.tier || raid.expansion}
								</p>
								<div
									className={cn(
										"rounded-2xl border border-white/10 bg-white/5 p-8  hover:border-blue-500/30",
										PUBLIC_CARD_REVEAL_CLASSES,
										PUBLIC_STAGGER_DELAY_CLASSES[idx] ?? "animate-delay-500",
									)}
								>
									<h3 className="mb-4 text-xl font-semibold uppercase tracking-[0.18em]">
										<span className="text-blue-100 drop-shadow-[0_0_24px_rgba(96,165,250,0.35)]">
											{raid.name}
										</span>
									</h3>
									<div className="mb-2 text-5xl font-semibold tracking-tighter text-white">
										{raid.progress}
									</div>
									<p className="text-sm font-medium text-white/90">
										{raid.rank !== "-" ? raid.rank : raid.status}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			)}
			<div className="mt-10 flex flex-col items-center gap-4">
				<p className="text-zinc-300 text-xs uppercase tracking-[0.3em] font-bold flex items-center justify-center gap-2">
					<span className="size-1.5 bg-red-500 rounded-full animate-pulse" />
					Live Data from Raider.io
				</p>
				<Button variant="landingTinted" size="landing" asChild>
					<Link href="/progreso">Ver detalle completo</Link>
				</Button>
			</div>
		</section>
	);
}
