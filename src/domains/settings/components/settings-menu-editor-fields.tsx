"use client";
import React from "react";
import { Badge } from "@/shared/ui/badge";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";
import { Textarea } from "@/shared/ui/textarea";
import { cn } from "@/shared/tailwind/tailwind-utils";
import { getIconByName } from "@/shared/lib/icon-utils";
import { IconPicker } from "@/shared/components/icon-picker";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select";
import { useApiQuery } from "@/shared/hooks/use-api-query";
import type { NavigationItem } from "./settings-menu.types";
import type { AppPage } from "@/app/api/pages/route";

export type PatchField = (field: keyof NavigationItem, value: unknown) => void;

/** Pages that can back a menu entry, straight from the pages registry. */
export function useSelectablePages() {
	const { data: pages } = useApiQuery<AppPage[]>("/api/pages", {});
	return (pages ?? []).filter((page): page is AppPage & { path: string } =>
		Boolean(page.is_active && page.path),
	);
}

function buildParentOptions(items: NavigationItem[], excludeId: string) {
	return items.reduce<React.ReactNode[]>((acc, item) => {
		if (item.url || item.id === excludeId) return acc;
		const grandParent = item.parent_id
			? items.find((parent) => parent.id === item.parent_id)
			: null;
		acc.push(
			<SelectItem key={item.id} value={item.id}>
				{grandParent ? `${grandParent.name} → ${item.name}` : item.name}
			</SelectItem>,
		);
		return acc;
	}, []);
}

export function MenuItemSummary({
	item,
	parentBreadcrumb,
}: {
	item: NavigationItem;
	parentBreadcrumb: string | null;
}) {
	const isCategory = !item.url;
	return (
		<div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
			<span className="rounded-lg bg-primary/10 p-2 text-primary">
				{React.createElement(getIconByName(item.icon_name || "IconFolder"), {
					className: "size-5",
				})}
			</span>
			<span className="max-w-[18rem] truncate text-sm font-semibold text-white">
				{item.name || "Sin nombre"}
			</span>
			<Badge variant="outline" className="h-5 px-2">
				{isCategory ? "Categoría" : "Enlace"}
			</Badge>
			<Badge
				variant="outline"
				className={cn(
					"h-5 px-2",
					item.is_active
						? "border-emerald-500/40 text-emerald-300"
						: "border-red-500/40 text-red-300",
				)}
			>
				{item.is_active ? "Activo" : "Oculto"}
			</Badge>
			{parentBreadcrumb && (
				<Badge variant="outline" className="h-5 px-2">
					{parentBreadcrumb}
				</Badge>
			)}
		</div>
	);
}

export function MenuContentFields({
	item,
	patchField,
	nameInputRef,
}: {
	item: NavigationItem;
	patchField: PatchField;
	nameInputRef: React.RefObject<HTMLInputElement | null>;
}) {
	const activePages = useSelectablePages();

	const handlePageSelect = (pageId: string) => {
		const page = activePages.find((candidate) => candidate.id === pageId);
		if (!page) return;
		patchField("url", page.path);
		patchField("app_id", page.id);
	};

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="menu-item-name">Nombre</Label>
				<Input
					id="menu-item-name"
					ref={nameInputRef}
					value={item.name}
					onChange={(e) => patchField("name", e.target.value)}
					placeholder="Nombre visible en el menú"
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="menu-item-url">URL / Ruta</Label>
				<div className="flex flex-col gap-2 sm:flex-row">
					<Input
						id="menu-item-url"
						value={item.url || ""}
						onChange={(e) => patchField("url", e.target.value || null)}
						placeholder="/zona-raider/ruta"
						className="flex-1"
					/>
					<Select value="" onValueChange={handlePageSelect}>
						<SelectTrigger className="sm:w-52">
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
					Ruta absoluta. Déjalo vacío para una categoría sin enlace.
				</p>
			</div>
			<div className="space-y-2">
				<Label>Icono</Label>
				<IconPicker
					value={item.icon_name}
					onSelect={(name: string) => patchField("icon_name", name)}
				/>
			</div>
		</div>
	);
}

