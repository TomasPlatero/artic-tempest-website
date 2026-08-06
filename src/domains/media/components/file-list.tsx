"use client";

import { FileRow } from "./file-row";
import { EmptyState } from "./empty-state";
import type { MediaFile } from "@/domains/media/types";

type FileListProps = {
	files: MediaFile[];
	selectedIds: Set<string>;
	onSelectFile: (id: string, selected: boolean) => void;
	onClickFile: (file: MediaFile) => void;
};

export function FileList({
	files,
	selectedIds,
	onSelectFile,
	onClickFile,
}: FileListProps) {
	if (files.length === 0) {
		return (
			<EmptyState
				message="Esta carpeta está vacía."
				hint="Arrastra archivos aquí para subirlos o usa el botón de subir."
			/>
		);
	}

	return (
		<div className="overflow-x-auto rounded-xl border border-white/10">
			<table className="w-full">
				<thead>
					<tr className="border-b border-white/10 bg-white/5">
						<th className="w-10 px-4 py-3" aria-label="Seleccionar" />
						<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/50">
							Nombre
						</th>
						<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/50">
							Tipo
						</th>
						<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/50">
							Tamaño
						</th>
						<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/50">
							Fecha
						</th>
					</tr>
				</thead>
				<tbody>
					{files.map((file) => (
						<FileRow
							key={file.id}
							file={file}
							isSelected={selectedIds.has(file.id)}
							onSelect={onSelectFile}
							onClick={onClickFile}
						/>
					))}
				</tbody>
			</table>
		</div>
	);
}
