"use client";

import React, { useState } from "react";
import { MediaPicker } from "@/domains/media/components/media-picker";
import type { MediaFile } from "@/domains/media/types";
import Image from "next/image";
import {
	IconPlus,
	IconEdit,
	IconTrash,
	IconCheck,
	IconX,
	IconNews,
	IconLayoutCards,
	IconEye,
	IconLayoutList,
	IconFileText,
	IconWorld,
	IconPhoto,
} from "@/shared/ui/tabler-icons";
import { CharacterAvatar } from "@/shared/components/character-avatar";
import { Button } from "@/shared/ui/button";
import { AdminPageHeader } from "@/shared/components/admin-page-header";
import { toast } from "sonner";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Card } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { RichTextEditor } from "@/shared/ui/rich-text-editor";
import {
	NewsPovTabsEditor,
	type PovTab,
} from "@/domains/news/components/news-pov-tabs-editor";
import { toSafeYouTubeEmbed } from "@/shared/lib/youtube";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/ui/table";
import { useSidebar } from "@/shared/components/sidebar";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select";
import { Switch } from "@/shared/ui/switch";
import Link from "next/link";
import { useRouter } from "next/navigation";

const DATE_FORMATTER_UTC = new Intl.DateTimeFormat("es-ES", {
	day: "2-digit",
	month: "2-digit",
	year: "numeric",
	timeZone: "UTC",
});

function fmtDateUTC(value: string): string {
	return DATE_FORMATTER_UTC.format(new Date(value));
}

interface NewsItem {
	id: string;
	title: string;
	slug: string;
	summary: string;
	content: string;
	image_url: string | null;
	category: string;
	author: string;
	is_featured: boolean;
	status: "draft" | "published";
	created_at: string;
	pov_tabs?: PovTab[];
}

export function SettingsNewsClient(props: {
	initialNews: NewsItem[];
	categories: { name: string; slug: string }[];
	currentUser: string;
}) {
	return useSettingsNewsClient(props);
}

