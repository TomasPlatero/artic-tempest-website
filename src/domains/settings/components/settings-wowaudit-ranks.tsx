"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
	IconPlus,
	IconPencil,
	IconTrash,
	IconDeviceGamepad,
	IconPhoto,
} from "@/shared/ui/tabler-icons";
import { Button } from "@/shared/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select";
import { MediaPicker } from "@/domains/media/components/media-picker";
import type { MediaFile } from "@/domains/media/types";

type RankRow = {
	rank: number;
	name: string;
	color: string | null;
	image_url: string | null;
	roster_section: "main" | "alters";
};

type ImageRow = {
	path: string;
	name: string;
	url: string;
	folder: string | null;
};

type RankForm = {
	open: boolean;
	saving: boolean;
	originalRank: number | null;
	rank: string;
	name: string;
	color: string;
	imageUrl: string;
	rosterSection: "main" | "alters";
};

type Props = {
	ranks: RankRow[];
	images: ImageRow[];
};

function copyRanks(source: RankRow[]): RankRow[] {
	return source;
}

const createEmptyForm = (rank = 0): RankForm => ({
	open: false,
	saving: false,
	originalRank: null,
	rank: String(rank),
	name: "",
	color: "#ffffff",
	imageUrl: "",
	rosterSection: rank >= 7 ? "alters" : "main",
});

async function doSubmitRank(payload: {
	originalRank: number | null;
	rank: number;
	name: string;
	color: string | null;
	imageUrl: string | null;
	rosterSection: "main" | "alters";
}): Promise<{ success: boolean; data?: any; error?: string }> {
	try {
		const res = await fetch("/api/guild/wowaudit/ranks", {
			method: payload.originalRank === null ? "POST" : "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});
		if (!res.ok) {
			const errData = await res.json();
			throw new Error(errData.details || errData.error || "No se pudo guardar");
		}
		const data = await res.json();
		return { success: true, data };
	} catch (error: any) {
		return {
			success: false,
			error: error.message || "No se pudo guardar el rango.",
		};
	}
}

async function doRemoveRank(
	rank: number,
): Promise<{ success: boolean; error?: string }> {
	try {
		const res = await fetch("/api/guild/wowaudit/ranks", {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ rank }),
		});
		if (!res.ok) {
			const data = await res.json();
			throw new Error(data.details || data.error || "No se pudo borrar");
		}
		return { success: true };
	} catch (error: any) {
		return {
			success: false,
			error: error.message || "No se pudo borrar el rango.",
		};
	}
}

