"use client";

import { useMemo, useState, useReducer, useEffect } from "react";
import { Suspense } from "react";
import useSWR from "swr";
import { useSearchParams } from "next/navigation";


import { Tabs, TabsContent } from "@/shared/ui/tabs";
import { IconExternalLink } from "@/shared/ui/tabler-icons";
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

import {
	wclReducer,
	INITIAL_WCL,
	topMembersReducer,
	inspectorReducer,
	INITIAL_INSPECTOR,
} from "./stats.types";
import { fmtDateFromUnknown, EMPTY_CLASS_COLORS } from "./stats.utils";
import { WclReportsCard } from "./wcl-reports-card";
import { WclReportFightsTab, WclReportSummaryTab } from "./wcl-report-dialog-tabs";

const LOGS_PAGE_SIZE = 10;


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
					<WclReportsCard
						dispatchWcl={dispatchWcl}
						filteredWclReports={filteredWclReports}
						handleViewWclReport={handleViewWclReport}
						paginatedLogs={paginatedLogs}
						safeLogsPage={safeLogsPage}
						setLogsPage={setLogsPage}
						totalLogsPages={totalLogsPages}
						wcl={wcl}
					/>

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
									<WclReportSummaryTab classColors={classColors} members={members} wcl={wcl} />

									<WclReportFightsTab wcl={wcl} />
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
