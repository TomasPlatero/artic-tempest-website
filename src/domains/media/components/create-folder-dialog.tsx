"use client";

import { useState } from "react";
import { IconFolderPlus, IconLoader2 } from "@/shared/ui/tabler-icons";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Label } from "@/shared/ui/label";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/shared/ui/dialog";

async function doCreateFolder(
	onCreate: (data: {
		display_name: string;
		description: string;
	}) => Promise<void>,
	name: string,
	description: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		await onCreate({ display_name: name, description });
		return { success: true };
	} catch (err) {
		return {
			success: false,
			error: err instanceof Error ? err.message : "Error al crear la carpeta",
		};
	}
}

type CreateFolderDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCreate: (data: {
		display_name: string;
		description: string;
	}) => Promise<void>;
};

export function CreateFolderDialog({
	open,
	onOpenChange,
	onCreate,
}: CreateFolderDialogProps) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [isCreating, setIsCreating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const reset = () => {
		setName("");
		setDescription("");
		setError(null);
	};

	const handleSubmit = async () => {
		if (isCreating) return;
		if (!name.trim()) {
			setError("El nombre es obligatorio");
			return;
		}

		setIsCreating(true);
		setError(null);

		const result = await doCreateFolder(
			onCreate,
			name.trim(),
			description.trim(),
		);
		setIsCreating(false);

		if (result.success) {
			reset();
			onOpenChange(false);
		} else {
			setError(result.error!);
		}
	};

	const handleCancel = () => {
		if (!isCreating) {
			reset();
			onOpenChange(false);
		}
	};

	const handleOpenChange = (newOpen: boolean) => {
		if (!newOpen && !isCreating) {
			reset();
		}
		onOpenChange(newOpen);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="bg-[#0a0a12]/95 border border-white/10 text-white max-w-md">
				<DialogHeader>
					<DialogTitle className="text-lg font-semibold text-white/90 flex items-center gap-2">
						<IconFolderPlus className="size-5 text-primary/70" />
						Nueva Carpeta
					</DialogTitle>
					<DialogDescription className="text-white/50">
						Crea una nueva carpeta para organizar tus archivos. Se creará un
						bucket de almacenamiento asociado.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-4 py-2">
					<div className="flex flex-col gap-2">
						<Label htmlFor="folder-name">Nombre de la carpeta</Label>
						<Input
							id="folder-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Ej: Recursos del evento"
							maxLength={100}
							disabled={isCreating}
							aria-label="Nombre de la carpeta"
							className="border-white/10"
							onKeyDown={(e) => {
								if (e.key === "Enter") { void handleSubmit(); }
							}}
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="folder-desc">Descripción</Label>
						<Textarea
							id="folder-desc"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Opcional: describe el propósito de esta carpeta"
							maxLength={500}
							disabled={isCreating}
							aria-label="Descripción"
							className="border-white/10 min-h-20"
							rows={3}
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
						disabled={isCreating}
						className="border-white/10 hover:bg-white/5"
					>
						Cancelar
					</Button>
					<Button
						onClick={() => void handleSubmit()}
						disabled={isCreating || !name.trim()}
						className="gap-2"
					>
						{isCreating ? (
							<>
								<IconLoader2 className="size-4 animate-spin" />
								Creando…
							</>
						) : (
							"Crear"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
