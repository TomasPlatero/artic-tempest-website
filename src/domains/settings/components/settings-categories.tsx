"use client";

import React from "react";
import {
	IconPlus,
	IconTrash,
	IconEdit,
	IconArrowLeft,
	IconDeviceFloppy,
	IconX,
} from "@/shared/ui/tabler-icons";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/ui/table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/dialog";
import { toast } from "sonner";
import Link from "next/link";

async function doSaveCategory(
	category: Partial<{
		id: string;
		name: string;
		slug: string;
		description: string | null;
	}>,
): Promise<{ success: boolean; error?: string; data?: any }> {
	try {
		const method = category.id ? "PATCH" : "POST";

		const response = await fetch("/api/guild/news/categories", {
			method,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(category),
		});

		if (!response.ok) {
			const result = await response.json();
			return { success: false, error: result.error || "Error saving category" };
		}

		const result = await response.json();
		return { success: true, data: result };
	} catch (error: any) {
		return { success: false, error: error.message || "Error saving category" };
	}
}

async function doDeleteCategory(
	id: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const response = await fetch(`/api/guild/news/categories?id=${id}`, {
			method: "DELETE",
		});

		if (!response.ok) {
			const result = await response.json();
			return {
				success: false,
				error: result.error || "Error deleting category",
			};
		}

		return { success: true };
	} catch (error: any) {
		return {
			success: false,
			error: error.message || "Error deleting category",
		};
	}
}

interface Category {
	id: string;
	name: string;
	slug: string;
	description: string | null;
}

interface SettingsCategoriesProps {
	initialCategories: Category[];
}