export function SettingsWowauditRanksClient({ ranks, images }: Props) {
	const [form, setForm] = useState<RankForm>(() => createEmptyForm());
	const [localRanks, setLocalRanks] = useState<RankRow[]>(() =>
		copyRanks(ranks),
	);
	const [pickerOpen, setPickerOpen] = useState(false);

	const handlePickerSelect = (file: MediaFile) => {
		setForm((prev) => ({ ...prev, imageUrl: file.url }));
		setPickerOpen(false);
	};

	const groupedImages = (() => {
		return images.reduce<Record<string, ImageRow[]>>((acc, image) => {
			const groupName = image.folder || "Raíz";
			acc[groupName] = acc[groupName] || [];
			acc[groupName].push(image);
			return acc;
		}, {});
	})();

	const sortedGroups = (() =>
		Object.entries(groupedImages).sort(([a], [b]) => a.localeCompare(b)))();

	const imageByUrl = (() =>
		Object.fromEntries(images.map((image) => [image.url, image] as const)))();

	const nextRank = (() => {
		const max = localRanks.reduce((acc, row) => Math.max(acc, row.rank), -1);
		return max + 1;
	})();

	const openCreate = () =>
		setForm({ ...createEmptyForm(nextRank), open: true });
	const openEdit = (rank: RankRow) =>
		setForm({
			open: true,
			saving: false,
			originalRank: rank.rank,
			rank: String(rank.rank),
			name: rank.name,
			color: rank.color || "#ffffff",
			imageUrl: rank.image_url || "",
			rosterSection: rank.roster_section,
		});

	const submit = async () => {
		setForm((prev) => ({ ...prev, saving: true }));
		const payload = {
			originalRank: form.originalRank,
			rank: Number(form.rank),
			name: form.name,
			color: form.color || null,
			imageUrl: form.imageUrl || null,
			rosterSection: form.rosterSection,
		};

		const result = await doSubmitRank(payload);
		if (result.success) {
			toast.success(
				form.originalRank === null ? "Rango creado" : "Rango actualizado",
			);
			if (result.data?.rank) {
				setLocalRanks((prev) => {
					const next = prev.filter((entry) => entry.rank !== form.originalRank);
					next.push(result.data.rank);
					return next.sort((a, b) => a.rank - b.rank);
				});
			}
			setForm(createEmptyForm());
		} else {
			toast.error("Error", {
				description: result.error,
			});
		}
		setForm((prev) => ({ ...prev, saving: false }));
	};

	const remove = async (rank: RankRow) => {
		if (!confirm(`¿Borrar el rango ${rank.name}?`)) return;

		const result = await doRemoveRank(rank.rank);
		if (result.success) {
			toast.success("Rango borrado");
			setLocalRanks((prev) => prev.filter((entry) => entry.rank !== rank.rank));
		} else {
			toast.error("Error", {
				description: result.error,
			});
		}
	};

	const selectedImage = form.imageUrl ? imageByUrl[form.imageUrl] : null;

	return (
		<Card className="border-white/10 bg-black/20 backdrop-blur-md">
			<CardHeader className="flex flex-row items-start justify-between gap-4">
				<div>
					<CardTitle className="flex items-center gap-2 uppercase tracking-widest text-sm">
						<IconDeviceGamepad className="size-4 text-amber-400" /> Rangos de
						WoWAudit
					</CardTitle>
					<CardDescription className="mt-1">
						Edita los nombres, colores y orden local que usa el roster.
					</CardDescription>
				</div>
				<Button onClick={openCreate} className="gap-2">
					<IconPlus className="size-4" /> Nuevo rango
				</Button>
			</CardHeader>

			<CardContent className="grid gap-3">
				{localRanks.length === 0 ? (
					<p className="text-sm text-white/50">
						No hay rangos configurados todavía.
					</p>
				) : (
					localRanks.map((rank) => (
						<RankRowCard
							key={rank.rank}
							rank={rank}
							onEdit={openEdit}
							onDelete={(rank) => void remove(rank)}
						/>
					))
				)}
			</CardContent>

			<RankFormDialog
				form={form}
				setForm={setForm}
				submit={() => void submit()}
				sortedGroups={sortedGroups}
				images={images}
				selectedImage={selectedImage}
				pickerOpen={pickerOpen}
				onOpenPicker={() => setPickerOpen(true)}
				onPickerSelect={handlePickerSelect}
				onPickerClose={() => setPickerOpen(false)}
			/>
		</Card>
	);
}

function RankRowCard({
	rank,
	onEdit,
	onDelete,
}: {
	rank: RankRow;
	onEdit: (rank: RankRow) => void;
	onDelete: (rank: RankRow) => void;
}) {
	return (
		<div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-center md:justify-between">
			<div className="flex items-center gap-3 min-w-0">
				<div
					className="relative size-7 shrink-0 overflow-hidden rounded-md border bg-black/20 flex items-center justify-center"
					style={{
						borderColor: rank.color || "rgba(255,255,255,0.15)",
					}}
				>
					{rank.image_url ? (
						<Image
							src={rank.image_url}
							alt={rank.name}
							fill
							sizes="28px"
							className="object-cover"
						/>
					) : (
						<div
							className="size-3 rounded-full border border-white/20"
							style={{ backgroundColor: rank.color || "#7c8aa5" }}
						/>
					)}
				</div>
				<div className="min-w-0">
					<div className="flex flex-wrap items-center gap-2">
						<span className="font-semibold uppercase tracking-wide truncate">
							{rank.name}
						</span>
						<span
							className={
								rank.roster_section === "alters"
									? "rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200"
									: "rounded-full border border-sky-400/20 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-200"
							}
						>
							{rank.roster_section === "alters" ? "Alters" : "Arriba"}
						</span>
					</div>
					<p className="text-xs text-white/40 font-mono mt-1 truncate">
						{rank.color || "sin color"}
					</p>
				</div>
			</div>

			<div className="flex items-center gap-2 self-start md:self-auto">
				<Button
					variant="outline"
					size="sm"
					onClick={() => onEdit(rank)}
					className="gap-2"
				>
					<IconPencil className="size-4" /> Editar
				</Button>
				<Button
					variant="destructive"
					size="sm"
					onClick={() => onDelete(rank)}
					className="gap-2"
				>
					<IconTrash className="size-4" /> Borrar
				</Button>
			</div>
		</div>
	);
}