function useSettingsNewsClient({
	initialNews,
	categories,
	currentUser,
}: {
	initialNews: NewsItem[];
	categories: { name: string; slug: string }[];
	currentUser: string;
}) {
	const [state, setState] = React.useState(() => ({
		news: initialNews,
		editorState: { editingId: null as string | null, isCreating: false },
		viewMode: "table" as "cards" | "table",
		form: {
			title: "",
			slug: "",
			summary: "",
			content: "",
			image_url: null as string | null,
			category: "General",
			author: "",
			is_featured: false,
			status: "draft" as const,
			pov_tabs: [] as PovTab[],
		},
	}));
	const { news, editorState, viewMode, form } = state;
	const setNews = (value: React.SetStateAction<NewsItem[]>) =>
		setState((prev) => ({
			...prev,
			news: typeof value === "function" ? (value as any)(prev.news) : value,
		}));
	const setEditorState = (
		value: React.SetStateAction<{
			editingId: string | null;
			isCreating: boolean;
		}>,
	) =>
		setState((prev) => ({
			...prev,
			editorState:
				typeof value === "function" ? (value as any)(prev.editorState) : value,
		}));
	const setViewMode = (value: React.SetStateAction<"cards" | "table">) =>
		setState((prev) => ({
			...prev,
			viewMode:
				typeof value === "function" ? (value as any)(prev.viewMode) : value,
		}));
	const setForm = (value: React.SetStateAction<Partial<NewsItem>>) =>
		setState((prev) => ({
			...prev,
			form: typeof value === "function" ? (value as any)(prev.form) : value,
		}));
	const router = useRouter();
	const { setOpen } = useSidebar();
	const { editingId, isCreating } = editorState;

	// Auto-hide global sidebar when editing/creating
	React.useEffect(() => {
		if (isCreating || editingId) {
			setOpen(false);
		} else {
			setOpen(true);
		}
	}, [isCreating, editingId, setOpen]);

	const startEdit = (item: NewsItem) => {
		setEditorState({ editingId: item.id, isCreating: false });
		setForm({ ...item });
	};

	const startCreate = () => {
		setEditorState({ editingId: null, isCreating: true });
		setForm({
			title: "",
			slug: "",
			summary: "",
			content: "",
			image_url: null,
			category: categories[0]?.name || "General",
			author: currentUser,
			is_featured: news.length === 0, // Default to true if first news
			status: "draft",
			pov_tabs: [],
		});
	};

	// Auto-generate slug from title
	const updateTitleAndSlug = (title: string) => {
		const slug = title
			.toLowerCase()
			.trim()
			.replace(/[^\w\s-]/g, "") // Remove non-word chars
			.replace(/[\s_-]+/g, "-") // Replace spaces/underscores with -
			.replace(/^-+|-+$/g, ""); // Remove leading/trailing -

		setForm((prev) => ({ ...prev, title, slug }));
	};

	const cancelEdit = () => {
		setEditorState({ editingId: null, isCreating: false });
	};

	const save = async () => {
		if (!form.title || !form.content) {
			toast.error("El título y el contenido son obligatorios");
			return;
		}

		try {
			const method = editingId ? "PATCH" : "POST";
			const cleanPovTabs = ((form as any).pov_tabs || []).map((tab: any) => ({
				...tab,
				youtube_url:
					toSafeYouTubeEmbed(tab.youtube_url) || tab.youtube_url || "",
			}));
			const body = editingId
				? { id: editingId, ...form, pov_tabs: cleanPovTabs }
				: { ...form, author: currentUser, pov_tabs: cleanPovTabs };

			const res = await fetch("/api/guild/news", {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			if (!res.ok) {
				toast.error("Error al guardar la noticia");
				return;
			}
			const savedItem = await res.json();

			if (editingId) {
				setNews((prev) =>
					prev.map((n) => (n.id === editingId ? savedItem : n)),
				);
				toast.success("Noticia actualizada");
			} else {
				setNews((prev) => [savedItem, ...prev]);
				toast.success("Noticia creada");
			}

			cancelEdit();
			router.refresh();
		} catch {
			toast.error("Error al guardar la noticia");
		}
	};

	const [newsPickerOpen, setNewsPickerOpen] = useState(false);

	const handleMediaPickerSelect = (file: MediaFile) => {
		setForm((prev) => ({ ...prev, image_url: file.url }));
		setNewsPickerOpen(false);
		toast.success("Imagen seleccionada de la biblioteca");
	};

	const deleteNews = async (id: string) => {
		if (!confirm("¿Estás seguro de que quieres eliminar esta noticia?")) return;

		try {
			const res = await fetch(`/api/guild/news?id=${id}`, {
				method: "DELETE",
			});
			if (!res.ok) {
				toast.error("Error al eliminar la noticia");
				return;
			}

			setNews((prev) => prev.filter((n) => n.id !== id));
			toast.success("Noticia eliminada");
			router.refresh();
		} catch {
			toast.error("Error al eliminar la noticia");
		}
	};

	return (
		<>
			<div className="flex flex-col gap-8 w-full animate-in fade-in duration-500">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
					<AdminPageHeader
						title="EDITOR DE NOTICIAS"
						description="Crea y edita comunicados para la landing page y la app."
						backHref="/zona-raider/configuracion/noticias"
					/>

					<div className="flex flex-wrap items-center gap-3">
						{!isCreating && !editingId && (
							<>
								<div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
									<Button
										variant="ghost"
										size="sm"
										className={`h-8 px-2 sm:px-3 rounded-lg flex gap-1 ${viewMode === "table" ? "bg-white/10 text-white" : "text-zinc-500"}`}
										onClick={() => setViewMode("table")}
									>
										<IconLayoutList className="size-4" />
										<span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest hidden xs:inline">
											Tabla
										</span>
									</Button>
									<Button
										variant="ghost"
										size="sm"
										className={`h-8 px-2 sm:px-3 rounded-lg flex gap-1 ${viewMode === "cards" ? "bg-white/10 text-white" : "text-zinc-500"}`}
										onClick={() => setViewMode("cards")}
									>
										<IconLayoutCards className="size-4" />
										<span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest hidden xs:inline">
											Tarjetas
										</span>
									</Button>
								</div>
								<Button
									onClick={startCreate}
									size="sm"
									className="gap-2 h-10 rounded-xl"
								>
									<IconPlus className="size-4" />{" "}
									<span className="hidden sm:inline">Nueva Noticia</span>
									<span className="sm:hidden">Nuevo</span>
								</Button>
							</>
						)}
					</div>
				</div>

				{isCreating || editingId ? (
					<div className="flex flex-col lg:flex-row gap-8 items-start">
						{/* Main Content Column */}
						<Card className="flex-1 w-full p-8 border-border/50 bg-card/40 backdrop-blur-md space-y-8 order-2 lg:order-1">
							<div className="space-y-4">
								<Label className="text-lg font-semibold italic tracking-tighter uppercase opacity-50">
									Título de la Noticia
								</Label>
								<Input
									placeholder="Título de la noticia..."
									className="text-3xl sm:text-4xl h-auto py-2 bg-transparent border-0 border-b border-transparent focus:border-primary/20 rounded-none font-semibold italic tracking-tighter placeholder:opacity-20  uppercase"
									value={form.title || ""}
									onChange={(e) => {
										if (isCreating) {
											updateTitleAndSlug(e.target.value);
										} else {
											setForm((prev) => ({ ...prev, title: e.target.value }));
										}
									}}
								/>
							</div>

							<div className="space-y-4">
								<Label className="text-lg font-semibold italic tracking-tighter uppercase opacity-50">
									Contenido
								</Label>
								<RichTextEditor
									value={form.content || ""}
									onChange={(content) =>
										setForm((prev) => ({ ...prev, content }))
									}
								/>
							</div>

							<div className="space-y-4 border-t border-white/5 pt-6">
								<NewsPovTabsEditor
									tabs={(form as any).pov_tabs || []}
									onChange={(tabs) =>
										setForm((prev) => ({ ...prev, pov_tabs: tabs as any }))
									}
								/>
							</div>
						</Card>

						{/* Settings Sidebar Column */}
						<div className="w-full lg:w-96 space-y-6 order-1 lg:order-2 lg:sticky lg:top-24">
							<Card className="p-6 border-border/50 bg-card/40 backdrop-blur-md space-y-6 shadow-2xl">
								<div className="flex items-center justify-between border-b border-white/5 pb-4">
									<h3 className="font-semibold italic uppercase tracking-tighter text-lg">
										Publicación
									</h3>
									<div className="flex gap-2">
										<Button
											variant="ghost"
											size="sm"
											className="rounded-xl h-9"
											onClick={cancelEdit}
										>
											<IconX className="size-4" />
										</Button>
										<Button
											size="sm"
											className="rounded-xl h-9 bg-primary text-black font-semibold uppercase tracking-widest text-[10px] px-4 shadow-xl shadow-primary/20 hover:scale-105  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
											onClick={() => void save()}
										>
											<IconCheck className="size-4 mr-1" />{" "}
											{editingId ? "Actualizar" : "Publicar"}
										</Button>
									</div>
								</div>

								<div className="space-y-6">
									<div className="space-y-3">
										<Label className="text-[10px] font-semibold uppercase tracking-widest opacity-50">
											Estado
										</Label>
										<Select
											value={form.status}
											onValueChange={(val: any) =>
												setForm((prev) => ({ ...prev, status: val }))
											}
										>
											<SelectTrigger className="w-full bg-white/5 border-white/10 rounded-xl h-11">
												<SelectValue placeholder="Selecciona el estado" />
											</SelectTrigger>
											<SelectContent className="bg-[#0c0c0e] border-white/10 text-white">
												<SelectItem
													value="draft"
													className="focus:bg-white/10 focus:text-white"
												>
													<div className="flex items-center gap-2">
														<IconFileText className="size-4 text-zinc-400" />
														<span>Borrador</span>
													</div>
												</SelectItem>
												<SelectItem
													value="published"
													className="focus:bg-white/10 focus:text-white"
												>
													<div className="flex items-center gap-2">
														<IconWorld className="size-4 text-blue-500" />
														<span>Publicada</span>
													</div>
												</SelectItem>
											</SelectContent>
										</Select>
									</div>

									<div className="space-y-4">
										<div className="space-y-2">
											<Label className="text-[10px] font-semibold uppercase tracking-widest opacity-50">
												Slug de la noticia (URL)
											</Label>
											<div className="relative group">
												<Input
													value={form.slug || ""}
													onChange={(e) =>
														setForm((prev) => ({
															...prev,
															slug: e.target.value,
														}))
													}
													placeholder="una-nueva-era"
													className="bg-white/5 border-white/10 focus:border-primary/50 rounded-xl h-10 text-xs font-mono lowercase"
												/>
											</div>
										</div>

										<div className="space-y-2">
											<Label className="text-[10px] font-semibold uppercase tracking-widest opacity-50">
												Resumen de la noticia
											</Label>
											<Input
												value={form.summary || ""}
												onChange={(e) =>
													setForm((prev) => ({
														...prev,
														summary: e.target.value,
													}))
												}
												placeholder="Un breve resumen que enganche a los lectores..."
												className="bg-white/5 border-white/10 focus:border-primary/50 rounded-xl h-12 text-sm"
											/>
										</div>
									</div>

									<div className="space-y-3">
										<Label className="text-[10px] font-semibold uppercase tracking-widest opacity-50">
											Categoría
										</Label>
										<Select
											value={form.category}
											onValueChange={(v) =>
												setForm((prev) => ({ ...prev, category: v }))
											}
										>
											<SelectTrigger className="w-full bg-white/5 border-white/10 rounded-xl h-11">
												<SelectValue placeholder="Seleccionar categoría" />
											</SelectTrigger>
											<SelectContent className="bg-zinc-900 border-white/10">
												{categories.map((cat) => (
													<SelectItem
														key={cat.slug}
														value={cat.name}
														className="focus:bg-white/10"
													>
														{cat.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									<div className="space-y-3">
										<Label className="text-[10px] font-semibold uppercase tracking-widest opacity-50">
											Imagen Destacada
										</Label>
										<div className="flex flex-col gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden group/img-cont">
											{form.image_url ? (
												<div className="aspect-video w-full rounded-xl overflow-hidden relative shadow-2xl border border-white/5">
													<Image
														src={form.image_url}
														alt="Preview"
														fill
														sizes="(min-width: 1280px) 896px, (min-width: 768px) 80vw, 100vw"
														className="object-cover"
													/>
													<div className="absolute inset-0 bg-zinc-950/40 opacity-0 group-hover/img-cont:opacity-100 transition-opacity flex items-center justify-center gap-2">
														<Button
															variant="secondary"
															size="sm"
															className="h-8 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20"
															onClick={() => setNewsPickerOpen(true)}
														>
															Cambiar
														</Button>
													</div>
												</div>
											) : (
												<button
													type="button"
													onClick={() => setNewsPickerOpen(true)}
													className="aspect-video w-full rounded-xl border-2 border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5  flex flex-col items-center justify-center gap-2 text-zinc-500 hover:text-primary group/upload disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-white/10 disabled:hover:bg-transparent disabled:hover:text-zinc-500"
												>
													<IconPhoto className="size-8 group-hover/upload:scale-110 transition-transform" />
													<span className="text-[10px] font-semibold uppercase tracking-widest">
														Subir imagen
													</span>
												</button>
											)}
										</div>
									</div>

									<div className="pt-4 border-t border-white/5">
										<div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/10 rounded-2xl">
											<div className="space-y-0.5">
												<Label
													htmlFor="featured"
													className="cursor-pointer text-[10px] font-semibold uppercase tracking-widest text-primary"
												>
													Noticia Principal
												</Label>
												<p className="text-[9px] text-zinc-500 uppercase tracking-tighter">
													Destacar en la landing
												</p>
											</div>
											<Switch
												id="featured"
												checked={form.is_featured}
												onCheckedChange={(checked) =>
													setForm((prev) => ({ ...prev, is_featured: checked }))
												}
											/>
										</div>
									</div>
								</div>
							</Card>
						</div>
					</div>
				) : (
					<>
						{viewMode === "table" ? (
							<Card className="border-border/50 bg-card/40 backdrop-blur-md overflow-hidden">
								<Table>
									<TableHeader className="bg-white/5">
										<TableRow className="hover:bg-transparent border-white/5">
											<TableHead className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 py-4 h-auto">
												Noticia
											</TableHead>
											<TableHead className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 py-4 h-auto hidden sm:table-cell">
												Estado
											</TableHead>
											<TableHead className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 py-4 h-auto hidden md:table-cell">
												Categoría
											</TableHead>
											<TableHead className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 py-4 h-auto hidden lg:table-cell">
												Autor
											</TableHead>
											<TableHead className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 py-4 h-auto hidden sm:table-cell">
												Fecha
											</TableHead>
											<TableHead className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 py-4 h-auto text-right">
												Acciones
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{news.length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={6}
													className="text-center py-20 text-muted-foreground italic"
												>
													No hay noticias publicadas
												</TableCell>
											</TableRow>
										) : (
											news.map((item) => (
												<TableRow
													key={item.id}
													className="border-white/5 hover:bg-white/[0.02] transition-colors group"
												>
													<TableCell>
														<div className="flex items-center gap-3">
															<div className="size-10 rounded-lg overflow-hidden border border-white/10 shrink-0 relative">
																{item.image_url ? (
																	<Image
																		src={item.image_url}
																		alt=""
																		fill
																		sizes="40px"
																		className="object-cover"
																	/>
																) : (
																	<div className="size-full bg-zinc-900 flex items-center justify-center">
																		<IconNews className="size-4 text-white/10" />
																	</div>
																)}
															</div>
															<div>
																<div className="font-bold text-sm tracking-tight text-white/90 group-hover:text-primary transition-colors flex items-center gap-2">
																	<span className="truncate max-w-[120px] xs:max-w-[200px] sm:max-w-[300px] md:max-w-[400px] lg:max-w-[500px] inline-block">
																		{item.title}
																	</span>
																	{item.is_featured && (
																		<Badge className="bg-primary text-black text-[8px] font-semibold px-1.5 h-4 tracking-tighter shrink-0">
																			DESTACADA
																		</Badge>
																	)}
																</div>
															</div>
														</div>
													</TableCell>
													<TableCell className="hidden sm:table-cell">
														{item.status === "draft" ? (
															<Badge
																variant="outline"
																className="bg-zinc-500/10 text-zinc-500 border-zinc-500/20 text-[9px] font-semibold tracking-widest uppercase"
															>
																Borrador
															</Badge>
														) : (
															<Badge
																variant="outline"
																className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[9px] font-semibold tracking-widest uppercase"
															>
																Publicada
															</Badge>
														)}
													</TableCell>
													<TableCell className="hidden md:table-cell">
														<Badge
															variant="secondary"
															className="bg-white/5 text-[9px] font-bold uppercase tracking-tighter"
														>
															{item.category}
														</Badge>
													</TableCell>
													<TableCell className="text-xs font-medium text-zinc-400 italic hidden lg:table-cell">
														<div className="flex items-center gap-2">
															<CharacterAvatar
																name={item.author}
																size={24}
																className="border-border/50 shadow-inner"
															/>
															{item.author}
														</div>
													</TableCell>
													<TableCell className="text-xs font-medium text-zinc-500 hidden sm:table-cell">
														{fmtDateUTC(item.created_at)}
													</TableCell>
													<TableCell className="text-right">
														<div className="flex justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
															<Link
																href={`/noticias/${item.slug || item.id}${item.status === "draft" ? "?preview=true" : ""}`}
																target="_blank"
															>
																<Button
																	size="icon"
																	aria-label="Ver noticia"
																	variant="ghost"
																	className="size-8 hover:text-primary hover:bg-primary/10"
																>
																	<IconEye className="size-4" />
																</Button>
															</Link>
															<Button
																size="icon"
																aria-label="Editar noticia"
																variant="ghost"
																onClick={() => startEdit(item)}
																className="size-8 hover:text-blue-400 hover:bg-blue-400/10"
															>
																<IconEdit className="size-4" />
															</Button>
															<Button
																size="icon"
																aria-label="Eliminar noticia"
																variant="ghost"
																className="size-8 text-destructive hover:bg-destructive/10"
																onClick={() => void deleteNews(item.id)}
															>
																<IconTrash className="size-4" />
															</Button>
														</div>
													</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							</Card>
						) : (
							<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
								{news.length === 0 ? (
									<div className="col-span-full p-20 text-center border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.01]">
										<IconNews className="size-16 mx-auto mb-4 text-white/10" />
										<p className="text-lg font-semibold italic tracking-tighter uppercase opacity-50">
											No hay noticias publicadas
										</p>
										<p className="text-sm text-muted-foreground">
											Comienza creando tu primera noticia para la comunidad.
										</p>
									</div>
								) : (
									news.map((item) => (
										<Card
											key={item.id}
											className={`group border-border/40 bg-card/20 hover:bg-card/40  hover:translate-y-[-4px] overflow-hidden flex flex-col ${item.status === "draft" ? "opacity-70 grayscale-[0.5]" : ""}`}
										>
											<div className="relative aspect-video overflow-hidden bg-muted">
												{item.image_url ? (
													<Image
														src={item.image_url}
														alt=""
														fill
														sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
														className="object-cover group-hover:scale-110 transition-transform duration-700"
													/>
												) : (
													<div className="size-full flex items-center justify-center bg-zinc-900">
														<IconNews className="size-8 text-white/5" />
													</div>
												)}
												<div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
												<div className="absolute top-2 right-2">
													{item.status === "draft" ? (
														<Badge className="bg-zinc-950/60 backdrop-blur-md text-zinc-500 text-[8px] border-zinc-500/30 tracking-widest">
															BORRADOR
														</Badge>
													) : (
														<Badge className="bg-blue-500/20 backdrop-blur-md text-blue-400 text-[8px] border-blue-500/30 tracking-widest">
															PUBLICADA
														</Badge>
													)}
												</div>
											</div>
											<div className="p-5 flex flex-col flex-1">
												<div className="flex items-center justify-between mb-3">
													<div className="flex items-center gap-2">
														<Badge
															variant="outline"
															className="text-[9px] uppercase tracking-widest bg-primary/5 text-primary border-primary/20"
														>
															{item.category}
														</Badge>
														{item.is_featured && (
															<Badge className="bg-primary text-black text-[9px] font-semibold uppercase tracking-widest">
																DESTACADA
															</Badge>
														)}
													</div>
													<span className="text-[9px] text-muted-foreground font-bold uppercase">
														{fmtDateUTC(item.created_at)}
													</span>
												</div>
												<h4 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors italic leading-relaxed">
													{item.title}
												</h4>
												<p className="text-xs text-muted-foreground line-clamp-2 mb-6 leading-relaxed flex-1">
													{item.summary || "Sin resumen"}
												</p>

												<div className="flex items-center justify-between pt-4 border-t border-white/5">
													<div className="flex items-center gap-2">
														<CharacterAvatar
															name={item.author || "Artic Tempest"}
															size={22}
															className="border-border/50 shadow-inner"
														/>
														<span className="text-[10px] font-bold text-muted-foreground italic truncate max-w-[100px]">
															{item.author || "Artic Tempest"}
														</span>
													</div>
													<div className="flex items-center gap-1">
														<Link
															href={`/noticias/${item.id}${item.status === "draft" ? "?preview=true" : ""}`}
															target="_blank"
														>
															<Button
																size="icon"
																aria-label="Ver noticia"
																variant="ghost"
																className="size-8 hover:text-primary hover:bg-primary/10"
															>
																<IconEye className="size-4" />
															</Button>
														</Link>
														<Button
															size="icon"
															aria-label="Editar noticia"
															variant="ghost"
															onClick={() => startEdit(item)}
															className="size-8 hover:text-blue-400 hover:bg-blue-400/10"
														>
															<IconEdit className="size-4" />
														</Button>
														<Button
															size="icon"
															aria-label="Eliminar noticia"
															variant="ghost"
															className="size-8 text-destructive hover:bg-destructive/10"
															onClick={() => void deleteNews(item.id)}
														>
															<IconTrash className="size-4" />
														</Button>
													</div>
												</div>
											</div>
										</Card>
									))
								)}
							</div>
						)}
					</>
				)}
			</div>

			<MediaPicker
				bucket="news-images"
				open={newsPickerOpen}
				onSelect={handleMediaPickerSelect}
				onClose={() => setNewsPickerOpen(false)}
				title="Seleccionar imagen destacada"
				showUpload={true}
			/>
		</>
	);
}
