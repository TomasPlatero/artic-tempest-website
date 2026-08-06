"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import Selecto from "react-selecto";
import { useSearchParams, useRouter } from "next/navigation";
import {
	IconArrowLeft,
	IconFolder,
	IconChevronRight,
} from "@/shared/ui/tabler-icons";
import { Button } from "@/shared/ui/button";
import { FolderGrid } from "./folder-grid";
import { FileView } from "./file-view";
import { FileDetailSheet } from "./file-detail-sheet";
import { UploadZone } from "./upload-zone";
import { CreateFolderDialog } from "./create-folder-dialog";
import { EditFolderDialog } from "./edit-folder-dialog";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { FilterBar } from "./filter-bar";
import { useMediaFiles } from "@/domains/media/hooks/use-media-files";
import type {
	MediaLibraryClientProps,
	MediaFolder,
	MediaFile,
	MediaSubfolder,
} from "@/domains/media/types";

// react-doctor-disable-next-line no-giant-component
export function MediaLibraryClient({
	folders,
	folderCounts: _folderCounts,
	permissions,
}: MediaLibraryClientProps) {
	const searchParams = useSearchParams();
	const router = useRouter();

	// ── URL-derived state ────────────────────
	const folderIdParam = searchParams.get("folder");

	const [selectedFolder, setSelectedFolder] = useState<MediaFolder | null>(
		null,
	);
	const [prefix, setPrefix] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [typeFilter, setTypeFilter] = useState<"all" | "image" | "document">(
		"all",
	);

	// ── Detail sheet state ──────────────────
	const [detailFile, setDetailFile] = useState<MediaFile | null>(null);
	const [detailOpen, setDetailOpen] = useState(false);

	// ── Dialog state ────────────────────────
	const [createFolderOpen, setCreateFolderOpen] = useState(false);
	const [editFolder, setEditFolder] = useState<MediaFolder | null>(null);
	const [deleteFolder, setDeleteFolder] = useState<MediaFolder | null>(null);

	// ── File selection state (lifted for Selecto) ──
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const selectedIdsRef = useRef(selectedIds);

	useEffect(() => {
		selectedIdsRef.current = selectedIds;
	}, [selectedIds]);

	const handleSelectFile = useCallback((id: string, selected: boolean) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (selected) next.add(id);
			else next.delete(id);
			return next;
		});
	}, []);

	const handleDeselectAll = useCallback(() => {
		setSelectedIds(new Set());
	}, []);

	// ── Restore folder from URL on mount ─────
	useEffect(() => {
		if (folderIdParam && folders.length > 0) {
			const folder = folders.find((f) => f.id === folderIdParam);
			if (folder) {
				// react-doctor-disable-next-line
				setSelectedFolder(folder);
			}
		}
	}, [folderIdParam, folders]);

	// ── Fetch files for selected folder ──────
	const bucketName = selectedFolder?.bucket_name ?? "";
	const {
		files,
		subfolders,
		isLoading,
		error,
		hasMore,
		total,
		loadMore,
		refetch,
	} = useMediaFiles({
		bucket: bucketName,
		type: typeFilter,
		search: searchQuery || undefined,
		prefix,
	});

	// ── Breadcrumb segments ──────────────────
	const breadcrumbSegments = useMemo(() => {
		if (!selectedFolder || !prefix) return [];
		const parts = prefix.replace(/\/$/, "").split("/").filter(Boolean);
		return parts.map((part, i) => ({
			label: part,
			prefix: parts.slice(0, i + 1).join("/") + "/",
		}));
	}, [selectedFolder, prefix]);

	// ── Navigation ───────────────────────────
	const handleSelectFolder = useCallback(
		(folder: MediaFolder) => {
			setSelectedFolder(folder);
			setPrefix("");
			setSearchQuery("");
			setTypeFilter("all");
			const params = new URLSearchParams(searchParams.toString());
			params.set("folder", folder.id);
			router.push(`?${params.toString()}`, { scroll: false });
		},
		[searchParams, router],
	);

	const handleEnterSubfolder = useCallback((subfolder: MediaSubfolder) => {
		setPrefix(subfolder.key + "/");
	}, []);

	const handleNavigateBreadcrumb = useCallback((targetPrefix: string) => {
		setPrefix(targetPrefix);
	}, []);

	const handleBackToFolders = useCallback(() => {
		setSelectedFolder(null);
		setPrefix("");
		setSearchQuery("");
		setTypeFilter("all");
		const params = new URLSearchParams(searchParams.toString());
		params.delete("folder");
		router.push(`?${params.toString()}`, { scroll: false });
	}, [searchParams, router]);

	const handleBackOneLevel = useCallback(() => {
		if (!prefix) {
			handleBackToFolders();
			return;
		}
		// Go up one directory level
		const parts = prefix.replace(/\/$/, "").split("/");
		parts.pop();
		setPrefix(parts.length > 0 ? parts.join("/") + "/" : "");
	}, [prefix, handleBackToFolders]);

	const handleSearchChange = useCallback((query: string) => {
		setSearchQuery(query);
	}, []);

	const handleTypeChange = useCallback((type: "all" | "image" | "document") => {
		setTypeFilter(type);
	}, []);

	// ── File detail ──────────────────────────
	const handleClickFile = useCallback((file: MediaFile) => {
		setDetailFile(file);
		setDetailOpen(true);
	}, []);

	const handleNavigateDetail = useCallback(
		(direction: "prev" | "next") => {
			if (!detailFile || files.length === 0) return;
			const currentIdx = files.findIndex((f) => f.id === detailFile.id);
			if (currentIdx === -1) return;

			const newIdx =
				direction === "prev"
					? Math.max(0, currentIdx - 1)
					: Math.min(files.length - 1, currentIdx + 1);

			setDetailFile(files[newIdx]);
		},
		[detailFile, files],
	);

	const handleSaveMetadata = useCallback(
		async (id: string, field: string, value: string) => {
			const res = await fetch(`/api/media/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ [field]: value }),
			});

			if (!res.ok) {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.error || "Error al actualizar");
			}
		},
		[],
	);

	const handleDeleteFile = useCallback(
		async (id: string) => {
			const res = await fetch(`/api/media/${id}`, {
				method: "DELETE",
			});

			if (res.ok) {
				setDetailOpen(false);
				setDetailFile(null);
				refetch();
			}
		},
		[refetch],
	);

	// ── Upload ──────────────────────────────
	const handleUploadComplete = useCallback(() => {
		refetch();
	}, [refetch]);

	const handleBulkDelete = useCallback(async (): Promise<boolean> => {
		if (selectedIds.size === 0) return false;
		const ids = Array.from(selectedIds).join(",");
		try {
			const res = await fetch(`/api/media/any?ids=${ids}`, {
				method: "DELETE",
			});
			setSelectedIds(new Set());
			refetch();
			return res.ok;
		} catch {
			return false;
		}
	}, [selectedIds, refetch]);

	// ── Create folder ───────────────────────
	const handleCreateFolder = useCallback(
		async (data: { display_name: string; description: string }) => {
			const res = await fetch("/api/media/folders", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});

			if (!res.ok) {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.error || "Error al crear la carpeta");
			}

			// Refresh the page to show new folder
			router.refresh();
		},
		[router],
	);

	// ── Edit folder ─────────────────────────
	const handleSaveFolder = useCallback(
		async (
			id: string,
			data: {
				display_name?: string;
				description?: string;
				is_system?: boolean;
			},
		) => {
			const res = await fetch(`/api/media/folders/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});

			if (!res.ok) {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.error || "Error al guardar los cambios");
			}

			router.refresh();
		},
		[router],
	);

	// ── Delete folder ──────────────────────
	const handleDeleteFolder = useCallback(async () => {
		if (!deleteFolder) return;
		await fetch(`/api/media/folders/${deleteFolder.id}`, { method: "DELETE" });
		setDeleteFolder(null);
		router.refresh();
	}, [deleteFolder, router]);

	// ── Navigation indices ──────────────────
	const detailFileIndex = useMemo(() => {
		if (!detailFile) return -1;
		return files.findIndex((f) => f.id === detailFile.id);
	}, [detailFile, files]);

	// ── Folder grid view ─────────────────────
	if (!selectedFolder) {
		return (
			<div className="flex flex-col gap-6 py-6 px-4 lg:px-6 w-full animate-in fade-in duration-500">
				<FolderGrid
					folders={folders}
					onSelectFolder={handleSelectFolder}
					canManage={permissions.canManage}
					onCreateFolder={
						permissions.canManage ? () => setCreateFolderOpen(true) : undefined
					}
					onEditFolder={setEditFolder}
					onDeleteFolder={setDeleteFolder}
				/>

				<CreateFolderDialog
					open={createFolderOpen}
					onOpenChange={setCreateFolderOpen}
					onCreate={handleCreateFolder}
				/>

				<EditFolderDialog
					key={editFolder?.id ?? "new"}
					open={editFolder !== null}
					folder={editFolder}
					onOpenChange={(open) => {
						if (!open) setEditFolder(null);
					}}
					onSave={handleSaveFolder}
				/>

				<DeleteConfirmDialog
					open={deleteFolder !== null}
					onOpenChange={(open) => {
						if (!open) setDeleteFolder(null);
					}}
					onConfirm={() => void handleDeleteFolder()}
					folderName={deleteFolder?.display_name ?? ""}
				/>
			</div>
		);
	}

	// ── File browser view ────────────────────
	return (
		<div className="flex flex-col gap-6 py-6 px-4 lg:px-6 w-full animate-in fade-in duration-500">
			{/* Header: back button + breadcrumb + folder name */}
			<div className="flex items-center gap-3">
				<Button
					variant="outline"
					size="icon"
					className="size-10 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 transition-colors shadow-xl shrink-0"
					onClick={handleBackOneLevel}
					aria-label="Volver atrás"
				>
					<IconArrowLeft className="size-5" />
				</Button>
				<div className="min-w-0">
					{/* Breadcrumb */}
					<div className="flex items-center gap-1 text-sm text-white/40 flex-wrap">
						<button
							type="button"
							className="hover:text-white/70 transition-colors truncate"
							onClick={handleBackToFolders}
						>
							Medios
						</button>
						<IconChevronRight className="size-3.5 shrink-0" />
						<button
							type="button"
							className="hover:text-white/70 transition-colors truncate"
							onClick={() => setPrefix("")}
						>
							{selectedFolder.display_name}
						</button>
						{breadcrumbSegments.map((seg) => (
							<span key={seg.prefix} className="flex items-center gap-1">
								<IconChevronRight className="size-3.5 shrink-0" />
								<button
									type="button"
									className="hover:text-white/70 transition-colors truncate"
									onClick={() => handleNavigateBreadcrumb(seg.prefix)}
								>
									{seg.label}
								</button>
							</span>
						))}
					</div>
					<h2 className="text-xl font-semibold text-white/80">
						{prefix
							? breadcrumbSegments[breadcrumbSegments.length - 1]?.label
							: selectedFolder.display_name}
					</h2>
					{!prefix && selectedFolder.description && (
						<p className="text-sm text-white/40 mt-1">
							{selectedFolder.description}
						</p>
					)}
				</div>
			</div>

			{/* Upload zone */}
			{permissions.canEdit && (
				<UploadZone
					bucket={bucketName}
					onUploadComplete={handleUploadComplete}
					canEdit={permissions.canEdit}
				/>
			)}

			{/* Filter bar */}
			<FilterBar
				onSearchChange={handleSearchChange}
				onTypeChange={handleTypeChange}
				searchValue={searchQuery}
				typeValue={typeFilter}
			/>

			{/* Subfolder grid */}
			{subfolders.length > 0 && (
				<div className="space-y-3">
					<h3 className="text-xs font-semibold uppercase tracking-widest text-white/30">
						Carpetas
					</h3>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
						{subfolders.map((sf) => (
							<button
								key={sf.key}
								type="button"
								className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-colors text-left group"
								onClick={() => handleEnterSubfolder(sf)}
							>
								<div className="size-12 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
									<IconFolder className="size-6 text-amber-400/70" />
								</div>
								<span className="text-xs text-white/60 font-medium text-center truncate w-full">
									{sf.name}
								</span>
							</button>
						))}
					</div>
				</div>
			)}

			{/* File listing */}
			<FileView
				files={files}
				isLoading={isLoading}
				error={error}
				hasMore={hasMore}
				total={total}
				onLoadMore={() => void loadMore()}
				onClickFile={handleClickFile}
				selectedIds={selectedIds}
				onSelectFile={handleSelectFile}
				onDeselectAll={handleDeselectAll}
				onBulkDelete={handleBulkDelete}
			/>

			{/* Drag-to-select */}
			<Selecto
				container={document.body}
				dragContainer={window}
				selectableTargets={["[data-file-id]"]}
				hitRate={0}
				selectByClick={false}
				selectFromInside={true}
				continueSelect={false}
				toggleContinueSelect={["shift"]}
				scrollOptions={{
					container: document.documentElement,
					throttleTime: 30,
					checkScrollEvent: true,
				}}
				onScroll={({ direction }) => {
					document.documentElement.scrollBy(
						direction[0] * 10,
						direction[1] * 10,
					);
				}}
				preventClickEventOnDrag={true}
				preventDefault={true}
				dragCondition={(e) => {
					const target = (e as { inputEvent?: { target?: EventTarget } })
						.inputEvent?.target as HTMLElement | undefined;
					if (!target) return true;
					return (
						!target.closest("input") &&
						!target.closest("textarea") &&
						!target.closest("button") &&
						!target.closest('[role="dialog"]')
					);
				}}
				onSelect={(e) => {
					for (const el of e.added) {
						const id = el.getAttribute("data-file-id");
						if (id && !selectedIdsRef.current.has(id)) {
							handleSelectFile(id, true);
						}
					}
					for (const el of e.removed) {
						const id = el.getAttribute("data-file-id");
						if (id) {
							handleSelectFile(id, false);
						}
					}
				}}
			/>

			{/* File detail sheet */}
			<FileDetailSheet
				key={detailFile?.id ?? "empty"}
				file={detailFile}
				open={detailOpen}
				onOpenChange={setDetailOpen}
				onSave={handleSaveMetadata}
				onDelete={(id) => void handleDeleteFile(id)}
				hasPrev={detailFileIndex > 0}
				hasNext={detailFileIndex < files.length - 1}
				onNavigate={handleNavigateDetail}
				canEdit={permissions.canEdit}
			/>
		</div>
	);
}
