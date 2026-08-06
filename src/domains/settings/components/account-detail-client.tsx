"use client";

import { useReducer, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/shared/tailwind/tailwind-utils";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Checkbox } from "@/shared/ui/checkbox";
import { Textarea } from "@/shared/ui/textarea";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/ui/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
	IconBan,
	IconCheck,
	IconChevronDown,
	IconRotate,
	IconTrash,
	IconUsers,
	IconShieldCheck,
	IconClockCheck,
} from "@/shared/ui/tabler-icons";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/dialog";
import type { AppRole } from "@/shared/types/auth";
import { RAIDER_VERIFIED_ROLE_ID } from "@/shared/constants/raider-rules";

type Profile = {
	user_id: string;
	discord_username: string;
	discord_user_id: string;
	discord_avatar: string | null;
	role_level: string;
	battlenet_battletag: string | null;
	battlenet_id: string | null;
	main_character_id?: string | null;
	discord_refresh_token: string | null;
	tokens_invalidated: boolean;
	created_at: string;
	last_verification_check: string | null;
	is_banned: boolean;
	ban_reason: string | null;
	ban_expires_at: string | null;
	officer_notes: string | null;
	raider_rules_accepted_at?: string | null;
	raider_rules_accepted_version?: string | null;
	raider_rules_discord_role_assigned_at?: string | null;
	raider_rules_discord_role_status?: string | null;
	raider_rules_discord_role_error?: string | null;
	raider_rules_discord_role_last_attempt_at?: string | null;
	is_online?: boolean;
	last_online_at?: string | null;
	verification_status?: {
		discord?: boolean;
		bnet?: boolean;
		discordRoles?: string[];
	} | null;
};

type Character = {
	id: string;
	name: string;
	realm?: string | null;
	realm_slug: string;
	class_id: number;
	spec?: string | null;
	spec_name?: string | null;
	role?: string | null;
	item_level?: number | null;
	region?: string | null;
	thumbnail_url?: string | null;
};

type Application = {
	id: string;
	status: string;
	character_name: string;
	character_class?: string | null;
	character_spec?: string | null;
	created_at: string;
	updated_at: string;
};

type Props = {
	initialProfile: Profile;
	characters: Character[];
	applications: Application[];
	canEdit: boolean;
	canManage: boolean;
	roleCatalog: AppRole[];
	initialDiscordRoleOptions: Array<{
		id: string;
		name: string;
		position: number;
		managed: boolean;
	}>;
	initialDiscordMemberRoleIds: string[];
	discordRoleManagerError?: string | null;
	charactersErrorMessage?: string | null;
};

type UiState = {
	savingProfile: boolean;
	action: string | null;
	isBanModalOpen: boolean;
	discordRoleAction: string | null;
	savingMainCharacterId: string | null;
};

type UiAction = {
	type: "merge";
	value: Partial<UiState>;
};

const initialUiState: UiState = {
	savingProfile: false,
	action: null,
	isBanModalOpen: false,
	discordRoleAction: null,
	savingMainCharacterId: null,
};

function uiReducer(state: UiState, action: UiAction): UiState {
	switch (action.type) {
		case "merge":
			return { ...state, ...action.value };
		default:
			return state;
	}
}

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
	day: "2-digit",
	month: "short",
	year: "numeric",
	timeZone: "UTC",
});

const applicationCreatedAtLabel = (createdAt: string) =>
	dateFormatter.format(new Date(createdAt));

const formatRelative = (iso?: string | null) => {
	if (!iso) return "Última actividad sin registros recientes";
	const diff = Date.now() - new Date(iso).getTime();
	if (diff < 60 * 1000) return "Última actividad hace <1 minuto";
	if (diff < 60 * 60 * 1000) {
		const minutes = Math.floor(diff / (60 * 1000));
		return `Última actividad hace ${minutes} minuto${minutes === 1 ? "" : "s"}`;
	}
	if (diff < 24 * 60 * 60 * 1000) {
		const hours = Math.floor(diff / (60 * 60 * 1000));
		return `Última actividad hace ${hours} hora${hours === 1 ? "" : "s"}`;
	}
	const days = Math.floor(diff / (24 * 60 * 60 * 1000));
	if (days < 7) {
		return `Última actividad hace ${days} día${days === 1 ? "" : "s"}`;
	}
	return `Última actividad el ${dateFormatter.format(new Date(iso))}`;
};

