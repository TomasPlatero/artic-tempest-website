"use client";

import { useEffect, useReducer } from "react";
import { toast } from "sonner";
import { IconArrowLeft, IconEye, IconEyeOff } from "@/shared/ui/tabler-icons";
import { Button } from "@/shared/ui/button";
import Link from "next/link";
import { SettingsGeneralGuildCard } from "./settings-general-guild-card";
import { Switch } from "@/shared/ui/switch";
import { MediaPicker } from "@/domains/media/components/media-picker";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/card";
import type {
	CredentialsData,
	GuildInfo,
	PermissionState,
	SettingsGeneralState,
} from "./settings-general.types";
import type { MediaFile } from "@/domains/media/types";

type SettingsGeneralClientProps = {
	guild: GuildInfo | null;
	credentials: CredentialsData;
	tourEnabled: boolean;
	permissions: {
		general: PermissionState;
	};
};

type SettingsGeneralAction =
	| {
			type: "sync-from-props";
			guild: GuildInfo | null;
			tourEnabled: boolean;
	  }
	| { type: "update-version"; version: string }
	| { type: "toggle-tour" }
	| {
			type: "update-guild-field";
			field: keyof SettingsGeneralState["guildInfo"];
			value: string;
	  }
	| {
			type: "set-picker";
			target: "main" | "mobile" | "public" | null;
	  }
	| {
			type: "set-uploading";
			target: "main" | "mobile" | "public";
			value: boolean;
	  }
	| {
			type: "set-saving";
			target: "version" | "guild" | "tour";
			value: boolean;
	  };

type GeneralHeaderProps = {
	title: string;
	description: string;
};

const createSettingsGeneralState = (
	guild: GuildInfo | null,
	tourEnabled: boolean,
): SettingsGeneralState => ({
	uploading: false,
	uploadingMobile: false,
	uploadingPublic: false,
	activePicker: null,
	version: guild?.version || "Zona Raider",
	savingVersion: false,
	tourEnabled,
	savingTour: false,
	guildInfo: {
		name: guild?.name || "",
		realm: guild?.realm || "",
		region: guild?.region || "eu",
	},
	savingGuild: false,
});

const settingsGeneralReducer = (
	state: SettingsGeneralState,
	action: SettingsGeneralAction,
): SettingsGeneralState => {
	switch (action.type) {
		case "sync-from-props":
			return createSettingsGeneralState(action.guild, action.tourEnabled);
		case "update-version":
			return { ...state, version: action.version };
		case "toggle-tour":
			return { ...state, tourEnabled: !state.tourEnabled };
		case "update-guild-field":
			return {
				...state,
				guildInfo: { ...state.guildInfo, [action.field]: action.value },
			};
		case "set-picker":
			return { ...state, activePicker: action.target };
		case "set-uploading":
			if (action.target === "main")
				return { ...state, uploading: action.value };
			if (action.target === "mobile")
				return { ...state, uploadingMobile: action.value };
			return { ...state, uploadingPublic: action.value };
		case "set-saving":
			return {
				...state,
				savingVersion:
					action.target === "version" ? action.value : state.savingVersion,
				savingGuild:
					action.target === "guild" ? action.value : state.savingGuild,
				savingTour: action.target === "tour" ? action.value : state.savingTour,
			};
		default:
			return state;
	}
};

async function doSaveGuildInfo(
	guildInfo: SettingsGeneralState["guildInfo"],
): Promise<{ success: boolean; error?: string }> {
	try {
		const res = await fetch("/api/guild/settings/info", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(guildInfo),
		});
		if (!res.ok) throw new Error();
		return { success: true };
	} catch {
		return {
			success: false,
			error: "No se pudo actualizar la información de la hermandad.",
		};
	}
}

async function doSaveLogoImage(
	body: Record<string, string>,
): Promise<{ success: boolean; error?: string }> {
	try {
		const res = await fetch("/api/guild/settings/info", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});
		if (!res.ok) {
			const data = await res.json().catch(() => null);
			return {
				success: false,
				error: data?.error ?? "No se pudo actualizar el icono.",
			};
		}
		return { success: true };
	} catch {
		return { success: false, error: "No se pudo contactar con el servidor." };
	}
}

