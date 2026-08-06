"use client";

import { useReducer, useState } from "react";
import Image from "next/image";
import { blurDataUrls } from "@/shared/images/blur-data-urls";
import { Button } from "@/shared/ui/button";
import Link from "next/link";
import { IconChevronRight } from "@/shared/ui/tabler-icons";
import {
	PUBLIC_CARD_REVEAL_CLASSES,
	PUBLIC_SECTION_REVEAL_CLASSES,
	PUBLIC_STAGGER_DELAY_CLASSES,
} from "@/shared/components/public-motion";
import { cn } from "@/shared/tailwind/tailwind-utils";

type Spot = {
	class_id: string;
	spec_name: string;
	urgency: string;
};

type ClassData = {
	id: string;
	name: string;
	color: string;
	spots: Spot[];
};

type RecruitmentFilter =
	| "all"
	| "high"
	| "medium"
	| "low"
	| "tank"
	| "heal"
	| "dps";

type SpotRole = "tank" | "heal" | "dps";

const urgencyBorderColors: Record<string, string> = {
	high: "rgba(244, 63, 94, 0.35)",
	medium: "rgba(245, 158, 11, 0.35)",
	low: "rgba(14, 165, 233, 0.35)",
};

const urgencyFillColors: Record<string, string> = {
	high: "rgba(244, 63, 94, 0.10)",
	medium: "rgba(245, 158, 11, 0.10)",
	low: "rgba(14, 165, 233, 0.10)",
};

const urgencyLabels: Record<string, string> = {
	high: "ALTA",
	medium: "MEDIA",
	low: "BAJA",
};

const urgencyOrder: Record<string, number> = {
	high: 0,
	medium: 1,
	low: 2,
};

const filterLabels: Record<RecruitmentFilter, string> = {
	all: "Todos",
	high: "Alta",
	medium: "Media",
	low: "Baja",
	tank: "Tanque",
	heal: "Heal",
	dps: "DPS",
};

const tankSpecs = new Set([
	"blood",
	"protection",
	"guardian",
	"vengeance",
	"brewmaster",
	"sangre",
	"protección",
	"proteccion",
	"guardián",
	"guardian",
	"venganza",
	"maestro cervecero",
]);

const healSpecs = new Set([
	"holy",
	"discipline",
	"restoration",
	"preservation",
	"mistweaver",
	"sagrado",
	"disciplina",
	"restauración",
	"restauracion",
	"preservación",
	"preservacion",
	"tejedor de niebla",
]);

function normalizeSpecName(value: string) {
	return value.trim().toLowerCase();
}

function getSpotRole(spot: Spot): SpotRole {
	const normalizedSpecName = normalizeSpecName(spot.spec_name);
	if (tankSpecs.has(normalizedSpecName)) return "tank";
	if (healSpecs.has(normalizedSpecName)) return "heal";
	return "dps";
}

function getClassPriority(cls: ClassData) {
	const sortedUrgencies = cls.spots
		.map((spot) => urgencyOrder[spot.urgency] ?? 99)
		.sort((a, b) => a - b);

	const highestPriority = sortedUrgencies[0] ?? 99;
	const highCount = cls.spots.filter((spot) => spot.urgency === "high").length;
	const mediumCount = cls.spots.filter(
		(spot) => spot.urgency === "medium",
	).length;

	return {
		highestPriority,
		highCount,
		mediumCount,
		total: cls.spots.length,
	};
}

