"use client";

import { FileCard } from "./file-card";
import { EmptyState } from "./empty-state";
import type { MediaFile } from "@/domains/media/types";

type FileGridProps = {
	files: MediaFile[];
	selectedIds: Set<string>;
	onSelectFile: (id: string, selected: boolean) => void;
	onClickFile: (file: MediaFile) => void;
	/** ref to the scrolling container where the selection rect is positioned */
	scrollRef?: React.RefObject<HTMLDivElement | null>;
};

export function FileGrid({
	files,
	selectedIds,
	onSelectFile,
	onClickFile,
}: FileGridProps) {
	if (files.length === 0) {
		return (
			<EmptyState
				message="Esta carpeta está vacía."
				hint="Arrastra archivos aquí para subirlos o usa el botón de subir."
			/>
		);
	}

	return (
		<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 select-none">
			{files.map((file) => (
				<FileCard
					key={file.id}
					file={file}
					isSelected={selectedIds.has(file.id)}
					onSelect={onSelectFile}
					onClick={onClickFile}
				/>
			))}
		</div>
	);
}
