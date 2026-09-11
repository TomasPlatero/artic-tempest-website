"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";

import {
	IconX,
	IconTrendingUp,
	IconSword,
	IconShield,
	IconHeartHandshake,
	IconLoader2,
} from "@/shared/ui/tabler-icons";
import { toast } from "sonner";
import { Label } from "@/shared/ui/label";
import { fetchCharacterRIO } from "@/shared/integrations/raiderio/raiderio-client";
import { RecruitmentDetailServiceButtons } from "./recruitment-detail-footer";
import {
	RecruitmentDetailChatHistory,
	RecruitmentDetailItemLevel,
} from "./recruitment-detail-sections";
import {
	RECRUITMENT_STATUS_COLORS,
	RECRUITMENT_STATUS_LABELS,
	TERMINAL_RECRUITMENT_STATUSES,
} from "@/domains/recruitment/lib/application-status";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select";

type Props = {
	application: any;
	answers: any[];
	classConstants: any[];
	initialRioData?: any;
	initialBnetData?: { equipped: number; average: number } | null;
};

const statusConfig: Record<string, { label: string; color: string }> =
	Object.fromEntries(
		Object.entries(RECRUITMENT_STATUS_LABELS).map(([key, label]) => [
			key,
			{ label, color: RECRUITMENT_STATUS_COLORS[key] },
		]),
	);

const DATE_FORMATTER_UTC = new Intl.DateTimeFormat("es-ES", {
	day: "2-digit",
	month: "2-digit",
	year: "numeric",
	timeZone: "UTC",
});

const statusChangeOptions = Object.entries(statusConfig).filter(
	([key]) => key !== "simulated",
);

const EXPANSION_ORDER = [
	"Midnight",
	"The War Within",
	"Dragonflight",
	"Shadowlands",
	"Battle for Azeroth",
	"Legion",
	"Otros",
];

const SEASON_1_RAID_SLUGS = ["tier-mn-1", "sporefall"];
const SEASON_2_RAID_SLUGS = ["the-venomous-abyss", "the-tidebound-grotto"];
const SEASON_1_CARD_TITLE = "Temporada 1 - VS/DR/MQD/SPORE";
const SEASON_2_CARD_TITLE = "Temporada 2 - Abismo Venenoso / Tidebound Grotto";

type CombinedRaidProgress = {
	mythic: number;
	heroic: number;
	normal: number;
	total: number;
};

function combineRaidProgress(
	raidProgression: any,
	slugs: string[],
): CombinedRaidProgress {
	const combined: CombinedRaidProgress = {
		mythic: 0,
		heroic: 0,
		normal: 0,
		total: 0,
	};

	for (const slug of slugs) {
		const raid = raidProgression?.[slug];
		if (!raid) continue;
		combined.mythic += raid.mythic_bosses_killed ?? 0;
		combined.heroic += raid.heroic_bosses_killed ?? 0;
		combined.normal += raid.normal_bosses_killed ?? 0;
		combined.total += raid.total_bosses ?? 0;
	}

	return combined;
}

function formatCombinedRaidSummary(progress: CombinedRaidProgress) {
	if (progress.mythic > 0) return `${progress.mythic}/${progress.total} M`;
	if (progress.heroic > 0) return `${progress.heroic}/${progress.total} H`;
	if (progress.normal > 0) return `${progress.normal}/${progress.total} N`;
	return `0/${progress.total} N`;
}

function getSeasonLabel(id: string) {
	const s = id.toLowerCase();
	if (s === "current") return "Midnight S1 (Actual)";
	if (s === "previous") return "Midnight S1 (Prev)";
	if (s.includes("mn")) return `MN S${s.split("-").pop()}`;
	if (s.includes("tww")) return `TWW S${s.split("-").pop()}`;
	if (s.includes("df")) return `DF S${s.split("-").pop()}`;
	if (s.includes("sl")) return `SL S${s.split("-").pop()}`;
	return id
		.replace("season-", "")
		.split("-")
		.map((w) => w.toUpperCase())
		.join(" ");
}

