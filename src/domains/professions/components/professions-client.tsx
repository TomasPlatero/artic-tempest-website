"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
	IconArrowsSort,
	IconSearch,
	IconSparkles,
	IconUsers,
} from "@/shared/ui/tabler-icons";
import { AdminPageHeader } from "@/shared/components/admin-page-header";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/ui/table";
import { cn } from "@/shared/tailwind/tailwind-utils";
import type {
	ProfessionEntry,
	ProfessionMember,
} from "@/domains/professions/lib/server";

const CURRENT_MAX_CHARACTER_LEVEL = 80;
const PAGE_SIZE = 20;

type ProfessionOption = {
	slug: string;
	label: string;
	iconUrl: string;
};

type Props = {
	members: ProfessionMember[];
	professionOptions: ProfessionOption[];
};

type SortKey = "name" | "level" | "profession" | "progress";

function progressPercent(skillPoints: number, maxSkillPoints: number) {
	if (!maxSkillPoints) return 0;
	return Math.max(
		0,
		Math.min(100, Math.round((skillPoints / maxSkillPoints) * 100)),
	);
}

export function ProfessionsClient(props: Props) {
	return useProfessionsClient(props);
}

function useProfessionsClient({ members, professionOptions }: Props) {
	const [filters, setFilters] = useState({
		query: "",
		selectedProfession: "all",
		memberType: "all" as "all" | "mains" | "alts",
		onlyMaxedProfession: false,
		onlyMaxLevel: false,
		sortKey: "name" as SortKey,
		currentPage: 1,
	});
	const [, startTransition] = useTransition();

	const setFilter = (
		updater: (prev: typeof filters) => Partial<typeof filters>,
	) => {
		setFilters((prev) => ({ ...prev, ...updater(prev), currentPage: 1 }));
	};

	const filteredMembers = (() => {
		const normalizedQuery = filters.query.trim().toLowerCase();

		return members.reduce(
			(acc, member) => {
				const visibleProfessions = member.professions
					.filter(
						(profession) =>
							profession.isPrimary &&
							(() => {
								if (
									filters.selectedProfession !== "all" &&
									profession.slug !== filters.selectedProfession
								) {
									return false;
								}

								if (filters.onlyMaxedProfession && !profession.isMaxed) {
									return false;
								}

								return true;
							})(),
					)
					.sort((a, b) => a.label.localeCompare(b.label, "es"));

				const enrichedMember = {
					...member,
					visibleProfessions,
				};

				if (filters.memberType === "mains" && !enrichedMember.isMain)
					return acc;
				if (filters.memberType === "alts" && enrichedMember.isMain) return acc;
				if (
					filters.onlyMaxLevel &&
					enrichedMember.level < CURRENT_MAX_CHARACTER_LEVEL
				) {
					return acc;
				}

				if (enrichedMember.visibleProfessions.length === 0) return acc;

				if (normalizedQuery) {
					const haystack = [
						enrichedMember.characterName,
						enrichedMember.rankName,
						enrichedMember.className,
						...enrichedMember.visibleProfessions.map(
							(profession) => profession.label,
						),
					]
						.join(" ")
						.toLowerCase();

					if (!haystack.includes(normalizedQuery)) return acc;
				}

				acc.push(enrichedMember);
				return acc;
			},
			[] as Array<ProfessionMember & { visibleProfessions: ProfessionEntry[] }>,
		);
	})();

	const maxedCount = filteredMembers.filter((member) =>
		member.visibleProfessions.some((profession) => profession.isMaxed),
	).length;

	const rows = filteredMembers
		.map((member) => {
			const primaryOne = member.visibleProfessions[0] || null;
			const primaryTwo = member.visibleProfessions[1] || null;
			const bestProgress = Math.max(
				...member.visibleProfessions.map((profession) =>
					progressPercent(profession.skillPoints, profession.maxSkillPoints),
				),
				0,
			);

			return {
				...member,
				primaryOne,
				primaryTwo,
				bestProgress,
			};
		})
		.sort((a, b) => {
			if (filters.sortKey === "level") {
				return (
					b.level - a.level ||
					a.characterName.localeCompare(b.characterName, "es")
				);
			}

			if (filters.sortKey === "profession") {
				const aLabel = a.primaryOne?.label || a.primaryTwo?.label || "";
				const bLabel = b.primaryOne?.label || b.primaryTwo?.label || "";
				return (
					aLabel.localeCompare(bLabel, "es") ||
					a.characterName.localeCompare(b.characterName, "es")
				);
			}

			if (filters.sortKey === "progress") {
				return (
					b.bestProgress - a.bestProgress ||
					a.characterName.localeCompare(b.characterName, "es")
				);
			}

			return a.characterName.localeCompare(b.characterName, "es");
		});

	const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

	const safePage = Math.min(filters.currentPage, totalPages);
	const start = (safePage - 1) * PAGE_SIZE;
	const pagedRows = rows.slice(start, start + PAGE_SIZE);

	const goToPage = (updater: (page: number) => number) => {
		startTransition(() => {
			setFilters((prev) => ({
				...prev,
				currentPage: updater(prev.currentPage),
			}));
		});
	};

	const groupedCoverage = (() =>
		professionOptions
			.reduce(
				(acc, option) => {
					const coveredBy = rows.filter((member) =>
						member.visibleProfessions.some(
							(profession) => profession.slug === option.slug,
						),
					);

					const item = {
						...option,
						count: coveredBy.length,
						maxedCount: coveredBy.filter((member) =>
							member.visibleProfessions.some(
								(profession) =>
									profession.slug === option.slug && profession.isMaxed,
							),
						).length,
					};

					if (item.count > 0) acc.push(item);
					return acc;
				},
				[] as Array<ProfessionOption & { count: number; maxedCount: number }>,
			)
			.sort(
				(a, b) => b.count - a.count || a.label.localeCompare(b.label, "es"),
			))();

	return (
		<div className="flex flex-1 flex-col w-full animate-in fade-in duration-500 gap-6">
			<AdminPageHeader
				title="PROFESIONES"
				description={`Consulta las profesiones disponibles en la hermandad (${filteredMembers.length} personajes visibles).`}
			/>

			<section
				className="rounded-[2rem] border border-white/5 bg-zinc-950/40 p-5 md:p-6 shadow-2xl backdrop-blur-3xl"
				data-tour-step="professions-filters"
			>
				<div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
					<div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px] xl:min-w-[520px] xl:flex-1">
						<div className="relative">
							<IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
							<Input
								value={filters.query}
								onChange={(event) =>
									setFilter(() => ({ query: event.target.value }))
								}
								placeholder="Buscar por personaje, clase o profesion"
								className="h-11 rounded-xl border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/30"
							/>
						</div>
						<Select
							value={filters.selectedProfession}
							onValueChange={(value) =>
								setFilter(() => ({ selectedProfession: value }))
							}
						>
							<SelectTrigger className="h-11 w-full rounded-xl border-white/10 bg-white/5 text-white">
								<SelectValue placeholder="Todas las profesiones" />
							</SelectTrigger>
							<SelectContent className="border-white/10 bg-[#090b14] text-white">
								<SelectItem value="all">Todas las profesiones</SelectItem>
								{professionOptions.map((profession) => (
									<SelectItem key={profession.slug} value={profession.slug}>
										<div className="flex items-center gap-2">
											<Image
												src={profession.iconUrl}
												alt=""
												width={18}
												height={18}
												className="rounded-sm"
											/>
											<span>{profession.label}</span>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="flex flex-wrap items-center gap-3">
						<div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
							{[
								{ key: "all", label: "Todos" },
								{ key: "mains", label: "Mains" },
								{ key: "alts", label: "Alters" },
							].map((option) => (
								<Button
									key={option.key}
									variant="ghost"
									size="sm"
									onClick={() =>
										setFilter(() => ({
											memberType: option.key as "all" | "mains" | "alts",
										}))
									}
									className={cn(
										"rounded-lg px-4 text-[11px] font-semibold uppercase tracking-[0.25em]",
										filters.memberType === option.key
											? "bg-white text-black hover:bg-white/90"
											: "text-white/65 hover:bg-white/10 hover:text-white",
									)}
								>
									{option.label}
								</Button>
							))}
						</div>

						<Button
							variant={filters.onlyMaxLevel ? "default" : "glass"}
							size="sm"
							onClick={() =>
								setFilter((prev) => ({
									onlyMaxLevel: !prev.onlyMaxLevel,
								}))
							}
							className="h-10 rounded-xl px-4 text-[11px] font-semibold uppercase tracking-[0.2em]"
						>
							Solo nivel max
						</Button>

						<Button
							variant={filters.onlyMaxedProfession ? "default" : "glass"}
							size="sm"
							onClick={() =>
								setFilter((prev) => ({
									onlyMaxedProfession: !prev.onlyMaxedProfession,
								}))
							}
							className="h-10 rounded-xl px-4 text-[11px] font-semibold uppercase tracking-[0.2em]"
						>
							Solo profesion max
						</Button>
					</div>
				</div>

				<div className="mt-4 flex flex-wrap gap-2">
					<Button
						variant={filters.selectedProfession === "all" ? "default" : "glass"}
						size="sm"
						onClick={() =>
							setFilter(() => ({
								selectedProfession: "all",
							}))
						}
						className="h-10 rounded-xl px-4 text-[11px] font-semibold uppercase tracking-[0.2em]"
					>
						Todas
					</Button>
					{professionOptions.map((profession) => (
						<Button
							key={profession.slug}
							variant={
								filters.selectedProfession === profession.slug
									? "default"
									: "glass"
							}
							size="sm"
							onClick={() =>
								setFilter(() => ({
									selectedProfession: profession.slug,
								}))
							}
							className="h-10 rounded-xl px-3"
							title={profession.label}
						>
							<Image
								src={profession.iconUrl}
								alt={profession.label}
								width={20}
								height={20}
								className="rounded-sm"
							/>
						</Button>
					))}
				</div>

				<div className="mt-5 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.25em] text-white/40">
					<span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1">
						<IconUsers className="size-3.5" />
						{filteredMembers.length} visibles
					</span>
					<span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1">
						<IconSparkles className="size-3.5" />
						{maxedCount} con profesiones maxeadas
					</span>
					<Select
						value={filters.sortKey}
						onValueChange={(value) =>
							setFilter(() => ({
								sortKey: value as SortKey,
							}))
						}
					>
						<SelectTrigger className="h-9 w-[190px] rounded-xl border-white/10 bg-white/5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75">
							<SelectValue placeholder="Ordenar" />
						</SelectTrigger>
						<SelectContent className="border-white/10 bg-[#090b14] text-white">
							<SelectItem value="name">Nombre</SelectItem>
							<SelectItem value="level">Nivel</SelectItem>
							<SelectItem value="profession">Profesion</SelectItem>
							<SelectItem value="progress">Progreso</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</section>

			<section
				className="rounded-[2rem] border border-white/5 bg-zinc-950/40 p-4 shadow-2xl backdrop-blur-3xl md:p-5"
				data-tour-step="professions-coverage"
			>
				<div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/45">
					<IconArrowsSort className="size-4" />
					Cobertura por profesion
				</div>
				<div className="flex flex-wrap gap-2.5">
					{groupedCoverage.map((profession) => (
						<div
							key={profession.slug}
							className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
						>
							<Image
								src={profession.iconUrl}
								alt={profession.label}
								width={22}
								height={22}
								className="rounded-sm"
							/>
							<div>
								<div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/85">
									{profession.label}
								</div>
								<div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
									{profession.count} personajes · {profession.maxedCount} max
								</div>
							</div>
						</div>
					))}
				</div>
			</section>

			<section
				className="rounded-[2rem] border border-white/5 bg-zinc-950/40 p-3 shadow-2xl backdrop-blur-3xl md:p-4"
				data-tour-step="professions-table"
			>
				{rows.length === 0 ? (
					<div className="rounded-[2rem] border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center text-white/55">
						No hay personajes que coincidan con los filtros actuales.
					</div>
				) : (
					<>
						{/* Mobile: card layout */}
						<div className="md:hidden space-y-3">
							{pagedRows.map((member) => (
								<div
									key={member.id}
									className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
								>
									<div className="flex items-start justify-between gap-3 mb-3">
										<div className="min-w-0">
											<div
												className="text-sm font-semibold tracking-tight"
												style={
													member.classColor
														? { color: member.classColor }
														: undefined
												}
											>
												{member.characterName}
											</div>
											<div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
												{member.className} · {member.rankName}
											</div>
										</div>
										<div className="flex items-center gap-1.5 shrink-0">
											<span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/65">
												{member.isMain ? "Main" : "Alter"}
											</span>
											<span
												className={cn(
													"rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em]",
													member.level >= CURRENT_MAX_CHARACTER_LEVEL
														? "border-emerald-500/30 text-emerald-300"
														: "border-white/10 text-white/55",
												)}
											>
												{member.level}
											</span>
										</div>
									</div>

									{[
										{
											position: "primaryOne" as const,
											data: member.primaryOne,
										},
										{
											position: "primaryTwo" as const,
											data: member.primaryTwo,
										},
									].map(({ position, data: profession }) => (
										<div
											key={profession?.slug ?? position}
											className="border-t border-white/5 py-2.5 first:pt-2 last:pb-0"
										>
											{profession ? (
												<div className="flex items-center gap-3">
													<Image
														src={profession.iconUrl}
														alt={profession.label}
														width={24}
														height={24}
														className="rounded-md border border-white/10 shrink-0"
													/>
													<div className="min-w-0 flex-1">
														<div className="flex items-center justify-between gap-2">
															<span className="truncate text-xs font-bold text-white/90">
																{profession.label}
															</span>
															<span
																className={cn(
																	"text-xs font-semibold shrink-0 tabular-nums",
																	profession.isMaxed
																		? "text-emerald-400"
																		: "text-white/70",
																)}
															>
																{profession.skillPoints}/
																{profession.maxSkillPoints || "?"}
															</span>
														</div>
														<div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/5">
															<div
																className={cn(
																	"h-full rounded-full",
																	profession.isMaxed
																		? "bg-emerald-400"
																		: "bg-linear-to-r from-blue-500 via-cyan-400 to-emerald-400",
																)}
																style={{
																	width: `${progressPercent(profession.skillPoints, profession.maxSkillPoints)}%`,
																}}
															/>
														</div>
													</div>
												</div>
											) : (
												<span className="text-[10px] text-white/25">
													Sin profesión
												</span>
											)}
										</div>
									))}
								</div>
							))}
						</div>

						{/* Desktop: table layout */}
						<div className="hidden md:block">
							<Table className="min-w-[980px] text-sm">
								<TableHeader>
									<TableRow className="border-white/10 hover:bg-transparent">
										<TableHead className="h-11 px-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/45">
											Personaje
										</TableHead>
										<TableHead className="h-11 px-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/45">
											Tipo
										</TableHead>
										<TableHead className="h-11 px-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/45">
											Nivel
										</TableHead>
										<TableHead className="h-11 px-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/45">
											Profesion 1
										</TableHead>
										<TableHead className="h-11 px-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/45">
											Profesion 2
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{pagedRows.map((member) => (
										<TableRow
											key={member.id}
											className="border-white/5 hover:bg-white/[0.03]"
										>
											<TableCell className="px-4 py-3 align-top">
												<div className="min-w-[200px]">
													<div
														className="text-sm font-semibold tracking-tight"
														style={
															member.classColor
																? { color: member.classColor }
																: undefined
														}
													>
														{member.characterName}
													</div>
													<div className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
														{member.className} · {member.rankName}
													</div>
												</div>
											</TableCell>
											<TableCell className="px-4 py-3 align-top">
												<span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/65">
													{member.isMain ? "Main" : "Alter"}
												</span>
											</TableCell>
											<TableCell className="px-4 py-3 align-top">
												<span
													className={cn(
														"rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]",
														member.level >= CURRENT_MAX_CHARACTER_LEVEL
															? "border-emerald-500/30 text-emerald-300"
															: "border-white/10 text-white/55",
													)}
												>
													{member.level}
												</span>
											</TableCell>
											{[member.primaryOne, member.primaryTwo].map(
												(profession, index) => (
													<TableCell
														key={`${member.id}-${index === 0 ? "one" : "two"}`}
														className="px-4 py-3 align-top"
													>
														{profession ? (
															<div className="min-w-[250px]">
																<div className="flex items-center gap-3">
																	<Image
																		src={profession.iconUrl}
																		alt={profession.label}
																		width={28}
																		height={28}
																		className="rounded-md border border-white/10"
																	/>
																	<div className="min-w-0 flex-1">
																		<div className="truncate text-sm font-bold text-white/90">
																			{profession.label}
																		</div>
																		<div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
																			{profession.tierName || "Midnight"}
																		</div>
																	</div>
																	<div className="text-right">
																		<div
																			className={cn(
																				"text-sm font-semibold",
																				profession.isMaxed
																					? "text-emerald-400"
																					: "text-white",
																			)}
																		>
																			{profession.skillPoints}/
																			{profession.maxSkillPoints || "?"}
																		</div>
																		<div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
																			{progressPercent(
																				profession.skillPoints,
																				profession.maxSkillPoints,
																			)}
																			%
																		</div>
																	</div>
																</div>
																<div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
																	<div
																		className={cn(
																			"h-full rounded-full",
																			profession.isMaxed
																				? "bg-emerald-400"
																				: "bg-linear-to-r from-blue-500 via-cyan-400 to-emerald-400",
																		)}
																		style={{
																			width: `${progressPercent(profession.skillPoints, profession.maxSkillPoints)}%`,
																		}}
																	/>
																</div>
															</div>
														) : (
															<span className="text-xs text-white/25">-</span>
														)}
													</TableCell>
												),
											)}
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</>
				)}

				{rows.length > PAGE_SIZE && (
					<div className="mt-4 flex flex-col gap-3 border-t border-white/5 px-2 pt-4 sm:flex-row sm:items-center sm:justify-between">
						<p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
							Mostrando{" "}
							{Math.min(filters.currentPage, totalPages) > 0
								? (Math.min(filters.currentPage, totalPages) - 1) * PAGE_SIZE +
									1
								: 0}
							-{Math.min(filters.currentPage * PAGE_SIZE, rows.length)} de{" "}
							{rows.length}
						</p>
						<div className="flex items-center gap-2">
							<Button
								variant="glass"
								size="sm"
								className="h-9 rounded-xl px-4 text-[10px] font-semibold uppercase tracking-[0.2em]"
								onClick={() => goToPage((page) => Math.max(1, page - 1))}
								disabled={filters.currentPage === 1}
							>
								Anterior
							</Button>
							<span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
								{filters.currentPage} / {totalPages}
							</span>
							<Button
								variant="glass"
								size="sm"
								className="h-9 rounded-xl px-4 text-[10px] font-semibold uppercase tracking-[0.2em]"
								onClick={() =>
									goToPage((page) => Math.min(totalPages, page + 1))
								}
								disabled={filters.currentPage === totalPages}
							>
								Siguiente
							</Button>
						</div>
					</div>
				)}
			</section>
		</div>
	);
}