async function doSaveProfile(
	userId: string,
	payload: Record<string, any>,
): Promise<{ success: boolean; error?: string }> {
	try {
		const res = await fetch(`/api/admin/accounts/${userId}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});
		if (!res.ok) {
			const data = await res.json();
			return { success: false, error: data.error || "No se pudo guardar" };
		}
		return { success: true };
	} catch (error: any) {
		return { success: false, error: error.message || "No se pudo guardar" };
	}
}

async function doSetMainCharacter(
	userId: string,
	characterId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const res = await fetch(`/api/admin/accounts/${userId}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ main_character_id: characterId }),
		});
		if (!res.ok) {
			const data = await res.json();
			return { success: false, error: data.error || "No se pudo guardar" };
		}
		return { success: true };
	} catch (error: any) {
		return { success: false, error: error.message || "No se pudo guardar" };
	}
}

async function doUpdateRole(
	userId: string,
	role: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const res = await fetch("/api/admin/system/update-role", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userId, role }),
		});
		if (!res.ok) {
			const data = await res.json();
			return {
				success: false,
				error: data.error || "No se pudo actualizar el rol",
			};
		}
		const data = await res.json();
		if (!data.success) {
			return {
				success: false,
				error: data.error || "No se pudo actualizar el rol",
			};
		}
		return { success: true };
	} catch (error: any) {
		return {
			success: false,
			error: error.message || "No se pudo actualizar el rol",
		};
	}
}

async function doVerifyUser(
	userId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const res = await fetch("/api/admin/system/verify-user", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userId }),
		});
		if (!res.ok) {
			const data = await res.json();
			return { success: false, error: data.error || "No se pudo verificar" };
		}
		const data = await res.json();
		if (!data.success) {
			return { success: false, error: data.error || "No se pudo verificar" };
		}
		return { success: true };
	} catch (error: any) {
		return { success: false, error: error.message || "No se pudo verificar" };
	}
}

async function doDeleteUser(
	userId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const res = await fetch("/api/admin/system/delete-user", {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userId }),
		});
		if (!res.ok) {
			const data = await res.json();
			return { success: false, error: data.error || "No se pudo eliminar" };
		}
		const data = await res.json();
		if (!data.success) {
			return { success: false, error: data.error || "No se pudo eliminar" };
		}
		return { success: true };
	} catch (error: any) {
		return { success: false, error: error.message || "No se pudo eliminar" };
	}
}

async function doBanUser(
	userId: string,
	reason: string,
	expiresAt: string | null,
): Promise<{ success: boolean; error?: string }> {
	try {
		const res = await fetch("/api/admin/system/ban-user", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				userId,
				reason,
				expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
			}),
		});
		if (!res.ok) {
			const data = await res.json();
			return { success: false, error: data.error || "No se pudo banear" };
		}
		const data = await res.json();
		if (!data.success) {
			return { success: false, error: data.error || "No se pudo banear" };
		}
		return { success: true };
	} catch (error: any) {
		return { success: false, error: error.message || "No se pudo banear" };
	}
}

async function doUnbanUser(
	userId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const res = await fetch("/api/admin/system/unban-user", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userId }),
		});
		if (!res.ok) {
			const data = await res.json();
			return {
				success: false,
				error: data.error || "No se pudo levantar el baneo",
			};
		}
		const data = await res.json();
		if (!data.success) {
			return {
				success: false,
				error: data.error || "No se pudo levantar el baneo",
			};
		}
		return { success: true };
	} catch (error: any) {
		return {
			success: false,
			error: error.message || "No se pudo levantar el baneo",
		};
	}
}