export function MenuPlacementFields({
	item,
	patchField,
	items,
}: {
	item: NavigationItem;
	patchField: PatchField;
	items: NavigationItem[];
}) {
	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label>Padre (Nivel superior)</Label>
				<Select
					value={item.parent_id || "null"}
					onValueChange={(v) => patchField("parent_id", v === "null" ? null : v)}
				>
					<SelectTrigger>
						<SelectValue placeholder="Ninguno (Raíz)" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="null">Ninguno (Raíz)</SelectItem>
						{buildParentOptions(items, item.id)}
					</SelectContent>
				</Select>
				<p className="text-[11px] text-muted-foreground">
					Define dónde se anida dentro del árbol de navegación.
				</p>
			</div>
			<div className="space-y-2">
				<Label htmlFor="menu-item-app-id">App ID</Label>
				<Input
					id="menu-item-app-id"
					value={item.app_id || ""}
					onChange={(e) => patchField("app_id", e.target.value)}
					placeholder="roster, bis..."
				/>
				<p className="text-[11px] text-muted-foreground">
					Debe coincidir con el ID usado en permisos y métricas.
				</p>
			</div>
			<div className="space-y-2">
				<Label>Visibilidad</Label>
				<Select
					value={item.visibility || "all"}
					onValueChange={(v) => patchField("visibility", v)}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todos</SelectItem>
						<SelectItem value="pc-only">Solo PC</SelectItem>
						<SelectItem value="mobile-only">Solo móvil</SelectItem>
					</SelectContent>
				</Select>
				<p className="text-[11px] text-muted-foreground">
					Útil para enlaces destacados por dispositivo.
				</p>
			</div>
			<div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
				<div>
					<p className="text-sm font-medium">Activo</p>
					<p className="text-[11px] text-muted-foreground">
						Si está desactivado, se ocultará para todos.
					</p>
				</div>
				<Switch
					checked={item.is_active}
					onCheckedChange={(v) => patchField("is_active", v)}
				/>
			</div>
		</div>
	);
}

export function MenuAdvancedFields({
	item,
	patchField,
}: {
	item: NavigationItem;
	patchField: PatchField;
}) {
	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
			<div className="space-y-2 md:col-span-3">
				<Label htmlFor="menu-item-description">Descripción (Mega Menú)</Label>
				<Textarea
					id="menu-item-description"
					value={item.description || ""}
					onChange={(e) => patchField("description", e.target.value)}
					placeholder="Descripción breve para el mega menú…"
					rows={2}
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="menu-item-css-class">Clase CSS</Label>
				<Input
					id="menu-item-css-class"
					value={item.css_class || ""}
					onChange={(e) => patchField("css_class", e.target.value)}
					placeholder="text-emerald-500"
				/>
				<p className="text-[11px] text-muted-foreground">
					Colores, énfasis o badges puntuales.
				</p>
			</div>
			<div className="space-y-2">
				<Label htmlFor="menu-item-element-id">ID Elemento</Label>
				<Input
					id="menu-item-element-id"
					value={item.element_id || ""}
					onChange={(e) => patchField("element_id", e.target.value)}
					placeholder="my-nav-item"
				/>
				<p className="text-[11px] text-muted-foreground">
					Para automatizaciones o pruebas end-to-end.
				</p>
			</div>
		</div>
	);
}

export function MenuRolesGrid({
	roleOptions,
	editingRolesSet,
	onToggleRole,
}: {
	roleOptions: { value: string; label: string }[];
	editingRolesSet: Set<string>;
	onToggleRole: (roleValue: string) => void;
}) {
	if (roleOptions.length === 0) {
		return (
			<p className="text-xs text-muted-foreground">
				No se pudieron cargar los roles disponibles.
			</p>
		);
	}
	return (
		<>
			<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
				{roleOptions.map((role) => {
					const isSelected = editingRolesSet.has(role.value);
					return (
						<button
							type="button"
							key={role.value}
							aria-pressed={isSelected}
							className={cn(
								"flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors bg-transparent w-full",
								isSelected
									? "border-primary/60 bg-primary/10"
									: "border-white/5 hover:border-white/20",
							)}
							onClick={() => onToggleRole(role.value)}
						>
							<span
								aria-hidden="true"
								className={cn(
									"flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
									isSelected
										? "border-primary bg-primary text-primary-foreground"
										: "border-white/20",
								)}
							>
								{isSelected && <IconCheckIcon />}
							</span>
							<span className="text-sm font-medium">{role.label}</span>
						</button>
					);
				})}
			</div>
			<p className="text-xs text-muted-foreground">
				Puedes mezclar roles para crear accesos personalizados.
			</p>
		</>
	);
}

function IconCheckIcon() {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			className="size-3.5"
			fill="none"
			stroke="currentColor"
			strokeWidth="3"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M5 12l5 5L20 7" />
		</svg>
	);
}
