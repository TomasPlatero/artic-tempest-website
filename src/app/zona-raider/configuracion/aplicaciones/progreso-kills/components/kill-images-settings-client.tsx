"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { IconPhoto } from "@/shared/ui/tabler-icons";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select";
import { MediaPicker } from "@/domains/media/components/media-picker";
import type { MediaFile } from "@/domains/media/types";

type BossItem = {
	slug: string;
	name: string;
	ordinal: number;
	imageUrl: string | null;
};

type ImageItem = {
	path: string;
	url: string;
	name: string;
};

type Props = {
	bosses: BossItem[];
	images: ImageItem[];
	initialMappings: Record<string, string>;
};

async function doAssignKillImage(
	bossSlug: string,
	imagePath: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const response = await fetch("/api/guild/progreso/kill-images", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ bossSlug, imagePath }),
		});
		if (!response.ok) {
			const data = await response.json();
			throw new Error(data.error || "No se pudo guardar");
		}
		return { success: true };
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "No se pudo asignar la imagen";
		return { success: false, error: message };
	}
}

async function doRemoveKillImage(
	bossSlug: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const response = await fetch(
			`/api/guild/progreso/kill-images?bossSlug=${encodeURIComponent(bossSlug)}`,
			{ method: "DELETE" },
		);
		if (!response.ok) {
			const data = await response.json();
			throw new Error(data.error || "No se pudo borrar");
		}
		return { success: true };
	} catch (error: any) {
		return {
			success: false,
			error: error.message || "No se pudo eliminar la imagen",
		};
	}
}

