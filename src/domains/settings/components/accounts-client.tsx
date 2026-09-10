"use client";

import { useState } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/ui/table";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/tailwind/tailwind-utils";
import {
	IconArrowDown,
	IconArrowUp,
	IconBrandDiscord,
	IconExternalLink,
	IconArrowsSort,
	IconSearch,
	IconRefresh,
	IconShieldCheck,
} from "@/shared/ui/tabler-icons";
import type { AppRole } from "@/shared/types/auth";

type Profile = {
	user_id: string;
	discord_username: string;
	discord_user_id?: string;
	discord_avatar?: string | null;
	role_level: string;
	created_at: string;
	is_online?: boolean;
	last_online_at?: string | null;
};

type SortColumn = "discord_username" | "created_at" | "role_level";
type SortDirection = "asc" | "desc";

const formatDate = (iso: string) =>
	new Date(iso).toLocaleDateString("es-ES", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		timeZone: "UTC",
	});

const formatLastSeen = (iso?: string | null) => {
	if (!iso) return "Última actividad sin registros recientes";
	const diff = Date.now() - new Date(iso).getTime();
	if (diff < 60 * 1000) return "Última actividad hace <1 min";
	if (diff < 60 * 60 * 1000)
		return `Última actividad hace ${Math.floor(diff / 60000)} min`;
	if (diff < 24 * 60 * 60 * 1000)
		return `Última actividad hace ${Math.floor(diff / 3600000)} h`;
	return `Última actividad el ${new Date(iso).toLocaleDateString("es-ES", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		timeZone: "UTC",
	})}`;
};

async function doSyncDiscordRoles(): Promise<{
	success: boolean;
	error?: string;
	data?: {
		assignedCount: number;
		missingCount: number;
		errorCount: number;
		assignedMembers: Array<{ userId: string; username: string }>;
	};
}> {
	try {
		const res = await fetch("/api/admin/raider-rules/sync-discord", {
			method: "POST",
		});
		if (!res.ok) {
			const data = await res.json();
			return {
				success: false,
				error: data.error || "No se pudo sincronizar Discord",
			};
		}
		const data = await res.json();
		if (!data.success) {
			return {
				success: false,
				error: data.error || "No se pudo sincronizar Discord",
			};
		}
		return {
			success: true,
			data: {
				assignedCount: data.assignedCount ?? 0,
				missingCount: data.missingCount ?? 0,
				errorCount: data.errorCount ?? 0,
				assignedMembers: data.assignedMembers ?? [],
			},
		};
	} catch (error: any) {
		return {
			success: false,
			error: error.message || "No se pudo sincronizar Discord",
		};
	}
}

export function AccountsClient(props: {
	initialProfiles: Profile[];
	roles: AppRole[];
}) {
	return useAccountsClient(props);
}

function resolveAriaSort(
	sortColumn: string,
	column: string,
	sortDirection: string,
): "ascending" | "descending" | "none" {
	if (sortColumn !== column) return "none";
	return sortDirection === "asc" ? "ascending" : "descending";
}

