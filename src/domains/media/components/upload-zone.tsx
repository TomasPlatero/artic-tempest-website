"use client";

import { useState, useRef, type DragEvent } from "react";
import {
	IconUpload,
	IconFile,
	IconAlertTriangle,
	IconCheck,
	IconLoader2,
	IconX,
} from "@/shared/ui/tabler-icons";
import type { MediaFile } from "@/domains/media/types";
import { MAX_FILE_SIZE } from "@/domains/media/lib/upload";

// ── Types ──────────────────────────────────
type UploadZoneProps = {
	bucket: string;
	onUploadComplete: (file: MediaFile) => void;
	canEdit?: boolean;
};

type UploadEntry = {
	id: string;
	fileName: string;
	progress: number;
	status: "uploading" | "success" | "error";
	error?: string;
};

// ── Helpers ───────────────────────────────
function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** MIME types que sharp puede convertir a WebP server-side */
const CONVERTIBLE_IMAGE_TYPES = new Set([
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/avif",
	"image/gif",
	"image/bmp",
	"image/tiff",
]);

let entryCounter = 0;

// ── Upload helper (XHR for progress) ───────
function uploadToSignedUrl(
	signedUrl: string,
	file: File,
	onProgress: (pct: number) => void,
): Promise<void> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open("PUT", signedUrl);

		xhr.upload.addEventListener("progress", (e) => {
			if (e.lengthComputable) {
				onProgress(Math.round((e.loaded / e.total) * 100));
			}
		});

		xhr.addEventListener("load", () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				resolve();
			} else {
				reject(new Error(`Upload failed: ${xhr.status}`));
			}
		});

		xhr.addEventListener("error", () => reject(new Error("Error de red")));
		xhr.addEventListener("abort", () => reject(new Error("Subida cancelada")));

		xhr.send(file);
	});
}

/**
 * Sube una imagen convertible al endpoint que la convierte a WebP con sharp
 * y la almacena en Supabase directamente. Usa fetch con progreso aproximado
 * porque FormData no soporta XHR progress events.
 */
async function uploadConvertibleImage(
	file: File,
	bucket: string,
	onProgress: (pct: number) => void,
): Promise<MediaFile> {
	const formData = new FormData();
	formData.append("file", file);
	formData.append("bucket", bucket);

	onProgress(10);

	const res = await fetch("/api/media/upload-image", {
		method: "POST",
		body: formData,
	});

	onProgress(90);

	if (!res.ok) {
		const errData = await res.json().catch(() => ({}));
		return Promise.reject(
			new Error(errData.error || "Error al subir y convertir imagen"),
		);
	}

	const { file: uploadedFile } = await res.json();
	onProgress(100);
	return uploadedFile as MediaFile;
}