function getInitialSeason(data: any) {
	if (!data?.mythic_plus_scores_by_season) return "";
	const seasons = data.mythic_plus_scores_by_season;
	const active = seasons.find((s: any) => s.scores?.all > 0) || seasons[0];
	return active?.season || "";
}

async function doUpdateApplicationStatus(
	id: string,
	status: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const res = await fetch("/api/recruitment/applications", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id, status }),
		});
		if (!res.ok) {
			const err = await res.json();
			return { success: false, error: err.error || "Error al actualizar" };
		}
		return { success: true };
	} catch (error: any) {
		return { success: false, error: error.message || "Error al actualizar" };
	}
}

async function doSaveInternalNote(
	id: string,
	notes: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const res = await fetch("/api/recruitment/applications", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id, internal_notes: notes }),
		});
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			return {
				success: false,
				error: (err as any).error || "Error al guardar nota",
			};
		}
		return { success: true };
	} catch (err: any) {
		return { success: false, error: err.message || "Error al guardar nota" };
	}
}

export function RecruitmentDetailClient(props: Props) {
	return useRecruitmentDetailClient(props);
}

/** The stored Raider.IO payload only counts when it belongs to this character. */
function resolveInitialRioMatchesApplication(
	initialRioData: any,
	application: any,
) {
	return Boolean(
		initialRioData &&
			initialRioData.name?.toLowerCase() ===
				application.character_name.toLowerCase() &&
			initialRioData.realm?.toLowerCase().replace(/\s+/g, "-") ===
				application.character_realm.toLowerCase().replace(/\s+/g, "-"),
	);
}

function resolveRioData(
	initialRioMatchesApplication: boolean,
	initialRioData: any,
	externalRio: any,
) {
	return initialRioMatchesApplication
		? initialRioData
		: (externalRio ?? initialRioData ?? null);
}

function resolveLoadingRio(
	isFetchingRio: boolean,
	initialRioData: any,
	rioData: any,
) {
	return isFetchingRio || (!initialRioData && !rioData);
}

function resolveMPlusScore(currentSeasonData: any) {
	return currentSeasonData?.scores?.all || 0;
}

function resolveRawSeasons(rioData: any) {
	return rioData?.mythic_plus_scores_by_season || [];
}

function resolveHasAnyRaidProgress(season1Progress: any, season2Progress: any) {
	return season1Progress.total > 0 || season2Progress.total > 0;
}

/** Spec label shown next to the character name. */
function resolveSpecLabel(application: any, rioData: any) {
	return application.character_spec === "Unknown"
		? rioData?.active_spec_name || "Unknown"
		: application.character_spec;
}

function resolveSpecFallback(application: any, rioData: any) {
	return application.character_spec !== "Unknown"
		? application.character_spec
		: rioData?.active_spec_name || "PENDIENTE";
}

function resolveGuildRealm(rioData: any, application: any) {
	return rioData.guild.realm || application.character_realm;
}

function resolveStatusLocked(isUpdating: boolean, isTerminalStatus: boolean) {
	return isUpdating || isTerminalStatus;
}

function resolveCanShowScores(loadingRio: boolean, rioData: any) {
	return !loadingRio && Boolean(rioData?.mythic_plus_scores_by_season);
}

