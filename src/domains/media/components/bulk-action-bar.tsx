"use client";

import { useState } from "react";
import { IconLoader2, IconCheck } from "@/shared/ui/tabler-icons";
import { Button } from "@/shared/ui/button";

async function doBulkDelete(
	onDelete: () => Promise<boolean>,
): Promise<{ success: boolean }> {
	try {
		const ok = await onDelete();
		return { success: ok };
	} catch {
		return { success: false };
	}
}

type BulkActionBarProps = {
	selectedCount: number;
	onDeselectAll: () => void;
	onDelete: () => Promise<boolean>;
};

export function BulkActionBar({
	selectedCount,
	onDeselectAll,
	onDelete,
}: BulkActionBarProps) {
	const [isDeleting, setIsDeleting] = useState(false);
	const [completed, setCompleted] = useState(false);

	const handleDelete = async () => {
		setIsDeleting(true);
		const result = await doBulkDelete(onDelete);
		setIsDeleting(false);
		if (result.success) {
			setCompleted(true);
			setTimeout(() => setCompleted(false), 2500);
		}
	};

	if (selectedCount === 0) return null;

	const label =
		selectedCount === 1 ? "archivo seleccionado" : "archivos seleccionados";

	return (
		<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 rounded-xl border border-primary/30 bg-card/90 backdrop-blur-md px-5 py-3 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
			{completed ? (
				<div className="flex items-center gap-2">
					<IconCheck className="size-4 text-green-400" />
					<p className="text-sm font-medium text-green-300">
						{selectedCount}{" "}
						{selectedCount === 1 ? "archivo eliminado" : "archivos eliminados"}
					</p>
				</div>
			) : (
				<p className="text-sm font-medium text-white/80">
					{selectedCount} {label}
				</p>
			)}

			{!completed && (
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={onDeselectAll}
						disabled={isDeleting}
						className="text-xs"
					>
						Deseleccionar
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="text-xs border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
						data-testid="bulk-delete-btn"
						onClick={() => void handleDelete()}
						disabled={isDeleting}
					>
						{isDeleting ? (
							<>
								<IconLoader2 className="size-3.5 animate-spin" />
								Eliminando…
							</>
						) : (
							`Eliminar ${selectedCount === 1 ? "" : "seleccionados"}`
						)}
					</Button>
				</div>
			)}
		</div>
	);
}