// ── Component ─────────────────────────────
// react-doctor-disable-next-line no-giant-component
export function UploadZone({
	bucket,
	onUploadComplete,
	canEdit = true,
}: UploadZoneProps) {
	const [isDragOver, setIsDragOver] = useState(false);
	const [entries, setEntries] = useState<UploadEntry[]>([]);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const dragCounterRef = useRef(0);

	// ── Upload a single file ──────────────
	const uploadFile = async (file: File) => {
		entryCounter = entryCounter + 1;
		const entryId = `upload-${entryCounter}`;
		const entry: UploadEntry = {
			id: entryId,
			fileName: file.name,
			progress: 0,
			status: "uploading",
		};

		setEntries((prev) => [...prev, entry]);

		try {
			const isConvertible =
				CONVERTIBLE_IMAGE_TYPES.has(file.type) ||
				/\.(jpe?g|png|gif|avif|bmp|tiff?)$/i.test(file.name);

			if (isConvertible) {
				// ── Flujo optimizado: convertir + subir server-side ──
				const result = await uploadConvertibleImage(file, bucket, (pct) => {
					setEntries((prev) =>
						prev.map((e) => (e.id === entryId ? { ...e, progress: pct } : e)),
					);
				});

				setEntries((prev) =>
					prev.map((e) =>
						e.id === entryId ? { ...e, progress: 100, status: "success" } : e,
					),
				);

				onUploadComplete(result);
			} else {
				// ── Flujo clásico para no-imágenes (PDFs, etc.) ──
				// Step 1: Request signed upload URL
				const signedRes = await fetch("/api/media", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						fileName: file.name,
						mimeType: file.type || "application/octet-stream",
						fileSize: file.size,
						bucket,
					}),
				});

				if (!signedRes.ok) {
					const errData = await signedRes.json().catch(() => ({}));
					const _errMsg = errData.error || "Error al solicitar subida";
					setEntries((prev) =>
						prev.map((e) =>
							e.id === entryId
								? { ...e, status: "error" as const, error: _errMsg }
								: e,
						),
					);
					return;
				}

				const { signedUrl, path, publicUrl } = await signedRes.json();

				// Step 2: Upload to signed URL (with progress)
				await uploadToSignedUrl(signedUrl, file, (pct) => {
					setEntries((prev) =>
						prev.map((e) => (e.id === entryId ? { ...e, progress: pct } : e)),
					);
				});

				setEntries((prev) =>
					prev.map((e) => (e.id === entryId ? { ...e, progress: 100 } : e)),
				);

				// Step 3: Confirm upload (register metadata)
				const confirmRes = await fetch("/api/media/confirm", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						bucket,
						storage_path: path,
						file_size: file.size,
						mime_type: file.type || "application/octet-stream",
					}),
				});

				if (!confirmRes.ok) {
					const errData = await confirmRes.json().catch(() => ({}));
					const _errMsg2 = errData.error || "Error al confirmar subida";
					setEntries((prev) =>
						prev.map((e) =>
							e.id === entryId
								? { ...e, status: "error" as const, error: _errMsg2 }
								: e,
						),
					);
					return;
				}

				const { file: uploadedFile } = await confirmRes.json();

				// Fix URL if needed
				const result: MediaFile = {
					...uploadedFile,
					url: uploadedFile.url || publicUrl,
				};

				setEntries((prev) =>
					prev.map((e) => (e.id === entryId ? { ...e, status: "success" } : e)),
				);

				onUploadComplete(result);
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : "Error desconocido";
			setEntries((prev) =>
				prev.map((e) =>
					e.id === entryId ? { ...e, status: "error", error: message } : e,
				),
			);
		}
	};

	// ── File validation ───────────────────
	const processFiles = (files: FileList | File[]) => {
		const fileArray = Array.from(files);

		for (const file of fileArray) {
			// Check size
			if (file.size > MAX_FILE_SIZE) {
				entryCounter = entryCounter + 1;
				const errorId = `upload-${entryCounter}`;
				setEntries((prev) => [
					...prev,
					{
						id: errorId,
						fileName: file.name,
						progress: 0,
						status: "error",
						error: `El archivo excede el límite de 50 MB (${formatFileSize(file.size)})`,
					},
				]);
				continue;
			}

			// Upload
			void uploadFile(file);
		}
	};

	// ── Drag handlers ─────────────────────
	const handleDragOver = (e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDragEnter = (e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		dragCounterRef.current += 1;
		if (e.dataTransfer?.types.includes("Files")) {
			setIsDragOver(true);
		}
	};

	const handleDragLeave = (e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		dragCounterRef.current -= 1;
		if (dragCounterRef.current <= 0) {
			dragCounterRef.current = 0;
			setIsDragOver(false);
		}
	};

	const handleDrop = (e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(false);
		dragCounterRef.current = 0;

		if (!canEdit) return;

		const files = e.dataTransfer?.files;
		if (files && files.length > 0) {
			processFiles(files);
		}
	};

	// ── File input change ─────────────────
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files && files.length > 0) {
			processFiles(files);
			e.target.value = "";
		}
	};

	// ── Click handler ─────────────────────
	const handleClickZone = () => {
		if (!canEdit) return;
		fileInputRef.current?.click();
	};

	// ── Dismiss single entry ──────────────
	const dismissEntry = (entryId: string) => {
		setEntries((prev) => prev.filter((e) => e.id !== entryId));
	};

	// ── Disabled state ────────────────────
	if (!canEdit) {
		return (
			<div
				data-testid="upload-zone"
				className="flex flex-col items-center justify-center gap-3 py-16 rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02]"
			>
				<div className="size-14 rounded-xl bg-white/5 flex items-center justify-center ring-1 ring-white/10">
					<IconUpload className="size-7 text-white/20" />
				</div>
				<p className="text-sm text-white/30 font-medium">
					No tienes permisos para subir archivos
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-3">
			{/* Drop zone */}
			<div
				data-testid="upload-zone"
				className={`flex flex-col items-center justify-center gap-3 py-12 rounded-2xl border-2 border-dashed cursor-pointer transition-colors duration-200 ${
					isDragOver
						? "border-primary/60 bg-primary/5"
						: "border-white/10 bg-white/[0.02] hover:border-primary/40 hover:bg-white/[0.04]"
				}`}
				onDragOver={handleDragOver}
				onDragEnter={handleDragEnter}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				onClick={handleClickZone}
				// oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
				role="button"
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						handleClickZone();
					}
				}}
			>
				<div className="size-14 rounded-xl bg-white/5 flex items-center justify-center ring-1 ring-white/10">
					<IconUpload className="size-7 text-white/30" />
				</div>
				<div className="flex flex-col items-center gap-1 text-center">
					<p className="text-sm text-white/50 font-medium">
						Arrastra archivos aquí o haz clic para{" "}
						<span className="text-primary/80 underline underline-offset-4 decoration-primary/30">
							seleccionar archivos
						</span>
					</p>
					<p className="text-xs text-white/30">
						Las imágenes se convierten a WebP automáticamente
					</p>
				</div>

				<input
					ref={fileInputRef}
					type="file"
					className="hidden"
					multiple
					onChange={handleInputChange}
				/>
			</div>

			{/* Upload progress entries */}
			{entries.length > 0 && (
				<div className="flex flex-col gap-2">
					{entries.map((entry) => (
						<div
							key={entry.id}
							data-testid={`upload-entry-${entry.id}`}
							className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
								entry.status === "error"
									? "border-red-500/20 bg-red-500/5"
									: entry.status === "success"
										? "border-green-500/20 bg-green-500/5"
										: "border-white/10 bg-white/5"
							}`}
						>
							{/* Icon */}
							<div className="shrink-0">
								{entry.status === "uploading" && (
									<IconLoader2 className="size-5 text-white/40 animate-spin" />
								)}
								{entry.status === "success" && (
									<IconCheck className="size-5 text-green-400" />
								)}
								{entry.status === "error" && (
									<IconAlertTriangle className="size-5 text-red-400" />
								)}
							</div>

							{/* File info + progress */}
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2">
									<IconFile className="size-3.5 text-white/30 shrink-0" />
									<p className="text-sm text-white/70 truncate">
										{entry.fileName}
									</p>
								</div>
								{entry.status === "uploading" && (
									<div className="mt-1.5 flex items-center gap-2">
										<div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
											<div
												className="h-full rounded-full bg-primary/60 transition-colors duration-300"
												style={{
													width: `${entry.progress}%`,
												}}
											/>
										</div>
										<span className="text-xs text-white/40 w-10 text-right tabular-nums">
											{entry.progress}%
										</span>
									</div>
								)}
								{entry.status === "error" && entry.error && (
									<p className="mt-1 text-xs text-red-300/80">{entry.error}</p>
								)}
							</div>

							{/* Dismiss button */}
							{(entry.status === "success" || entry.status === "error") && (
								<button
									type="button"
									className="shrink-0 rounded-full p-1 hover:bg-white/10 transition-colors"
									onClick={() => dismissEntry(entry.id)}
									aria-label={`Descartar ${entry.fileName}`}
								>
									<IconX className="size-4 text-white/40" />
								</button>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
}