function useAccountsClient({
	initialProfiles,
	roles,
}: {
	initialProfiles: Profile[];
	roles: AppRole[];
}) {
	const profiles = initialProfiles;
	const [viewState, setViewState] = useState({
		searchTerm: "",
		currentPage: 1,
		sortColumn: "created_at" as SortColumn,
		sortDirection: "desc" as SortDirection,
		isMounted: true,
		syncing: false,
		syncSummary: null as {
			assignedCount: number;
			missingCount: number;
			errorCount: number;
			assignedMembers: Array<{ userId: string; username: string }>;
		} | null,
	});
	const {
		searchTerm,
		currentPage,
		sortColumn,
		sortDirection,
		isMounted,
		syncing,
		syncSummary,
	} = viewState;
	const itemsPerPage = 10;

	const roleMap = (() => {
		const map: Record<string, AppRole> = {};
		roles.forEach((role) => {
			map[role.level] = role;
		});
		return map;
	})();

	const syncDiscordRoles = async () => {
		setViewState((prev) => ({ ...prev, syncing: true }));
		const result = await doSyncDiscordRoles();
		if (result.success && result.data) {
			setViewState((prev) => ({
				...prev,
				syncSummary: result.data!,
			}));
		} else {
			setViewState((prev) => ({ ...prev, syncSummary: null }));
			alert(result.error || "No se pudo sincronizar Discord");
		}
		setViewState((prev) => ({ ...prev, syncing: false }));
	};

	const filteredProfiles = (() => {
		const term = searchTerm.toLowerCase();
		return profiles.filter(
			(profile) =>
				profile.discord_username?.toLowerCase().includes(term) ||
				profile.user_id.toLowerCase().includes(term),
		);
	})();

	const sortedProfiles = filteredProfiles.toSorted((a, b) => {
		const direction = sortDirection === "asc" ? 1 : -1;

		if (sortColumn === "created_at") {
			return (
				(new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) *
				direction
			);
		}

		if (sortColumn === "role_level") {
			const prioA = roleMap[a.role_level]?.priority ?? 0;
			const prioB = roleMap[b.role_level]?.priority ?? 0;
			return (prioA - prioB) * direction;
		}

		return (
			a.discord_username.localeCompare(b.discord_username, "es", {
				sensitivity: "base",
			}) * direction
		);
	});

	const totalPages = Math.ceil(sortedProfiles.length / itemsPerPage) || 1;
	const paginatedProfiles = sortedProfiles.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage,
	);

	const handleSort = (column: SortColumn) => {
		setViewState((prev) => ({ ...prev, currentPage: 1 }));
		if (sortColumn === column) {
			setViewState((prev) => ({
				...prev,
				sortDirection: prev.sortDirection === "asc" ? "desc" : "asc",
			}));
			return;
		}

		setViewState((prev) => ({
			...prev,
			sortColumn: column,
			sortDirection: "asc",
		}));
	};

	const getSortIcon = (column: SortColumn) => {
		if (sortColumn !== column) {
			return <IconArrowsSort className="size-3 text-white/25" />;
		}

		return sortDirection === "asc" ? (
			<IconArrowUp className="size-3 text-cyan-300" />
		) : (
			<IconArrowDown className="size-3 text-cyan-300" />
		);
	};

	if (!isMounted) {
		return (
			<div className="p-12 flex justify-center items-center text-white/20 animate-pulse font-semibold uppercase tracking-[0.3em] text-xs">
				Cargando Panel de Gestión…
			</div>
		);
	}

	const getRoleBadge = (role: string) => {
		const meta = roleMap[role];
		return (
			<Badge
				variant="outline"
				className="uppercase font-semibold text-[10px] tracking-[0.2em]"
				style={
					meta
						? {
								borderColor: meta.color,
								color: meta.color,
							}
						: undefined
				}
			>
				{meta?.label ?? role}
			</Badge>
		);
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
				<div className="relative w-full max-w-sm">
					<IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
					<Input
						placeholder="Buscar por usuario o ID…"
						className="pl-10 bg-zinc-950/50 border-white/5 focus:border-blue-500/50 transition-colors"
						value={searchTerm}
						onChange={(e) => {
							setViewState((prev) => ({
								...prev,
								searchTerm: e.target.value,
								currentPage: 1,
							}));
						}}
					/>
				</div>
				<Button
					type="button"
					variant="outline"
					onClick={() => void syncDiscordRoles()}
					disabled={syncing}
					className="border-cyan-500/30 bg-cyan-500/5 text-cyan-100 hover:bg-cyan-500/10 w-full lg:w-auto"
				>
					<IconRefresh
						className={cn("mr-2 size-4", syncing && "animate-spin")}
					/>
					Sincronizar Discord
				</Button>
			</div>

			{syncSummary && (
				<div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-sm text-cyan-100 space-y-3">
					<div className="flex flex-wrap items-center gap-4">
						<span className="flex items-center gap-2">
							<IconShieldCheck className="size-4" />
							{syncSummary.assignedCount} con rol
						</span>
						<span>{syncSummary.missingCount} sin rol</span>
						<span>{syncSummary.errorCount} con error</span>
					</div>
					{syncSummary.assignedMembers.length > 0 ? (
						<div className="flex flex-wrap gap-2">
							{syncSummary.assignedMembers.map((member) => (
								<span
									key={member.userId}
									className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold"
								>
									{member.username}
								</span>
							))}
						</div>
					) : null}
				</div>
			)}

			{/* Mobile cards */}
			<div className="grid grid-cols-1 gap-3 lg:hidden">
				{paginatedProfiles.map((profile) => (
					<div
						key={profile.user_id}
						className="bg-zinc-900/70 border border-white/5 rounded-2xl p-4 flex flex-col gap-3"
					>
						<div className="flex items-center gap-4">
							<div className="relative size-12 rounded-full overflow-hidden border border-white/10 bg-zinc-900">
								{profile.discord_avatar ? (
									<Image
										src={profile.discord_avatar}
										alt="Avatar"
										fill
										sizes="48px"
										className="object-cover"
									/>
								) : (
									<div className="flex items-center justify-center h-full">
										<IconBrandDiscord className="size-6 text-white/10" />
									</div>
								)}
							</div>
							<div className="flex-1 min-w-0">
								<p className="font-semibold text-white truncate">
									{profile.discord_username}
								</p>
								<p className="text-[10px] text-zinc-500">
									{profile.is_online
										? "En línea"
										: `Desconectado · ${formatLastSeen(profile.last_online_at)}`}
								</p>
							</div>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							{getRoleBadge(profile.role_level)}
							<span className="text-[10px] text-zinc-500 uppercase tracking-[0.3em]">
								Alta {formatDate(profile.created_at)}
							</span>
						</div>
						<Button asChild variant="outline" className="w-full">
							<Link
								href={`/zona-raider/configuracion/cuentas/${profile.user_id}`}
							>
								Ver ficha
							</Link>
						</Button>
					</div>
				))}

				{filteredProfiles.length > itemsPerPage && (
					<div className="flex items-center justify-between gap-4 py-4 px-2">
						<Button
							variant="outline"
							size="sm"
							disabled={currentPage === 1}
							onClick={() =>
								setViewState((prev) => ({
									...prev,
									currentPage: Math.max(1, prev.currentPage - 1),
								}))
							}
						>
							Anterior
						</Button>
						<span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
							Página {currentPage} de {totalPages}
						</span>
						<Button
							variant="outline"
							size="sm"
							disabled={currentPage === totalPages}
							onClick={() =>
								setViewState((prev) => ({
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

			{/* Desktop table */}
			<div className="hidden lg:block rounded-3xl border border-white/[0.08] bg-zinc-950/40 backdrop-blur-xl overflow-hidden w-full shadow-2xl ring-1 ring-white/5">
				<Table>
					<TableHeader className="bg-white/[0.03]">
						<TableRow className="hover:bg-transparent border-white/[0.05]">
							<TableHead
								className="h-14 pl-8 uppercase tracking-[0.2em] text-[10px] font-semibold text-white/40 text-left"
								aria-sort={resolveAriaSort(
									sortColumn,
									"discord_username",
									sortDirection,
								)}
							>
								<button
									type="button"
									className="inline-flex items-center gap-2 transition-colors hover:text-white focus-visible:text-white"
									onClick={() => handleSort("discord_username")}
								>
									Usuario {getSortIcon("discord_username")}
								</button>
							</TableHead>
							<TableHead
								className="uppercase tracking-[0.2em] text-[10px] font-semibold text-white/40 text-left"
								aria-sort={resolveAriaSort(
									sortColumn,
									"role_level",
									sortDirection,
								)}
							>
								<button
									type="button"
									className="inline-flex items-center gap-2 transition-colors hover:text-white focus-visible:text-white"
									onClick={() => handleSort("role_level")}
								>
									Rol actual {getSortIcon("role_level")}
								</button>
							</TableHead>
							<TableHead
								className="uppercase tracking-[0.2em] text-[10px] font-semibold text-white/40 text-left"
								aria-sort={resolveAriaSort(
									sortColumn,
									"created_at",
									sortDirection,
								)}
							>
								<button
									type="button"
									className="inline-flex items-center gap-2 transition-colors hover:text-white focus-visible:text-white"
									onClick={() => handleSort("created_at")}
								>
									Registro {getSortIcon("created_at")}
								</button>
							</TableHead>
							<TableHead className="text-right pr-8 uppercase tracking-[0.2em] text-[10px] font-semibold text-white/40">
								Acciones
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{paginatedProfiles.map((profile) => (
							<TableRow key={profile.user_id} className="border-white/[0.05]">
								<TableCell className="pl-8">
									<div className="flex items-center gap-4">
										<div className="relative size-11 rounded-full overflow-hidden border-2 border-white/10 bg-zinc-900 shadow-xl">
											{profile.discord_avatar ? (
												<Image
													src={profile.discord_avatar}
													alt="Avatar"
													fill
													sizes="44px"
													className="object-cover"
												/>
											) : (
												<div className="flex items-center justify-center h-full">
													<IconBrandDiscord className="size-6 text-white/10" />
												</div>
											)}
										</div>
										<div className="flex flex-col min-w-0">
											<span className="font-semibold text-white tracking-tight text-base">
												{profile.discord_username}
											</span>
											<span className="text-[10px] text-zinc-500">
												{profile.is_online
													? "En línea · Ahora"
													: `Desconectado · ${formatLastSeen(profile.last_online_at)}`}
											</span>
										</div>
									</div>
								</TableCell>
								<TableCell className="text-left">
									{getRoleBadge(profile.role_level)}
								</TableCell>
								<TableCell className="text-left">
									<div className="flex flex-col">
										<span className="text-white/90 font-medium">
											{formatDate(profile.created_at)}
										</span>
										<span className="text-[10px] text-white/40 uppercase tracking-[0.3em]">
											Fecha alta
										</span>
									</div>
								</TableCell>
								<TableCell className="text-right pr-8">
									<Button
										asChild
										variant="outline"
										className="rounded-xl h-10 px-4 border-white/10 bg-white/5"
									>
										<Link
											href={`/zona-raider/configuracion/cuentas/${profile.user_id}`}
										>
											<IconExternalLink className="size-4 mr-2" /> Ver ficha
										</Link>
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			{filteredProfiles.length > itemsPerPage && (
				<div className="hidden lg:flex items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
					<Button
						variant="outline"
						size="sm"
						disabled={currentPage === 1}
						onClick={() =>
							setViewState((prev) => ({
								...prev,
								currentPage: Math.max(1, prev.currentPage - 1),
							}))
						}
						className="bg-white/5 border-white/10 text-white"
					>
						Anterior
					</Button>
					<span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
						Página {currentPage} de {totalPages}
					</span>
					<Button
						variant="outline"
						size="sm"
						disabled={currentPage === totalPages}
						onClick={() =>
							setViewState((prev) => ({
								...prev,
								currentPage: Math.min(totalPages, prev.currentPage + 1),
							}))
						}
						className="bg-white/5 border-white/10 text-white"
					>
						Siguiente
					</Button>
				</div>
			)}

			{filteredProfiles.length === 0 && (
				<div className="p-12 text-center text-zinc-500 italic font-medium bg-zinc-950/20 rounded-3xl border border-dashed border-white/5">
					No se encontraron usuarios que coincidan con la búsqueda.
				</div>
			)}
		</div>
	);
}
