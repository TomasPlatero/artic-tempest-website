"use client";

import { useMemo, useState, useReducer, useEffect } from "react";
import { Suspense } from "react";
import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Tabs, TabsContent } from "@/shared/ui/tabs";
import {
	IconSwords,
	IconSearch,
	IconUser,
	IconTrophy,
	IconCheck,
	IconX,
	IconExternalLink,
} from "@/shared/ui/tabler-icons";
import { cn } from "@/shared/tailwind/tailwind-utils";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/dialog";
import type { CharacterPerformancePayload } from "@/domains/stats/types/performance";

import { StatsPerformanceTab } from "./stats-performance-tab";
import { StatsTabsHeader } from "./stats-tabs-header";
import { TopMembersRankingCards } from "./stats-top-members";
import { InspectorRosterCard, InspectorDetailsCard } from "./stats-inspector";
import { WclFilterControls } from "./stats-wcl-controls";
import {
	wclReducer,
	INITIAL_WCL,
	topMembersReducer,
	inspectorReducer,
	INITIAL_INSPECTOR,
} from "./stats.types";
import {
	fmtDateFromUnknown,
	normalizeName,
	EMPTY_CLASS_COLORS,
} from "./stats.utils";

const LOGS_PAGE_SIZE = 10;

const WCL_ZONES = [
	{
		group: "Midnight",
		zones: [{ id: "46", name: "Todas las Raids (VS/DR/MQD)" }],
	},
	{
		group: "The War Within",
		zones: [
			{ id: "44", name: "Forja de Maná Omega" },
			{ id: "42", name: "Liberación de Minahonda" },
			{ id: "38", name: "Palacio Nerub'ar" },
			{ id: "40", name: "Blackrock Depths" },
		],
	},
];

async function doFetchWclReport(
	code: string,
): Promise<{ success: boolean; data?: any; error?: string }> {
	try {
		const res = await fetch("/api/wcl", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ code }),
		});
		if (!res.ok) {
			return {
				success: false,
				error: `Error fetching WCL details: ${res.status}`,
			};
		}
		const data = await res.json();
		return { success: true, data };
	} catch (e) {
		return { success: false, error: String(e) };
	}
}

async function doFetchRaiderIoProfile(
	m: any,
): Promise<{ success: boolean; data?: any; error?: string }> {
	try {
		const realm = (m.realm_slug || m.character_realm || "zuljin")
			.toLowerCase()
			.trim()
			.replace(/\s+/g, "-");
		const seasons = [
			"current",
			"previous",
			"season-tww-1",
			"season-df-4",
			"season-df-3",
			"season-df-2",
			"season-df-1",
		];
		const seasonField = `mythic_plus_scores_by_season:${seasons.join(":")}`;
		const url = `/api/raiderio?path=/characters/profile&region=eu&realm=${realm}&name=${encodeURIComponent(m.character_name.trim())}&fields=${seasonField},mythic_plus_best_runs`;
		const res = await fetch(url);
		if (!res.ok) {
			let errMsg = "Error desconocido";
			if (res.status === 404)
				errMsg = "Personaje no encontrado (puede que no haya pisado ninguna M+)";
			else if (res.status === 400 || res.status === 429) {
				const errData = await res.json().catch(() => ({}));
				errMsg = errData.message || "Error al conectar con la API de Raider.IO";
			}
			return { success: false, error: errMsg };
		}
		const data = await res.json();
		return { success: true, data };
	} catch (e: any) {
		return { success: false, error: e.message };
	}
}

