"use client";

import { useState } from "react";
import { IconAlertTriangle } from "@/shared/ui/tabler-icons";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/shared/ui/dialog";

type DeleteConfirmDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	folderName: string;
};

export function DeleteConfirmDialog({
	open,
	onOpenChange,
	onConfirm,
	folderName,
}: DeleteConfirmDialogProps) {
	const [typedName, setTypedName] = useState("");

	const matches = typedName === folderName;

	const reset = () => {
		setTypedName("");
	};

	const handleConfirm = () => {
		if (matches) {
			onConfirm();
			reset();
			onOpenChange(false);
		}
	};

	const handleOpenChange = (newOpen: boolean) => {
		if (!newOpen) {
			reset();
		}
		onOpenChange(newOpen);
	};

	const handleCancel = () => {
		reset();
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="bg-[#0a0a12]/95 border border-red-500/20 text-white max-w-md">
				<DialogHeader>
					<DialogTitle className="text-lg font-semibold text-white/90 flex items-center gap-2">
						<IconAlertTriangle className="size-5 text-red-400" />
						Eliminar Carpeta
					</DialogTitle>
					<DialogDescription className="text-white/60">
						Esta acción eliminará permanentemente la carpeta{" "}
						<strong className="text-white/80">{folderName}</strong> y todos los
						archivos que contiene. Esta acción no se puede deshacer.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-3 py-2">
					<p className="text-sm text-white/50">
						Escribe{" "}
						<code className="text-red-300/80 bg-red-500/10 px-1.5 py-0.5 rounded text-xs">
							{folderName}
						</code>{" "}
						para confirmar:
					</p>

					<Input
						value={typedName}
						onChange={(e) => setTypedName(e.target.value)}
						placeholder={`Escribe "${folderName}" para eliminar`}
						aria-label="Confirmar nombre de carpeta"
						className="border-white/10 font-mono text-sm"
						onKeyDown={(e) => {
							if (e.key === "Enter" && matches) handleConfirm();
						}}
					/>
				</div>

				<DialogFooter className="gap-2 sm:justify-between">
					<Button
						variant="outline"
						onClick={handleCancel}
						className="border-white/10 hover:bg-white/5"
					>
						Cancelar
					</Button>
					<Button
						variant="destructive"
						onClick={handleConfirm}
						disabled={!matches}
						className="gap-2"
					>
						<IconAlertTriangle className="size-4" />
						Eliminar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
