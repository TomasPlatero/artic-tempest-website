"use client";

import { Button } from "@/shared/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/dialog";
import {
	IconAlertTriangle,
	IconRefresh,
	IconTrash,
} from "@/shared/ui/tabler-icons";

type Props = {
	open: boolean;
	deleting: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirmDelete: () => void;
};

export function AccountDeleteAccountDialog({
	open,
	deleting,
	onOpenChange,
	onConfirmDelete,
}: Props) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="bg-[#08070b]/95 border border-white/10 text-white sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-lg font-semibold uppercase tracking-tight text-red-400 flex items-center gap-2">
						<IconAlertTriangle className="size-4" />
						¿Eliminar tu cuenta?
					</DialogTitle>
					<DialogDescription className="text-zinc-400 text-sm leading-relaxed">
						Esta acción borrará tu perfil, personajes vinculados, datos de
						reclutamiento, roster de temporada y cualquier otro rastro asociado.
						No podrás recuperarlo.
					</DialogDescription>
				</DialogHeader>
				<div className="rounded-xl border border-white/5 bg-white/5 p-4 text-[13px] text-white/80 leading-relaxed">
					<p className="font-semibold mb-2 text-white/90">
						Resumen del borrado:
					</p>
					<ul className="list-disc pl-4 space-y-1 text-white/70">
						<li>
							Se eliminan tus personajes importados y vínculos con Battle.net.
						</li>
						<li>Desaparecen tus aplicaciones de reclutamiento y sus chats.</li>
						<li>Se borran tus registros del roster de temporada.</li>
						<li>Se purgan tus capturas y conversaciones del chat.</li>
					</ul>
				</div>
				<DialogFooter className="gap-3">
					<Button
						variant="ghost"
						className="w-full sm:w-auto border border-white/10 text-white/70 hover:text-white"
						onClick={() => onOpenChange(false)}
						disabled={deleting}
					>
						Cancelar
					</Button>
					<Button
						variant="destructive"
						className="w-full sm:w-auto text-[11px] font-semibold uppercase tracking-[0.2em] h-11"
						onClick={onConfirmDelete}
						disabled={deleting}
					>
						{deleting ? (
							<IconRefresh className="size-4 animate-spin" />
						) : (
							<IconTrash className="size-4" />
						)}
						Sí, borrar todo
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