function useStatsClientContent({
	members,
	classColors = EMPTY_CLASS_COLORS,
	performanceData = null,
}: {
	members: any[];
	classColors?: Record<number, string>;
	performanceData?: CharacterPerformancePayload | null;
}) {
	const searchParams = useSearchParams();
	const [activeTab, setActiveTab] = useState("wcl");

	useEffect(() => {
		const tab = searchParams.get("tab");
		let nextTab: "wcl" | "inspector" | "performance" | null = null;

		if (tab === "logs") {
			nextTab = "wcl";
		} else if (tab === "armeria" || tab === "inspector") {
			nextTab = "inspector";
		} else if (tab === "performance" || tab === "rendimiento") {
			nextTab = "performance";
		}

		// react-doctor-disable-next-line
		if (nextTab) setActiveTab(nextTab);
	}, [searchParams]);

	const [wcl, dispatchWcl] = useReducer(wclReducer, INITIAL_WCL);

	const handleViewWclReport = async (report: any) => {
		dispatchWcl({ type: "SELECT_REPORT", report });
		dispatchWcl({ type: "SET_FETCHING_DETAIL", isFetching: true });
		const result = await doFetchWclReport(report.code);
		if (result.success && result.data?.reportData?.report) {
			dispatchWcl({
				type: "SET_REPORT_DETAILS",
				details: result.data.reportData.report,
			});
		} else if (!result.success) {
			console.error(result.error);
		}
		dispatchWcl({ type: "SET_FETCHING_DETAIL", isFetching: false });
	};

	const [logsPage, setLogsPage] = useState(1);

	const filteredWclReports = useMemo(() => {
		return wcl.reports.filter((report) => {
			// Filter out empty logs (no combat segments)
			if (report.segments === 0) return false;
			// Text search filter
			return (
				report.title.toLowerCase().includes(wcl.searchQuery.toLowerCase()) ||
				report.zone?.name?.toLowerCase().includes(wcl.searchQuery.toLowerCase())
			);
		});
	}, [wcl.reports, wcl.searchQuery]);

	const totalLogsPages = Math.max(
		1,
		Math.ceil(filteredWclReports.length / LOGS_PAGE_SIZE),
	);

	const safeLogsPage = useMemo(
		() => Math.min(logsPage, totalLogsPages),
		[logsPage, totalLogsPages],
	);

	const paginatedLogs = useMemo(() => {
		const start = (safeLogsPage - 1) * LOGS_PAGE_SIZE;
		return filteredWclReports.slice(start, start + LOGS_PAGE_SIZE);
	}, [filteredWclReports, safeLogsPage]);

	const { data: wclTagsData } = useSWR(
		"/api/wcl-tags",
		async () => {
			const res = await fetch("/api/wcl", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "tags" }),
			});
			if (!res.ok) {
				throw new Error("Error al cargar tags de WCL");
			}
			const data = await res.json();
			return data?.guildData?.guild?.tags ?? [];
		},
		{ revalidateOnFocus: false },
	);

	const {
		data: wclReportsData,
		error: wclReportsError,
		isLoading: isLoadingWclReports,
	} = useSWR(
		["/api/wcl-reports", wcl.zoneFilter, wcl.tagFilter],
		async ([, zoneFilter, tagFilter]: [string, string, string]) => {
			const res = await fetch("/api/wcl", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					zoneID: zoneFilter !== "all" ? zoneFilter : undefined,
					guildTagID: tagFilter !== "all" ? tagFilter : undefined,
				}),
			});
			if (!res.ok) {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.error || "Error al cargar datos de WCL");
			}
			const data = await res.json();
			return data?.reportData?.reports?.data ?? [];
		},
		{ revalidateOnFocus: false },
	);

	// react-doctor-disable-next-line
	useEffect(() => {
		if (Array.isArray(wclTagsData)) {
			dispatchWcl({ type: "SET_TAGS", tags: wclTagsData });
		}
	}, [wclTagsData]);

	// react-doctor-disable-next-line
	useEffect(() => {
		dispatchWcl({ type: "SET_LOADING", isLoading: isLoadingWclReports });
		if (wclReportsError) {
			dispatchWcl({ type: "SET_ERROR", error: wclReportsError.message });
		} else {
			dispatchWcl({ type: "SET_ERROR", error: null });
		}
		if (Array.isArray(wclReportsData)) {
			dispatchWcl({ type: "SET_REPORTS", reports: wclReportsData });
		}
	}, [isLoadingWclReports, wclReportsData, wclReportsError]);

	const [searchQuery, setSearchQuery] = useState("");
	const [topMembers, dispatchTopMembers] = useReducer(topMembersReducer, {
		members: [],
		isLoading: true,
	});

	// Filter members based on search
	const filteredMembers = useMemo(() => {
		return members
			.filter((m) =>
				m.character_name.toLowerCase().includes(searchQuery.toLowerCase()),
			)
			.toSorted((a, b) => a.character_name.localeCompare(b.character_name));
	}, [members, searchQuery]);

	const [inspector, dispatchInspector] = useReducer(
		inspectorReducer,
		INITIAL_INSPECTOR,
	);

	const { data: topMembersData, isLoading: isLoadingTopMembers } = useSWR(
		members.length > 0 ? ["top-members", members] : null,
		async () => {
			const membersToFetch = members.slice(0, 15);
			const scores = await Promise.all(
				membersToFetch.map(async (m) => {
					try {
						const res = await fetch(
							`/api/raiderio?path=/characters/profile&region=eu&realm=${m.realm_slug}&name=${encodeURIComponent(m.character_name)}&fields=mythic_plus_scores_by_season:current`,
						);
						if (!res.ok) return null;
						const data = await res.json();
						return {
							...m,
							score: data.mythic_plus_scores_by_season?.[0]?.scores?.all || 0,
							color:
								data.mythic_plus_scores_by_season?.[0]?.segments?.all?.color ||
								"#ffffff",
						};
					} catch {
						return null;
					}
				}),
			);

			return (scores.filter(Boolean) as any[])
				.toSorted((a, b) => b.score - a.score)
				.slice(0, 3);
		},
		{ revalidateOnFocus: false },
	);

	useEffect(() => {
		dispatchTopMembers({ type: "SET_LOADING", isLoading: isLoadingTopMembers });
		if (Array.isArray(topMembersData)) {
			dispatchTopMembers({ type: "SET_MEMBERS", members: topMembersData });
		}
	}, [isLoadingTopMembers, topMembersData]);

	const handleInspectMember = async (m: any) => {
		dispatchInspector({ type: "INSPECT_START", member: m });
		const result = await doFetchRaiderIoProfile(m);
		if (result.success && result.data) {
			dispatchInspector({ type: "INSPECT_SUCCESS", data: result.data });
		} else {
			dispatchInspector({
				type: "INSPECT_ERROR",
				error: result.error || "Error desconocido",
			});
		}
	};

	return (
		<div className="flex flex-col gap-6 px-4 lg:px-6">
			<div>
				<h1 className="text-2xl font-semibold">Logs y Armería Míticas Plus</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Consulta los logs recientes de la hermandad, la armería individual de
					Míticas Plus y el rendimiento del personaje principal.
				</p>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<StatsTabsHeader />

				{/* --- PESTAÑA: WARCRAFT LOGS --- */}
				<TabsContent
					value="wcl"
					className="space-y-6 animate-in fade-in-50 mb-10"
					data-tour-step="stats-logs-panel"
				>
					<Card className="border-border/40 shadow-sm bg-card/60 pt-0 overflow-hidden">
						<CardHeader className="border-b bg-muted/20 pb-6 pt-6">
							<div className="flex flex-col items-center justify-center gap-4 md:gap-5">
								<div className="gap-y-1 text-center flex flex-col items-center">
									<div className="flex items-center justify-center gap-2">
										<CardTitle className="text-base md:text-lg">
											Rendimiento en WarcraftLogs
										</CardTitle>
									</div>
									<CardDescription className="text-[10px] md:text-xs max-w-[280px] md:max-w-none">
										Accede a los últimos reportes y análisis de combate de la hermandad.
									</CardDescription>
								</div>
								<WclFilterControls
									wcl={wcl}
									zones={WCL_ZONES}
									onZoneChange={(v) =>
										dispatchWcl({ type: "SET_ZONE_FILTER", filter: v })
									}
									onTagChange={(v) => dispatchWcl({ type: "SET_TAG_FILTER", filter: v })}
									onSearchChange={(v) =>
										dispatchWcl({ type: "SET_SEARCH_QUERY", query: v })
									}
								/>
							</div>
						</CardHeader>
						<CardContent className="p-4 sm:p-6 min-h-[400px]">
							{wcl.isLoading ? (
								<div className="flex flex-col size-full min-h-[300px] items-center justify-center text-sm text-muted-foreground gap-4 animate-pulse">
									<div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
									Cargando reportes de WCL…
								</div>
							) : wcl.error ? (
								<div className="flex size-full min-h-[300px] items-center justify-center text-sm text-red-500/80 bg-red-500/5 rounded-xl border border-red-500/10 p-8 text-center flex-col gap-2">
									<IconUser className="size-10 opacity-20" />
									{wcl.error}
								</div>
							) : filteredWclReports.length === 0 ? (
								<div className="flex flex-col size-full min-h-[300px] items-center justify-center text-sm text-muted-foreground gap-2">
									<IconSearch className="size-10 opacity-10" />
									<p className="italic">
										No se encontraron reportes
										{wcl.searchQuery && ` para "${wcl.searchQuery}"`}
									</p>
								</div>
							) : (
								<div className="flex flex-col divide-y divide-border/10">
									{paginatedLogs.map((report: any) => (
										<button
											type="button"
											key={report.code}
											onClick={() => void handleViewWclReport(report)}
											className="w-full appearance-none text-left flex flex-col md:flex-row md:items-center gap-2 md:gap-4 px-4 py-4 md:py-3 cursor-pointer hover:bg-blue-500/5 transition-colors group"
										>
											<div className="flex items-center gap-3 flex-1 min-w-0">
												<IconSwords className="size-4 text-muted-foreground/30 group-hover:text-blue-500/60 transition-colors shrink-0" />
												<span className="font-semibold text-sm group-hover:text-blue-400 transition-colors truncate">
													{report.title}
												</span>
											</div>
											<div className="flex items-center justify-between md:justify-end gap-2 md:gap-3 pl-7 md:pl-0">
												<div className="flex items-center gap-1.5 shrink-0">
													<Badge
														variant="secondary"
														className="bg-background/80 text-[9px] md:text-[10px] font-semibold text-muted-foreground/80 py-0 px-1.5 whitespace-nowrap"
													>
														{report.zone?.name || "Desconocido"}
													</Badge>
													{report.guildTag?.name && (
														<Badge
															variant="outline"
															className="text-[9px] md:text-[10px] font-semibold py-0 px-1.5 border-blue-500/30 text-blue-400/80 whitespace-nowrap"
														>
															{report.guildTag.name}
														</Badge>
													)}
												</div>
												<span className="text-[9px] md:text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-wider w-auto md:w-20 text-right">
													{fmtDateFromUnknown(report.startTime)}
												</span>
											</div>
										</button>
									))}
								</div>
							)}

							{/* Paginación */}
							{!wcl.isLoading &&
								!wcl.error &&
								filteredWclReports.length > 0 &&
								totalLogsPages > 1 && (
									<div className="flex items-center justify-between px-4 py-3 border-t border-border/10">
										<span className="text-[10px] text-muted-foreground/50 font-semibold">
											{filteredWclReports.length} reportes
										</span>
										<div className="flex items-center gap-2">
											<button
												type="button"
												disabled={safeLogsPage <= 1}
												onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
												className="px-3 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wider  disabled:opacity-30 disabled:cursor-not-allowed bg-background/50 border border-border/30 hover:bg-muted/50 text-muted-foreground/70"
											>
												Anterior
											</button>
											<span className="text-[10px] font-semibold text-muted-foreground/50 px-1 tabular-nums">
												{safeLogsPage} / {totalLogsPages}
											</span>
											<button
												type="button"
												disabled={safeLogsPage >= totalLogsPages}
												onClick={() => setLogsPage((p) => p + 1)}
												className="px-3 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wider  disabled:opacity-30 disabled:cursor-not-allowed bg-background/50 border border-border/30 hover:bg-muted/50 text-muted-foreground/70"
											>
												Siguiente
											</button>
										</div>
									</div>
								)}
						</CardContent>
					</Card>

					{/* WCL REPORT MODAL */}
					<Dialog
						open={!!wcl.selectedReport}
						onOpenChange={(open) =>
							!open && dispatchWcl({ type: "SELECT_REPORT", report: null })
						}
					>
						<DialogContent className="max-w-[95vw] sm:max-w-[95vw] bg-zinc-950 border-border/40 max-h-[85vh] flex flex-col p-0 overflow-hidden">
							<DialogHeader className="p-6 pb-4 border-b border-border/10 bg-blue-500/5">
								<div className="flex items-center justify-between pr-4">
									<div>
										<DialogTitle className="text-xl font-semibold text-blue-400 capitalize">
											{wcl.selectedReport?.title}
										</DialogTitle>
										<DialogDescription className="text-xs mt-1">
											{wcl.selectedReport?.zone?.name} •{" "}
											{wcl.selectedReport &&
												fmtDateFromUnknown(wcl.selectedReport.startTime)}
											{wcl.reportDetails?.owner?.name && (
												<>
													{" "}
													• Creado por{" "}
													<span className="text-blue-400/70 font-semibold">
														{wcl.reportDetails.owner.name}
													</span>
												</>
											)}
										</DialogDescription>
									</div>
									{wcl.selectedReport && (
										<a
											href={`https://www.warcraftlogs.com/reports/${wcl.selectedReport.code}`}
											target="_blank"
											rel="noreferrer"
											className="h-8 px-3 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-semibold flex items-center gap-2 "
										>
											<IconExternalLink className="size-3" />
											LOG COMPLETO
										</a>
									)}
								</div>
							</DialogHeader>

							{/* TAB BAR */}
							<div className="flex border-b border-border/10 px-6">
								<button
									type="button"
									onClick={() => dispatchWcl({ type: "SET_MODAL_TAB", tab: "sumario" })}
									className={cn(
										"px-4 py-2.5 text-xs font-semibold uppercase tracking-widest  border-b-2 -mb-px",
										wcl.modalTab === "sumario"
											? "text-blue-400 border-blue-500"
											: "text-muted-foreground/50 border-transparent hover:text-muted-foreground",
									)}
								>
									Sumario
								</button>
								<button
									type="button"
									onClick={() => dispatchWcl({ type: "SET_MODAL_TAB", tab: "intentos" })}
									className={cn(
										"px-4 py-2.5 text-xs font-semibold uppercase tracking-widest  border-b-2 -mb-px",
										wcl.modalTab === "intentos"
											? "text-blue-400 border-blue-500"
											: "text-muted-foreground/50 border-transparent hover:text-muted-foreground",
									)}
								>
									Intentos
								</button>
							</div>

							<div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
								{wcl.isFetchingDetail ? (
									<div className="flex flex-col items-center justify-center py-12 gap-4 animate-pulse">
										<div className="size-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
										<p className="text-xs text-muted-foreground uppercase font-semibold tracking-widest">
											Analizando combates…
										</p>
									</div>
								) : wcl.reportDetails ? (
									<div className="space-y-6">
										{wcl.modalTab === "sumario" && (
											<>
												{/* GROUP COMPOSITION */}
												{wcl.reportDetails.playerDetails?.data?.playerDetails &&
													(() => {
														const pd = wcl.reportDetails.playerDetails.data.playerDetails;
														const tanks = pd.tanks || [];
														const healersList = pd.healers || [];
														const dpsList = pd.dps || [];
														if (
															tanks.length === 0 &&
															healersList.length === 0 &&
															dpsList.length === 0
														)
															return null;
														return (
															<div className="rounded-lg border border-border/10 bg-background/30 p-4">
																<h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-3">
																	Composición del grupo
																</h3>
																<div className="flex flex-col gap-2">
																	{tanks.length > 0 && (
																		<div className="flex items-center gap-2 flex-wrap">
																			<span className="text-[10px] font-semibold uppercase tracking-widest text-blue-400/60 w-16 shrink-0">
																				Tanks:
																			</span>
																			{tanks.map((p: any) => (
																				<Badge
																					key={p.name}
																					variant="outline"
																					className="text-[10px] font-semibold py-0 px-1.5 border-blue-500/20 text-blue-300/70"
																				>
																					{p.name}
																				</Badge>
																			))}
																		</div>
																	)}
																	{healersList.length > 0 && (
																		<div className="flex items-center gap-2 flex-wrap">
																			<span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400/60 w-16 shrink-0">
																				Healers:
																			</span>
																			{healersList.map((p: any) => (
																				<Badge
																					key={p.name}
																					variant="outline"
																					className="text-[10px] font-semibold py-0 px-1.5 border-emerald-500/20 text-emerald-300/70"
																				>
																					{p.name}
																				</Badge>
																			))}
																		</div>
																	)}
																	{dpsList.length > 0 && (
																		<div className="flex items-center gap-2 flex-wrap">
																			<span className="text-[10px] font-semibold uppercase tracking-widest text-red-400/60 w-16 shrink-0">
																				DPS:
																			</span>
																			{dpsList.map((p: any) => (
																				<Badge
																					key={p.name}
																					variant="outline"
																					className="text-[10px] font-semibold py-0 px-1.5 border-red-500/20 text-red-300/70"
																				>
																					{p.name}
																				</Badge>
																			))}
																		</div>
																	)}
																</div>
															</div>
														);
													})()}

												{/* DAMAGE & HEALING TABLES */}
												{(wcl.reportDetails.damageDone?.data?.entries?.length > 0 ||
													wcl.reportDetails.healingDone?.data?.entries?.length > 0) &&
													(() => {
														const fmt = (n: number) =>
															n >= 1000000
																? (n / 1000000).toFixed(2) + "m"
																: n >= 1000
																	? (n / 1000).toFixed(1) + "k"
																	: n.toFixed(0);
														const duration =
															(wcl.reportDetails.damageDone?.data?.totalTime ||
																wcl.reportDetails.healingDone?.data?.totalTime ||
																wcl.reportDetails.endTime - wcl.reportDetails.startTime) / 1000;
														const dmgSorted = (
															wcl.reportDetails.damageDone?.data?.entries || []
														).toSorted((a: any, b: any) => b.total - a.total);
														const healSorted = (
															wcl.reportDetails.healingDone?.data?.entries || []
														).toSorted((a: any, b: any) => b.total - a.total);
														const wclClassColors: Record<string, string> = {
															DeathKnight: "#C41E3A",
															DemonHunter: "#A330C9",
															Druid: "#FF7C0A",
															Evoker: "#33937F",
															Hunter: "#AAD372",
															Mage: "#3FC7EB",
															Monk: "#00FF98",
															Paladin: "#F48CBA",
															Priest: "#FFFFFF",
															Rogue: "#FFF468",
															Shaman: "#0070DD",
															Warlock: "#8788EE",
															Warrior: "#C69B6D",
														};
														const getColor = (type?: string, fallbackClassId?: number) =>
															(type ? wclClassColors[type] : undefined) ||
															(fallbackClassId ? classColors[fallbackClassId] : undefined) ||
															"#888888";

														const mergeRosterRows = (entries: any[]) => {
															const entryMap = new Map(
																entries.map((entry) => [
																	normalizeName(entry.name ?? ""),
																	entry,
																]),
															);

															return members
																.map((member) => {
																	const reportEntry = entryMap.get(
																		normalizeName(member.character_name),
																	);
																	const total = reportEntry?.total ?? 0;
																	const type = reportEntry?.type
																		? String(reportEntry.type)
																		: undefined;

																	return {
																		name: member.character_name,
																		total,
																		type,
																		classId: member.class_id,
																		color: getColor(type, member.class_id),
																	};
																})
																.toSorted((a, b) => {
																	if (b.total !== a.total) {
																		return b.total - a.total;
																	}
																	return a.name.localeCompare(b.name);
																});
														};

														const dmgRows = mergeRosterRows(dmgSorted);
														const healRows = mergeRosterRows(healSorted);

														const renderTable = (
															entries: any[],
															label: string,
															icon: React.ReactNode,
															metricLabel: string,
														) => (
															<div>
																<h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-3 flex items-center gap-2">
																	{icon} {label}
																</h3>
																<div className="rounded-lg border border-border/10 overflow-hidden">
																	<div className="grid grid-cols-[1fr_90px_80px] text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/40 px-3 py-1.5 border-b border-border/10 bg-muted/5">
																		<span>Nombre</span>
																		<span className="text-right">Cantidad</span>
																		<span className="text-right">{metricLabel}</span>
																	</div>
																	{entries.map((entry: any) => {
																		const maxTotal = entries[0]?.total || 1;
																		const pct = (entry.total / maxTotal) * 100;
																		return (
																			<div
																				key={entry.name}
																				className="relative grid grid-cols-[1fr_90px_80px] items-center px-3 py-1.5 text-xs"
																			>
																				<div
																					className="absolute inset-0 opacity-15"
																					style={{
																						width: `${pct}%`,
																						backgroundColor: entry.color,
																					}}
																				/>
																				<span
																					className="relative font-semibold truncate"
																					style={{ color: entry.color }}
																				>
																					{entry.name}
																				</span>
																				<span className="relative text-right text-[10px] font-semibold text-muted-foreground/60 tabular-nums">
																					{fmt(entry.total)}
																				</span>
																				<span className="relative text-right text-[10px] font-semibold text-muted-foreground/80 tabular-nums">
																					{fmt(entry.total / duration)}
																				</span>
																			</div>
																		);
																	})}
																</div>
															</div>
														);

														return (
															<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
																{dmgSorted.length > 0 &&
																	renderTable(
																		dmgRows,
																		"Daño hecho por fuente",
																		<IconSwords className="size-3.5" />,
																		"DPS",
																	)}
																{healSorted.length > 0 &&
																	renderTable(
																		healRows,
																		"Sanación hecha por fuente",
																		<IconTrophy className="size-3.5" />,
																		"HPS",
																	)}
															</div>
														);
													})()}
											</>
										)}

										{wcl.modalTab === "intentos" && (
											<div className="grid grid-cols-1 gap-2">
												{wcl.reportDetails.fights && wcl.reportDetails.fights.length > 0 ? (
													wcl.reportDetails.fights.map((fight: any) => (
														<a
															href={`https://www.warcraftlogs.com/reports/${wcl.selectedReport?.code}#fight=${fight.id}`}
															target="_blank"
															rel="noreferrer"
															key={fight.id}
															className="flex items-center justify-between p-3 rounded-lg border border-border/10 bg-background/40 group hover:border-blue-500/30 hover:bg-blue-500/[0.03] "
														>
															<div className="flex items-center gap-3">
																<div
																	className={cn(
																		"size-6 rounded-md flex items-center justify-center text-[10px] font-semibold",
																		fight.kill
																			? "bg-emerald-500/20 text-emerald-400"
																			: "bg-red-500/20 text-red-400",
																	)}
																>
																	{fight.kill ? (
																		<IconCheck className="size-3.5" />
																	) : (
																		<IconX className="size-3.5" />
																	)}
																</div>
																<div className="flex flex-col">
																	<div className="flex items-center gap-2">
																		<span className="text-sm font-semibold group-hover:text-blue-400 transition-colors">
																			{fight.name}
																		</span>
																		<IconExternalLink className="size-3 opacity-0 group-hover:opacity-40 transition-opacity" />
																	</div>
																	<span className="text-[10px] uppercase font-semibold text-muted-foreground/50 tracking-tighter">
																		{fight.difficulty === 3
																			? "Normal"
																			: fight.difficulty === 4
																				? "Heroico"
																				: fight.difficulty === 5
																					? "Mítico"
																					: "Buscador"}
																	</span>
																</div>
															</div>

															<div className="flex items-center gap-4">
																{!fight.kill && (
																	<div className="flex flex-col items-end">
																		<span className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-tighter">
																			Mejor Intento
																		</span>
																		<span className="text-xs font-semibold text-red-400/80">
																			{(fight.fightPercentage / 100).toFixed(1)}%
																		</span>
																	</div>
																)}
																{fight.kill && (
																	<Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[9px] font-semibold uppercase">
																		Derrotado
																	</Badge>
																)}
															</div>
														</a>
													))
												) : (
													<div className="text-center py-8 text-xs text-muted-foreground italic">
														No se encontraron combates registrados.
													</div>
												)}
											</div>
										)}
									</div>
								) : (
									<div className="text-center py-12 text-sm text-red-400">
										Error al cargar el sumario.
									</div>
								)}
							</div>
						</DialogContent>
					</Dialog>
				</TabsContent>

				{/* --- PESTAÑA: INSPECTOR M+ --- */}
				<TabsContent
					value="inspector"
					className="space-y-6 animate-in fade-in-50 mb-10"
					data-tour-step="stats-armory-panel"
				>
					<TopMembersRankingCards
						topMembers={topMembers}
						classColors={classColors}
						onInspectMember={(member) => void handleInspectMember(member)}
					/>

					<div className="grid gap-6 md:grid-cols-12 items-start">
						<InspectorRosterCard
							filteredMembers={filteredMembers}
							selectedMemberName={inspector.selectedMember?.character_name ?? null}
							searchQuery={searchQuery}
							classColors={classColors}
							onSearchChange={setSearchQuery}
							onInspectMember={(member) => void handleInspectMember(member)}
						/>

						<InspectorDetailsCard
							inspector={inspector}
							fmtDateFromUnknown={fmtDateFromUnknown}
						/>
					</div>
				</TabsContent>

				<TabsContent
					value="performance"
					className="space-y-6 animate-in fade-in-50 mb-10"
					data-tour-step="stats-performance-panel"
				>
					<StatsPerformanceTab performanceData={performanceData} />
				</TabsContent>
			</Tabs>
		</div>
	);
}

export function StatsClient(props: {
	members: any[];
	classColors?: Record<number, string>;
	performanceData?: CharacterPerformancePayload | null;
}) {
	return <Suspense fallback={null}>{useStatsClientContent(props)}</Suspense>;
}
