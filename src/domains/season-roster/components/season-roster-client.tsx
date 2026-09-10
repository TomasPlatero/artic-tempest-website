"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/shared/ui/button";
import {
	IconArrowUp,
	IconArrowDown,
	IconArrowsSort,
	IconPlus,
} from "@/shared/ui/tabler-icons";

import {
	getSpecRole,
	getRolePriority,
	computeStats,
} from "./season-roster.utils";
import type { SortColumn, PageProps } from "./season-roster.types";
import { RosterRow } from "./roster-row";
import { MyEntryForm, ManualEntryForm } from "./roster-forms";
import { RosterStatsBar } from "./roster-stats-bar";

// ──────────────────────────────────────────────
// Sort header component
// ──────────────────────────────────────────────

function SortHeader({
	column,
	label,
	className,
	sortColumn,
	sortDirection,
	onSort,
}: {
	column: SortColumn;
	label: string;
	className?: string;
	sortColumn: SortColumn;
	sortDirection: "asc" | "desc";
	onSort: (column: SortColumn) => void;
}) {
	const isActive = sortColumn === column;
	return (
		<th
			className={`text-left font-semibold uppercase tracking-widest text-[9px] sm:text-[10px] text-zinc-300 p-2 sm:p-3 md:p-4 ${className ?? ""}`}
		>
			<button
				type="button"
				className="flex items-center gap-1.5 hover:text-zinc-100 transition-colors cursor-pointer select-none bg-transparent border-0 p-0 text-inherit font-inherit"
				onClick={() => onSort(column)}
			>
				<span>{label}</span>
				{isActive ? (
					sortDirection === "asc" ? (
						<IconArrowUp className="size-3 shrink-0 text-zinc-200" />
					) : (
						<IconArrowDown className="size-3 shrink-0 text-zinc-200" />
					)
				) : (
					<IconArrowsSort className="size-3 shrink-0 text-zinc-700" />
				)}
			</button>
		</th>
	);
}

// ──────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────

function resolveMyCharactersHint({
	entryCount,
	hasBnetChars,
}: {
	entryCount: number;
	hasBnetChars: boolean;
}) {
	if (entryCount > 0) {
		const plural = entryCount !== 1 ? "s" : "";
		return `Tienes ${entryCount} personaje${plural} registrado${plural}. Edítalos abajo o añade hasta ${3 - entryCount} más.`;
	}
	return hasBnetChars
		? "Selecciona tus personajes para Season 2"
		: "Vincula tu cuenta de Battle.net en Mis Personajes para poder registrarte";
}

// Sort helpers
function sortRosterEntries(
	entries: PageProps["entries"],
	sortColumn: SortColumn,
	sortDirection: "asc" | "desc",
	classNames: PageProps["classNames"],
	specsByClass: PageProps["specsByClass"],
) {
	if (!sortColumn) return entries;

	return [...entries].sort((a, b) => {
		let aVal: string, bVal: string;

		switch (sortColumn) {
			case "character_name":
				aVal = a.character_name.toLowerCase();
				bVal = b.character_name.toLowerCase();
				break;
			case "class_name":
				aVal = (classNames[a.class_id] ?? "").toLowerCase();
				bVal = (classNames[b.class_id] ?? "").toLowerCase();
				break;
			case "main_spec":
				aVal = a.main_spec.toLowerCase();
				bVal = b.main_spec.toLowerCase();
				break;
			case "role": {
				const aRole = getRolePriority(
					getSpecRole(a.class_id, a.main_spec, specsByClass),
				);
				const bRole = getRolePriority(
					getSpecRole(b.class_id, b.main_spec, specsByClass),
				);
				const cmp = bRole - aRole; // descending: Tank first
				return sortDirection === "asc" ? -cmp : cmp;
			}
			case "off_spec":
				aVal = (a.off_spec ?? "").toLowerCase();
				bVal = (b.off_spec ?? "").toLowerCase();
				break;
			case "profession_1":
				aVal = (a.profession_1 ?? "").toLowerCase();
				bVal = (b.profession_1 ?? "").toLowerCase();
				break;
			case "profession_2":
				aVal = (a.profession_2 ?? "").toLowerCase();
				bVal = (b.profession_2 ?? "").toLowerCase();
				break;
			default:
				return 0;
		}

		const cmp = aVal.localeCompare(bVal, "es");
		return sortDirection === "asc" ? cmp : -cmp;
	});
}

