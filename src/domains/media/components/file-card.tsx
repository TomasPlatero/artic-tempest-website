"use client";

import type React from "react";
import Image from "next/image";
import {
	IconPhoto,
	IconFileTypePdf,
	IconFile,
	IconVideo,
	IconFolder,
} from "@/shared/ui/tabler-icons";
import { Checkbox } from "@/shared/ui/checkbox";
import type { MediaFile } from "@/domains/media/types";

type FileCardProps = {
	file: MediaFile;
	onSelect: (id: string, selected: boolean) => void;
	onClick: (file: MediaFile) => void;
	isSelected?: boolean;
};

function FileTypeIcon({
	mimeType,
	storagePath,
}: {
	mimeType: string;
	storagePath: string;
}) {
	const ext = storagePath.split(".").pop()?.toLowerCase();
	const isImageExt = ext && IMAGE_EXTENSIONS.has(ext);

	if (mimeType.startsWith("image/") || (!mimeType && isImageExt)) {
		return <IconPhoto className="size-10 text-white/40" />;
	}
	if (mimeType === "application/pdf") {
		return <IconFileTypePdf className="size-10 text-red-400/60" />;
	}
	if (mimeType.startsWith("video/")) {
		return <IconVideo className="size-10 text-blue-400/60" />;
	}
	// Folder / subdirectory
	if (!mimeType && !isImageExt) {
		return <IconFolder className="size-10 text-amber-400/60" />;
	}
	return <IconFile className="size-10 text-white/30" />;
}

// Known image extensions as fallback when mime_type is empty
const IMAGE_EXTENSIONS = new Set([
	"jpg",
	"jpeg",
	"png",
	"gif",
	"webp",
	"avif",
	"svg",
	"bmp",
	"ico",
]);

function isImageFile(file: MediaFile): boolean {
	if (file.mime_type.startsWith("image/")) return true;
	// Fallback: detect by extension when mime_type is empty (orphaned storage files)
	const ext = file.storage_path.split(".").pop()?.toLowerCase();
	if (ext && IMAGE_EXTENSIONS.has(ext)) return true;
	return false;
}

export function FileCard({
	file,
	onSelect,
	onClick,
	isSelected = false,
}: FileCardProps) {
	const isImage = isImageFile(file);

	const handleCheckboxChange = (checked: boolean) => {
		onSelect(file.id, checked);
	};

	return (
		<button
			type="button"
			onClick={() => onClick(file)}
			data-testid={`file-card-${file.id}`}
			data-file-id={file.id}
			className={`group relative flex flex-col gap-2 rounded-xl border transition-colors hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary/50 text-left ${
				isSelected
					? "border-primary/50 bg-primary/10"
					: "border-white/10 bg-white/5 hover:border-primary/40 hover:bg-white/10"
			}`}
		>
			{/* Thumbnail */}
			<div className="relative aspect-square w-full overflow-hidden rounded-t-xl bg-black/40 flex items-center justify-center p-2">
				{isImage ? (
					<Image
						src={file.url}
						alt={file.alt_text || file.title || file.storage_path}
						fill
						sizes="(max-width: 768px) 50vw, 25vw"
						className="object-contain"
					/>
				) : (
					<FileTypeIcon
						mimeType={file.mime_type}
						storagePath={file.storage_path}
					/>
				)}
			</div>

			{/* File info */}
			<div className="flex items-start gap-2 px-3 pb-3 min-w-0">
			<div
				className="shrink-0 pt-0.5"
				// oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
				role="button"
				tabIndex={0}
				onClick={(e: React.MouseEvent) => e.stopPropagation()}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") e.stopPropagation();
				}}
			>
					<Checkbox
						checked={isSelected}
						onCheckedChange={handleCheckboxChange}
						aria-label={`Seleccionar ${file.title || file.storage_path}`}
					/>
				</div>
				<p className="text-xs font-medium text-white/80 break-all leading-tight pt-0.5">
					{file.title || file.storage_path}
				</p>
			</div>
		</button>
	);
}