// react-doctor-disable-next-line no-giant-component
export function KillImagesSettingsClient({
	bosses,
	images: initialImages,
	initialMappings,
}: Props) {
	const [mappings, setMappings] = useState<Record<string, string>>(
		() => initialMappings,
	);
	const [localImages, setLocalImages] = useState<ImageItem[]>(
		() => initialImages,
	);
	const [pendingBoss, setPendingBoss] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();
	const [pickerOpen, setPickerOpen] = useState(false);
	const [pickerTargetBoss, setPickerTargetBoss] = useState<string | null>(null);

	const imageByPath = (() =>
		Object.fromEntries(
			localImages.map((image) => [image.path, image] as const),
		))();

	const handleLibraryClick = (bossSlug: string) => {
		setPickerTargetBoss(bossSlug);
		setPickerOpen(true);
	};

	const handleMediaPickerSelect = async (file: MediaFile) => {
		const bossSlug = pickerTargetBoss;
		if (!bossSlug) return;

		setPickerOpen(false);
		setPendingBoss(bossSlug);

		// Add image to local list if not already there
		const newPath = file.storage_path;
		setLocalImages((prev) => {
			if (prev.some((img) => img.path === newPath)) return prev;
			return [
				...prev,
				{ path: newPath, name: file.title || file.storage_path, url: file.url },
			];
		});

		// Assign via PATCH
		const result = await doAssignKillImage(bossSlug, newPath);
		if (result.success) {
			setMappings((prev) => ({ ...prev, [bossSlug]: newPath }));
			toast.success("Imagen asignada desde la biblioteca");
		} else {
			toast.error(result.error);
		}
		setPendingBoss(null);
		setPickerTargetBoss(null);
	};

	const handleSave = (bossSlug: string) => {
		const imagePath = mappings[bossSlug];
		if (!imagePath) {
			toast.error("Selecciona una imagen primero");
			return;
		}

		setPendingBoss(bossSlug);
		startTransition(async () => {
			const result = await doAssignKillImage(bossSlug, imagePath);
			if (result.success) {
				toast.success("Imagen guardada");
			} else {
				toast.error(result.error);
			}
			setPendingBoss(null);
		});
	};

	const handleRemove = (bossSlug: string) => {
		setPendingBoss(bossSlug);
		startTransition(async () => {
			const result = await doRemoveKillImage(bossSlug);
			if (result.success) {
				setMappings((prev) => {
					const next = { ...prev };
					delete next[bossSlug];
					return next;
				});
				toast.success("Imagen eliminada");
			} else {
				toast.error(result.error);
			}
			setPendingBoss(null);
		});
	};

	const bossCards = bosses.map((boss) => {
		const currentPath = mappings[boss.slug] || "";
		const currentImage = currentPath ? imageByPath[currentPath] : null;

		return (
			<Card key={boss.slug} className="border-white/10 bg-white/[0.03]">
				<CardHeader className="gap-2 md:gap-3 border-b border-white/5 pb-4 md:pb-5">
					<div className="flex items-start justify-between gap-2 md:gap-4">
						<div className="min-w-0 flex-1">
							<CardTitle className="text-base md:text-lg uppercase tracking-tight truncate">
								{boss.ordinal}. {boss.name}
							</CardTitle>
							<CardDescription className="mt-1 text-[10px] md:text-xs uppercase tracking-[0.3em] text-white/40 truncate">
								{boss.slug}
							</CardDescription>
						</div>
						{currentImage ? (
							<span className="shrink-0 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-xs font-semibold uppercase tracking-[0.25em] text-emerald-200">
								OK
							</span>
						) : (
							<span className="shrink-0 rounded-full border border-white/10 px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
								—
							</span>
						)}
					</div>
				</CardHeader>
				<CardContent className="space-y-3 md:space-y-4 py-4 md:py-5">
					<div className="grid gap-3 md:gap-4 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-start">
						<div className="space-y-2 md:space-y-3">
							<Select
								value={currentPath || undefined}
								onValueChange={(value) =>
									setMappings((prev) => ({ ...prev, [boss.slug]: value }))
								}
							>
								<SelectTrigger className="w-full rounded-xl border-white/10 bg-white/5 text-sm">
									<SelectValue placeholder="Elige una imagen del bucket" />
								</SelectTrigger>
								<SelectContent>
									{localImages.length === 0 ? (
										<SelectItem value="__empty" disabled>
											No hay imágenes en el bucket
										</SelectItem>
									) : (
										localImages.map((image) => (
											<SelectItem key={image.path} value={image.path}>
												{image.name}
											</SelectItem>
										))
									)}
								</SelectContent>
							</Select>

							<div className="flex flex-wrap gap-2 md:gap-3">
								<Button
									type="button"
									size="sm"
									className="rounded-xl text-xs md:text-sm"
									onClick={() => handleSave(boss.slug)}
									disabled={isPending && pendingBoss === boss.slug}
								>
									Guardar
								</Button>
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="rounded-xl border-white/10 bg-white/5 text-xs md:text-sm"
									onClick={() => handleLibraryClick(boss.slug)}
									disabled={isPending && pendingBoss === boss.slug}
								>
									<IconPhoto className="size-3.5 md:size-4" />
									Biblioteca
								</Button>
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="rounded-xl border-white/10 bg-white/5 text-xs md:text-sm"
									onClick={() => handleRemove(boss.slug)}
									disabled={isPending && pendingBoss === boss.slug}
								>
									Quitar
								</Button>
							</div>
						</div>

						<div className="overflow-hidden rounded-xl md:rounded-2xl border border-white/10 bg-black/30">
							{currentImage ? (
								<div className="relative w-full">
									<Image
										src={currentImage.url}
										alt={currentImage.name}
										width={640}
										height={360}
										className="h-36 md:h-40 w-full object-contain bg-black/50"
									/>
								</div>
							) : (
								<div className="flex h-24 md:h-40 items-center justify-center px-4 md:px-6 text-center text-xs md:text-sm text-white/40">
									Selecciona una imagen para ver la vista previa.
								</div>
							)}
						</div>
					</div>
				</CardContent>
			</Card>
		);
	});

	const bucketSection = (
		<Card className="border-white/10 bg-white/[0.03]">
			<CardHeader className="border-b border-white/5 pb-3 md:pb-4">
				<CardTitle className="text-base md:text-lg uppercase tracking-tight">
					Imágenes del bucket
				</CardTitle>
				<CardDescription className="text-xs md:text-sm">
					Archivos cargados en{" "}
					<span className="font-semibold text-white">image_boses_kills</span>.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-2 md:space-y-3 py-4 md:py-5">
				{localImages.length === 0 ? (
					<p className="text-xs md:text-sm text-white/50">
						No se encontraron imágenes en el bucket.
					</p>
				) : (
					localImages.map((image) => (
						<div
							key={image.path}
							className="flex items-center gap-2 md:gap-3 rounded-lg md:rounded-xl border border-white/5 bg-white/[0.02] p-2 md:p-3"
						>
							<div className="relative size-10 md:size-14 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/30">
								<Image
									src={image.url}
									alt={image.name}
									fill
									sizes="56px"
									className="object-cover"
								/>
							</div>
							<div className="min-w-0 flex-1">
								<p className="truncate text-xs md:text-sm font-medium text-white">
									{image.name}
								</p>
								<p className="truncate text-[10px] md:text-xs text-white/40">
									{image.path}
								</p>
							</div>
						</div>
					))
				)}
			</CardContent>
		</Card>
	);

	return (
		<>
			<MediaPicker
				bucket="image_boses_kills"
				open={pickerOpen}
				onSelect={(file) => void handleMediaPickerSelect(file)}
				onClose={() => {
					setPickerOpen(false);
					setPickerTargetBoss(null);
				}}
				title={
					pickerTargetBoss
						? `Seleccionar imagen para ${bosses.find((b) => b.slug === pickerTargetBoss)?.name ?? pickerTargetBoss}`
						: "Seleccionar imagen"
				}
				showUpload={true}
			/>

			{/* Mobile: bucket images at top, bosses below */}
			<div className="flex flex-col gap-5 xl:hidden">
				{bucketSection}
				<div className="space-y-3">{bossCards}</div>
			</div>

			{/* Desktop: grid with bosses left, bucket right */}
			<div className="hidden xl:grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.85fr)]">
				<div className="space-y-4">{bossCards}</div>
				{bucketSection}
			</div>
		</>
	);
}
