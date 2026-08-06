"use client";

import { useReducer, useState } from "react";
import { format, subDays } from "date-fns";
import { toast } from "sonner";
import { WeeklyVaultFilters } from "./weekly-vault-filters";
import { WeeklyVaultDesktopTable } from "./weekly-vault-desktop-table";
import { WeeklyVaultMobileGrid } from "./weekly-vault-mobile-grid";
import { WeeklyVaultPagination } from "./weekly-vault-pagination";
import type { SortConfig, Upload } from "./weekly-vault-shared";

interface Props {
	initialUploads: any[];
}

type UiState = {
	selectedWeek: string;
	selectedProfile: string;
	currentPage: number;
	sortConfig: SortConfig;
};

type UiAction =
	| { type: "setWeek"; week: string }
	| { type: "setProfile"; profile: string }
	| { type: "setPage"; page: number }
	| { type: "setSort"; sortConfig: SortConfig }
	| { type: "resetProfileIfMissing" };

function createInitialUiState(): UiState {
	return {
		selectedWeek: getCurrentWowResetWeek(),
		selectedProfile: "all",
		currentPage: 1,
		sortConfig: {
			key: "created_at",
			direction: "desc",
		},
	};
}

function uiReducer(state: UiState, action: UiAction): UiState {
	switch (action.type) {
		case "setWeek":
			return {
				...state,
				selectedWeek: action.week,
				selectedProfile: "all",
				currentPage: 1,
				sortConfig: {
					key: "created_at",
					direction: "desc",
				},
			};
		case "setProfile":
			return {
				...state,
				selectedProfile: action.profile,
				currentPage: 1,
			};
		case "setPage":
			return {
				...state,
				currentPage: action.page,
			};
		case "setSort":
			return {
				...state,
				sortConfig: action.sortConfig,
				currentPage: 1,
			};
		case "resetProfileIfMissing":
			return state.selectedProfile !== "all"
				? { ...state, selectedProfile: "all", currentPage: 1 }
				: state;
		default:
			return state;
	}
}

function getNextSortConfig(current: SortConfig, key: string): SortConfig {
	if (current.key === key) {
		if (current.direction === "asc") return { key, direction: "desc" };
		if (current.direction === "desc")
			return { key: "created_at", direction: "desc" };
	}

	return { key, direction: "asc" };
}

function getCurrentWowResetWeek(date: Date = new Date()): string {
	const day = date.getDay();
	const diffToWednesday = day >= 3 ? day - 3 : day + 4;
	const resetDate = subDays(date, diffToWednesday);
	return format(resetDate, "yyyy-MM-dd");
}

const ITEMS_PER_PAGE = 10;

function formatUploadDate(value: string) {
	return format(new Date(value), "dd/MM/yyyy HH:mm");
}

async function doDeleteVaultCapture(
	id: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const res = await fetch(`/api/weekly-vault?id=${id}`, {
			method: "DELETE",
		});
		if (!res.ok) throw new Error("Error borrando la captura");
		return { success: true };
	} catch (error: any) {
		return { success: false, error: error.message || "Ha ocurrido un error" };
	}
}