/** Protection / Blood / Guardian are the tank specialisations. */
function resolveIsTankSpec(spec: string) {
	const value = spec.toLowerCase();
	return ["tank", "protection", "blood", "guardian"].some((keyword) =>
		value.includes(keyword),
	);
}
function useRecruitmentDetailClient({
	application,
	answers,
	classConstants,
	initialRioData,
	initialBnetData,
}: Props) {
	const router = useRouter();

	const initialRioMatchesApplication = resolveInitialRioMatchesApplication(
		initialRioData,
		application,
	);

	const [viewState, setViewState] = useState({
		selectedSeason: getInitialSeason(initialRioData) as string,
		isUpdating: false,
		currentStatus: application.status,
	});
	const { selectedSeason, isUpdating, currentStatus } = viewState;

	const { data: externalData, isLoading: isFetchingRio } = useSWR(
		initialRioMatchesApplication
			? null
			: [
					"recruitment-detail-external",
					application.character_name,
					application.character_realm,
					application.id,
				],
		async () => {
			const rio = await fetchCharacterRIO(
				application.character_name,
				application.character_realm,
			);

			if (application.character_spec === "Unknown") {
				const betterSpec = rio?.active_spec_name;
				if (betterSpec && betterSpec !== "Unknown") {
					await fetch("/api/recruitment/applications", {
						method: "PATCH",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							id: application.id,
							character_spec: betterSpec,
						}),
					});
				}
			}

			return { rio, synced: initialBnetData ?? null };
		},
	);

	const rioData = resolveRioData(
		initialRioMatchesApplication,
		initialRioData,
		externalData?.rio,
	);
	const loadingRio = resolveLoadingRio(isFetchingRio, initialRioData, rioData);

	const classMap = (() => {
		const map = new Map<number, { name: string; color: string }>();
		classConstants.forEach((c: any) =>
			map.set(Number(c.key), { name: c.value, color: c.metadata?.color }),
		);
		return map;
	})();
	const cls = classMap.get(application.character_class);

	const handleUpdateStatus = async (val: string) => {
		const prevStatus = currentStatus;
		setViewState((prev) => ({ ...prev, currentStatus: val, isUpdating: true }));

		const result = await doUpdateApplicationStatus(application.id, val);

		if (result.success) {
			if (val === "accepted") {
				toast.success("Tu apply ha sido aceptado", {
					duration: 5000,
					closeButton: true,
				});
			} else if (val === "rejected") {
				toast("Tu apply ha sido rechazado", {
					duration: 5000,
					closeButton: true,
				});
			} else {
				toast.success(`Estado actualizado a: ${statusConfig[val].label}`, {
					closeButton: true,
				});
			}
			router.refresh();
		} else {
			setViewState((prev) => ({ ...prev, currentStatus: prevStatus }));
			toast.error("Error al actualizar estado", {
				description: result.error,
				closeButton: true,
			});
		}

		setViewState((prev) => ({ ...prev, isUpdating: false }));
	};

	const currentSeasonData = rioData?.mythic_plus_scores_by_season?.find(
		(s: any) => s.season === selectedSeason,
	);
	const mPlusScore = resolveMPlusScore(currentSeasonData);
	const canViewChatHistory = [
		"paused",
		"interview",
		"accepted",
		"rejected",
	].includes(currentStatus);
	const isTerminalStatus = TERMINAL_RECRUITMENT_STATUSES.includes(
		currentStatus as any,
	);

	// Season Grouping Logic
	const rawSeasons = resolveRawSeasons(rioData);
	// Remove duplicates if RIO returns the same season for 'current' and 'season-xxx'
	const uniqueSeasons = Array.from(
		new Set(rawSeasons.map((s: any) => s.season)),
	).map((id) => rawSeasons.find((s: any) => s.season === id));

	const groupedSeasons =
		uniqueSeasons.reduce((acc: any, s: any) => {
			let expansion = "Otros";
			const sid = s.season.toLowerCase();

			// Expanded logic to handle 'current' and 'previous' slugs
			if (sid.includes("mn") || sid.includes("midnight")) expansion = "Midnight";
			else if (sid.includes("tww") || sid.includes("war-within"))
				expansion = "The War Within";
			else if (sid.includes("dragonflight") || sid.includes("df-"))
				expansion = "Dragonflight";
			else if (sid.includes("shadowlands") || sid.includes("sl-"))
				expansion = "Shadowlands";
			else if (sid.includes("bfa")) expansion = "Battle for Azeroth";
			else if (sid.includes("legion")) expansion = "Legion";

			// Final fallback for 'current'/'previous' based on RIO structure if possible
			if (sid === "current" || sid === "previous") {
				// Usually 'current' in 2026 is Midnight
				expansion = "Midnight";
			}

			if (!acc[expansion]) acc[expansion] = [];
			acc[expansion].push(s);
			return acc;
		}, {}) || {};

	const season1Progress = combineRaidProgress(
		rioData?.raid_progression,
		SEASON_1_RAID_SLUGS,
	);
	const season2Progress = combineRaidProgress(
		rioData?.raid_progression,
		SEASON_2_RAID_SLUGS,
	);
	const statusLocked = resolveStatusLocked(isUpdating, isTerminalStatus);
	const hasAnyRaidProgress = resolveHasAnyRaidProgress(
		season1Progress,
		season2Progress,
	);

	return (
		<div className="space-y-8 w-full pb-20 dark">
			{/* CLEAN HEADER SECTION */}
			<RecruitmentDetailContent
				application={application}
				canViewChatHistory={canViewChatHistory}
				cls={cls}
				currentStatus={currentStatus}
				groupedSeasons={groupedSeasons}
				handleUpdateStatus={handleUpdateStatus}
				hasAnyRaidProgress={hasAnyRaidProgress}
				initialBnetData={initialBnetData}
				statusLocked={statusLocked}
				loadingRio={loadingRio}
				mPlusScore={mPlusScore}
				rioData={rioData}
				season1Progress={season1Progress}
				season2Progress={season2Progress}
				selectedSeason={selectedSeason}
				setViewState={setViewState}
			/>

			{/* 2. APPLICATION FORM ANSWERS (FULL WIDTH, COMPACT) */}
			<div className="space-y-4">
				<div className="flex items-center gap-3 px-2">
					<IconHeartHandshake className="size-5 text-blue-500" />
					<h3 className="text-lg font-semibold text-white uppercase tracking-wider">
						Respuestas del Formulario
					</h3>
					<div className="h-px flex-1 bg-linear-to-r from-white/10 to-transparent" />
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{answers
						.slice()
						.sort(
							(a, b) =>
								a.recruitment_questions.order_index -
								b.recruitment_questions.order_index,
						)
						.map((ans: any) => (
							<Card
								key={
									ans.id ||
									ans.recruitment_question_id ||
									ans.recruitment_questions?.label
								}
								className="bg-card/20 border-border/10 overflow-hidden hover:bg-card/30 transition-colors"
							>
								<CardContent className="p-4">
									<Label className="text-blue-400/80 font-semibold mb-1.5 block text-[10px] uppercase tracking-[0.2em]">
										{ans.recruitment_questions.label}
									</Label>
									<div className="text-sm text-zinc-200 leading-snug whitespace-pre-wrap">
										{ans.answer_text}
									</div>
								</CardContent>
							</Card>
						))}
					{answers.length === 0 && (
						<div className="col-span-full p-10 text-center text-muted-foreground border border-dashed border-border/20 rounded-2xl">
							No hay respuestas registradas.
						</div>
					)}
				</div>
			</div>

			{/* 3. INTERNAL NOTES (AT THE VERY BOTTOM) */}
			<div className="space-y-4 border-t border-white/5 pt-8">
				<div className="flex items-center gap-3 px-2">
					<IconShield className="size-5 text-purple-500" />
					<h3 className="text-lg font-semibold text-white uppercase tracking-wider">
						Notas Internas de Oficiales
					</h3>
				</div>
				<Card className="bg-purple-500/5 border-purple-500/10 overflow-hidden">
					<CardContent className="p-0">
						<textarea
							aria-label="Notas internas de oficiales"
							className="w-full h-32 bg-transparent border-none p-4 text-sm text-white resize-none outline-none placeholder:text-zinc-600 focus:ring-1 focus:ring-purple-500/30"
							placeholder="Escribe notas privadas para el resto de oficiales sobre este aplicante..."
							defaultValue={application.internal_notes || ""}
							onBlur={(e) => {
								void (async () => {
									const result = await doSaveInternalNote(
										application.id,
										e.target.value,
									);
									if (result.success) {
										toast.success("Nota guardada");
									} else {
										toast.error("Error al guardar nota");
									}
								})();
							}}
						/>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

type RecruitmentDetailContentProps = {
	application: any;
	canViewChatHistory: boolean;
	cls: any;
	currentStatus: any;
	groupedSeasons: any;
	handleUpdateStatus: any;
	hasAnyRaidProgress: boolean;
	initialBnetData: any;
	statusLocked: boolean;
	loadingRio: boolean;
	mPlusScore: number;
	rioData: any;
	season1Progress: any;
	season2Progress: any;
	selectedSeason: string;
	setViewState: any;
};

function RecruitmentDetailContent({
	application,
	canViewChatHistory,
	cls,
	currentStatus,
	groupedSeasons,
	handleUpdateStatus,
	hasAnyRaidProgress,
	initialBnetData,
	loadingRio,
	mPlusScore,
	rioData,
	season1Progress,
	season2Progress,
	selectedSeason,
	setViewState,
	statusLocked,
}: RecruitmentDetailContentProps) {
	return (
		<>
			<div className="flex flex-col md:flex-row justify-between items-start gap-4">
				<div className="flex items-center gap-6">
					<div className="relative size-20 md:size-24 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl shadow-blue-500/10 bg-zinc-900">
						<Image
							src={
								rioData?.thumbnail_url ||
								`/assets/images/classes/${application.character_class}.webp`
							}
							alt="Avatar"
							fill
							sizes="(min-width: 768px) 96px, 80px"
							className="object-cover"
						/>
					</div>
					<div>
						<div className="flex items-center gap-3 mb-1">
							<h2 className="text-3xl md:text-4xl font-semibold text-white uppercase tracking-tighter">
								{application.character_name}
							</h2>
						</div>
						<p className="text-lg font-medium" style={{ color: cls?.color }}>
							{resolveSpecLabel(application, rioData)} {cls?.name}
						</p>
						<p
							className="text-sm text-muted-foreground flex items-center gap-2"
							suppressHydrationWarning
						>
							{application.character_realm} •{" "}
							{DATE_FORMATTER_UTC.format(new Date(application.created_at))}
						</p>
						{rioData?.guild?.name && (
							<p className="text-sm text-blue-400/80 font-medium flex items-center gap-1.5 mt-1">
								<IconShield className="size-3.5" />
								&lt;{rioData.guild.name}&gt; · {resolveGuildRealm(rioData, application)}
							</p>
						)}
					</div>
				</div>

				<div className="flex flex-col gap-2 w-full md:w-64">
					<Label className="text-[10px] uppercase font-bold text-zinc-500 ml-2">
						Cambiar Estado
					</Label>
					<Select
						value={currentStatus}
						onValueChange={(val) => void handleUpdateStatus(val)}
						disabled={statusLocked}
					>
						<SelectTrigger className="bg-zinc-950/50 border-white/10 h-10 rounded-xl focus:ring-blue-500/50">
							<SelectValue placeholder="Seleccionar estado" />
						</SelectTrigger>
						<SelectContent className="bg-zinc-950 border-white/10 text-white">
							{statusChangeOptions.map(([key, cfg]) => (
								<SelectItem
									key={key}
									value={key}
									className="focus:bg-white/5 cursor-pointer"
								>
									<div className="flex items-center gap-2">
										<div
											className={`size-2 rounded-full ${key === "pending" ? "bg-blue-500" : key === "reviewing" ? "bg-purple-500" : key === "paused" ? "bg-zinc-400" : key === "interview" ? "bg-amber-500" : key === "accepted" ? "bg-emerald-500" : key === "simulated" ? "bg-cyan-500" : key === "cancelado" ? "bg-zinc-500" : key === "rejected" ? "bg-rose-500" : "bg-zinc-500"}`}
										/>
										{cfg.label}
									</div>
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<RecruitmentDetailChatHistory
						application={application}
						canViewChatHistory={canViewChatHistory}
						currentStatus={currentStatus}
					/>
				</div>
			</div>

			{/* 1. TOP SUMMARY: EXPANSION SELECTOR + SCORE */}
			<Card className="bg-card/20 border-border/20 overflow-hidden backdrop-blur-xl border-t-2 border-t-blue-500/50">
				<CardHeader className="py-4 px-6 border-b border-white/5 bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-4">
					<CardTitle className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-400 flex items-center gap-2">
						<IconTrendingUp className="size-4" /> Progreso Banda
					</CardTitle>

					{resolveCanShowScores(loadingRio, rioData) && (
						<Select
							value={selectedSeason}
							onValueChange={(value) =>
								setViewState((prev: any) => ({ ...prev, selectedSeason: value }))
							}
						>
							<SelectTrigger className="w-full sm:w-72 h-9 bg-zinc-900/80 border-white/10 text-[10px] uppercase font-semibold tracking-widest hover:border-blue-500/30 transition-colors">
								<SelectValue placeholder="Seleccionar Temporada / Tier" />
							</SelectTrigger>
							<SelectContent className="bg-zinc-950 border-white/10 max-h-[400px]">
								{EXPANSION_ORDER.map(
									(exp) =>
										groupedSeasons[exp] && (
											<div key={exp} className="p-1">
												<div className="px-3 py-1.5 text-[9px] font-semibold text-blue-500/70 uppercase tracking-[0.2em] bg-white/[0.02] rounded-md mb-1">
													{exp}
												</div>
												{groupedSeasons[exp].map((s: any) => (
													<SelectItem
														key={s.season}
														value={s.season}
														className="text-[10px] uppercase font-bold py-2 focus:bg-blue-500/10"
													>
														{getSeasonLabel(s.season)}
													</SelectItem>
												))}
											</div>
										),
								)}
							</SelectContent>
						</Select>
					)}
				</CardHeader>
				<CardContent className="p-6">
					{loadingRio ? (
						<div className="flex flex-col items-center justify-center py-20 gap-4">
							<IconLoader2 className="size-10 animate-spin text-blue-500" />
							<span className="text-xs font-bold text-zinc-500 uppercase tracking-widest animate-pulse">
								Consultando historial de la API…
							</span>
						</div>
					) : (
						<div className="space-y-10">
							{/* Score and Main Info */}
							<div className="flex flex-col lg:flex-row gap-8 items-center">
								<div className="flex flex-col items-center justify-center bg-blue-500/10 border border-blue-500/20 rounded-3xl p-8 min-w-[220px] text-center shadow-xl shadow-blue-500/5 relative overflow-hidden group">
									<div className="absolute inset-0 bg-linear-to-br from-blue-500/10 to-transparent opacity-50" />
									<span className="relative text-[10px] uppercase font-semibold text-blue-400 tracking-[0.2em] mb-2">
										Score de Temporada
									</span>
									<span className="relative text-6xl font-semibold text-white tabular-nums tracking-tighter">
										{mPlusScore.toFixed(0)}
									</span>
									<div className="relative mt-4 flex items-center gap-2">
										<Badge className="bg-blue-500 text-white font-semibold text-[9px] px-2 py-1 uppercase">
											Verificado RIO
										</Badge>
									</div>
								</div>

								<div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
									<div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center hover:bg-white/10 transition-colors">
										<span className="text-[10px] uppercase font-bold text-zinc-500 mb-1">
											Espec. Principal
										</span>
										<div className="flex items-center gap-1.5 text-white">
											{resolveIsTankSpec(application.character_spec) ? (
												<IconShield className="size-4 text-blue-400" />
											) : (
												<IconSword className="size-4 text-rose-400" />
											)}
											<span className="text-sm font-semibold uppercase">
												{resolveSpecFallback(application, rioData)}
											</span>
										</div>
									</div>
									{/* <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center hover:bg-white/10 transition-colors">
										<span className="text-[10px] uppercase font-bold text-zinc-500 mb-1">
											Expansión
										</span>
										<span className="text-xs font-semibold text-white uppercase">
											{selectedSeason.includes("tww")
												? "TWW"
												: selectedSeason.includes("df")
													? "DF"
													: selectedSeason.includes("mn")
														? "Midnight"
														: "Otros"}
										</span>
									</div> */}
									<RecruitmentDetailItemLevel
										initialBnetData={initialBnetData}
										rioData={rioData}
									/>
								</div>
							</div>

							{/* Raid Progression Section */}
							<div className="space-y-4">
								<div className="flex items-center gap-2 px-1">
									<IconSword className="size-4 text-rose-500" />
									<h4 className="text-[10px] uppercase font-semibold text-zinc-500 tracking-[0.2em]">
										Progreso Banda
									</h4>
								</div>
								{hasAnyRaidProgress ? (
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										{[
											{
												key: "season-1",
												title: SEASON_1_CARD_TITLE,
												progress: season1Progress,
											},
											{
												key: "season-2",
												title: SEASON_2_CARD_TITLE,
												progress: season2Progress,
											},
										].map(({ key, title, progress }) => (
											<div
												key={key}
												className="bg-zinc-950/60 border border-white/5 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-colors group shadow-xl"
											>
												<div className="p-4 bg-white/[0.03] border-b border-white/5 flex items-center justify-between gap-2">
													<span className="text-xs font-semibold text-zinc-100 group-hover:text-blue-400 transition-colors truncate">
														{title}
													</span>
													<span className="text-[10px] font-semibold text-rose-500 shrink-0">
														{formatCombinedRaidSummary(progress)}
													</span>
												</div>
												<div className="p-4 space-y-4">
													{/* Mythic */}
													<div className="space-y-1.5">
														<div className="flex justify-between items-center">
															<span className="text-[9px] font-semibold text-zinc-500 tracking-wider">
																MÍTICO
															</span>
															<span className="text-[11px] font-semibold text-orange-400">
																{progress.mythic}/{progress.total}
															</span>
														</div>
														<div className="h-1.5 w-full bg-white/[0.03] rounded-full">
															<div
																className="h-full bg-linear-to-r from-orange-600 to-orange-400 rounded-full shadow-[0_0_8px_rgba(251,146,60,0.3)]"
																style={{
																	width: `${progress.total > 0 ? (progress.mythic / progress.total) * 100 : 0}%`,
																}}
															/>
														</div>
													</div>

													{/* Heroic */}
													<div className="space-y-1.5">
														<div className="flex justify-between items-center">
															<span className="text-[9px] font-semibold text-zinc-500 tracking-wider">
																HEROICO
															</span>
															<span className="text-[11px] font-semibold text-purple-400">
																{progress.heroic}/{progress.total}
															</span>
														</div>
														<div className="h-1.5 w-full bg-white/[0.03] rounded-full">
															<div
																className="h-full bg-linear-to-r from-purple-600 to-purple-400 rounded-full"
																style={{
																	width: `${progress.total > 0 ? (progress.heroic / progress.total) * 100 : 0}%`,
																}}
															/>
														</div>
													</div>

													{/* Normal */}
													<div className="space-y-1.5">
														<div className="flex justify-between items-center">
															<span className="text-[9px] font-semibold text-zinc-500 tracking-wider">
																NORMAL
															</span>
															<span className="text-[11px] font-semibold text-blue-400">
																{progress.normal}/{progress.total}
															</span>
														</div>
														<div className="h-1.5 w-full bg-white/[0.03] rounded-full">
															<div
																className="h-full bg-linear-to-r from-blue-600 to-blue-400 rounded-full"
																style={{
																	width: `${progress.total > 0 ? (progress.normal / progress.total) * 100 : 0}%`,
																}}
															/>
														</div>
													</div>
												</div>
											</div>
										))}
									</div>
								) : (
									<div className="py-12 text-center bg-white/[0.01] rounded-3xl border border-dashed border-white/10">
										<div className="flex flex-col items-center gap-2">
											<IconX className="size-6 text-zinc-700" />
											<span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-[0.3em]">
												Sin registros de banda en esta temporada
											</span>
										</div>
									</div>
								)}
							</div>

							{/* Service Buttons */}
							<RecruitmentDetailServiceButtons application={application} />
						</div>
					)}
				</CardContent>
			</Card>
		</>
	);
}
