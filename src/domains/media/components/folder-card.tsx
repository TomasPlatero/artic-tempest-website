import { IconLock, IconPencil, IconTrash } from "@/shared/ui/tabler-icons";
import { Badge } from "@/shared/ui/badge";
import type { MediaFolder } from "@/domains/media/types";

type FolderCardProps = {
	folder: MediaFolder;
	onClick: (folder: MediaFolder) => void;
	onEdit?: (folder: MediaFolder) => void;
	onDelete?: (folder: MediaFolder) => void;
};

export function FolderCard({
	folder,
	onClick,
	onEdit,
	onDelete,
}: FolderCardProps) {
	return (
		<div className="group relative flex flex-col rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:border-primary/40 hover:bg-white/10 hover:scale-[1.02] focus-within:ring-2 focus-within:ring-primary/50">
			<button
				type="button"
				onClick={() => onClick(folder)}
				data-testid={`folder-card-${folder.id}`}
				className="flex flex-col gap-2 text-left w-full focus:outline-none"
			>
				<div className="flex items-center gap-2 min-w-0">
					<h3 className="text-base font-semibold text-white truncate">
						{folder.display_name}
					</h3>
					{folder.is_system && (
						<IconLock
							className="size-4 shrink-0 text-amber-400"
							aria-label="Carpeta del sistema"
						/>
					)}
				</div>
				{folder.description && (
					<p className="text-sm text-white/50 line-clamp-2">
						{folder.description}
					</p>
				)}
			</button>

			{/* File count badge — bottom right */}
			<div className="flex items-center justify-end mt-2">
				<Badge variant="secondary" className="shrink-0 text-xs">
					{folder.file_count}
				</Badge>
			</div>

			{/* Action buttons — visible on hover */}
			<div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-colors">
				{onEdit && (
					<button
						type="button"
						className="size-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
						onClick={(e) => {
							e.stopPropagation();
							onEdit(folder);
						}}
						aria-label={`Editar ${folder.display_name}`}
					>
						<IconPencil className="size-3.5 text-white/60" />
					</button>
				)}
				{onDelete && !folder.is_system && (
					<button
						type="button"
						className="size-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
						onClick={(e) => {
							e.stopPropagation();
							onDelete(folder);
						}}
						aria-label={`Eliminar ${folder.display_name}`}
					>
						<IconTrash className="size-3.5 text-red-400/70" />
					</button>
				)}
			</div>
		</div>
	);
}