async function doToggleDiscordRole(
	userId: string,
	roleId: string,
	assign: boolean,
): Promise<{ success: boolean; error?: string; memberRoleIds?: string[] }> {
	try {
		const res = await fetch(`/api/admin/accounts/${userId}/discord-roles`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ roleId, assign }),
		});
		if (!res.ok) {
			const data = await res.json();
			return {
				success: false,
				error: data.error || "No se pudo actualizar el rol en Discord",
			};
		}
		const data = await res.json();
		if (!data.success) {
			return {
				success: false,
				error: data.error || "No se pudo actualizar el rol en Discord",
			};
		}
		return { success: true, memberRoleIds: data.memberRoleIds || [] };
	} catch (error: any) {
		return {
			success: false,
			error: error.message || "No se pudo actualizar el rol en Discord",
		};
	}
}

export function AccountDetailClient(props: Props) {
	return useAccountDetailClient(props);
}

function useAccountDetailClient({
	initialProfile,
	characters,
	applications,
	canEdit,
	canManage,
	roleCatalog,
	initialDiscordRoleOptions,
	initialDiscordMemberRoleIds,
	discordRoleManagerError,
	charactersErrorMessage,
}: Props) {
	const router = useRouter();
	const profile = initialProfile;
	const [draft, setDraft] = useState(() => ({
		notes: initialProfile.officer_notes || "",
		battletag: initialProfile.battlenet_battletag || "",
		banReason: initialProfile.ban_reason || "",
		banExpiresAt: "",
		memberDiscordRoleIds: initialDiscordMemberRoleIds,
		discordRoleError: discordRoleManagerError ?? null,
		currentCharacterPage: 1,
	}));
	const [ui, updateUi] = useReducer(uiReducer, initialUiState);
	const savingProfile = ui.savingProfile;
	const action = ui.action;
	const isBanModalOpen = ui.isBanModalOpen;
	const discordRoleAction = ui.discordRoleAction;
	const savingMainCharacterId = ui.savingMainCharacterId;
	const setIsBanModalOpen = (value: boolean) =>
		updateUi({ type: "merge", value: { isBanModalOpen: value } });

	const roleMap = (() => {
		const map: Record<string, AppRole> = {};
		roleCatalog.forEach((role) => {
			map[role.level] = role;
		});
		return map;
	})();

	const roleOptions = roleCatalog.toSorted((a, b) => b.priority - a.priority);

	const sortedCharacters = characters.toSorted((a, b) => {
		const aMain = a.id === profile.main_character_id;
		const bMain = b.id === profile.main_character_id;

		if (aMain !== bMain) return aMain ? -1 : 1;

		return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
	});

	const charactersPerPage = 10;
	const totalCharacterPages = Math.max(
		1,
		Math.ceil(sortedCharacters.length / charactersPerPage),
	);

	// Derive effective page during render — resets when user identity changes (profile.user_id in deps)
	const effectivePage = (() => {
		const page = draft.currentCharacterPage;
		if (page < 1) return 1;
		if (page > totalCharacterPages) return totalCharacterPages;
		return page;
	})();

	const paginatedCharacters = sortedCharacters.slice(
		(effectivePage - 1) * charactersPerPage,
		effectivePage * charactersPerPage,
	);

	const saveProfile = async (payload: Record<string, any>, message: string) => {
		updateUi({ type: "merge", value: { savingProfile: true } });
		const result = await doSaveProfile(profile.user_id, payload);
		if (result.success) {
			toast.success(message);
			router.refresh();
		} else {
			toast.error("Error al guardar", { description: result.error });
		}
		updateUi({ type: "merge", value: { savingProfile: false } });
	};

	const handleSetMainCharacter = async (characterId: string) => {
		if (characterId === profile.main_character_id) return;

		updateUi({ type: "merge", value: { savingMainCharacterId: characterId } });
		const result = await doSetMainCharacter(profile.user_id, characterId);
		if (result.success) {
			toast.success("Personaje principal actualizado");
			router.refresh();
		} else {
			toast.error("Error al guardar", { description: result.error });
		}
		updateUi({ type: "merge", value: { savingMainCharacterId: null } });
	};

	const handleUpdateRole = async (newRole: string) => {
		updateUi({ type: "merge", value: { action: "role" } });
		const result = await doUpdateRole(profile.user_id, newRole);
		if (result.success) {
			toast.success(`Rol asignado como ${newRole.toUpperCase()}`);
			router.refresh();
		} else {
			toast.error("Error", { description: result.error });
		}
		updateUi({ type: "merge", value: { action: null } });
	};

	const handleVerify = async () => {
		updateUi({ type: "merge", value: { action: "verify" } });
		const result = await doVerifyUser(profile.user_id);
		if (result.success) {
			toast.success("Usuario verificado correctamente");
			router.refresh();
		} else {
			toast.error("Error", { description: result.error });
		}
		updateUi({ type: "merge", value: { action: null } });
	};

	const handleDelete = async () => {
		const first = confirm(
			`¿Seguro que quieres eliminar permanentemente a ${profile.discord_username}?`,
		);
		if (!first) return;
		const second = confirm(
			"Esta acción borrará todos los datos asociados y no se puede deshacer. ¿Continuar?",
		);
		if (!second) return;

		updateUi({ type: "merge", value: { action: "delete" } });
		const result = await doDeleteUser(profile.user_id);
		if (result.success) {
			toast.success("Usuario eliminado");
			router.push("/zona-raider/configuracion/cuentas");
		} else {
			toast.error("Error", { description: result.error });
		}
		updateUi({ type: "merge", value: { action: null } });
	};

	const handleBanSubmit = async () => {
		updateUi({ type: "merge", value: { action: "ban" } });
		const result = await doBanUser(
			profile.user_id,
			draft.banReason || "Acceso bloqueado por los administradores.",
			draft.banExpiresAt || null,
		);
		if (result.success) {
			toast.success("Usuario baneado");
			updateUi({ type: "merge", value: { isBanModalOpen: false } });
			router.refresh();
		} else {
			toast.error("Error", { description: result.error });
		}
		updateUi({ type: "merge", value: { action: null } });
	};

	const handleUnban = async () => {
		updateUi({ type: "merge", value: { action: "unban" } });
		const result = await doUnbanUser(profile.user_id);
		if (result.success) {
			toast.success("Baneo levantado");
			router.refresh();
		} else {
			toast.error("Error", { description: result.error });
		}
		updateUi({ type: "merge", value: { action: null } });
	};

	const raiderRulesHasLegacyDiscordRole = Boolean(
		profile.verification_status?.discordRoles?.includes(
			RAIDER_VERIFIED_ROLE_ID,
		) || profile.raider_rules_discord_role_status === "assigned",
	);
	const raiderRulesAccepted =
		Boolean(profile.raider_rules_accepted_at) ||
		raiderRulesHasLegacyDiscordRole;
	const quickActionsDisabled = !(canEdit || canManage);
	const createdAtLabel = dateFormatter.format(new Date(profile.created_at));
	const lastVerificationLabel = profile.last_verification_check
		? formatRelative(profile.last_verification_check)
		: "Nunca";
	const presenceLabel = profile.is_online
		? "Activo ahora"
		: profile.last_online_at
			? `Último ping ${formatRelative(profile.last_online_at)}`
			: "Último ping pendiente";

	const handleToggleDiscordRole = async (roleId: string, assign: boolean) => {
		updateUi({ type: "merge", value: { discordRoleAction: roleId } });
		setDraft((prev) => ({ ...prev, discordRoleError: null }));
		const result = await doToggleDiscordRole(profile.user_id, roleId, assign);
		if (result.success) {
			setDraft((prev) => ({
				...prev,
				memberDiscordRoleIds: result.memberRoleIds || [],
			}));
			toast.success(
				assign ? "Rol asignado en Discord" : "Rol retirado de Discord",
			);
		} else {
			const message = result.error || "No se pudo actualizar el rol en Discord";
			setDraft((prev) => ({ ...prev, discordRoleError: message }));
			toast.error("Error en Discord", { description: message });
		}
		updateUi({ type: "merge", value: { discordRoleAction: null } });
	};

	return renderAccountDetailView({
		action,
		applicationCreatedAtLabel,
		applications,
		canEdit,
		canManage,
		characters,
		charactersErrorMessage,
		charactersPerPage,
		createdAtLabel,
		discordRoleAction,
		draft,
		effectivePage,
		handleBanSubmit,
		handleDelete,
		handleSetMainCharacter,
		handleToggleDiscordRole,
		handleUnban,
		handleUpdateRole,
		handleVerify,
		initialDiscordRoleOptions,
		isBanModalOpen,
		lastVerificationLabel,
		paginatedCharacters,
		presenceLabel,
		profile,
		quickActionsDisabled,
		raiderRulesAccepted,
		roleMap,
		roleOptions,
		savingMainCharacterId,
		savingProfile,
		saveProfile,
		setDraft,
		setIsBanModalOpen,
		totalCharacterPages,
	});
}

