"use client";

import { Button } from "@/shared/ui/button";
import { FolderCard } from "./folder-card";
import { EmptyState } from "./empty-state";
import type { MediaFolder } from "@/domains/media/types";

type FolderGridProps = {
	folders: MediaFolder[];
	onSelectFolder: (folder: MediaFolder) => void;
	canManage?: boolean;
	onCreateFolder?: () => void;
	onEditFolder?: (folder: MediaFolder) => void;
	onDeleteFolder?: (folder: MediaFolder) => void;
};

export function FolderGrid({
	folders,
	onSelectFolder,
	canManage = false,
	onCreateFolder,
	onEditFolder,
	onDeleteFolder,
}: FolderGridProps) {
	if (folders.length === 0) {
		return (
			<EmptyState
				message="No hay carpetas disponibles."
				hint="Contacta a un oficial si crees que deberías ver carpetas aquí."
			/>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold text-white/80 uppercase tracking-wide">
					Carpetas
				</h2>
				{canManage && (
					<Button
						variant="outline"
						size="sm"
						className="text-xs"
						data-testid="new-folder-btn"
						onClick={onCreateFolder}
					>
						Nueva Carpeta
					</Button>
				)}
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
				{folders.map((folder) => (
					<FolderCard
						key={folder.id}
						folder={folder}
						onClick={onSelectFolder}
						onEdit={canManage ? onEditFolder : undefined}
						onDelete={canManage ? onDeleteFolder : undefined}
					/>
				))}
			</div>
		</div>
	);
}