export function SeasonRosterClient({
	entries,
	classNames,
	specsByClass,
	currentUserId,
	canEditAll: _canEditAll,
	canManageAll,
	myBnetCharacters,
}: PageProps) {
	const router = useRouter();
	const [showForm, setShowForm] = useState(false);
	const [sortColumn, setSortColumn] = useState<SortColumn>(null);
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

	const [showManualForm, setShowManualForm] = useState(false);

	const myEntries = entries.filter((e) => e.user_id === currentUserId);
	const entryCount = myEntries.length;
	const hasBnetChars = myBnetCharacters.length > 0;

	const stats = computeStats(entries, classNames, specsByClass);

	const sortedEntries = sortRosterEntries(
		entries,
		sortColumn,
		sortDirection,
		classNames,
		specsByClass,
	);

	const handleSort = (column: SortColumn) => {
		if (sortColumn === column) {
			setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
		} else {
			setSortColumn(column);
			setSortDirection("asc");
		}
	};

	const handleSaved = () => {
		setShowForm(false);
		router.refresh();
	};

	return (
		<div className="flex flex-col gap-6">
			{/* ─── Create / Edit section ─── */}
			{currentUserId && (
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
					<div>
						<h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-200">
							Tus personajes ({entryCount}/3)
						</h2>
						<p className="text-xs text-zinc-400 mt-0.5">
							{resolveMyCharactersHint({ entryCount, hasBnetChars })}
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						{entryCount < 3 && hasBnetChars && !showForm && (
							<Button
								onClick={() => setShowForm(true)}
								className="bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm"
							>
								<IconPlus className="size-4 mr-1 sm:mr-2" />
								Añadir personaje
							</Button>
						)}

						{canManageAll && !showManualForm && (
							<Button
								onClick={() => setShowManualForm(true)}
								variant="outline"
								className="border-white/10 text-zinc-300 text-xs sm:text-sm"
							>
								<IconPlus className="size-4 mr-1 sm:mr-2" />
								Añadir manual
							</Button>
						)}
					</div>
				</div>
			)}

			{showForm && entryCount < 3 && (
				<MyEntryForm
					myBnetCharacters={myBnetCharacters}
					specsByClass={specsByClass}
					classNames={classNames}
					onSaved={handleSaved}
				/>
			)}

			{showManualForm && (
				<ManualEntryForm
					specsByClass={specsByClass}
					classNames={classNames}
					onSaved={() => {
						setShowManualForm(false);
						router.refresh();
					}}
				/>
			)}

			{/* ─── Stats ─── */}
			<RosterStatsBar stats={stats} />

			{/* ─── Table ─── */}
			{entries.length > 0 ? (
				<div className="overflow-x-auto rounded-2xl border border-white/10 bg-zinc-950/20 backdrop-blur-sm">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-white/10 bg-white/[0.03]">
								<SortHeader
									column="character_name"
									label="Personaje"
									sortColumn={sortColumn}
									sortDirection={sortDirection}
									onSort={handleSort}
								/>
								<SortHeader
									column="role"
									label="Rol"
									className="hidden sm:table-cell"
									sortColumn={sortColumn}
									sortDirection={sortDirection}
									onSort={handleSort}
								/>
								<SortHeader
									column="class_name"
									label="Clase"
									sortColumn={sortColumn}
									sortDirection={sortDirection}
									onSort={handleSort}
								/>
								<SortHeader
									column="main_spec"
									label="Espec principal"
									sortColumn={sortColumn}
									sortDirection={sortDirection}
									onSort={handleSort}
								/>
								<SortHeader
									column="off_spec"
									label="Espec secundaria"
									className="hidden sm:table-cell"
									sortColumn={sortColumn}
									sortDirection={sortDirection}
									onSort={handleSort}
								/>
								<SortHeader
									column="profession_1"
									label="Profesión 1"
									className="hidden md:table-cell"
									sortColumn={sortColumn}
									sortDirection={sortDirection}
									onSort={handleSort}
								/>
								<SortHeader
									column="profession_2"
									label="Profesión 2"
									className="hidden md:table-cell"
									sortColumn={sortColumn}
									sortDirection={sortDirection}
									onSort={handleSort}
								/>
								<th className="p-2 sm:p-3 md:p-4 w-16 sm:w-24" aria-label="Acciones" />
							</tr>
						</thead>
						<tbody>
							{sortedEntries.map((entry) => {
								const isOwn = entry.user_id === currentUserId;
								const canEdit = isOwn || canManageAll;

								return (
									<RosterRow
										key={entry.id}
										entry={entry}
										classNames={classNames}
										specsByClass={specsByClass}
										isOwn={isOwn}
										canEdit={canEdit}
									/>
								);
							})}
						</tbody>
					</table>
				</div>
			) : (
				<div className="rounded-2xl border border-dashed border-white/10 p-16 text-center">
					<p className="text-zinc-300 text-sm italic">
						{hasBnetChars
							? "Nadie se ha registrado aún. ¡Sé el primero!"
							: "No hay personajes en el roster aún."}
					</p>
				</div>
			)}
		</div>
	);
}
