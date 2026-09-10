"use client";

import { useState } from "react";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	CardDescription,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import {
	IconKey,
	IconTrash,
	IconPlus,
	IconLoader2,
	IconCopy,
	IconCheck,
	IconClock,
	IconAlertTriangle,
	IconPencil,
	IconX,
	IconEye,
} from "@/shared/ui/tabler-icons";
import { toast } from "sonner";
import { AdminPageHeader } from "@/shared/components/admin-page-header";
import { useApiQuery } from "@/shared/hooks/use-api-query";

type TokenRow = {
	id: string;
	label: string | null;
	created_at: string;
	last_used_at: string | null;
	revoked_at: string | null;
	created_by: string | null;
	revoked_by: string | null;
};

type TokenListResponse = {
	tokens: TokenRow[];
};

type TokenCreateResponse = {
	tokenId: string;
	token: string;
	label: string | null;
	createdAt: string;
	note: string;
};

function formatDate(iso: string | null) {
	if (!iso) return null;
	return new Date(iso).toLocaleDateString("es-ES", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		timeZone: "UTC",
	});
}

async function doGenerateToken(
	label: string | null,
): Promise<{ success: boolean; error?: string; data?: TokenCreateResponse }> {
	try {
		const res = await fetch("/api/admin/public-api-tokens", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ label }),
		});

		if (!res.ok) {
			const err = await res.json().catch(() => null);
			return {
				success: false,
				error: err?.error ?? "Error al generar el token",
			};
		}

		const created: TokenCreateResponse = await res.json();
		return { success: true, data: created };
	} catch (err) {
		return {
			success: false,
			error: err instanceof Error ? err.message : "No se pudo generar el token.",
		};
	}
}

async function doCopyToClipboard(
	text: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		await navigator.clipboard.writeText(text);
		return { success: true };
	} catch {
		return { success: false, error: "No se pudo copiar al portapapeles" };
	}
}

async function doRevokeToken(
	id: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const res = await fetch("/api/admin/public-api-tokens", {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id }),
		});

		if (!res.ok) {
			const err = await res.json().catch(() => null);
			return {
				success: false,
				error: err?.error ?? "Error al revocar el token",
			};
		}

		return { success: true };
	} catch (err) {
		return {
			success: false,
			error: err instanceof Error ? err.message : "No se pudo revocar el token.",
		};
	}
}

async function doSaveTokenLabel(
	id: string,
	label: string | null,
): Promise<{ success: boolean; error?: string }> {
	try {
		const res = await fetch("/api/admin/public-api-tokens", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id, label }),
		});

		if (!res.ok) {
			const err = await res.json().catch(() => null);
			return {
				success: false,
				error: err?.error ?? "Error al actualizar la etiqueta",
			};
		}

		return { success: true };
	} catch (err) {
		return {
			success: false,
			error:
				err instanceof Error ? err.message : "No se pudo actualizar la etiqueta.",
		};
	}
}

function shortId(id: string) {
	return id.slice(0, 8);
}

// ──────────────────────────────────────────────
// Generated token card
// ──────────────────────────────────────────────

