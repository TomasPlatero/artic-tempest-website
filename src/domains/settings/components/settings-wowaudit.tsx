"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
	IconArrowLeft,
	IconCheck,
	IconRefresh,
	IconX,
} from "@/shared/ui/tabler-icons";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";
import { Input } from "@/shared/ui/input";
import { ClientDateText } from "@/shared/components/client-date-text";
import { SettingsBnetManualDialog } from "./settings-bnet-manual-dialog";
import { SettingsBnetDangerZone } from "./settings-bnet-danger-zone";
import { SettingsWowauditRanksClient } from "./settings-wowaudit-ranks";

type Props = {
	memberCount: number;
	lastSync: string | null;
	wowauditConfigured: boolean;
	hasGuild: boolean;
	ranks: Array<{
		rank: number;
		name: string;
		color: string | null;
		image_url: string | null;
		roster_section: "main" | "alters";
	}>;
	rankImages: Array<{
		path: string;
		name: string;
		url: string;
		folder: string | null;
	}>;
	initialCredentials: {
		wowaudit_api_key: string;
	};
	sources?: {
		wowaudit: "db" | "env";
	};
};

async function doSyncRoster(): Promise<{
	success: boolean;
	data?: { imported: number; guild: string; syncedAt?: string };
	error?: string;
}> {
	try {
		const res = await fetch("/api/guild/sync", {
			method: "POST",
			credentials: "include",
		});
		if (!res.ok) {
			const errData = await res.json();
			return { success: false, error: errData.error ?? "Error desconocido" };
		}
		const data = await res.json();
		return { success: true, data };
	} catch {
		return { success: false, error: "No se pudo contactar con el servidor" };
	}
}

async function doSaveWowauditCredentials(
	apiKey: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const res = await fetch("/api/guild/settings/credentials", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ wowaudit_api_key: apiKey }),
		});
		if (!res.ok) {
			const data = await res.json().catch(() => ({}));
			throw new Error(data.error || "API error");
		}
		return { success: true };
	} catch {
		return {
			success: false,
			error: "No se pudieron guardar las credenciales.",
		};
	}
}

async function doWipeRoster(): Promise<{ success: boolean; error?: string }> {
	try {
		const res = await fetch("/api/guild/roster", { method: "DELETE" });
		if (!res.ok) {
			const errData = await res.json();
			return {
				success: false,
				error: errData.error ?? "No se pudo vaciar la lista de personajes.",
			};
		}
		return { success: true };
	} catch {
		return { success: false, error: "No se pudo contactar con el servidor." };
	}
}

async function doAddManualCharacter(dialog: {
	name: string;
	realm: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
	try {
		const res = await fetch("/api/guild/roster", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(dialog),
		});
		if (!res.ok) {
			const errData = await res.json();
			return {
				success: false,
				error: errData.details
					? `${errData.error}: ${errData.details}`
					: errData.error || "No se pudo añadir el personaje.",
			};
		}
		const data = await res.json();
		return { success: true, data };
	} catch {
		return { success: false, error: "Error de conexión" };
	}
}

