"use client";
import { Button } from "@/shared/ui/button";
import {
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/dialog";
import { IconCheck, IconDeviceFloppy } from "@/shared/ui/tabler-icons";

export function MenuEditorDialogHeader({
	isDraft,
	isCategory,
}: {
	isDraft?: boolean;
	isCategory?: boolean;
}) {
	return (
		<DialogHeader>
			<DialogTitle>
				{isDraft
					? isCategory
						? "Nueva Categoría"
						: "Nuevo Enlace"
					: "Editar Elemento"}
			</DialogTitle>
			<DialogDescription>
				{isDraft
					? "Rellena los datos y pulsa Crear. El elemento no existe hasta que guardes."
					: "Nombre, ruta, icono, permisos y visibilidad en una sola ventana."}
			</DialogDescription>
		</DialogHeader>
	);
}

export function MenuEditorDialogFooter({
	onCancel,
	onSave,
	submitLabel = "Guardar",
	isDraft,
}: {
	onCancel: () => void;
	onSave: () => void;
	submitLabel?: string;
	isDraft?: boolean;
}) {
	return (
		<DialogFooter className="gap-2 border-t border-white/5 pt-4 sm:justify-between">
			<Button variant="outline" onClick={onCancel}>
				Cancelar
			</Button>
			<Button onClick={onSave} className="gap-2">
				{isDraft ? (
					<IconCheck className="size-4" />
				) : (
					<IconDeviceFloppy className="size-4" />
				)}{" "}
				{submitLabel}
			</Button>
		</DialogFooter>
	);
}
