// Extracted from stats-client.tsx (ATW-20).

import { Badge } from "@/shared/ui/badge";
import {
	IconSwords,
	IconTrophy,
	IconCheck,
	IconX,
	IconExternalLink,
} from "@/shared/ui/tabler-icons";
import { cn } from "@/shared/tailwind/tailwind-utils";
import { normalizeName } from "./stats.utils";

type WclReportSummaryTabProps = {
	classColors: any;
	members: any;
	wcl: any;
};

export function WclReportSummaryTab({
	classColors,
	members,
	wcl,
}: WclReportSummaryTabProps) {
	return (
		<>
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
								entries.map((entry) => [normalizeName(entry.name ?? ""), entry]),
							);

							return members
								.map((member: any) => {
									const reportEntry = entryMap.get(normalizeName(member.character_name));
									const total = reportEntry?.total ?? 0;
									const type = reportEntry?.type ? String(reportEntry.type) : undefined;

									return {
										name: member.character_name,
										total,
										type,
										classId: member.class_id,
										color: getColor(type, member.class_id),
									};
								})
								.toSorted((a: any, b: any) => {
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
		</>
	);
}

type WclReportFightsTabProps = {
	wcl: any;
};

export function WclReportFightsTab({ wcl }: WclReportFightsTabProps) {
	return (
		<>
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
		</>
	);
}
