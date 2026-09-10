"use client";

import { useState } from "react";
import {
	IconLayoutGrid,
	IconLayoutList,
	IconLoader2,
	IconAlertTriangle,
} from "@/shared/ui/tabler-icons";
import { Button } from "@/shared/ui/button";
import { FileGrid } from "./file-grid";
import { FileList } from "./file-list";
import { BulkActionBar } from "./bulk-action-bar";
import type { MediaFile } from "@/domains/media/types";

type FileViewProps = {
	files: MediaFile[];
	isLoading: boolean;
	error: string | null;
	hasMore: boolean;
	total: number;
	onLoadMore: () => void;
	onClickFile?: (file: MediaFile) => void;
	selectedIds?: Set<string>;
	onSelectFile?: (id: string, selected: boolean) => void;
	onDeselectAll?: () => void;
	onBulkDelete?: () => Promise<boolean>;
};

function useFileSelection({
	selectedIds,
	onSelectFile,
	onDeselectAll,
}: {
	selectedIds?: Set<string>;
	onSelectFile?: (id: string, selected: boolean) => void;
	onDeselectAll?: () => void;
}) {
	// Internal fallback selection state (for tests or standalone usage)
	const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(
		new Set(),
	);
	const effectiveSelectedIds = selectedIds ?? internalSelectedIds;
	const effectiveOnSelect =
		onSelectFile ??
		((id: string, sel: boolean) => {
			setInternalSelectedIds((prev) => {
				const next = new Set(prev);
				if (sel) next.add(id);
				else next.delete(id);
				return next;
			});
		});
	const effectiveOnDeselect =
		onDeselectAll ?? (() => setInternalSelectedIds(new Set()));

	return { effectiveSelectedIds, effectiveOnSelect, effectiveOnDeselect };
}

function LoadingState() {
	return (
		<div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
			<IconLoader2 className="size-8 animate-spin" />
			<p className="text-sm font-medium">Cargando archivos…</p>
		</div>
	);
}

function ErrorState({ error }: { error: string }) {
	return (
		<div className="flex flex-col items-center justify-center py-20 gap-3">
			<div className="size-16 rounded-2xl bg-red-500/10 flex items-center justify-center ring-1 ring-red-500/20">
				<IconAlertTriangle className="size-8 text-red-400" />
			</div>
			<p className="text-base font-semibold text-red-300">{error}</p>
		</div>
	);
}

function FileViewToolbar({
	total,
	viewMode,
	onChangeView,
}: {
	total: number;
	viewMode: "grid" | "list";
	onChangeView: (mode: "grid" | "list") => void;
}) {
	return (
		<div className="flex items-center justify-between">
			<p className="text-sm font-medium text-white/50">
				{total} {total === 1 ? "archivo" : "archivos"}
			</p>
			<div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
				<Button
					variant={viewMode === "grid" ? "secondary" : "ghost"}
					size="icon"
					className="size-8"
					onClick={() => onChangeView("grid")}
					aria-label="Vista de cuadrícula"
				>
					<IconLayoutGrid className="size-4" />
				</Button>
				<Button
					variant={viewMode === "list" ? "secondary" : "ghost"}
					size="icon"
					className="size-8"
					onClick={() => onChangeView("list")}
					aria-label="Vista de lista"
				>
					<IconLayoutList className="size-4" />
				</Button>
			</div>
		</div>
	);
}

export function FileView({
	files,
	isLoading,
	error,
	hasMore,
	total,
	onLoadMore,
	onClickFile,
	selectedIds,
	onSelectFile,
	onDeselectAll,
	onBulkDelete,
}: FileViewProps) {
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

	// Internal fallback selection state (for tests or standalone usage)
	const { effectiveSelectedIds, effectiveOnSelect, effectiveOnDeselect } =
		useFileSelection({ selectedIds, onSelectFile, onDeselectAll });

	// ── Loading ──────────────────────────────
	if (isLoading && files.length === 0) {
		return <LoadingState />;
	}

	// ── Error ────────────────────────────────
	if (error) {
		return <ErrorState error={error} />;
	}

	// ── Content ──────────────────────────────
	return (
		<div className="flex flex-col gap-4">
			{/* Toolbar: view toggle + file count */}
			<FileViewToolbar
				total={total}
				viewMode={viewMode}
				onChangeView={setViewMode}
			/>

			{/* File content */}
			{viewMode === "grid" ? (
				<FileGrid
					files={files}
					selectedIds={effectiveSelectedIds}
					onSelectFile={effectiveOnSelect}
					onClickFile={onClickFile ?? (() => {})}
				/>
			) : (
				<FileList
					files={files}
					selectedIds={effectiveSelectedIds}
					onSelectFile={effectiveOnSelect}
					onClickFile={onClickFile ?? (() => {})}
				/>
			)}

			{/* Load more */}
			{hasMore && (
				<div className="flex justify-center pt-4">
					<Button
						variant="outline"
						onClick={onLoadMore}
						disabled={isLoading}
						className="text-sm"
					>
						{isLoading ? (
							<>
								<IconLoader2 className="size-4 animate-spin mr-2" />
								Cargando…
							</>
						) : (
							"Cargar más"
						)}
					</Button>
				</div>
			)}

			{/* Bulk action bar */}
			<BulkActionBar
				selectedCount={effectiveSelectedIds.size}
				onDeselectAll={effectiveOnDeselect}
				onDelete={onBulkDelete ?? (async () => false)}
			/>
		</div>
	);
}