function GeneratedTokenCard({
	generatedToken,
	generatedLabel,
	onCopy,
	copied,
}: {
	generatedToken: string;
	generatedLabel: string | null;
	onCopy: () => void;
	copied: boolean;
}) {
	return (
		<Card className="border-yellow-500/30 bg-yellow-500/5 backdrop-blur-sm">
			<CardHeader>
				<div className="flex items-center gap-2">
					<IconAlertTriangle className="size-5 text-yellow-500" />
					<CardTitle className="text-yellow-500">
						Token Generado — Solo se muestra una vez
					</CardTitle>
				</div>
				<CardDescription>
					{generatedLabel ? (
						<>
							Etiqueta: <strong>{generatedLabel}</strong> —{" "}
						</>
					) : null}
					Copia este valor ahora. No se volverá a mostrar y queda registrado como
					hash en la base de datos.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col sm:flex-row gap-3">
					<Input
						readOnly
						value={generatedToken}
						className="flex-1 bg-zinc-950/40 font-mono text-sm"
					/>
					<Button variant="outline" onClick={onCopy} className="shrink-0">
						{copied ? (
							<>
								<IconCheck className="mr-2 size-4 text-green-500" />
								Copiado
							</>
						) : (
							<>
								<IconCopy className="mr-2 size-4" />
								Copiar
							</>
						)}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

// ──────────────────────────────────────────────
// Token row (active or revoked)
// ──────────────────────────────────────────────

function TokenLabelEditor({
	editLabel,
	saving,
	onEditLabelChange,
	onSave,
	onCancel,
}: {
	editLabel: string;
	saving: boolean;
	onEditLabelChange: (value: string) => void;
	onSave: () => void;
	onCancel: () => void;
}) {
	return (
		<div className="flex items-center gap-2">
			<Input
				value={editLabel}
				onChange={(e) => onEditLabelChange(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter") onSave();
					if (e.key === "Escape") onCancel();
				}}
				className="h-8 bg-zinc-950/40 text-sm"
				placeholder="Sin etiqueta"
			/>
			<Button
				size="icon"
				aria-label="Guardar etiqueta"
				variant="ghost"
				className="size-7 shrink-0"
				disabled={saving}
				onClick={onSave}
			>
				{saving ? (
					<IconLoader2 className="size-3.5 animate-spin" />
				) : (
					<IconCheck className="size-3.5 text-green-500" />
				)}
			</Button>
			<Button
				size="icon"
				aria-label="Cancelar edición de etiqueta"
				variant="ghost"
				className="size-7 shrink-0"
				onClick={onCancel}
			>
				<IconX className="size-3.5 text-muted-foreground" />
			</Button>
		</div>
	);
}

function TokenMeta({ token, isRevoked }: { token: TokenRow; isRevoked: boolean }) {
	const lastUsed = isRevoked ? (
		<span>Revocado: {formatDate(token.revoked_at)}</span>
	) : token.last_used_at ? (
		<span className="flex items-center gap-1">
			<IconClock className="size-3" />
			Último uso: {formatDate(token.last_used_at)}
		</span>
	) : (
		<span className="flex items-center gap-1">
			<IconClock className="size-3" />
			Sin uso
		</span>
	);

	return (
		<>
			<p className="font-bold text-sm tracking-tight truncate flex items-center gap-2">
				{token.label ?? "Sin etiqueta"}
				{isRevoked ? (
					<Badge
						variant="outline"
						className="text-[10px] py-0 h-4 border-red-500/30 text-red-400"
					>
						Revocado
					</Badge>
				) : null}
			</p>
			<div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
				<span>Creado: {formatDate(token.created_at)}</span>
				{lastUsed}
				<span className="flex items-center gap-1 font-mono text-[10px] opacity-50">
					<IconEye className="size-3" />
					{shortId(token.id)}
				</span>
			</div>
		</>
	);
}

function TokenActions({
	token,
	revoking,
	editing,
	onStartEdit,
	onRevoke,
}: {
	token: TokenRow;
	revoking: boolean;
	editing: boolean;
	onStartEdit: (token: TokenRow) => void;
	onRevoke: (id: string, label: string | null) => void;
}) {
	return (
		<div className="flex items-center gap-1 shrink-0 ml-3">
			{editing ? null : (
				<Button
					size="sm"
					variant="ghost"
					className="text-muted-foreground hover:text-white hover:bg-white/10"
					onClick={() => onStartEdit(token)}
				>
					<IconPencil className="size-4" />
					<span className="ml-1.5 hidden sm:inline">Editar</span>
				</Button>
			)}
			<Button
				size="sm"
				variant="ghost"
				disabled={revoking}
				className="text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
				onClick={() => onRevoke(token.id, token.label)}
			>
				{revoking ? (
					<IconLoader2 className="size-4 animate-spin" />
				) : (
					<IconTrash className="size-4" />
				)}
				<span className="ml-1.5 hidden sm:inline">Revocar</span>
			</Button>
		</div>
	);
}


function TokenRow({
	token,
	isRevoked,
	editingId,
	editLabel,
	savingLabel,
	revoking,
	onStartEdit,
	onSaveLabel,
	onCancelEdit,
	onRevoke,
	onEditLabelChange,
}: {
	token: TokenRow;
	isRevoked: boolean;
	editingId: string | null;
	editLabel: string;
	savingLabel: string | null;
	revoking: string | null;
	onStartEdit: (token: TokenRow) => void;
	onSaveLabel: (id: string) => void;
	onCancelEdit: () => void;
	onRevoke: (id: string, label: string | null) => void;
	onEditLabelChange: (value: string) => void;
}) {
	const isEditing = !isRevoked && editingId === token.id;
	const isSaving = savingLabel === token.id;
	const isRevoking = revoking === token.id;

	return (
		<div
			className={`flex items-center gap-3 p-3 rounded-lg border ${
				isRevoked
					? "bg-zinc-950/10 border-white/5 opacity-60"
					: "bg-zinc-950/20 border-white/5"
			}`}
		>
			<div
				className={`size-8 rounded flex items-center justify-center shrink-0 ${
					isRevoked
						? "bg-red-500/10 text-red-400"
						: "bg-yellow-500/10 text-yellow-500"
				}`}
			>
				<IconKey className="size-4" />
			</div>
			<div className="min-w-0 flex-1">
				{isEditing ? (
					<TokenLabelEditor
						editLabel={editLabel}
						saving={isSaving}
						onEditLabelChange={onEditLabelChange}
						onSave={() => onSaveLabel(token.id)}
						onCancel={onCancelEdit}
					/>
				) : (
					<TokenMeta token={token} isRevoked={isRevoked} />
				)}
			</div>
			{isRevoked ? null : (
				<TokenActions
					token={token}
					revoking={isRevoking}
					editing={editingId === token.id}
					onStartEdit={onStartEdit}
					onRevoke={onRevoke}
				/>
			)}
		</div>
	);
}

export function ApiTokensSettings() {
	const [newLabel, setNewLabel] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [generatedToken, setGeneratedToken] = useState<string | null>(null);
	const [generatedLabel, setGeneratedLabel] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);
	const [revoking, setRevoking] = useState<string | null>(null);

	const [editingId, setEditingId] = useState<string | null>(null);
	const [editLabel, setEditLabel] = useState("");
	const [savingLabel, setSavingLabel] = useState<string | null>(null);

	const { data, isLoading, mutate } = useApiQuery<TokenListResponse>(
		"/api/admin/public-api-tokens",
	);

	const rawTokens = data?.tokens ?? [];

	const tokens = [...rawTokens].sort(
		(a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
	);

	const handleGenerate = async (e: React.FormEvent) => {
		e.preventDefault();
		if (submitting) return;

		setSubmitting(true);
		setGeneratedToken(null);
		setGeneratedLabel(null);

		const result = await doGenerateToken(newLabel.trim() || null);

		if (result.success && result.data) {
			setGeneratedToken(result.data.token);
			setGeneratedLabel(result.data.label);
			setNewLabel("");
			void mutate();
			toast.success("Token generado", {
				description: result.data.note,
			});
		} else {
			toast.error("Error", {
				description: result.error || "No se pudo generar el token.",
			});
		}

		setSubmitting(false);
	};

	const handleCopy = async () => {
		if (!generatedToken) return;
		const result = await doCopyToClipboard(generatedToken);
		if (result.success) {
			setCopied(true);
			toast.success("Token copiado al portapapeles");
			setTimeout(() => setCopied(false), 2000);
		} else {
			toast.error("No se pudo copiar al portapapeles");
		}
	};

	const handleRevoke = async (id: string, label: string | null) => {
		const name = label ?? id.slice(0, 8);
		if (
			!confirm(`¿Revocar el token "${name}"? Esta acción no se puede deshacer.`)
		) {
			return;
		}

		setRevoking(id);
		const result = await doRevokeToken(id);

		if (result.success) {
			toast.success(`Token "${name}" revocado`);
			void mutate();
		} else {
			toast.error("Error", {
				description: result.error || "No se pudo revocar el token.",
			});
		}

		setRevoking(null);
	};

	const handleStartEdit = (token: TokenRow) => {
		setEditingId(token.id);
		setEditLabel(token.label ?? "");
	};

	const handleCancelEdit = () => {
		setEditingId(null);
		setEditLabel("");
	};

	const handleSaveLabel = async (id: string) => {
		const trimmed = editLabel.trim();
		setSavingLabel(id);
		const result = await doSaveTokenLabel(id, trimmed || null);

		if (result.success) {
			toast.success("Etiqueta actualizada");
			setEditingId(null);
			setEditLabel("");
			void mutate();
		} else {
			toast.error("Error", {
				description: result.error || "No se pudo actualizar la etiqueta.",
			});
		}

		setSavingLabel(null);
	};

	const activeTokens = tokens.filter((t) => !t.revoked_at);
	const revokedTokens = tokens.filter((t) => t.revoked_at);

	return (
		<div className="flex flex-col gap-6 py-6 px-4 lg:px-6 w-full animate-in fade-in duration-500">
			<AdminPageHeader
				title="API TOKENS"
				description="Genera y gestiona tokens de acceso para aplicaciones externas e integraciones."
				backHref="/zona-raider/configuracion"
			/>

			<Card className="border-border/40 bg-card/40 backdrop-blur-sm">
				<CardHeader>
					<CardTitle>Generar Nuevo Token</CardTitle>
					<CardDescription>
						Asigna una etiqueta para identificar el uso de este token (ej: Bot
						Recruitment Relay, Dashboard App). El valor del token solo se muestra una
						vez al generarlo.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={(e) => void handleGenerate(e)}
						className="flex flex-col sm:flex-row gap-3"
					>
						<Input
							placeholder="Etiqueta del token..."
							value={newLabel}
							onChange={(e) => setNewLabel(e.target.value)}
							className="flex-1 bg-zinc-950/20"
						/>
						<Button
							type="submit"
							disabled={submitting}
							className="shrink-0 bg-yellow-600 hover:bg-yellow-700 text-white"
						>
							{submitting ? (
								<IconLoader2 className="mr-2 size-4 animate-spin" />
							) : (
								<IconPlus className="mr-2 size-4" />
							)}
							Generar Token
						</Button>
					</form>
				</CardContent>
			</Card>

			{generatedToken ? (
				<GeneratedTokenCard
					generatedToken={generatedToken}
					generatedLabel={generatedLabel}
					onCopy={() => void handleCopy()}
					copied={copied}
				/>
			) : null}

			<Card className="border-border/40 bg-card/40 backdrop-blur-sm">
				<CardHeader>
					<CardTitle>Tokens Activos ({activeTokens.length})</CardTitle>
					<CardDescription>
						Tokens que pueden usarse para autenticar peticiones a la API pública.
						Ordenados del más reciente al más antiguo.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex justify-center py-6 text-muted-foreground">
							<IconLoader2 className="size-6 animate-spin" />
						</div>
					) : activeTokens.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							<IconKey className="size-10 mx-auto opacity-20 mb-2" />
							<p>No hay tokens activos.</p>
						</div>
					) : (
						<div className="flex flex-col gap-2">
							{activeTokens.map((token) => (
								<TokenRow
									key={token.id}
									token={token}
									isRevoked={false}
									editingId={editingId}
									editLabel={editLabel}
									savingLabel={savingLabel}
									revoking={revoking}
									onStartEdit={handleStartEdit}
									onSaveLabel={(id) => void handleSaveLabel(id)}
									onCancelEdit={handleCancelEdit}
									onRevoke={(id, label) => void handleRevoke(id, label)}
									onEditLabelChange={setEditLabel}
								/>
							))}
						</div>
					)}

					{revokedTokens.length > 0 ? (
						<div className="mt-6">
							<h3 className="text-sm font-semibold text-muted-foreground mb-2">
								Tokens Revocados ({revokedTokens.length})
							</h3>
							<div className="flex flex-col gap-2">
								{revokedTokens.map((token) => (
									<TokenRow
										key={token.id}
										token={token}
										isRevoked
										editingId={null}
										editLabel=""
										savingLabel={null}
										revoking={null}
										onStartEdit={() => {}}
										onSaveLabel={() => {}}
										onCancelEdit={() => {}}
										onRevoke={() => {}}
										onEditLabelChange={() => {}}
									/>
								))}
							</div>
						</div>
					) : null}
				</CardContent>
			</Card>
		</div>
	);
}