async function doSaveVersion(
	version: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const res = await fetch("/api/guild/settings/version", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ version }),
		});
		if (!res.ok) throw new Error();
		return { success: true };
	} catch {
		return { success: false, error: "No se pudo actualizar la versión." };
	}
}

async function doSaveTour(
	tourEnabled: boolean,
): Promise<{ success: boolean; error?: string }> {
	try {
		const res = await fetch("/api/guild/settings/tour", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ tour_enabled: tourEnabled }),
		});
		if (!res.ok) throw new Error();
		return { success: true };
	} catch {
		return {
			success: false,
			error: "No se pudo actualizar la configuración del tour.",
		};
	}
}

function GeneralHeader({ title, description }: GeneralHeaderProps) {
	return (
		<div className="flex items-center gap-6">
			<Link href="/zona-raider/configuracion">
				<Button
					variant="outline"
					size="icon"
					aria-label="Volver a configuración"
					className="size-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10  shadow-xl"
				>
					<IconArrowLeft className="size-6" />
				</Button>
			</Link>
			<div>
				<h1 className="text-3xl font-semibold font-heading italic tracking-tight uppercase flex items-center gap-3">
					{title}
				</h1>
				<p className="text-sm font-medium text-white/40 mt-2 uppercase tracking-widest">
					{description}
				</p>
			</div>
		</div>
	);
}

function toastSaveResult(
	result: { success: boolean; error?: string | null },
	successTitle: string,
	successDescription: string,
	errorTitle = "Error",
) {
	if (result.success) {
		toast.success(successTitle, { description: successDescription });
	} else {
		toast.error(errorTitle, { description: result.error });
	}
}

function buildLogoImageBody(
	pickerType: "main" | "mobile" | "public",
	fileUrl: string,
): Record<string, string> {
	if (pickerType === "mobile") return { mobile_icon_url: fileUrl };
	if (pickerType === "public") return { public_logo_url: fileUrl };
	return { icon_url: fileUrl };
}

function pickLogoSuccessDescription(
	pickerType: "main" | "mobile" | "public",
) {
	if (pickerType === "mobile")
		return "El icono para dispositivos móviles se ha guardado correctamente.";
	if (pickerType === "public")
		return "El logotipo de portada se ha guardado correctamente.";
	return "El logotipo principal de la hermandad se ha guardado correctamente.";
}

function pickTourSuccessDescription(tourEnabled: boolean) {
	return tourEnabled
		? "El tour guiado se ha activado para los nuevos usuarios."
		: "El tour guiado se ha desactivado.";
}

function pickMediaPickerTitle(pickerType: string | null) {
	if (pickerType === "mobile") return "Seleccionar icono para móvil";
	if (pickerType === "public") return "Seleccionar logotipo de portada";
	return "Seleccionar logotipo principal";
}

