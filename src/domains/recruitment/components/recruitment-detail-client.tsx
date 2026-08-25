"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
	IconX,
	IconExternalLink,
	IconTrendingUp,
	IconSword,
	IconShield,
	IconHeartHandshake,
	IconLoader2,
	IconMessageCircle,
} from "@/shared/ui/tabler-icons";
import { toast } from "sonner";
import { Label } from "@/shared/ui/label";
import { fetchCharacterRIO } from "@/shared/integrations/raiderio/raiderio-client";
import {
	RECRUITMENT_STATUS_COLORS,
	RECRUITMENT_STATUS_LABELS,
	TERMINAL_RECRUITMENT_STATUSES,
} from "@/domains/recruitment/lib/application-status";
import {
	formatRecruitmentRaidSummary,
	getRecruitmentRaidName,
	getRecruitmentRaidSeasonLabel,
	getRecruitmentRaidsForSeason,
} from "@/shared/lib/recruitment/raid-progression";

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

const SEASON_2_RAID_SLUG = "the-venomous-abyss";
const SEASON_2_RAID_NAME = "El Abismo Venenoso";

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

function useRecruitmentDetailClient({
	application,
	answers,
	classConstants,
	initialRioData,
	initialBnetData,
}: Props) {
	const router = useRouter();

	const initialRioMatchesApplication = Boolean(
		initialRioData &&
			initialRioData.name?.toLowerCase() ===
				application.character_name.toLowerCase() &&
			initialRioData.realm?.toLowerCase().replace(/\s+/g, "-") ===
				application.character_realm.toLowerCase().replace(/\s+/g, "-"),
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

	const rioData = initialRioMatchesApplication
		? initialRioData
		: (externalData?.rio ?? initialRioData ?? null);
	const loadingRio = isFetchingRio || (!initialRioData && !rioData);

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
	const mPlusScore = currentSeasonData?.scores?.all || 0;
	const canViewChatHistory = [
		"paused",
		"interview",
		"accepted",
		"rejected",
	].includes(currentStatus);
	const isTerminalStatus = TERMINAL_RECRUITMENT_STATUSES.includes(
		currentStatus as any,
	);

	// Debug
	if (rioData) {
		console.log("RIO Data state:", {
			name: rioData.name,
			seasonsCount: rioData.mythic_plus_scores_by_season?.length,
			selectedSeason,
			mPlusScore,
		});
	}

	// Season Grouping Logic
	const rawSeasons = rioData?.mythic_plus_scores_by_season || [];
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

	const activeRaids = getRecruitmentRaidsForSeason(
		rioData?.raid_progression,
		selectedSeason,
	);
	const season2Raid = rioData?.raid_progression?.[SEASON_2_RAID_SLUG];

	return (
		<div className="space-y-8 w-full pb-20 dark">
			{/* CLEAN HEADER SECTION */}
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
							{application.character_spec === "Unknown"
								? rioData?.active_spec_name || "Unknown"
								: application.character_spec}{" "}
							{cls?.name}
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
								&lt;{rioData.guild.name}&gt; ·{" "}
								{rioData.guild.realm || application.character_realm}
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
						disabled={isUpdating || isTerminalStatus}
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

					{canViewChatHistory && (
						<div className="pt-3 animate-in fade-in slide-in-from-top-2 duration-500">
							<Button
								className="w-full rounded-xl h-12 bg-linear-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold uppercase text-[10px] tracking-[0.15em] shadow-xl shadow-blue-500/20 border-t border-white/20 group justify-center gap-2 px-4 ring-1 ring-white/5"
								asChild
							>
								<Link
									href={`/zona-raider/configuracion/reclutamiento/${application.id}/chat`}
								>
									<IconMessageCircle className="size-4 group-hover:translate-x-[-2px] group-hover:rotate-[-10deg] transition-colors duration-300" />
									<span className="truncate">
										{currentStatus === "interview"
											? "Chat con Aspirante"
											: "Ver histórico de chat"}
									</span>
									<IconExternalLink className="size-3 opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-colors shrink-0" />
								</Link>
							</Button>
						</div>
					)}
				</div>
			</div>

			{/* 1. TOP SUMMARY: EXPANSION SELECTOR + SCORE */}
			<Card className="bg-card/20 border-border/20 overflow-hidden backdrop-blur-xl border-t-2 border-t-blue-500/50">
				<CardHeader className="py-4 px-6 border-b border-white/5 bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-4">
					<CardTitle className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-400 flex items-center gap-2">
						<IconTrendingUp className="size-4" /> Progreso Banda
					</CardTitle>

					{!loadingRio && rioData?.mythic_plus_scores_by_season && (
						<Select
							value={selectedSeason}
							onValueChange={(value) =>
								setViewState((prev) => ({ ...prev, selectedSeason: value }))
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
											{application.character_spec.toLowerCase().includes("tank") ||
											application.character_spec.toLowerCase().includes("protection") ||
											application.character_spec.toLowerCase().includes("blood") ||
											application.character_spec.toLowerCase().includes("guardian") ? (
												<IconShield className="size-4 text-blue-400" />
											) : (
												<IconSword className="size-4 text-rose-400" />
											)}
											<span className="text-sm font-semibold uppercase">
												{application.character_spec !== "Unknown"
													? application.character_spec
													: rioData?.active_spec_name || "PENDIENTE"}
											</span>
										</div>
									</div>
									<div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center hover:bg-white/10 transition-colors">
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
									</div>
									<div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center hover:bg-emerald-500/5 transition-colors">
										<span className="text-[10px] uppercase font-bold text-zinc-500 mb-1">
											Status
										</span>
										<span className="text-xs font-semibold text-emerald-400 uppercase">
											Activo
										</span>
									</div>
									<div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center hover:bg-white/10 transition-colors">
										<span className="text-[10px] uppercase font-bold text-zinc-500 mb-1">
											iLvl
										</span>
										<span className="text-xs font-semibold text-white">
											{initialBnetData?.equipped ? (
												<>
													{initialBnetData.equipped}
													{initialBnetData.average > 0 && (
														<span className="text-zinc-500 ml-1">
															/ {initialBnetData.average}
														</span>
													)}
												</>
											) : rioData?.gear?.item_level_equipped ? (
												<>
													{rioData.gear.item_level_equipped}
													{rioData.gear.item_level_total > 0 && (
														<span className="text-zinc-500 ml-1">
															/ {rioData.gear.item_level_total}
														</span>
													)}
												</>
											) : (
												"Próx. Sinc."
											)}
										</span>
									</div>
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
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
									{activeRaids.map(([key, data]: [string, any]) => (
										<div
											key={key}
											className="bg-zinc-950/60 border border-white/5 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-colors group shadow-xl"
										>
											<div className="p-4 bg-white/[0.03] border-b border-white/5 flex flex-col gap-1">
												<Badge
													variant="outline"
													className="w-fit text-[8px] font-semibold border-blue-500/30 text-blue-400 uppercase tracking-tighter"
												>
													{getRecruitmentRaidSeasonLabel(key)}
												</Badge>
												<div className="flex justify-between items-center">
													<span className="text-[11px] font-semibold uppercase text-zinc-100 group-hover:text-blue-400 transition-colors truncate pr-2">
														{getRecruitmentRaidName(key)}
													</span>
													<span className="text-[10px] font-semibold text-rose-500">
														{formatRecruitmentRaidSummary(data)}
													</span>
												</div>
											</div>
											<div className="p-4 space-y-4">
												{/* Mythic */}
												<div className="space-y-1.5">
													<div className="flex justify-between items-center">
														<span className="text-[9px] font-semibold text-zinc-500 tracking-wider">
															MÍTICO
														</span>
														<span className="text-[11px] font-semibold text-orange-400">
															{data.mythic_bosses_killed}/{data.total_bosses}
														</span>
													</div>
													<div className="h-1.5 w-full bg-white/[0.03] rounded-full">
														<div
															className="h-full bg-linear-to-r from-orange-600 to-orange-400 rounded-full shadow-[0_0_8px_rgba(251,146,60,0.3)]"
															style={{
																width: `${(data.mythic_bosses_killed / data.total_bosses) * 100}%`,
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
															{data.heroic_bosses_killed}/{data.total_bosses}
														</span>
													</div>
													<div className="h-1.5 w-full bg-white/[0.03] rounded-full">
														<div
															className="h-full bg-linear-to-r from-purple-600 to-purple-400 rounded-full"
															style={{
																width: `${(data.heroic_bosses_killed / data.total_bosses) * 100}%`,
															}}
														/>
													</div>
												</div>
											</div>
										</div>
									))}
									{activeRaids.length === 0 && (
										<div className="col-span-full py-12 text-center bg-white/[0.01] rounded-3xl border border-dashed border-white/10">
											<div className="flex flex-col items-center gap-2">
												<IconX className="size-6 text-zinc-700" />
												<span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-[0.3em]">
													Sin registros de banda en esta temporada
												</span>
											</div>
										</div>
									)}
								</div>
							</div>

							{/* Service Buttons */}
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-white/5">
								<a
									href={`https://raider.io/characters/eu/${application.character_realm}/${application.character_name}`}
									target="_blank"
									rel="noreferrer"
									className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10 hover:bg-orange-500/10 hover:border-orange-500/30 transition-colors group"
								>
									<Image
										src="/assets/images/icons/raiderio.webp"
										alt="RIO"
										width={28}
										height={28}
										className="object-contain group-hover:scale-110 transition-transform"
									/>
									<div className="flex flex-col">
										<span className="text-[10px] font-semibold text-white uppercase tracking-widest">
											Raider.io
										</span>
										<span className="text-[8px] font-bold text-orange-400/70 uppercase">
											Perfil Completo
										</span>
									</div>
								</a>
								<a
									href={`https://www.warcraftlogs.com/character/eu/${application.character_realm}/${application.character_name}`}
									target="_blank"
									rel="noreferrer"
									className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 hover:bg-blue-500/10 hover:border-blue-500/30 transition-colors group"
								>
									<Image
										src="/assets/images/icons/wcl.webp"
										alt="WCL"
										width={28}
										height={28}
										className="object-contain group-hover:scale-110 transition-transform"
									/>
									<div className="flex flex-col">
										<span className="text-[10px] font-semibold text-white uppercase tracking-widest">
											WarcraftLogs
										</span>
										<span className="text-[8px] font-bold text-blue-400/70 uppercase">
											Logs y Rankings
										</span>
									</div>
								</a>
								<a
									href={`https://worldofwarcraft.blizzard.com/es-es/character/eu/${application.character_realm}/${application.character_name}`}
									target="_blank"
									rel="noreferrer"
									className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/20 transition-colors group"
								>
									<Image
										src="/assets/images/icons/armory.webp"
										alt="Armory"
										width={28}
										height={28}
										className="object-contain invert opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-colors"
									/>
									<div className="flex flex-col">
										<span className="text-[10px] font-semibold text-white uppercase tracking-widest">
											Armory
										</span>
										<span className="text-[8px] font-bold text-zinc-500 uppercase">
											Perfil Oficial
										</span>
									</div>
								</a>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* SEASON 2 PANEL */}
			{!loadingRio && (
				<Card className="bg-card/20 border-border/20 overflow-hidden backdrop-blur-xl border-t-2 border-t-emerald-500/50">
					<CardHeader className="py-4 px-6 border-b border-white/5 bg-white/[0.02]">
						<CardTitle className="text-xs font-semibold tracking-[0.2em] text-emerald-400 flex items-center gap-2">
							<IconSword className="size-4" /> Temporada 2 — {SEASON_2_RAID_NAME}
						</CardTitle>
					</CardHeader>
					<CardContent className="p-6">
						{season2Raid ? (
							<div className="space-y-6">
								<div className="flex items-center justify-between px-1">
									<span className="text-[10px] uppercase font-bold text-zinc-500 tracking-[0.2em]">
										Progreso
									</span>
									<span className="text-sm font-semibold text-emerald-400 tabular-nums">
										{formatRecruitmentRaidSummary(season2Raid)}
									</span>
								</div>
								<div className="space-y-1.5">
									<div className="flex justify-between items-center">
										<span className="text-[9px] font-semibold text-zinc-500 tracking-wider">
											MÍTICO
										</span>
										<span className="text-[11px] font-semibold text-orange-400">
											{season2Raid.mythic_bosses_killed}/{season2Raid.total_bosses}
										</span>
									</div>
									<div className="h-1.5 w-full bg-white/[0.03] rounded-full">
										<div
											className="h-full bg-linear-to-r from-orange-600 to-orange-400 rounded-full shadow-[0_0_8px_rgba(251,146,60,0.3)]"
											style={{
												width: `${(season2Raid.mythic_bosses_killed / (season2Raid.total_bosses || 1)) * 100}%`,
											}}
										/>
									</div>
								</div>
								<div className="space-y-1.5">
									<div className="flex justify-between items-center">
										<span className="text-[9px] font-semibold text-zinc-500 tracking-wider">
											HEROICO
										</span>
										<span className="text-[11px] font-semibold text-purple-400">
											{season2Raid.heroic_bosses_killed}/{season2Raid.total_bosses}
										</span>
									</div>
									<div className="h-1.5 w-full bg-white/[0.03] rounded-full">
										<div
											className="h-full bg-linear-to-r from-purple-600 to-purple-400 rounded-full"
											style={{
												width: `${(season2Raid.heroic_bosses_killed / (season2Raid.total_bosses || 1)) * 100}%`,
											}}
										/>
									</div>
								</div>
								<div className="space-y-1.5">
									<div className="flex justify-between items-center">
										<span className="text-[9px] font-semibold text-zinc-500 tracking-wider">
											NORMAL
										</span>
										<span className="text-[11px] font-semibold text-blue-400">
											{season2Raid.normal_bosses_killed}/{season2Raid.total_bosses}
										</span>
									</div>
									<div className="h-1.5 w-full bg-white/[0.03] rounded-full">
										<div
											className="h-full bg-linear-to-r from-blue-600 to-blue-400 rounded-full"
											style={{
												width: `${(season2Raid.normal_bosses_killed / (season2Raid.total_bosses || 1)) * 100}%`,
											}}
										/>
									</div>
								</div>
							</div>
						) : (
							<div className="py-12 text-center bg-white/[0.01] rounded-3xl border border-dashed border-white/10">
								<div className="flex flex-col items-center gap-2">
									<IconX className="size-6 text-zinc-700" />
									<span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-[0.3em]">
										Sin registros de temporada 2
									</span>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			)}

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