export function WeeklyVaultAdminClient({ initialUploads }: Props) {
	const [uploads, setUploads] = useState<Upload[]>(initialUploads as Upload[]);
	const [isDeleting, setIsDeleting] = useState<string | null>(null);
	const [uiState, dispatch] = useReducer(
		uiReducer,
		undefined,
		createInitialUiState,
	);
	const currentWeek = getCurrentWowResetWeek();
	const { selectedWeek, selectedProfile, currentPage, sortConfig } = uiState;

	// Extract unique weeks (current week first, then previous weeks with uploads)
	const uniqueWeeks = (() => {
		const weeks = new Set<string>([currentWeek]);
		uploads.forEach((u) => weeks.add(u.week_start));
		return Array.from(weeks)
			.filter((week) => week <= currentWeek)
			.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
	})();

	const weekUploads = (() => {
		return uploads.filter((u) => u.week_start === selectedWeek);
	})();

	const availableProfiles = (() => {
		const profileMap = new Map<string, { id: string; label: string }>();

		weekUploads.forEach((upload) => {
			if (!profileMap.has(upload.profile_id)) {
				profileMap.set(upload.profile_id, {
					id: upload.profile_id,
					label: upload.profiles?.discord_username || "Desconocido",
				});
			}
		});

		return Array.from(profileMap.values()).sort((a, b) =>
			a.label.localeCompare(b.label, "es"),
		);
	})();

	const resolvedProfile =
		selectedProfile !== "all" &&
		!availableProfiles.some((p) => p.id === selectedProfile)
			? "all"
			: selectedProfile;

	// Filter uploads
	const filteredUploads = (() => {
		let result = [...uploads];

		result = result.filter((u) => u.week_start === selectedWeek);
		if (resolvedProfile !== "all") {
			result = result.filter((u) => u.profile_id === resolvedProfile);
		}

		// Apply sorting
		if (sortConfig.key && sortConfig.direction) {
			result.sort((a, b) => {
				let valA: string = "";
				let valB: string = "";

				switch (sortConfig.key) {
					case "character":
						valA = a.bnet_characters?.name || "";
						valB = b.bnet_characters?.name || "";
						break;
					case "player":
						valA = a.profiles?.discord_username || "";
						valB = b.profiles?.discord_username || "";
						break;
					case "created_at":
						valA = a.created_at;
						valB = b.created_at;
						break;
				}

				if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
				if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
				return 0;
			});
		}

		return result;
	})();

	const handleSort = (key: string) =>
		dispatch({
			type: "setSort",
			sortConfig: getNextSortConfig(sortConfig, key),
		});

	// Calculate pagination
	const totalPages = Math.max(
		1,
		Math.ceil(filteredUploads.length / ITEMS_PER_PAGE),
	);
	const paginatedUploads = (() => {
		const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
		return filteredUploads.slice(startIndex, startIndex + ITEMS_PER_PAGE);
	})();

	const handleDelete = async (id: string) => {
		if (
			!confirm(
				"¿Seguro que quieres borrar esta captura? Esta acción no se puede deshacer.",
			)
		)
			return;

		setIsDeleting(id);
		const result = await doDeleteVaultCapture(id);
		if (result.success) {
			setUploads((prev) => prev.filter((u) => u.id !== id));
			toast.success("Captura borrada");
		} else {
			toast.error(result.error);
		}
		setIsDeleting(null);
	};

	return (
		<div className="space-y-6">
			<WeeklyVaultFilters
				selectedWeek={selectedWeek}
				selectedProfile={selectedProfile}
				uniqueWeeks={uniqueWeeks}
				currentWeek={currentWeek}
				availableProfiles={availableProfiles}
				onWeekChange={(week) => dispatch({ type: "setWeek", week })}
				onProfileChange={(profile) => dispatch({ type: "setProfile", profile })}
			/>

			{filteredUploads.length === 0 ? (
				<div className="text-center py-24 bg-card/50 rounded-xl border border-dashed border-white/10">
					<p className="text-muted-foreground">
						No hay capturas para los filtros seleccionados.
					</p>
				</div>
			) : (
				<>
					<WeeklyVaultDesktopTable
						uploads={paginatedUploads}
						sortConfig={sortConfig}
						formatUploadDate={formatUploadDate}
						onSort={handleSort}
						onDelete={(id) => void handleDelete(id)}
						isDeleting={isDeleting}
					/>

					<WeeklyVaultMobileGrid
						uploads={paginatedUploads}
						formatUploadDate={formatUploadDate}
						onDelete={(id) => void handleDelete(id)}
						isDeleting={isDeleting}
					/>

					<WeeklyVaultPagination
						currentPage={currentPage}
						totalPages={totalPages}
						itemsPerPage={ITEMS_PER_PAGE}
						totalItems={filteredUploads.length}
						onPageChange={(page) => dispatch({ type: "setPage", page })}
					/>
				</>
			)}
		</div>
	);
}