function hexToRgba(hex: string, alpha: number) {
	const value = hex.replace("#", "");
	const normalized =
		value.length === 3
			? value
					.split("")
					.map((char) => `${char}${char}`)
					.join("")
			: value;

	if (normalized.length !== 6) return `rgba(34, 211, 238, ${alpha})`;

	const numeric = Number.parseInt(normalized, 16);
	const red = (numeric >> 16) & 255;
	const green = (numeric >> 8) & 255;
	const blue = numeric & 255;

	return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function matchesFilter(cls: ClassData, filter: RecruitmentFilter) {
	if (filter === "all") return true;
	if (filter === "high" || filter === "medium" || filter === "low") {
		return cls.spots.some((spot) => spot.urgency === filter);
	}

	return cls.spots.some((spot) => getSpotRole(spot) === filter);
}

export function WantedClasses({
	initialClasses,
	initialHasApplied: _initialHasApplied,
}: {
	initialClasses?: ClassData[];
	initialHasApplied?: boolean;
}) {
	const [state, _dispatch] = useReducer(
		(
			current: { classesWithSpots: ClassData[]; loading: boolean },
			action: any,
		) => {
			switch (action.type) {
				case "SET_CLASSES":
					return {
						...current,
						classesWithSpots: action.classes,
						loading: false,
					};
				case "SET_LOADING":
					return { ...current, loading: action.loading };
				default:
					return current;
			}
		},
		{
			classesWithSpots: initialClasses ?? [],
			loading: initialClasses === undefined,
		},
	);
	const { classesWithSpots, loading } = state;
	const [activeFilter, setActiveFilter] = useState<RecruitmentFilter>("all");

	const filteredClasses = [...classesWithSpots]
		.sort((a, b) => {
			const aPriority = getClassPriority(a);
			const bPriority = getClassPriority(b);

			return (
				aPriority.highestPriority - bPriority.highestPriority ||
				bPriority.highCount - aPriority.highCount ||
				bPriority.mediumCount - aPriority.mediumCount ||
				bPriority.total - aPriority.total ||
				Number(a.id) - Number(b.id)
			);
		})
		.filter((cls) => matchesFilter(cls, activeFilter));

	return (
		<section
			className={cn(
				"relative isolate w-full overflow-hidden py-16 md:py-20",
				PUBLIC_SECTION_REVEAL_CLASSES,
			)}
			aria-labelledby="reclutamiento-title"
		>
			<div className="pointer-events-none absolute inset-0 -z-10">
				<Image
					src="/assets/images/recruitment.webp"
					alt=""
					fill
					aria-hidden="true"
					placeholder="blur"
					blurDataURL={blurDataUrls.recruitment}
					className="object-cover object-center"
					sizes="100vw"
				/>
				<div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,16,0.62),rgba(5,8,16,0.78))]" />
			</div>

			<div className="relative z-10 mx-auto max-w-7xl px-6">
				<div className="mb-8 text-center md:mb-10">
					<h2
						id="reclutamiento-title"
						className="text-3xl font-semibold uppercase tracking-[0.18em] text-blue-50 md:text-4xl"
					>
						Reclutamiento
					</h2>
					<div className="mx-auto mt-4 h-1 w-16 rounded-full bg-blue-500" />
					<p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-blue-100/90 md:text-base">
						Buscamos jugadores comprometidos para reforzar nuestro roster de
						raid.
					</p>
				</div>

				<div className="mb-8 rounded-[2rem] border border-white/10 bg-black/25 p-6 md:mb-10 md:p-8">
					<div className="flex flex-wrap justify-center gap-2">
						{(
							[
								"all",
								"high",
								"medium",
								"low",
								"tank",
								"heal",
								"dps",
							] as RecruitmentFilter[]
						).map((filter) => (
							<button
								key={filter}
								type="button"
								onClick={() => setActiveFilter(filter)}
								className={cn(
									"rounded-full border px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] ",
									activeFilter === filter
										? "border-cyan-300/45 bg-cyan-300/12 text-cyan-50"
										: "border-white/10 bg-white/[0.03] text-blue-100/85 hover:border-white/20 hover:text-blue-50",
								)}
							>
								{filterLabels[filter]}
							</button>
						))}
					</div>
				</div>

				{loading ? (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
						{Array.from({ length: 4 }).map((_, i) => (
							<div
								key={i}
								className="h-48 animate-pulse rounded-[1.75rem] bg-white/[0.03]"
							/>
						))}
					</div>
				) : filteredClasses.length > 0 ? (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
						{filteredClasses.map((cls: ClassData, idx: number) => (
							<article
								key={cls.id}
								className={cn(
									"group overflow-hidden rounded-[1.75rem] border border-white/10 p-4  motion-reduce:transition-none hover:-translate-y-1 motion-reduce:hover:translate-y-0 hover:border-cyan-300/22",
									PUBLIC_CARD_REVEAL_CLASSES,
									PUBLIC_STAGGER_DELAY_CLASSES[idx] ?? "animate-delay-500",
								)}
								style={{
									backgroundImage: `radial-gradient(circle at top, ${hexToRgba(cls.color, 0.16)}, transparent 45%), linear-gradient(180deg, rgba(10, 15, 28, 0.94), rgba(5, 8, 16, 0.98))`,
								}}
							>
								<div className="flex items-center gap-3">
									<div className="relative size-14 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
										<div
											aria-hidden="true"
											className="absolute inset-y-0 left-0 w-1"
											style={{ backgroundColor: cls.color }}
										/>
										<Image
											src={`/assets/images/classes/${cls.id}.webp`}
											alt={cls.name}
											width={112}
											height={112}
											className="absolute inset-0 size-full object-cover transition-transform duration-500 motion-reduce:transition-none group-hover:scale-110 motion-reduce:group-hover:scale-100"
											sizes="56px"
										/>
									</div>
									<div className="min-w-0">
										<h3 className="text-base font-semibold uppercase tracking-[0.14em] text-white">
											{cls.name}
										</h3>
									</div>
								</div>

								<div className="mt-4 flex flex-wrap gap-2">
									{cls.spots.map((spot: Spot) => (
										<div
											key={spot.spec_name}
											className="inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-left"
											style={{
												borderColor: urgencyBorderColors[spot.urgency],
												background: `linear-gradient(180deg, ${urgencyFillColors[spot.urgency]}, rgba(255,255,255,0.03))`,
											}}
										>
											<span
												className="size-2 rounded-full"
												style={{ backgroundColor: cls.color }}
											/>
											<span className="text-[13px] font-semibold text-white/92">
												{spot.spec_name}
											</span>
											<span className="text-[10px] leading-none text-white/50">
												•
											</span>
											<span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-blue-100/85">
												{urgencyLabels[spot.urgency]}
											</span>
										</div>
									))}
								</div>
							</article>
						))}
					</div>
				) : (
					<div className="rounded-3xl border border-dashed border-white/10 bg-white/5 py-12 text-center">
						<p className="text-base font-medium italic text-blue-100/70 md:text-lg">
							{classesWithSpots.length > 0
								? "No hay clases que coincidan con este filtro ahora mismo."
								: "No hay vacantes abiertas actualmente, pero siempre revisamos aplicaciones excelentes."}
						</p>
					</div>
				)}

				<div className="mt-10 flex justify-center md:mt-12">
					<Button
						variant="landingPrimary"
						asChild
						size="landingLg"
						className="w-full sm:w-auto"
					>
						<Link
							href="/reclutamiento"
							className="group/cta"
							aria-label="Aplicar a Artic Tempest – Ir a reclutamiento"
						>
							Aplicar a Artic Tempest
							<IconChevronRight className="ml-2 size-5 transition-transform duration-300 group-hover/cta:translate-x-1 md:size-6" />
						</Link>
					</Button>
				</div>
			</div>
		</section>
	);
}