// react-doctor-disable-next-line no-giant-component
export function SettingsCategories({
	initialCategories,
}: SettingsCategoriesProps) {
	const [state, setState] = React.useState(() => ({
		categories: initialCategories,
		isDialogOpen: false,
		editingCategory: null as Partial<Category> | null,
		loading: false,
	}));
	const { categories, isDialogOpen, editingCategory, loading } = state;

	const setCategories = (value: React.SetStateAction<Category[]>) =>
		setState((prev) => ({
			...prev,
			categories:
				typeof value === "function" ? (value as any)(prev.categories) : value,
		}));
	const setIsDialogOpen = (value: React.SetStateAction<boolean>) =>
		setState((prev) => ({
			...prev,
			isDialogOpen:
				typeof value === "function" ? (value as any)(prev.isDialogOpen) : value,
		}));
	const setEditingCategory = (
		value: React.SetStateAction<Partial<Category> | null>,
	) =>
		setState((prev) => ({
			...prev,
			editingCategory:
				typeof value === "function"
					? (value as any)(prev.editingCategory)
					: value,
		}));
	const setLoading = (value: React.SetStateAction<boolean>) =>
		setState((prev) => ({
			...prev,
			loading:
				typeof value === "function" ? (value as any)(prev.loading) : value,
		}));

	const handleOpenDialog = (category?: Category) => {
		if (category) {
			setEditingCategory(category);
		} else {
			setEditingCategory({ name: "", slug: "", description: "" });
		}
		setIsDialogOpen(true);
	};

	const handleCloseDialog = () => {
		setIsDialogOpen(false);
		setEditingCategory(null);
	};

	const handleSave = async () => {
		if (!editingCategory?.name || !editingCategory?.slug) {
			toast.error("El nombre y el slug son obligatorios");
			return;
		}

		setLoading(true);
		const result = await doSaveCategory(editingCategory);

		if (result.success && result.data) {
			if (editingCategory.id) {
				setCategories((prev) =>
					prev.map((c) => (c.id === editingCategory.id ? result.data : c)),
				);
				toast.success("Categoría actualizada correctamente");
			} else {
				setCategories((prev) => [...prev, result.data]);
				toast.success("Categoría creada correctamente");
			}
			handleCloseDialog();
		} else {
			console.error(result.error);
			toast.error("Error al guardar la categoría: " + (result.error || ""));
		}

		setLoading(false);
	};

	const handleDelete = async (id: string) => {
		if (
			!confirm(
				"¿Estás seguro de que deseas eliminar esta categoría? Las noticias asociadas podrían verse afectadas.",
			)
		) {
			return;
		}

		const result = await doDeleteCategory(id);

		if (result.success) {
			setCategories((prev) => prev.filter((c) => c.id !== id));
			toast.success("Categoría eliminada correctamente");
		} else {
			console.error(result.error);
			toast.error("Error al eliminar la categoría: " + (result.error || ""));
		}
	};

	return (
		<div className="flex flex-col gap-6 p-4 md:p-8 lg:px-12">
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div className="flex items-center gap-4">
					<Link href="/zona-raider/configuracion/noticias">
						<Button variant="ghost" size="icon" className="rounded-full">
							<IconArrowLeft className="size-5" />
						</Button>
					</Link>
					<div>
						<h1 className="text-2xl font-semibold italic tracking-tighter uppercase">
							Gestión de Categorías
						</h1>
						<p className="text-sm text-muted-foreground">
							Administra las etiquetas disponibles para organizar las noticias.
						</p>
					</div>
				</div>
				<Button
					onClick={() => handleOpenDialog()}
					className="bg-blue-600 hover:bg-blue-500 font-bold italic uppercase tracking-tighter"
				>
					<IconPlus className="size-4 mr-2" />
					Nueva Categoría
				</Button>
			</div>

			<div className="rounded-3xl border border-white/5 bg-white/[0.02] overflow-hidden backdrop-blur-sm">
				<Table>
					<TableHeader className="bg-white/[0.03]">
						<TableRow className="border-white/5 hover:bg-transparent">
							<TableHead className="text-[10px] font-semibold uppercase tracking-widest py-5 px-6">
								Nombre
							</TableHead>
							<TableHead className="text-[10px] font-semibold uppercase tracking-widest py-5 px-6">
								Slug
							</TableHead>
							<TableHead className="text-[10px] font-semibold uppercase tracking-widest py-5 px-6 hidden md:table-cell">
								Descripción
							</TableHead>
							<TableHead className="text-[10px] font-semibold uppercase tracking-widest py-5 px-6 text-right">
								Acciones
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{categories.map((category) => (
							<TableRow
								key={category.id}
								className="border-white/5 hover:bg-white/[0.02] transition-colors"
							>
								<TableCell className="font-bold px-6 py-4">
									<span className="bg-white/5 px-3 py-1 rounded-full text-[11px] uppercase tracking-wider border border-white/5">
										{category.name}
									</span>
								</TableCell>
								<TableCell className="px-6 py-4">
									<code className="text-[10px] text-zinc-500 bg-white/5 px-2 py-0.5 rounded">
										{category.slug}
									</code>
								</TableCell>
								<TableCell className="text-zinc-400 text-xs px-6 py-4 hidden md:table-cell max-w-xs truncate">
									{category.description || "-"}
								</TableCell>
								<TableCell className="text-right px-6 py-4">
									<div className="flex items-center justify-end gap-2">
										<Button
											variant="ghost"
											size="icon"
											onClick={() => handleOpenDialog(category)}
											className="size-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-500"
										>
											<IconEdit className="size-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => void handleDelete(category.id)}
											className="size-8 rounded-lg hover:bg-red-500/10 hover:text-red-500"
										>
											<IconTrash className="size-4" />
										</Button>
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="max-w-md bg-zinc-950 border-white/10 p-8 rounded-[32px]">
					<DialogHeader>
						<DialogTitle className="text-2xl font-semibold italic tracking-tighter uppercase">
							{editingCategory?.id ? "Editar Categoría" : "Nueva Categoría"}
						</DialogTitle>
						<DialogDescription>
							Completa los campos para definir una nueva categoría de noticias.
						</DialogDescription>
					</DialogHeader>

					<div className="grid gap-6 py-6">
						<div className="space-y-2">
							<label
								htmlFor="cat-name"
								className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 px-1"
							>
								Nombre
							</label>
							<Input
								id="cat-name"
								value={editingCategory?.name || ""}
								onChange={(e) =>
									setEditingCategory((prev) => ({
										...prev!,
										name: e.target.value,
									}))
								}
								placeholder="Ej: Raid"
								className="bg-white/5 border-white/10 rounded-xl focus:ring-blue-500"
							/>
						</div>
						<div className="space-y-2">
							<label
								htmlFor="cat-slug"
								className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 px-1"
							>
								Slug
							</label>
							<Input
								id="cat-slug"
								value={editingCategory?.slug || ""}
								onChange={(e) =>
									setEditingCategory((prev) => ({
										...prev!,
										slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
									}))
								}
								placeholder="ej-raid"
								className="bg-white/5 border-white/10 rounded-xl focus:ring-blue-500"
							/>
						</div>
						<div className="space-y-2">
							<label
								htmlFor="cat-desc"
								className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 px-1"
							>
								Descripción
							</label>
							<Textarea
								id="cat-desc"
								value={editingCategory?.description || ""}
								onChange={(e) =>
									setEditingCategory((prev) => ({
										...prev!,
										description: e.target.value,
									}))
								}
								placeholder="Noticias sobre..."
								className="bg-white/5 border-white/10 rounded-xl focus:ring-blue-500 min-h-[100px]"
							/>
						</div>
					</div>

					<DialogFooter className="gap-3">
						<Button
							variant="ghost"
							onClick={handleCloseDialog}
							className="rounded-xl font-bold uppercase tracking-tighter text-xs"
						>
							<IconX className="size-4 mr-2" />
							Cancelar
						</Button>
						<Button
							onClick={() => void handleSave()}
							disabled={loading}
							className="bg-blue-600 hover:bg-blue-500 rounded-xl px-8 font-semibold italic uppercase tracking-tighter shadow-xl shadow-blue-600/20"
						>
							{loading ? (
								"Guardando..."
							) : (
								<>
									<IconDeviceFloppy className="size-4 mr-2" />
									Guardar Categoría
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