function RankFormDialog({
	form,
	setForm,
	submit,
	sortedGroups,
	images,
	selectedImage,
	pickerOpen,
	onOpenPicker,
	onPickerSelect,
	onPickerClose,
}: {
	form: RankForm;
	setForm: React.Dispatch<React.SetStateAction<RankForm>>;
	submit: () => void;
	sortedGroups: [string, ImageRow[]][];
	images: ImageRow[];
	selectedImage: ImageRow | null;
	pickerOpen: boolean;
	onOpenPicker: () => void;
	onPickerSelect: (file: MediaFile) => void;
	onPickerClose: () => void;
}) {
	return (
		<Dialog
			open={form.open}
			onOpenChange={(open) => setForm((prev) => ({ ...prev, open }))}
		>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{form.originalRank === null ? "Nuevo rango" : "Editar rango"}
					</DialogTitle>
					<DialogDescription>
						Estos datos alimentan el roster y sus selects internos.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-2">
					<div className="grid gap-2">
						<Label htmlFor="wowaudit-rank">Orden / Rank</Label>
						<Input
							id="wowaudit-rank"
							type="number"
							value={form.rank}
							onChange={(e) =>
								setForm((prev) => ({ ...prev, rank: e.target.value }))
							}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="wowaudit-name">Nombre</Label>
						<Input
							id="wowaudit-name"
							value={form.name}
							onChange={(e) =>
								setForm((prev) => ({ ...prev, name: e.target.value }))
							}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="wowaudit-section">Tabla</Label>
						<Select
							value={form.rosterSection}
							onValueChange={(value) =>
								setForm((prev) => ({
									...prev,
									rosterSection: value === "alters" ? "alters" : "main",
								}))
							}
						>
							<SelectTrigger
								id="wowaudit-section"
								className="w-full rounded-xl border-white/10 bg-white/5"
							>
								<SelectValue placeholder="Elige dónde se muestra" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="main">Tabla de arriba</SelectItem>
								<SelectItem value="alters">Tabla de abajo (alters)</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="wowaudit-image">Imagen</Label>
						<Select
							value={form.imageUrl || "__none__"}
							onValueChange={(value) =>
								setForm((prev) => ({
									...prev,
									imageUrl: value === "__none__" ? "" : value,
								}))
							}
						>
							<SelectTrigger
								id="wowaudit-image"
								className="w-full rounded-xl border-white/10 bg-white/5"
							>
								<SelectValue placeholder="Elige una imagen del bucket roster_ranks_images" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__none__">Sin imagen</SelectItem>
								{sortedGroups.length === 0 ? (
									<SelectItem value="__empty" disabled>
										No hay imágenes en roster_ranks_images
									</SelectItem>
								) : (
									sortedGroups.map(([folder, folderImages]) => (
										<SelectGroup key={folder}>
											<SelectLabel>{folder}</SelectLabel>
											{folderImages.map((image) => (
												<SelectItem key={image.url} value={image.url}>
													{image.name}
												</SelectItem>
											))}
										</SelectGroup>
									))
								)}
							</SelectContent>
						</Select>

						<div className="flex items-center gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={onOpenPicker}
								className="gap-2"
							>
								<IconPhoto className="size-4" />
								Subir medio
							</Button>
						</div>

						<ImagePreviewGrid
							selectedImage={selectedImage}
							images={images}
							formImageUrl={form.imageUrl}
							formColor={form.color}
							setForm={setForm}
						/>
					</div>

					<div className="grid gap-2">
						<Label htmlFor="wowaudit-color">Color</Label>
						<div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2">
							<div className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-white/15">
								<input
									id="wowaudit-color-picker"
									type="color"
									value={form.color || "#ffffff"}
									onChange={(e) =>
										setForm((prev) => ({ ...prev, color: e.target.value }))
									}
									className="absolute inset-0 size-full cursor-pointer opacity-0"
									aria-label="Seleccionar color del rango"
								/>
								<div
									className="size-full"
									style={{ backgroundColor: form.color || "#ffffff" }}
								/>
							</div>
							<Input
								id="wowaudit-color"
								value={form.color}
								onChange={(e) =>
									setForm((prev) => ({ ...prev, color: e.target.value }))
								}
								placeholder="#ffffff"
								className="font-mono uppercase"
							/>
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => setForm(createEmptyForm())}>
						Cancelar
					</Button>
					<Button onClick={submit} disabled={form.saving}>
						{form.saving ? "Guardando..." : "Guardar"}
					</Button>
				</DialogFooter>
			</DialogContent>
			<MediaPicker
				bucket="roster_ranks_images"
				open={pickerOpen}
				onSelect={onPickerSelect}
				onClose={onPickerClose}
				title={`Seleccionar imagen para ${form.name || "rango"}`}
				showUpload={true}
			/>
		</Dialog>
	);
}

