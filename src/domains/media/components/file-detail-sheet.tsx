"use client";

import { useState, useReducer } from "react";
import Image from "next/image";
import {
	IconPhoto,
	IconFileTypePdf,
	IconFile,
	IconVideo,
	IconChevronLeft,
	IconChevronRight,
	IconCopy,
	IconDownload,
	IconTrash,
	IconX,
	IconDeviceFloppy,
	IconLoader2,
} from "@/shared/ui/tabler-icons";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Label } from "@/shared/ui/label";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
	SheetClose,
} from "@/shared/ui/sheet";
import type { MediaFile } from "@/domains/media/types";
import { openExternalUrl } from "@/shared/lib/external-url";

// ── Helpers ───────────────────────────────
async function doSaveFileMetadata(
	fileId: string,
	body: Record<string, string>,
): Promise<{ success: boolean; error?: string }> {
	try {
		const res = await fetch(`/api/media/${fileId}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});

		if (!res.ok) {
			const errData = await res.json().catch(() => ({}));
			return { success: false, error: errData.error || "Error al guardar" };
		}

		return { success: true };
	} catch (err) {
		return {
			success: false,
			error: err instanceof Error ? err.message : "Error al guardar",
		};
	}
}

// ── Types ──────────────────────────────────
type FileDetailSheetProps = {
	file: MediaFile | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (id: string, field: string, value: string) => Promise<void>;
	onDelete: (id: string) => void;
	hasPrev: boolean;
	hasNext: boolean;
	onNavigate: (direction: "prev" | "next") => void;
	canEdit: boolean;
};

// ── Field max lengths ─────────────────────
const MAX_LENGTHS: Record<string, number> = {
	title: 255,
	alt_text: 500,
	caption: 1000,
	description: 2000,
};

// ── Helpers ───────────────────────────────
function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1024 * 1024 * 1024)
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(iso: string): string {
	try {
		const d = new Date(iso);
		return d.toLocaleDateString("es-ES", {
			timeZone: "UTC",
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	} catch {
		return iso;
	}
}

function FileTypeIcon({ mimeType }: { mimeType: string }) {
	const cls = "size-16 text-white/40";
	if (mimeType.startsWith("image/")) {
		return <IconPhoto className={cls} />;
	}
	if (mimeType === "application/pdf") {
		return <IconFileTypePdf className="size-16 text-red-400/60" />;
	}
	if (mimeType.startsWith("video/")) {
		return <IconVideo className="size-16 text-blue-400/60" />;
	}
	return <IconFile className={cls} />;
}

// ── Form reducer ──────────────────────────
type FormState = {
	title: string;
	altText: string;
	caption: string;
	description: string;
	errors: Record<string, string>;
};

type FormAction =
	| { type: "reset"; file: MediaFile }
	| { type: "setTitle"; value: string }
	| { type: "setAltText"; value: string }
	| { type: "setCaption"; value: string }
	| { type: "setDescription"; value: string }
	| { type: "setError"; field: string; message: string }
	| { type: "clearError"; field: string }
	| { type: "clearErrors" }
	| { type: "setErrors"; errors: Record<string, string> };

function formReducer(state: FormState, action: FormAction): FormState {
	switch (action.type) {
		case "reset":
			return {
				title: action.file.title || "",
				altText: action.file.alt_text || "",
				caption: action.file.caption || "",
				description: action.file.description || "",
				errors: {},
			};
		case "setTitle":
			return { ...state, title: action.value };
		case "setAltText":
			return { ...state, altText: action.value };
		case "setCaption":
			return { ...state, caption: action.value };
		case "setDescription":
			return { ...state, description: action.value };
		case "setError":
			return {
				...state,
				errors: { ...state.errors, [action.field]: action.message },
			};
		case "clearError": {
			const next = { ...state.errors };
			delete next[action.field];
			return { ...state, errors: next };
		}
		case "clearErrors":
			return { ...state, errors: {} };
		case "setErrors":
			return { ...state, errors: action.errors };
		default:
			return state;
	}
}

// ── Component ─────────────────────────────
// react-doctor-disable-next-line no-giant-component
// react-doctor-disable-next-line prefer-explicit-variants
function resolveFileLabels(file: NonNullable<FileDetailSheetProps["file"]>) {
	return {
		label: file.title || file.storage_path,
		alt: file.alt_text || file.title || file.storage_path,
	};
}

function FileMetadataFields({
	form,
	dispatch,
	handleBlur,
	file,
	canEdit,
}: {
	form: FormState;
	dispatch: React.Dispatch<FormAction>;
	handleBlur: (field: string, value: string, originalValue: string) => Promise<void>;
	file: NonNullable<FileDetailSheetProps["file"]>;
	canEdit?: boolean;
}) {
	return (
					<div className="flex flex-col gap-3">
						<h3 className="text-xs font-semibold uppercase tracking-widest text-white/40">
							Metadatos
						</h3>

						<div className="flex flex-col gap-2">
							<Label htmlFor="detail-title">Título</Label>
							<Input
								id="detail-title"
								value={form.title}
								onChange={(e) =>
									dispatch({ type: "setTitle", value: e.target.value })
								}
								onBlur={() => void handleBlur("title", form.title, file.title || "")}
								maxLength={MAX_LENGTHS.title}
								aria-label="Título"
								className={
									form.errors.title ? "border-red-500/50" : "border-white/10"
								}
								disabled={!canEdit}
							/>
							{form.errors.title && (
								<p className="text-xs text-red-400">{form.errors.title}</p>
							)}
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor="detail-alt">Texto alternativo</Label>
							<Input
								id="detail-alt"
								value={form.altText}
								onChange={(e) =>
									dispatch({ type: "setAltText", value: e.target.value })
								}
								onBlur={() =>
									void handleBlur("alt_text", form.altText, file.alt_text || "")
								}
								maxLength={MAX_LENGTHS.alt_text}
								aria-label="Texto alternativo"
								className="border-white/10"
								disabled={!canEdit}
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor="detail-caption">Pie de foto</Label>
							<Input
								id="detail-caption"
								value={form.caption}
								onChange={(e) =>
									dispatch({ type: "setCaption", value: e.target.value })
								}
								onBlur={() =>
									void handleBlur("caption", form.caption, file.caption || "")
								}
								maxLength={MAX_LENGTHS.caption}
								aria-label="Pie de foto"
								className="border-white/10"
								disabled={!canEdit}
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor="detail-desc">Descripción</Label>
							<Textarea
								id="detail-desc"
								value={form.description}
								onChange={(e) =>
									dispatch({ type: "setDescription", value: e.target.value })
								}
								onBlur={() =>
									void handleBlur(
										"description",
										form.description,
										file.description || "",
									)
								}
								maxLength={MAX_LENGTHS.description}
								aria-label="Descripción"
								className="border-white/10 min-h-20"
								rows={3}
								disabled={!canEdit}
							/>
						</div>
					</div>
	);
}

function FileInfoSection({
	file,
}: {
	file: NonNullable<FileDetailSheetProps["file"]>;
}) {
	return (
					<div className="flex flex-col gap-3">
						<h3 className="text-xs font-semibold uppercase tracking-widest text-white/40">
							Información del archivo
						</h3>

						<div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
							<span className="text-white/40">Carpeta</span>
							<span className="text-white/70 font-mono text-xs truncate">
								{file.bucket}
							</span>

							<span className="text-white/40">Ruta</span>
							<span className="text-white/70 font-mono text-xs truncate">
								{file.storage_path}
							</span>

							<span className="text-white/40">Tipo</span>
							<span className="text-white/70 font-mono text-xs">
								{file.mime_type}
							</span>

							<span className="text-white/40">Tamaño</span>
							<span className="text-white/70 text-xs">
								{formatFileSize(file.file_size)}
							</span>

							{file.dimensions && (
								<>
									<span className="text-white/40">Dimensiones</span>
									<span className="text-white/70 text-xs">
										{file.dimensions}
									</span>
								</>
							)}

							<span className="text-white/40">Fecha</span>
							<span className="text-white/70 text-xs">
								{formatDate(file.created_at)}
							</span>
						</div>
					</div>
	);
}

function resolveShowNavigation(hasPrev: boolean, hasNext: boolean) {
	return hasPrev || hasNext;
}

function SheetNavArrow({
	direction,
	enabled,
	onNavigate,
}: {
	direction: "prev" | "next";
	enabled: boolean;
	onNavigate: (direction: "prev" | "next") => void;
}) {
	if (!enabled) return <div className="size-8" />;
	return (
		<Button
			variant="ghost"
			size="icon"
			className="size-8 text-white/50 hover:text-white/80"
			onClick={() => onNavigate(direction)}
			aria-label={
				direction === "prev" ? "Archivo anterior" : "Archivo siguiente"
			}
		>
			{direction === "prev" ? (
				<IconChevronLeft className="size-5" />
			) : (
				<IconChevronRight className="size-5" />
			)}
		</Button>
	);
}

export function FileDetailSheet({
	file,
	open,
	onOpenChange,
	onSave,
	onDelete,
	hasPrev,
	hasNext,
	onNavigate,
	canEdit,
}: FileDetailSheetProps) {
	// Form state via reducer — resets when file identity changes
	const [form, dispatch] = useReducer(
		formReducer,
		file,
		(f): FormState => ({
			title: f?.title || "",
			altText: f?.alt_text || "",
			caption: f?.caption || "",
			description: f?.description || "",
			errors: {},
		}),
	);

	const [isSaving, setIsSaving] = useState(false);
	const [saved, setSaved] = useState(false);

	// ── Manual save ────────────────────────
	const handleSave = async () => {
		if (!file || isSaving) return;
		setIsSaving(true);
		setSaved(false);

		const body: Record<string, string> = {};
		if (form.title !== (file.title || "")) body.title = form.title;
		if (form.altText !== (file.alt_text || "")) body.alt_text = form.altText;
		if (form.caption !== (file.caption || "")) body.caption = form.caption;
		if (form.description !== (file.description || ""))
			body.description = form.description;

		if (Object.keys(body).length === 0) {
			setSaved(true);
			setTimeout(() => setSaved(false), 1500);
			setIsSaving(false);
			return;
		}

		const result = await doSaveFileMetadata(file.id, body);
		setIsSaving(false);

		if (result.success) {
			setSaved(true);
			setTimeout(() => setSaved(false), 2000);
		} else {
			dispatch({
				type: "setErrors",
				errors: { _save: result.error || "Error al guardar" },
			});
		}
	};
	const handleBlur = async (
		field: string,
		value: string,
		originalValue: string,
	) => {
		// Validate max length
		const maxLen = MAX_LENGTHS[field];
		if (maxLen && value.length > maxLen) {
			dispatch({
				type: "setError",
				field,
				message: `Demasiado largo (máximo ${maxLen} caracteres)`,
			});
			return;
		}

		// Clear error if valid
		dispatch({ type: "clearError", field });

		// Save only if changed
		if (value !== originalValue && file) {
			await onSave(file.id, field, value);
		}
	};

	// ── Copy URL ───────────────────────────
	const handleCopyUrl = async () => {
		if (file) {
			try {
				await navigator.clipboard.writeText(file.url);
			} catch {
				// Fallback — ignore
			}
		}
	};

	// ── Download ──────────────────────────
	const handleDownload = () => {
		if (file) {
			openExternalUrl(file.url);
		}
	};

	// ── Guard: no file ─────────────────────
	if (!file) return null;

	const isImage = file.mime_type.startsWith("image/");
	const { label: fileLabel, alt: fileAlt } = resolveFileLabels(file);
	const showNavigation = resolveShowNavigation(hasPrev, hasNext);

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className="w-full sm:max-w-lg lg:max-w-xl p-0 flex flex-col border-white/10 bg-[#0a0a12]/95"
			>
				{/* Header */}
				<SheetHeader className="shrink-0 px-5 pt-5 pb-3 border-b border-white/10">
					<div className="flex items-center gap-2">
						<SheetTitle className="text-white/90 text-base truncate flex-1">
							{fileLabel}
						</SheetTitle>
						<SheetClose
							className="rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
							aria-label="Cerrar detalle"
						>
							<IconX className="size-4 text-white/60" />
						</SheetClose>
					</div>
					<SheetDescription className="sr-only">
						Detalle del archivo {fileLabel}. Vista previa,
						metadatos editables y acciones.
					</SheetDescription>
				</SheetHeader>

				{/* Scrollable body */}
				<div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
					{/* Preview */}
					<div className="shrink-0 aspect-video w-full rounded-xl bg-white/5 flex items-center justify-center overflow-hidden ring-1 ring-white/10">
						{isImage ? (
							<Image
								src={file.url}
								alt={fileAlt}
								fill
								sizes="(max-width: 768px) 50vw, 25vw"
								className="object-contain"
							/>
						) : (
							<FileTypeIcon mimeType={file.mime_type} />
						)}
					</div>

					{/* Metadata Form */}
					<FileMetadataFields
						form={form}
						dispatch={dispatch}
						handleBlur={handleBlur}
						file={file}
						canEdit={canEdit}
					/>

					{/* File Info */}
					<FileInfoSection file={file} />

					{/* Save button */}
					<div className="flex items-center justify-end pt-1">
						<Button
							size="sm"
							className="gap-2 text-xs"
							onClick={() => void handleSave()}
							disabled={isSaving}
						>
							{isSaving ? (
								<>
									<IconLoader2 className="size-3.5 animate-spin" />
									Guardando…
								</>
							) : saved ? (
								<>
									<IconDeviceFloppy className="size-3.5" />
									Guardado ✓
								</>
							) : (
								<>
									<IconDeviceFloppy className="size-3.5" />
									Guardar metadatos
								</>
							)}
						</Button>
					</div>
				</div>

				{/* Footer: actions + navigation */}
				<div className="shrink-0 border-t border-white/10 px-5 py-3 flex flex-col gap-3">
					{/* Action buttons */}
					<div className="flex items-center gap-2 flex-wrap">
						<Button
							variant="outline"
							size="sm"
							className="text-xs border-white/10 hover:bg-white/5"
							onClick={() => void handleCopyUrl()}
						>
							<IconCopy className="size-3.5" data-icon="inline-start" />
							Copiar URL
						</Button>
						<Button
							variant="outline"
							size="sm"
							className="text-xs border-white/10 hover:bg-white/5"
							onClick={handleDownload}
						>
							<IconDownload className="size-3.5" data-icon="inline-start" />
							Descargar
						</Button>
						{canEdit && (
							<Button
								variant="destructive"
								size="sm"
								className="text-xs"
								onClick={() => onDelete(file.id)}
							>
								<IconTrash className="size-3.5" data-icon="inline-start" />
								Eliminar
							</Button>
						)}
					</div>

					{/* Navigation arrows */}
					{showNavigation && (
						<div className="flex items-center justify-center gap-4">
							<SheetNavArrow
								direction="prev"
								enabled={hasPrev}
								onNavigate={onNavigate}
							/>
							<span className="text-xs text-white/40">
								Navegar entre archivos
							</span>
							<SheetNavArrow
								direction="next"
								enabled={hasNext}
								onNavigate={onNavigate}
							/>
						</div>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
