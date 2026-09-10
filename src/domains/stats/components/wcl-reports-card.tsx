// Extracted from stats-client.tsx (ATW-20).

import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { IconSwords, IconSearch, IconUser } from "@/shared/ui/tabler-icons";
import { WclFilterControls } from "./stats-wcl-controls";
import { fmtDateFromUnknown } from "./stats.utils";

type WclReportsCardProps = {
	dispatchWcl: any;
	filteredWclReports: any;
	handleViewWclReport: any;
	paginatedLogs: any;
	safeLogsPage: number;
	setLogsPage: any;
	totalLogsPages: number;
	wcl: any;
};

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

export function WclReportsCard({
	dispatchWcl,
	filteredWclReports,
	handleViewWclReport,
	paginatedLogs,
	safeLogsPage,
	setLogsPage,
	totalLogsPages,
	wcl,
}: WclReportsCardProps) {
	return (
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
									onClick={() => setLogsPage((p: any) => Math.max(1, p - 1))}
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
									onClick={() => setLogsPage((p: any) => p + 1)}
									className="px-3 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wider  disabled:opacity-30 disabled:cursor-not-allowed bg-background/50 border border-border/30 hover:bg-muted/50 text-muted-foreground/70"
								>
									Siguiente
								</button>
							</div>
						</div>
					)}
			</CardContent>
		</Card>
	);
}
