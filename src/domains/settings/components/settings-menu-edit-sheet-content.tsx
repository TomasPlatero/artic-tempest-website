"use client";

import React from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Switch } from "@/shared/ui/switch";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/tailwind/tailwind-utils";
import { getIconByName } from "@/shared/lib/icon-utils";
import { IconPicker } from "@/shared/components/icon-picker";
import { Checkbox } from "@/shared/ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select";
import { IconCopy } from "@/shared/ui/tabler-icons";
import { useApiQuery } from "@/shared/hooks/use-api-query";
import { SectionCard } from "./settings-menu-section-card";
import type { NavigationItem } from "./settings-menu.types";

import type { AppPage } from "@/app/api/pages/route";

interface EditSheetContentProps {
	editingItem: NavigationItem;
	setEditingItem: (updater: any) => void;
	roleOptions: { value: string; label: string }[];
	editingRolesSet: Set<string>;
	parentBreadcrumb: string | null;
	handleCopyUrl: () => void;
	items: NavigationItem[];
}

// react-doctor-disable-next-line
export function EditSheetContent({
	editingItem,
	setEditingItem,
	roleOptions,
	editingRolesSet,
	parentBreadcrumb,
	handleCopyUrl,
	items,
}: EditSheetContentProps) {
	const { data: pages } = useApiQuery<AppPage[]>("/api/pages", {});

	const activePages = (pages ?? []).filter(
		(p): p is AppPage & { path: string } => Boolean(p.is_active && p.path),
	);

	const handlePageSelect = (pageId: string) => {
		const page = activePages.find((p) => p.id === pageId);
		if (!page) return;
		setEditingItem((prev: any) =>
			prev
				? {
						...prev,
						url: page.path,
						app_id: page.id,
					}
				: prev,
		);
	};

	return (
		<div className="flex flex-col gap-6 py-4 px-4 sm:px-6">
			{/* Current item header */}
			<div className="rounded-2xl border border-white/10 bg-linear-to-br from-white/[0.06] via-white/[0.015] to-transparent p-4 sm:p-5">
				<div className="flex flex-wrap items-center gap-4">
					<div className="p-4 rounded-2xl bg-primary/10 text-primary">
						{React.createElement(
							getIconByName(editingItem.icon_name || "IconFolder"),
							{ className: "size-6" },
						)}
					</div>
					<div className="flex-1 min-w-[200px] space-y-1">
						<p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
							Elemento actual
						</p>
						<p className="text-lg font-semibold text-white">
							{editingItem.name || "Sin nombre"}
						</p>
						<div className="flex flex-wrap gap-2 text-xs">
							<Badge variant="outline" className="h-5 px-2">
								{!editingItem.url ? "Categoría" : "Enlace"}
							</Badge>
							<Badge
								variant="outline"
								className={cn(
									"h-5 px-2",
									editingItem.is_active
										? "border-emerald-500/40 text-emerald-300"
										: "border-red-500/40 text-red-300",
								)}
							>
								{editingItem.is_active ? "Activo" : "Oculto"}
							</Badge>
							{parentBreadcrumb && (
								<Badge variant="outline" className="h-5 px-2">
									{parentBreadcrumb}
								</Badge>
							)}
						</div>
					</div>
					{editingItem.url ? (
						<Button
							variant="outline"
							size="sm"
							className="gap-1.5"
							onClick={handleCopyUrl}
						>
							<IconCopy className="size-3.5" /> Copiar ruta
						</Button>
					) : (
						<Badge variant="secondary" className="h-5 px-3">
							Sin ruta
						</Badge>
					)}
				</div>
				{editingItem.url && (
					<p className="mt-3 text-xs text-muted-foreground font-mono line-clamp-1">
						{editingItem.url}
					</p>
				)}
			</div>

			{/* Main content */}
			<SectionCard
				title="Contenido principal"
				description="Nombre, ruta visible e icono que verán los usuarios."
			>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label>Nombre</Label>
						<Input
							value={editingItem.name}
							onChange={(e) =>
								setEditingItem((prev: any) =>
									prev ? { ...prev, name: e.target.value } : prev,
								)
							}
						/>
						<p className="text-[11px] text-muted-foreground">
							Usa un nombre breve y descriptivo.
						</p>
					</div>
					<div className="space-y-2">
						<Label>URL / Ruta</Label>
						<div className="flex gap-2">
							<Input
								value={editingItem.url || ""}
								onChange={(e) =>
									setEditingItem((prev: any) =>
										prev ? { ...prev, url: e.target.value || null } : prev,
									)
								}
								placeholder="/zona-raider/ruta"
								className="flex-1"
							/>
							<Select value="" onValueChange={handlePageSelect}>
								<SelectTrigger className="w-48">
									<SelectValue placeholder="Elegir página…" />
								</SelectTrigger>
								<SelectContent>
									{activePages.map((page) => (
										<SelectItem key={page.id} value={page.id}>
											{page.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<p className="text-[11px] text-muted-foreground">
							Rutas absolutas. Déjalo vacío para categorías sin enlace. También
							puedes elegir una página registrada.
						</p>
					</div>
				</div>
				<div className="space-y-2">
					<Label>Icono</Label>
					<IconPicker
						value={editingItem.icon_name}
						onSelect={(name: string) =>
							setEditingItem((prev: any) =>
								prev ? { ...prev, icon_name: name } : prev,
							)
						}
					/>
				</div>
			</SectionCard>

			{/* Organization */}
			<SectionCard
				title="Organización y estado"
				description="Controla la jerarquía, el orden y los dispositivos donde aparece."
			>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 flex items-center justify-between">
						<div>
							<p className="text-sm font-medium">Activo</p>
							<p className="text-xs text-muted-foreground">
								Si está desactivado, se ocultará para todos.
							</p>
						</div>
						<Switch
							checked={editingItem.is_active}
							onCheckedChange={(v) =>
								setEditingItem((prev: any) =>
									prev ? { ...prev, is_active: v } : prev,
								)
							}
						/>
					</div>

					<div className="space-y-2">
						<Label>App ID</Label>
						<Input
							value={editingItem.app_id || ""}
							onChange={(e) =>
								setEditingItem((prev: any) =>
									prev ? { ...prev, app_id: e.target.value } : prev,
								)
							}
							placeholder="roster, bis..."
						/>
						<p className="text-[11px] text-muted-foreground">
							Debe coincidir con el ID usado en permisos y métricas.
						</p>
					</div>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label>Padre (Nivel superior)</Label>
						<Select
							value={editingItem.parent_id || "null"}
							onValueChange={(v) =>
								setEditingItem((prev: any) =>
									prev ? { ...prev, parent_id: v === "null" ? null : v } : prev,
								)
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="Ninguno (Raíz)" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="null">Ninguno (Raíz)</SelectItem>
								{items.reduce<React.ReactNode[]>((acc, i: any) => {
									if (i.url || i.id === editingItem.id) return acc;
									const grandParent = i.parent_id
										? items.find((p: any) => p.id === i.parent_id)
										: null;
									acc.push(
										<SelectItem key={i.id} value={i.id}>
											{grandParent ? `${grandParent.name} → ${i.name}` : i.name}
										</SelectItem>,
									);
									return acc;
								}, [])}
							</SelectContent>
						</Select>
						<p className="text-[11px] text-muted-foreground">
							Define dónde se anida dentro del árbol de navegación.
						</p>
					</div>
					<div className="space-y-2">
						<Label>Visibilidad</Label>
						<Select
							value={editingItem.visibility || "all"}
							onValueChange={(v) =>
								setEditingItem((prev: any) =>
									prev ? { ...prev, visibility: v } : prev,
								)
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todos</SelectItem>
								<SelectItem value="pc-only">Solo PC</SelectItem>
								<SelectItem value="mobile-only">Solo Móvil</SelectItem>
							</SelectContent>
						</Select>
						<p className="text-[11px] text-muted-foreground">
							Útil para enlaces destacados por dispositivo.
						</p>
					</div>
				</div>
			</SectionCard>

			{/* Advanced presentation */}
			<SectionCard
				title="Presentación avanzada"
				description="Campos opcionales para mega menús o personalizaciones."
			>
				<div className="space-y-2">
					<Label>Descripción (Mega Menú)</Label>
					<Textarea
						value={editingItem.description || ""}
						onChange={(e) =>
							setEditingItem((prev: any) =>
								prev ? { ...prev, description: e.target.value } : prev,
							)
						}
						placeholder="Descripción breve para el mega menú…"
						rows={3}
					/>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label>Clase CSS</Label>
						<Input
							value={editingItem.css_class || ""}
							onChange={(e) =>
								setEditingItem((prev: any) =>
									prev ? { ...prev, css_class: e.target.value } : prev,
								)
							}
							placeholder="text-emerald-500"
						/>
						<p className="text-[11px] text-muted-foreground">
							Aplica estilos puntuales: colores, énfasis, badges…
						</p>
					</div>
					<div className="space-y-2">
						<Label>ID Elemento</Label>
						<Input
							value={editingItem.element_id || ""}
							onChange={(e) =>
								setEditingItem((prev: any) =>
									prev ? { ...prev, element_id: e.target.value } : prev,
								)
							}
							placeholder="my-nav-item"
						/>
						<p className="text-[11px] text-muted-foreground">
							Útil para automatizaciones o pruebas end-to-end.
						</p>
					</div>
				</div>
			</SectionCard>

			{/* Permissions */}
			<SectionCard
				title="Permisos de visualización"
				description="Limita quién puede ver el elemento. Sin selección = todos."
			>
				<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
					{roleOptions.map((role) => (
						<button
							type="button"
							key={role.value}
							className={cn(
								"flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors bg-transparent w-full",
								editingRolesSet.has(role.value)
									? "border-primary/60 bg-primary/10"
									: "border-white/5 hover:border-white/20",
							)}
							onClick={() => {
								const current = editingItem.roles || [];
								const exists = current.includes(role.value);
								setEditingItem((prev: any) =>
									prev
										? {
												...prev,
												roles: exists
													? current.filter((r: string) => r !== role.value)
													: [...current, role.value],
											}
										: prev,
								);
							}}
						>
							<Checkbox
								checked={editingRolesSet.has(role.value)}
								className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-zinc-950"
							/>
							<span className="text-sm font-medium">{role.label}</span>
						</button>
					))}
				</div>
				<p className="text-xs text-muted-foreground">
					Puedes mezclar roles para crear accesos personalizados.
				</p>
			</SectionCard>
		</div>
	);
}
