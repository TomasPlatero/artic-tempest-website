"use client";

import { Checkbox } from "@/shared/ui/checkbox";
import type { MediaFile } from "@/domains/media/types";

type FileRowProps = {
	file: MediaFile;
	isSelected: boolean;
	onSelect: (id: string, selected: boolean) => void;
	onClick: (file: MediaFile) => void;
};

function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 B";
	const units = ["B", "KB", "MB", "GB"];
	const i = Math.min(
		Math.floor(Math.log(bytes) / Math.log(1024)),
		units.length - 1,
	);
	const size = bytes / 1024 ** i;
	return `${i === 0 ? size : size.toFixed(1)} ${units[i]}`;
}

function formatDate(dateStr: string): string {
	const date = new Date(dateStr);
	return date.toLocaleDateString("es-ES", {
		timeZone: "UTC",
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

export function FileRow({ file, isSelected, onSelect, onClick }: FileRowProps) {
	return (
		<tr
			// oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
		role="button"
			tabIndex={0}
			onClick={() => onClick(file)}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onClick(file);
				}
			}}
			data-testid={`file-row-${file.id}`}
			className={`cursor-pointer transition-colors hover:bg-white/5 ${
				isSelected ? "bg-primary/10" : ""
			}`}
		>
			<td className="px-4 py-3 w-10">
				<Checkbox
					checked={isSelected}
					onCheckedChange={(checked) => onSelect(file.id, !!checked)}
					onClick={(e: React.MouseEvent) => e.stopPropagation()}
					aria-label={`Seleccionar ${file.title || file.storage_path}`}
				/>
			</td>
			<td className="px-4 py-3 text-sm font-medium text-white/80 truncate max-w-[200px]">
				{file.title || file.storage_path}
			</td>
			<td className="px-4 py-3 text-sm text-white/50">{file.mime_type}</td>
			<td className="px-4 py-3 text-sm text-white/50">
				{formatFileSize(file.file_size)}
			</td>
			<td className="px-4 py-3 text-sm text-white/50">
				{formatDate(file.created_at)}
			</td>
		</tr>
	);
}
