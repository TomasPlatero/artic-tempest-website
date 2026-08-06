"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { IconInbox } from "@/shared/ui/tabler-icons";
import { toast } from "sonner";
import { RecruitmentInboxFilters } from "./recruitment-inbox-filters";
import { RecruitmentInboxList } from "./recruitment-inbox-list";
import {
	RECRUITMENT_STATUS_COLORS,
	RECRUITMENT_STATUS_LABELS,
} from "@/domains/recruitment/lib/application-status";

const statusConfig: Record<string, { label: string; color: string }> =
	Object.fromEntries(
		Object.entries(RECRUITMENT_STATUS_LABELS).map(([key, label]) => [
			key,
			{
				label,
				color:
					RECRUITMENT_STATUS_COLORS[key] ||
					"bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
			},
		]),
	);

const statusFilterOptions = Object.entries(statusConfig).filter(
	([key]) => key !== "simulated",
);

const createdAtFormatter = new Intl.DateTimeFormat("es-ES", {
	day: "2-digit",
	month: "short",
	year: "numeric",
	timeZone: "UTC",
});

function CreatedAtDate({ createdAt }: { createdAt: string | number | Date }) {
	return <span>{createdAtFormatter.format(new Date(createdAt))}</span>;
}

type SortKey = "character" | "status" | "createdAt" | "notes";
type SortDirection = "asc" | "desc";

const statusSortOrder: Record<string, number> = {
	pending: 1,
	reviewing: 2,
	interview: 3,
	accepted: 4,
	rejected: 5,
	paused: 6,
	cancelado: 7,
	simulated: 8,
};

function getNotesScore(app: any) {
	if (app.status === "interview" && app.hasNewApplicantMessage) return 2;
	if (app.internal_notes) return 1;
	return 0;
}

function compareApps(
	a: any,
	b: any,
	sortKey: SortKey,
	direction: SortDirection,
) {
	const multiplier = direction === "asc" ? 1 : -1;

	let result = 0;

	switch (sortKey) {
		case "character":
			result = a.character_name.localeCompare(b.character_name, "es", {
				sensitivity: "base",
			});
			if (result === 0)
				result = (a.character_realm ?? "").localeCompare(
					b.character_realm ?? "",
					"es",
					{ sensitivity: "base" },
				);
			break;
		case "status":
			result =
				(statusSortOrder[a.status] ?? 99) - (statusSortOrder[b.status] ?? 99);
			break;
		case "createdAt":
			result =
				new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
			break;
		case "notes":
			result = getNotesScore(a) - getNotesScore(b);
			break;
	}

	if (result === 0 && sortKey !== "createdAt") {
		result =
			new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
	}

	return result * multiplier;
}

async function doDeleteApplication(
	id: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const res = await fetch(`/api/recruitment/applications?id=${id}`, {
			method: "DELETE",
		});

		if (!res.ok)
			return { success: false, error: "No se pudo borrar la solicitud" };

		return { success: true };
	} catch (error: any) {
		return {
			success: false,
			error: error.message || "No se pudo borrar la solicitud",
		};
	}
}

async function doForceDiscordEmbed(
	id: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const res = await fetch("/api/discord/notify-apply", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ application_id: id, force: true }),
		});

		if (!res.ok) {
			const json = await res.json().catch(() => ({}));
			return {
				success: false,
				error: (json as any).error || "No se pudo enviar el embed",
			};
		}

		return { success: true };
	} catch (error: any) {
		return {
			success: false,
			error: error.message || "No se pudo enviar el embed",
		};
	}
}

