"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { IconSearch, IconChartBar } from "@/shared/ui/tabler-icons";
import { Input } from "@/shared/ui/input";
import Image from "next/image";
import { cn } from "@/shared/tailwind/tailwind-utils";
import type { InspectorState } from "./stats.types";

export function InspectorRosterCard({
	filteredMembers,
	selectedMemberName,
	searchQuery,
	classColors,
	onSearchChange,
	onInspectMember,
}: {
	filteredMembers: any[];
	selectedMemberName: string | null;
	searchQuery: string;
	classColors: Record<number, string>;
	onSearchChange: (value: string) => void;
	onInspectMember: (member: any) => void;
}) {
	return (
		<Card className="md:col-span-4 lg:col-span-3 border-border/40 shadow-sm bg-card/60 flex flex-col max-h-[700px] pt-0 overflow-hidden">
			<CardHeader className="pt-4 border-b bg-muted/20 pb-3 space-y-3">
				<div className="flex flex-col gap-1 text-center items-center">
					<CardTitle className="text-base text-foreground/80">Roster</CardTitle>
					<CardDescription className="text-xs">
						Busca e inspecciona un jugador
					</CardDescription>
				</div>
				<div className="relative">
					<IconSearch className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
					<Input
						placeholder="Buscar personaje…"
						className="pl-9 h-9 bg-background/50 border-border/40 text-xs"
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
					/>
				</div>
			</CardHeader>
			<CardContent className="p-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
				<div className="flex flex-col">
					{filteredMembers.length > 0 ? (
						filteredMembers.map((m) => (
							<button
								type="button"
								key={m.id || m.character_name}
								onClick={() => onInspectMember(m)}
								className={`flex items-center gap-3 px-4 py-3 text-left border-b border-border/20 hover:bg-muted/50  group ${selectedMemberName === m.character_name ? "bg-primary/10 border-l-4 border-l-primary" : "border-l-4 border-l-transparent"}`}
							>
								<div className="size-8 rounded-full border border-border/40 flex items-center justify-center bg-muted/30 group-hover:bg-primary/20 transition-colors shrink-0">
									<Image
										src={`/assets/images/classes/${m.class_id}.webp`}
										alt=""
										width={24}
										height={24}
										className="rounded-full"
									/>
								</div>
								<div className="flex flex-col min-w-0">
									<span
										className={cn(
											"font-semibold text-sm truncate",
											!classColors[m.class_id ?? 0]?.startsWith("#") &&
												classColors[m.class_id ?? 0],
										)}
										style={
											classColors[m.class_id ?? 0]?.startsWith("#")
												? { color: classColors[m.class_id ?? 0] }
												: {}
										}
									>
										{m.character_name}
									</span>
									<span className="text-[10px] uppercase font-semibold text-muted-foreground/60">
										{m.role || m.character_realm}
									</span>
								</div>
							</button>
						))
					) : (
						<div className="p-8 text-center text-xs text-muted-foreground italic">
							No se encontraron miembros
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

function resolveInspectorTitle(inspector: InspectorState) {
	return inspector.selectedMember
		? inspector.selectedMember.character_name
		: "Armería";
}

function resolveInspectorHint(inspector: InspectorState) {
	return inspector.selectedMember
		? ""
		: "Selecciona un jugador del panel izquierdo";
}

function resolveInspectorViewState(inspector: InspectorState) {
	if (!inspector.selectedMember) return "empty";
	if (inspector.isInspecting) return "loading";
	if (inspector.error) return "error";
	if (inspector.characterData) return "ready";
	return "blank";
}

function SelectedMemberBadge({
	member,
}: {
	member: InspectorState["selectedMember"];
}) {
	if (!member) return null;
	return (
		<Badge
			variant="outline"
			className="text-xs ml-2 opacity-70 border-border/50"
		>
			{member.character_realm}
		</Badge>
	);
}

function InspectorProfileLink({ inspector }: { inspector: InspectorState }) {
	if (!inspector.selectedMember || !inspector.characterData) return null;
	return (
		<a
			href={inspector.characterData.profile_url}
			target="_blank"
			rel="noreferrer"
			className="text-xs text-primary hover:underline"
		>
			Ver Perfil Completo &rarr;
		</a>
	);
}

export function InspectorDetailsCard({
	inspector,
	fmtDateFromUnknown,
}: {
	inspector: InspectorState;
	fmtDateFromUnknown: (value: string | number | Date) => string;
}) {
	const viewState = resolveInspectorViewState(inspector);

	return (
		<Card className="md:col-span-8 lg:col-span-9 border-border/40 shadow-sm bg-card/60 flex flex-col min-h-[500px] pt-0 overflow-hidden">
			<CardHeader className="pt-4 pb-4 border-b bg-muted/20">
				<div className="flex flex-col md:flex-row items-center justify-between gap-2 text-center md:text-left">
					<div className="flex flex-col items-center md:items-start">
						<CardTitle className="text-lg text-foreground/80 flex items-center justify-center md:justify-start gap-2">
							{resolveInspectorTitle(inspector)}
							<SelectedMemberBadge member={inspector.selectedMember} />
						</CardTitle>
						<CardDescription className="text-xs mt-1">
							{resolveInspectorHint(inspector)}
						</CardDescription>
					</div>
					<InspectorProfileLink inspector={inspector} />
				</div>
			</CardHeader>
			<CardContent className="p-6">
				{viewState === "empty" && (
					<div className="flex flex-col items-center justify-center h-full min-h-[300px] text-muted-foreground gap-2">
						<IconChartBar className="size-10 opacity-20" />
						<p>Selecciona un miembro para ver su Mythic+ Score</p>
					</div>
				)}
				{viewState === "loading" && (
					<div className="flex items-center justify-center h-full min-h-[300px] text-muted-foreground animate-pulse">
						Consultando Raider.IO…
					</div>
				)}
				{viewState === "error" && (
					<div className="flex items-center justify-center h-full min-h-[300px] text-red-400">
						{inspector.error}
					</div>
				)}
				{viewState === "ready" && (
					<div className="flex flex-col gap-6 animate-in fade-in-50">
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<div className="flex flex-col p-4 rounded-xl bg-muted/20 border border-border/50 items-center justify-center text-center">
								<span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
									M+ Score
								</span>
								<span
									className="text-3xl font-semibold"
									style={{
										color:
											inspector.characterData.mythic_plus_scores_by_season[0]
												?.segments?.all?.color || "inherit",
									}}
								>
									{Math.round(
										inspector.characterData.mythic_plus_scores_by_season[0]
											?.scores?.all || 0,
									)}
								</span>
							</div>
							<div className="flex flex-col p-4 rounded-xl bg-muted/20 border border-border/50 items-center justify-center text-center">
								<span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
									Clase
								</span>
								<span className="text-lg font-semibold">
									{inspector.characterData.class}
								</span>
							</div>
							<div className="flex flex-col p-4 rounded-xl bg-muted/20 border border-border/50 items-center justify-center text-center">
								<span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
									Rol Activo
								</span>
								<span className="text-lg font-semibold">
									{inspector.characterData.active_spec_role}
								</span>
							</div>
							<div className="flex flex-col p-4 rounded-xl bg-muted/20 border border-border/50 items-center justify-center text-center">
								<span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
									Espec.
								</span>
								<span className="text-lg font-semibold">
									{inspector.characterData.active_spec_name}
								</span>
							</div>
						</div>
						{inspector.characterData.mythic_plus_best_runs &&
							inspector.characterData.mythic_plus_best_runs.length > 0 && (
								<div className="mt-4">
									<h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
										Mejores Míticas Completadas
									</h3>
									<div className="grid md:grid-cols-2 gap-3">
										{inspector.characterData.mythic_plus_best_runs.map(
											(run: any) => (
												<a
													key={`${run.short_name}-${run.completed_at}`}
													href={run.url}
													target="_blank"
													rel="noreferrer"
													aria-label={`Mítica +${run.mythic_level}: ${run.short_name}`}
													className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-card hover:bg-muted/30 transition-colors"
												>
													<div className="flex flex-col">
														<span className="font-semibold text-sm">
															{run.short_name}
														</span>
														<span className="text-xs text-muted-foreground">
															{fmtDateFromUnknown(run.completed_at)}
														</span>
													</div>
													<div className="flex items-center gap-3">
														<span
															className={`text-sm font-semibold ${run.num_keystone_upgrades > 0 ? "text-green-500" : "text-muted-foreground"}`}
														>
															+{run.mythic_level}{" "}
															{run.num_keystone_upgrades > 0 &&
																`(+${run.num_keystone_upgrades})`}
														</span>
													</div>
												</a>
											),
										)}
									</div>
								</div>
							)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