export function SettingsGeneralClient({
	guild,
	credentials: _initialCredentials,
	tourEnabled: initialTourEnabled,
	permissions,
}: SettingsGeneralClientProps) {
	const [state, dispatch] = useReducer(settingsGeneralReducer, undefined, () =>
		createSettingsGeneralState(guild, initialTourEnabled),
	);

	useEffect(() => {
		dispatch({
			type: "sync-from-props",
			guild,
			tourEnabled: initialTourEnabled,
		});
	}, [
		guild,
		initialTourEnabled,
		guild?.name,
		guild?.realm,
		guild?.region,
		guild?.version,
	]);

	const canEditGeneral = permissions.general.canEdit;
	const updateGuildField =
		(field: keyof SettingsGeneralState["guildInfo"]) => (value: string) => {
			dispatch({ type: "update-guild-field", field, value });
		};

	const saveGuildInfo = async () => {
		dispatch({ type: "set-saving", target: "guild", value: true });
		const result = await doSaveGuildInfo(state.guildInfo);
		toastSaveResult(
			result,
			"Información actualizada",
			"Los datos de la hermandad se han guardado correctamente.",
		);
		dispatch({ type: "set-saving", target: "guild", value: false });
	};

	const handleOpenPicker = (type: "main" | "mobile" | "public") => {
		dispatch({ type: "set-picker", target: type });
	};

	const handlePickerSelect = async (file: MediaFile) => {
		const pickerType = state.activePicker;
		if (!pickerType) return;

		dispatch({
			type: "set-uploading",
			target: pickerType,
			value: true,
		});

		const body = buildLogoImageBody(pickerType, file.url);

		const result = await doSaveLogoImage(body);
		if (result.success) {
			toast.success("Logotipo actualizado", {
				description: pickLogoSuccessDescription(pickerType),
			});
			window.location.reload();
		} else {
			toast.error("Error al actualizar logotipo", {
				description: result.error,
			});
		}

		dispatch({
			type: "set-uploading",
			target: pickerType,
			value: false,
		});
		dispatch({ type: "set-picker", target: null });
	};

	const handlePickerClose = () => {
		dispatch({ type: "set-picker", target: null });
	};

	const saveVersion = async () => {
		dispatch({ type: "set-saving", target: "version", value: true });
		const result = await doSaveVersion(state.version);
		toastSaveResult(
			result,
			"Versión actualizada",
			"El cambio se aplicará al recargar o navegar.",
		);
		dispatch({ type: "set-saving", target: "version", value: false });
	};

	const saveTour = async () => {
		dispatch({ type: "set-saving", target: "tour", value: true });
		const result = await doSaveTour(state.tourEnabled);
		toastSaveResult(
			result,
			"Tour actualizado",
			pickTourSuccessDescription(state.tourEnabled),
		);
		dispatch({ type: "set-saving", target: "tour", value: false });
	};

	return (
		<div className="flex flex-col gap-8 p-4 md:p-6 lg:px-8 w-full max-w-full animate-in fade-in duration-500">
			<GeneralHeader
				title="CONFIGURACIÓN GENERAL"
				description="Información básica de la aplicación y credenciales de sistema."
			/>

			{permissions.general.canView && guild ? (
				<>
					<SettingsGeneralGuildCard
						guild={guild}
						canEditGeneral={canEditGeneral}
						state={state}
						saveGuildInfo={saveGuildInfo}
						saveVersion={saveVersion}
						onGuildFieldChange={updateGuildField}
						onVersionChange={(version) =>
							dispatch({ type: "update-version", version })
						}
						onOpenPicker={handleOpenPicker}
					/>
					<MediaPicker
						bucket="guild_assets"
						open={state.activePicker !== null}
						onSelect={(file) => void handlePickerSelect(file)}
						onClose={handlePickerClose}
						title={pickMediaPickerTitle(state.activePicker)}
						showUpload={true}
					/>
				</>
			) : permissions.general.canView ? (
				<p className="text-sm text-muted-foreground">
					No hay configuración general. Añade una fila en la tabla
					<code className="mx-1 rounded bg-muted px-1">settings</code> en
					Supabase.
				</p>
			) : null}

			{permissions.general.canView && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							{state.tourEnabled ? (
								<IconEye className="size-5 text-cyan-400" />
							) : (
								<IconEyeOff className="size-5 text-white/40" />
							)}
							Tour guiado
						</CardTitle>
						<CardDescription>
							Controla si el tour interactivo de Zona Raider se muestra a los
							nuevos usuarios en escritorio.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{!canEditGeneral && (
							<p className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-200/80">
								Tienes acceso de solo lectura a esta sección.
							</p>
						)}
						<div className="flex items-center justify-between rounded-2xl border border-white/5 p-4">
							<div>
								<p className="text-sm font-semibold">Activar tour guiado</p>
								<p className="text-[11px] text-white/60">
									{state.tourEnabled
										? "El tour se muestra automáticamente en escritorio para nuevos usuarios."
										: "El tour está desactivado para todos los usuarios."}
								</p>
							</div>
							<div className="flex items-center gap-3">
								<Switch
									checked={state.tourEnabled}
									onCheckedChange={() => dispatch({ type: "toggle-tour" })}
									disabled={!canEditGeneral || state.savingTour}
									aria-label="Activar o desactivar el tour guiado"
								/>
								{canEditGeneral && state.tourEnabled !== initialTourEnabled && (
									<Button
										size="sm"
										variant="secondary"
										disabled={state.savingTour}
										onClick={() => void saveTour()}
									>
										{state.savingTour ? "Guardando..." : "Guardar"}
									</Button>
								)}
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