function ImagePreviewGrid({
	selectedImage,
	images,
	formImageUrl,
	formColor,
	setForm,
}: {
	selectedImage: ImageRow | null;
	images: ImageRow[];
	formImageUrl: string;
	formColor: string;
	setForm: React.Dispatch<React.SetStateAction<RankForm>>;
}) {
	return (
		<div className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
			<div className="flex items-center gap-3">
				<div
					className="relative size-14 shrink-0 overflow-hidden rounded-lg border bg-black/20 flex items-center justify-center"
					style={{
						borderColor: formColor || "rgba(255,255,255,0.15)",
					}}
				>
					{selectedImage ? (
						<Image
							src={selectedImage.url}
							alt="Vista previa del rango"
							fill
							sizes="56px"
							className="object-cover"
						/>
					) : (
						<span className="text-[10px] text-white/30 uppercase">Preview</span>
					)}
				</div>
				<div className="min-w-0">
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70 truncate">
						{selectedImage?.name || "Sin imagen seleccionada"}
					</p>
					<p className="text-[10px] text-white/40 font-mono truncate">
						{selectedImage?.folder || "roster_ranks_images"}
					</p>
				</div>
			</div>

			<div className="grid max-h-56 gap-2 overflow-auto pr-1 sm:grid-cols-2">
				{images.length === 0 ? (
					<p className="text-sm text-white/40 sm:col-span-2">
						No hay imágenes cargadas en el bucket.
					</p>
				) : (
					images.map((image) => {
						const active = formImageUrl === image.url;
						return (
							<button
								key={image.url}
								type="button"
								onClick={() =>
									setForm((prev) => ({
										...prev,
										imageUrl: image.url,
									}))
								}
								className={`flex items-center gap-3 rounded-lg border p-2 text-left transition-colors ${active ? "border-sky-400/40 bg-sky-500/10" : "border-white/10 bg-black/20 hover:bg-white/10"}`}
							>
								<div className="relative size-10 shrink-0 overflow-hidden rounded-md border border-white/10 bg-black/30">
									<Image
										src={image.url}
										alt={image.name}
										fill
										sizes="40px"
										className="object-cover"
									/>
								</div>
								<div className="min-w-0 flex-1">
									<p className="truncate text-xs font-semibold uppercase tracking-wide">
										{image.name}
									</p>
									<p className="truncate text-[10px] font-mono text-white/35">
										{image.folder || "raíz"}
									</p>
								</div>
							</button>
						);
					})
				)}
			</div>
		</div>
	);
}