export function RecruitmentInbox({
	applications,
	constants,
	currentRoleLevel,
}: {
	applications: any[];
	constants: any[];
	currentRoleLevel?: string;
}) {
	const router = useRouter();
	const [inboxState, setInboxState] = useState({
		searchTerm: "",
		statusFilter: "all",
		isDeleting: null as string | null,
		isSendingEmbed: null as string | null,
		currentPage: 1,
		sortKey: "createdAt" as SortKey,
		sortDirection: "desc" as SortDirection,
	});
	const {
		searchTerm,
		statusFilter,
		isDeleting,
		isSendingEmbed,
		currentPage,
		sortKey,
		sortDirection,
	} = inboxState;
	const canForceEmbed = currentRoleLevel?.trim().toLowerCase() === "gm";

	const classMap = new Map();
	for (const c of constants) {
		if (c.category !== "wow_class") continue;
		classMap.set(Number(c.key), { name: c.value, color: c.metadata?.color });
	}

	const filteredApps = applications.filter((app) => {
		const matchesSearch = app.character_name
			.toLowerCase()
			.includes(searchTerm.toLowerCase());
		const matchesStatus = statusFilter === "all" || app.status === statusFilter;
		return matchesSearch && matchesStatus;
	});

	const sortedApps = [...filteredApps].sort((a, b) =>
		compareApps(a, b, sortKey, sortDirection),
	);

	const pageSize = 10;
	const totalPages = Math.max(1, Math.ceil(sortedApps.length / pageSize));
	const safeCurrentPage = Math.min(currentPage, totalPages);
	const visibleApps = sortedApps.slice(
		(safeCurrentPage - 1) * pageSize,
		safeCurrentPage * pageSize,
	);

	const handleSortChange = (nextKey: SortKey) => {
		setInboxState((prev) => ({
			...prev,
			sortDirection:
				prev.sortKey === nextKey && prev.sortDirection === "asc"
					? "desc"
					: "asc",
			sortKey: nextKey,
			currentPage: 1,
		}));
	};

	const handleDelete = async (
		e: React.MouseEvent,
		id: string,
		name: string,
	) => {
		e.stopPropagation(); // Evitar navegar a los detalles

		if (
			!window.confirm(
				`¿Estás seguro de que quieres borrar la solicitud de ${name}? Esta acción no se puede deshacer.`,
			)
		) {
			return;
		}

		setInboxState((prev) => ({ ...prev, isDeleting: id }));
		const result = await doDeleteApplication(id);

		if (result.success) {
			toast.success("Solicitud borrada correctamente");
			router.refresh();
		} else {
			console.error("Delete error:", result.error);
			toast.error("Error al borrar la solicitud");
		}

		setInboxState((prev) => ({ ...prev, isDeleting: null }));
	};

	const handleForceDiscordEmbed = async (
		e: React.MouseEvent,
		id: string,
		name: string,
	) => {
		e.stopPropagation();

		setInboxState((prev) => ({ ...prev, isSendingEmbed: id }));

		const result = await doForceDiscordEmbed(id);

		if (result.success) {
			toast.success(`Embed enviado para ${name}`);
			router.refresh();
		} else {
			console.error("Force embed error:", result.error);
			toast.error("Error al forzar el embed", {
				description: result.error,
			});
		}

		setInboxState((prev) => ({ ...prev, isSendingEmbed: null }));
	};

	return (
		<div className="space-y-6">
			<RecruitmentInboxFilters
				searchTerm={searchTerm}
				statusFilter={statusFilter}
				total={filteredApps.length}
				statusOptions={statusFilterOptions}
				onSearchChange={(value) =>
					setInboxState((prev) => ({
						...prev,
						searchTerm: value,
						currentPage: 1,
					}))
				}
				onStatusChange={(value) =>
					setInboxState((prev) => ({
						...prev,
						statusFilter: value,
						currentPage: 1,
					}))
				}
			/>

			<RecruitmentInboxList
				visibleApps={visibleApps}
				classMap={classMap}
				canForceEmbed={canForceEmbed}
				isDeleting={isDeleting}
				isSendingEmbed={isSendingEmbed}
				statusConfig={statusConfig}
				sortKey={sortKey}
				sortDirection={sortDirection}
				onSortChange={handleSortChange}
				CreatedAtDate={CreatedAtDate}
				onOpenDetails={(id) =>
					router.push(`/zona-raider/configuracion/reclutamiento/${id}`)
				}
				onDelete={(e, id, name) => void handleDelete(e, id, name)}
				onForceEmbed={(e, id, name) =>
					void handleForceDiscordEmbed(e, id, name)
				}
			/>

			<div className="grid grid-cols-1 gap-3">
				{filteredApps.length === 0 && (
					<div className="py-20 text-center space-y-4 bg-zinc-950/20 border border-dashed border-white/5 rounded-3xl">
						<IconInbox className="size-12 text-zinc-700 mx-auto" />
						<div>
							<p className="text-zinc-400 font-bold">
								No hay solicitudes que coincidan
							</p>
							<p className="text-xs text-zinc-600 mt-1">
								Prueba a cambiar los filtros o el término de búsqueda.
							</p>
						</div>
					</div>
				)}

				{sortedApps.length > pageSize && (
					<div className="flex items-center justify-center gap-3 pt-2">
						<Button
							variant="outline"
							className="rounded-xl border-white/10 bg-white/5"
							disabled={safeCurrentPage === 1}
							onClick={() =>
								setInboxState((prev) => ({
									...prev,
									currentPage: Math.max(1, prev.currentPage - 1),
								}))
							}
						>
							Anterior
						</Button>
						<span className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
							Página {safeCurrentPage} de {totalPages}
						</span>
						<Button
							variant="outline"
							className="rounded-xl border-white/10 bg-white/5"
							disabled={safeCurrentPage === totalPages}
							onClick={() =>
								setInboxState((prev) => ({
									...prev,
									currentPage: Math.min(totalPages, prev.currentPage + 1),
								}))
							}
						>
							Siguiente
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