type AccountDetailViewParams = any;

function renderAccountDetailView(params: AccountDetailViewParams) {
	const {
		action,
		applicationCreatedAtLabel,
		applications,
		canEdit,
		canManage,
		characters,
		charactersErrorMessage,
		charactersPerPage,
		createdAtLabel,
		discordRoleAction,
		draft,
		effectivePage,
		handleBanSubmit,
		handleDelete,
		handleSetMainCharacter,
		handleToggleDiscordRole,
		handleUnban,
		handleUpdateRole,
		handleVerify,
		initialDiscordRoleOptions,
		isBanModalOpen,
		lastVerificationLabel,
		paginatedCharacters,
		presenceLabel,
		profile,
		quickActionsDisabled,
		raiderRulesAccepted,
		roleMap,
		roleOptions,
		savingMainCharacterId,
		savingProfile,
		saveProfile,
		setDraft,
		setIsBanModalOpen,
		totalCharacterPages,
	} = params;

	return (
		<div className="space-y-6">
			<div className="grid gap-4 lg:grid-cols-3">
				<Card className="bg-zinc-950/40 border-white/5">
					<CardContent className="p-6 flex items-start gap-4">
						<div className="relative size-20 shrink-0 rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-zinc-900 mt-1">
							{profile.discord_avatar ? (
								<Image
									src={profile.discord_avatar}
									alt={profile.discord_username}
									fill
									sizes="80px"
									className="object-cover"
								/>
							) : (
								<div className="flex items-center justify-center h-full">
									<IconUsers className="size-8 text-white/10" />
								</div>
							)}
						</div>
						<div className="flex w-full flex-col gap-2">
							<div className="flex items-center gap-2 flex-wrap">
								<h2 className="text-xl font-semibold text-white">
									{profile.discord_username}
								</h2>
								<Badge
									variant="outline"
									className="uppercase tracking-[0.3em]"
									style={
										roleMap[profile.role_level]
											? {
													borderColor: roleMap[profile.role_level].color,
													color: roleMap[profile.role_level].color,
												}
											: undefined
									}
								>
									{roleMap[profile.role_level]?.label || profile.role_level}
								</Badge>
							</div>
							<p className="text-xs uppercase tracking-[0.4em] text-white/40">
								{presenceLabel}
							</p>
							<p className="text-sm text-white/60">
								Discord ID: {profile.discord_user_id}
							</p>

							<div className="mt-4 rounded-2xl border border-white/10 bg-zinc-950/20 p-4 space-y-3">
								<p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-white/50">
									Acciones de la cuenta
								</p>
								<div className="flex flex-col gap-3">
									{canManage && (
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="outline"
													className="w-full justify-start gap-2"
													disabled={action === "role"}
												>
													<IconChevronDown className="size-4" />
													Cambiar rol
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent className="w-48 bg-zinc-950 border-white/10">
												<DropdownMenuLabel className="text-[9px] uppercase tracking-[0.3em] text-white/40">
													Selecciona nivel
												</DropdownMenuLabel>
												<DropdownMenuSeparator className="bg-white/10 my-1" />
												{roleOptions.map((role: AppRole) => (
													<DropdownMenuItem
														key={role.level}
														onClick={() => handleUpdateRole(role.level)}
														className={cn(
															"uppercase text-[10px] font-semibold tracking-[0.3em]",
															role.level === profile.role_level
																? "text-primary"
																: "text-white/70",
														)}
													>
														{role.label}
													</DropdownMenuItem>
												))}
											</DropdownMenuContent>
										</DropdownMenu>
									)}
									<Button
										variant="outline"
										className="w-full justify-start gap-2"
										onClick={handleVerify}
										disabled={action === "verify" || quickActionsDisabled}
									>
										<IconRotate
											className={cn(
												"size-4",
												action === "verify" && "animate-spin",
											)}
										/>
										Forzar verificación
									</Button>
									<Button
										variant={profile.is_banned ? "default" : "destructive"}
										className="w-full justify-start gap-2"
										onClick={() =>
											profile.is_banned
												? handleUnban()
												: setIsBanModalOpen(true)
										}
										disabled={
											action === "ban" ||
											action === "unban" ||
											quickActionsDisabled
										}
									>
										{profile.is_banned ? (
											<IconCheck className="size-4" />
										) : (
											<IconBan className="size-4" />
										)}
										{profile.is_banned ? "Quitar baneo" : "Banear usuario"}
									</Button>
									<Button
										variant="outline"
										className="w-full justify-start gap-2"
										onClick={handleDelete}
										disabled={action === "delete"}
									>
										<IconTrash className="size-4" />
										Eliminar cuenta
									</Button>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-zinc-950/40 border-white/5">
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-semibold uppercase tracking-[0.4em] text-white/50">
							Listado vinculaciones
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4 text-sm text-white/80">
						<div className="flex items-center justify-between">
							<span>Discord OAuth</span>
							<Badge
								variant="outline"
								className={cn(
									profile.discord_refresh_token
										? "text-emerald-400 border-emerald-500/40"
										: "text-rose-400 border-rose-500/40",
								)}
							>
								{profile.discord_refresh_token ? "Activo" : "Inactivo"}
							</Badge>
						</div>
						<div className="flex items-center justify-between">
							<span>Battle.net</span>
							<Badge
								variant="outline"
								className={cn(
									profile.battlenet_id
										? "text-amber-300 border-amber-400/40"
										: "text-rose-400 border-rose-500/40",
								)}
							>
								{profile.battlenet_id ? "Vinculado" : "No vinculado"}
							</Badge>
						</div>
						<div className="flex items-center justify-between gap-3">
							<div className="flex items-center gap-2">
								<IconShieldCheck className="size-4 text-cyan-300" />
								<span>Normativa Raider</span>
							</div>
							<Badge
								variant="outline"
								className={cn(
									raiderRulesAccepted
										? "text-emerald-400 border-emerald-500/40"
										: "text-amber-300 border-amber-400/40",
								)}
							>
								{raiderRulesAccepted ? "Aceptada" : "Pendiente"}
							</Badge>
						</div>
						{raiderRulesAccepted ? (
							<div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-100 space-y-1">
								<p className="flex items-center gap-2 font-semibold uppercase tracking-[0.3em]">
									<IconClockCheck className="size-4" />
									Rol Discord:{" "}
									{profile.raider_rules_discord_role_status === "assigned"
										? "Asignado"
										: profile.raider_rules_discord_role_status === "pending"
											? "Pendiente"
											: "Sin estado"}
								</p>
								{profile.raider_rules_discord_role_error ? (
									<p className="text-rose-100/80">
										Error: {profile.raider_rules_discord_role_error}
									</p>
								) : null}
							</div>
						) : (
							<div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-100">
								El trial todavía no ha aceptado la normativa de Raiders.
							</div>
						)}
					</CardContent>
				</Card>

				<Card className="bg-zinc-950/40 border-white/5">
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-semibold uppercase tracking-[0.4em] text-white/50">
							Actividad
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3 text-sm text-white/80">
						<div>
							<p className="text-white/50 text-xs uppercase tracking-[0.3em]">
								Creado
							</p>
							<p>{createdAtLabel}</p>
						</div>
						<div>
							<p className="text-white/50 text-xs uppercase tracking-[0.3em]">
								Última verificación
							</p>
							<p>{lastVerificationLabel}</p>
						</div>
						{profile.is_banned && (
							<div className="text-rose-400 bg-rose-500/10 rounded-xl border border-rose-500/20 p-3 text-xs">
								<p className="font-semibold uppercase tracking-[0.3em] mb-1">
									Baneado
								</p>
								<p>{profile.ban_reason || "Acceso bloqueado"}</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<Card className="bg-zinc-950/40 border-white/5">
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-semibold uppercase tracking-[0.4em] text-white/50">
							Roles de Discord
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4 text-sm text-white/80">
						<div className="space-y-2">
							<div className="flex items-center justify-between gap-2">
								<span>Roles del miembro en Discord</span>
								<Badge variant="outline" className="text-[10px] uppercase">
									{draft.memberDiscordRoleIds.length} activos
								</Badge>
							</div>

							{draft.discordRoleError ? (
								<div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-100">
									{draft.discordRoleError}
								</div>
							) : null}

							{!draft.discordRoleError &&
							initialDiscordRoleOptions.length === 0 ? (
								<p className="text-xs text-white/50">
									No hay roles asignables disponibles en el servidor.
								</p>
							) : null}

							<div className="max-h-56 w-full overflow-y-auto space-y-2 rounded-2xl border border-white/10 bg-zinc-950/30 p-2 pr-1 shadow-inner shadow-black/30">
								{(() => {
									const memberRoleIdSet = new Set(draft.memberDiscordRoleIds);
									return initialDiscordRoleOptions.map((role: any) => {
										const checked = memberRoleIdSet.has(role.id);
										const disabled =
											!canManage || discordRoleAction === role.id;
										return (
											<label
												key={role.id}
												className={cn(
													"flex w-full items-center justify-between rounded-xl border px-3 py-2 text-xs",
													checked
														? "border-cyan-500/30 bg-cyan-500/5 text-cyan-100"
														: "border-white/10 bg-zinc-950/20 text-white/70",
													disabled && "opacity-70",
												)}
											>
												<span className="truncate pr-3">{role.name}</span>
												<Checkbox
													checked={checked}
													disabled={disabled}
													onCheckedChange={(nextValue) =>
														handleToggleDiscordRole(role.id, Boolean(nextValue))
													}
												/>
											</label>
										);
									});
								})()}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-zinc-950/40 border-white/5">
					<CardHeader>
						<CardTitle className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">
							BattleTag y notas
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<label
								htmlFor="account-detail-battletag"
								className="text-xs uppercase tracking-[0.3em] text-white/40"
							>
								BattleTag
							</label>
							<Input
								id="account-detail-battletag"
								value={draft.battletag}
								onChange={(e) =>
									setDraft((prev: any) => ({
										...prev,
										battletag: e.target.value,
									}))
								}
								placeholder="Nombre#0000"
								className="bg-white/5 border-white/10"
								disabled={!canEdit}
							/>
							<Button
								size="sm"
								className="mt-2"
								disabled={savingProfile || !canEdit}
								onClick={() =>
									saveProfile(
										{ battlenet_battletag: draft.battletag },
										"BattleTag actualizado",
									)
								}
							>
								Guardar cambios
							</Button>
						</div>
						<div className="space-y-2">
							<label
								htmlFor="account-detail-notes"
								className="text-xs uppercase tracking-[0.3em] text-white/40"
							>
								Notas internas
							</label>
							<Textarea
								id="account-detail-notes"
								value={draft.notes}
								onChange={(e) =>
									setDraft((prev: any) => ({ ...prev, notes: e.target.value }))
								}
								className="bg-white/5 border-white/10"
								rows={4}
								placeholder="Observaciones visibles solo por oficiales"
								disabled={!canEdit}
							/>
							<Button
								size="sm"
								disabled={savingProfile || !canEdit}
								onClick={() =>
									saveProfile({ officer_notes: draft.notes }, "Notas guardadas")
								}
							>
								Guardar notas
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>

			<Card className="bg-zinc-950/40 border-white/5 lg:col-span-2">
				<CardHeader>
					<CardTitle className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">
						Personajes vinculados
					</CardTitle>
				</CardHeader>
				<CardContent>
					{charactersErrorMessage ? (
						<div className="mb-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-100">
							No se pudieron cargar los personajes: {charactersErrorMessage}
						</div>
					) : null}

					{characters.length === 0 ? (
						<p className="text-sm text-white/60">Sin personajes asociados.</p>
					) : (
						<>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Nombre</TableHead>
										<TableHead className="w-24">Reino</TableHead>
										<TableHead className="text-right">Principal</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{paginatedCharacters.map((char: any) => (
										<TableRow
											key={char.id}
											className={cn(
												profile.main_character_id === char.id &&
													"bg-emerald-500/10 border-emerald-500/30",
											)}
										>
											<TableCell className="font-bold text-white">
												{char.name || "—"}
											</TableCell>
											<TableCell className="uppercase text-white/60">
												{char.realm_slug || "—"}
											</TableCell>
											<TableCell className="text-right">
												{profile.main_character_id === char.id ? (
													<Badge
														variant="outline"
														className="border-emerald-500/40 text-emerald-300"
													>
														Principal
													</Badge>
												) : (
													<Button
														size="sm"
														variant="outline"
														className="h-8"
														disabled={
															!canManage || savingMainCharacterId === char.id
														}
														onClick={() => handleSetMainCharacter(char.id)}
													>
														{savingMainCharacterId === char.id
															? "Guardando..."
															: "Marcar"}
													</Button>
												)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
							{characters.length > charactersPerPage ? (
								<div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											setDraft((prev: any) => ({
												...prev,
												currentCharacterPage: effectivePage - 1,
											}))
										}
										disabled={effectivePage <= 1}
									>
										Anterior
									</Button>
									<span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/50">
										Página {effectivePage} de {totalCharacterPages}
									</span>
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											setDraft((prev: any) => ({
												...prev,
												currentCharacterPage: effectivePage + 1,
											}))
										}
										disabled={effectivePage >= totalCharacterPages}
									>
										Siguiente
									</Button>
								</div>
							) : null}
						</>
					)}
				</CardContent>
			</Card>

			{applications.length > 0 ? (
				<Card className="bg-zinc-950/40 border-white/5">
					<CardHeader>
						<CardTitle className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">
							Solicitudes de reclutamiento
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{applications.map((app: any) => (
							<div
								key={app.id}
								className="bg-white/5 border border-white/10 rounded-2xl p-4"
							>
								<div className="flex justify-between text-sm">
									<span className="font-bold">{app.character_name}</span>
									<Badge variant="outline">{app.status}</Badge>
								</div>
								<p className="text-white/60 text-xs mt-1">
									{app.character_spec ||
										app.character_class ||
										"Sin especialización"}
								</p>
								<p className="text-white/40 text-xs mt-2">
									Creada {applicationCreatedAtLabel(app.created_at)}
								</p>
							</div>
						))}
					</CardContent>
				</Card>
			) : null}

			<Dialog open={isBanModalOpen} onOpenChange={setIsBanModalOpen}>
				<DialogContent className="bg-zinc-950 border-white/10 text-white">
					<DialogHeader>
						<DialogTitle>Banear usuario</DialogTitle>
						<DialogDescription>
							Define un motivo y una fecha de expiración opcional.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3">
						<Textarea
							value={draft.banReason}
							onChange={(e) =>
								setDraft((prev: any) => ({
									...prev,
									banReason: e.target.value,
								}))
							}
							className="bg-white/5 border-white/10"
							rows={4}
							placeholder="Motivo del baneo"
						/>
						<Input
							type="datetime-local"
							value={draft.banExpiresAt}
							onChange={(e) =>
								setDraft((prev: any) => ({
									...prev,
									banExpiresAt: e.target.value,
								}))
							}
							className="bg-white/5 border-white/10"
						/>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setIsBanModalOpen(false)}>
							Cancelar
						</Button>
						<Button onClick={handleBanSubmit} disabled={action === "ban"}>
							Confirmar
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
