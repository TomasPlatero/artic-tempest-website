"use client";

import { useState } from "react";
import { IconPencil, IconLoader2, IconLock } from "@/shared/ui/tabler-icons";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/shared/ui/dialog";
import type { MediaFolder } from "@/domains/media/types";

async function doSaveFolder(
	onSave: (
		id: string,
		data: { display_name?: string; description?: string; is_system?: boolean },
	) => Promise<void>,
	folderId: string,
	data: { display_name?: string; description?: string; is_system?: boolean },
): Promise<{ success: boolean; error?: string }> {
	try {
		await onSave(folderId, data);
		return { success: true };
	} catch (err) {
		return {
			success: false,
			error:
				err instanceof Error ? err.message : "Error al guardar los cambios",
		};
	}
}

type EditFolderDialogProps = {
	open: boolean;
	folder: MediaFolder | null;
	onOpenChange: (open: boolean) => void;
	onSave: (
		id: string,
		data: { display_name?: string; description?: string; is_system?: boolean },
	) => Promise<void>;
};

export function EditFolderDialog({
	open,
	folder,
	onOpenChange,
	onSave,
}: EditFolderDialogProps) {
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Form state — initialised from folder prop, component remounts via key when folder changes
	const [form, setForm] = useState(() => ({
		name: folder?.display_name ?? "",
		description: folder?.description ?? "",
		isLocked: folder?.is_system ?? false,
	}));

	const reset = () => {
		setForm({ name: "", description: "", isLocked: false });
		setError(null);
	};

	const handleSubmit = async () => {
		if (!folder || isSaving) return;
		if (!form.name.trim()) {
			setError("El nombre es obligatorio");
			return;
		}

		setIsSaving(true);
		setError(null);

		const result = await doSaveFolder(onSave, folder.id, {
			display_name: form.name.trim(),
			description: form.description.trim(),
			is_system: form.isLocked,
		});
		setIsSaving(false);

		if (result.success) {
			onOpenChange(false);
		} else {
			setError(result.error!);
		}
	};

	const handleCancel = () => {
		if (!isSaving) {
			reset();
			onOpenChange(false);
		}
	};

	const handleOpenChange = (newOpen: boolean) => {
		if (!newOpen && !isSaving) {
			reset();
		}
		onOpenChange(newOpen);
	};

	if (!folder) return null;

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="bg-[#0a0a12]/95 border border-white/10 text-white max-w-md">
				<DialogHeader>
					<DialogTitle className="text-lg font-semibold text-white/90 flex items-center gap-2">
						<IconPencil className="size-5 text-primary/70" />
						Editar Carpeta
					</DialogTitle>
					<DialogDescription className="text-white/50">
						Cambia el nombre o la descripción de la carpeta.
						{folder.is_system &&
							" El nombre del bucket no se puede modificar en carpetas del sistema."}
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-4 py-2">
					<div className="flex flex-col gap-2">
						<Label htmlFor="edit-folder-name">Nombre</Label>
						<Input
							id="edit-folder-name"
							value={form.name}
							onChange={(e) =>
								setForm((prev) => ({ ...prev, name: e.target.value }))
							}
							maxLength={100}
							disabled={isSaving}
							aria-label="Nombre de la carpeta"
							className="border-white/10"
							onKeyDown={(e) => {
								if (e.key === "Enter") { void handleSubmit(); }
							}}
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="edit-folder-desc">Descripción</Label>
						<Textarea
							id="edit-folder-desc"
							value={form.description}
							onChange={(e) =>
								setForm((prev) => ({ ...prev, description: e.target.value }))
							}
							maxLength={500}
							disabled={isSaving}
							aria-label="Descripción"
							className="border-white/10 min-h-20"
							rows={3}
						/>
					</div>

					<div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
						<div className="flex items-center gap-3">
							<IconLock className="size-4 text-amber-400/70" />
							<div>
								<p className="text-sm font-medium text-white/80">
									Proteger carpeta
								</p>
								<p className="text-xs text-white/40">
									Bloquea la carpeta para evitar que se elimine accidentalmente
								</p>
							</div>
						</div>
						<Switch
							checked={form.isLocked}
							onCheckedChange={(checked) =>
								setForm((prev) => ({ ...prev, isLocked: checked }))
							}
							disabled={isSaving}
							aria-label="Proteger carpeta"
						/>
					</div>

					{error && (
						<p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">
							{error}
						</p>
					)}
				</div>

				<DialogFooter className="gap-2 sm:justify-between">
					<Button
						variant="outline"
						onClick={handleCancel}
						disabled={isSaving}
						className="border-white/10 hover:bg-white/5"
					>
						Cancelar
					</Button>
					<Button
						onClick={() => void handleSubmit()}
						disabled={isSaving || !form.name.trim()}
						className="gap-2"
					>
						{isSaving ? (
							<>
								<IconLoader2 className="size-4 animate-spin" />
								Guardando…
							</>
						) : (
							"Guardar"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