// react-doctor-disable-next-line no-giant-component
export function SettingsWowauditClient({
	memberCount,
	lastSync,
	wowauditConfigured,
	hasGuild,
	ranks,
	rankImages,
	initialCredentials,
	sources,
}: Props) {
	const [apiKey, setApiKey] = useState(initialCredentials.wowaudit_api_key);
	const [syncResult, setSyncResult] = useState<{
		memberCount: number;
		lastSync: string;
	} | null>(null);
	const [savingCreds, setSavingCreds] = useState(false);
	const [syncing, setSyncing] = useState(false);
	const [wiping, setWiping] = useState(false);
	const [addingManual, setAddingManual] = useState(false);
	const [manualDialog, setManualDialog] = useState({
		name: "",
		realm: "",
		open: false,
	});
	const charNameRef = useRef<HTMLInputElement>(null);

	const displayMemberCount = syncResult?.memberCount ?? memberCount;
	const displayLastSync = syncResult?.lastSync ?? lastSync;

	useEffect(() => {
		if (manualDialog.open) charNameRef.current?.focus();
	}, [manualDialog.open]);

	const handleSync = async () => {
		setSyncing(true);
		const result = await doSyncRoster();
		if (result.success && result.data) {
			setSyncResult({
				memberCount: Number.isFinite(result.data.imported)
					? result.data.imported
					: displayMemberCount,
				lastSync:
					typeof result.data.syncedAt === "string"
						? result.data.syncedAt
						: new Date().toISOString(),
			});
			toast.success("Roster sincronizado", {
				description: `${result.data.imported} personajes importados de ${result.data.guild}`,
			});
		} else {
			toast.error("Error al sincronizar", {
				description: result.error,
			});
		}
		setSyncing(false);
	};

	const handleSaveCredentials = async () => {
		setSavingCreds(true);
		const result = await doSaveWowauditCredentials(apiKey);
		if (result.success) {
			toast.success("Credenciales guardadas", {
				description: "Los cambios se aplicarán en la próxima sincronización.",
			});
			setTimeout(() => window.location.reload(), 1000);
		} else {
			toast.error("Error", {
				description: result.error,
			});
		}
		setSavingCreds(false);
	};

	const handleWipeRoster = async () => {
		if (
			!confirm(
				"⚠️ ATENCIÓN: Estás a punto de borrar TODO el roster importado. ¿Estás seguro?",
			)
		)
			return;
		setWiping(true);
		const result = await doWipeRoster();
		if (result.success) {
			toast.success("Roster eliminado", {
				description: "Se han borrado todos los personajes de la base de datos.",
			});
			window.location.reload();
		} else {
			toast.error("Error al borrar", {
				description: result.error,
			});
		}
		setWiping(false);
	};

	const handleAddManual = async (e: FormEvent) => {
		e.preventDefault();
		if (!manualDialog.name || !manualDialog.realm) return;
		setAddingManual(true);
		const result = await doAddManualCharacter(manualDialog);
		if (result.success && result.data) {
			toast.success("Personaje añadido", {
				description: `${result.data.character.character_name} se ha añadido correctamente al roster.`,
			});
			setManualDialog({ name: "", realm: "", open: false });
			window.location.reload();
		} else {
			toast.error("Error", {
				description: result.error,
			});
		}
		setAddingManual(false);
	};

	return (
		<div className="flex flex-col gap-6 p-4 md:p-6 italic">
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-6 not-italic">
				<div className="flex items-center gap-6">
					<Link href="/zona-raider/configuracion">
						<Button
							variant="outline"
							size="icon"
							className="size-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10  shadow-xl"
						>
							<IconArrowLeft className="size-6 text-white/50" />
						</Button>
					</Link>
					<div>
						<h1 className="text-3xl font-semibold font-heading italic tracking-tight flex items-center gap-3">
							SINCRONIZACIÓN WOWAUDIT
						</h1>
						<p className="text-sm font-medium text-white/40 mt-2 tracking-widest leading-relaxed">
							Gestiona la importación de miembros y datos desde WoWAudit.
						</p>
					</div>
				</div>

				<SettingsBnetManualDialog
					manualDialog={manualDialog}
					addingManual={addingManual}
					charNameRef={charNameRef}
					onOpenChange={(open) =>
						setManualDialog((prev) => ({ ...prev, open }))
					}
					onNameChange={(name) =>
						setManualDialog((prev) => ({ ...prev, name }))
					}
					onRealmChange={(realm) =>
						setManualDialog((prev) => ({ ...prev, realm }))
					}
					onSubmit={(e) => void handleAddManual(e)}
				/>
			</div>

			<Card className="not-italic">
				<CardHeader>
					<CardTitle>Estado y Sincronización</CardTitle>
					<CardDescription>
						Importa y actualiza los datos de la hermandad desde WoWAudit.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-6">
					<div className="grid gap-3 text-sm">
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground">Estado API</span>
							{wowauditConfigured ? (
								<Badge
									variant="outline"
									className="bg-green-500/10 text-green-500 border-green-500/20"
								>
									<IconCheck className="size-3 mr-1" />
									Configurado
								</Badge>
							) : (
								<Badge
									variant="outline"
									className="bg-red-500/10 text-red-500 border-red-500/20"
								>
									<IconX className="size-3 mr-1" />
									Sin configurar
								</Badge>
							)}
						</div>
						<Separator />
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground">Miembros importados</span>
							<span className="font-medium tabular-nums text-lg">
								{displayMemberCount}
							</span>
						</div>
						{displayLastSync && (
							<>
								<Separator />
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">
										Última sincronización
									</span>
									<span className="font-medium">
										<ClientDateText
											value={displayLastSync}
											options={{
												day: "2-digit",
												month: "short",
												year: "numeric",
												hour: "2-digit",
												minute: "2-digit",
											}}
										/>
									</span>
								</div>
							</>
						)}
					</div>

					{!wowauditConfigured && (
						<div className="rounded-lg bg-orange-500/10 border border-orange-500/30 p-4">
							<h4 className="font-semibold text-orange-500 mb-2">
								Acción Requerida
							</h4>
							<p className="text-sm text-orange-500/80 mb-3">
								No se han detectado las credenciales de WoWAudit. Necesitas
								configurarlas para activar la sincronización automática.
							</p>
							<Button
								variant="outline"
								size="sm"
								className="bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20 text-orange-600"
							>
								Configurar Credenciales WoWAudit
							</Button>
						</div>
					)}

					<Button
						onClick={() => void handleSync()}
						disabled={syncing || !wowauditConfigured || !hasGuild}
						className="w-full sm:w-auto self-start bg-blue-600 hover:bg-blue-500 rounded-xl font-bold tracking-wider h-12"
						size="lg"
					>
						{syncing ? (
							<IconRefresh className="mr-2 size-5 animate-spin" />
						) : (
							<IconRefresh className="mr-2 size-5" />
						)}
						{syncing ? "Sincronizando..." : "Sincronizar Roster"}
					</Button>
				</CardContent>
			</Card>

			<div className="grid gap-6 md:grid-cols-2 not-italic">
				<Card className="border-2 border-primary/10 shadow-2xl bg-card/40 backdrop-blur-md overflow-hidden">
					<CardHeader>
						<CardTitle className="flex items-center gap-3 font-semibold text-xs tracking-[0.3em] text-blue-500">
							<IconRefresh className="size-5" />
							Credenciales de WoWAudit
							{sources?.wowaudit && (
								<Badge
									variant="outline"
									className={
										sources.wowaudit === "db"
											? "text-[9px] h-4 px-1.5 border-emerald-500/30 bg-emerald-500/5 text-emerald-400 font-bold ml-auto"
											: "text-[9px] h-4 px-1.5 border-amber-500/30 bg-amber-500/5 text-amber-400 font-bold ml-auto"
									}
								>
									{sources.wowaudit === "db" ? "DATABASE" : "ENV FALLBACK"}
								</Badge>
							)}
						</CardTitle>
						<CardDescription className="text-xs font-medium italic opacity-60">
							Configura la llave de acceso para WoWAudit.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<label
								htmlFor="wowaudit-api-key"
								className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground/60 px-1"
							>
								API Key
							</label>
							<Input
								id="wowaudit-api-key"
								type="password"
								placeholder="Tu WoWAudit API Key"
								value={apiKey}
								onChange={(e) => setApiKey(e.target.value)}
								className="h-12 bg-muted/20 border-border/40 font-mono text-sm rounded-xl"
							/>
						</div>
						<Button
							onClick={() => void handleSaveCredentials()}
							disabled={savingCreds}
							className="w-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-600/20 rounded-xl font-semibold text-[10px] tracking-widest h-12"
						>
							{savingCreds ? (
								<IconRefresh className="size-4 animate-spin mr-2" />
							) : null}
							Guardar Credenciales
						</Button>
					</CardContent>
				</Card>
			</div>

			<SettingsWowauditRanksClient
				key={ranks.map((r) => `${r.rank}`).join(",")}
				ranks={ranks}
				images={rankImages}
			/>

			<SettingsBnetDangerZone
				memberCount={memberCount}
				wiping={wiping}
				onWipeRoster={() => void handleWipeRoster()}
			/>
		</div>
	);
}
