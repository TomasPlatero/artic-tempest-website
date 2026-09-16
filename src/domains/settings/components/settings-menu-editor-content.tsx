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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select";
import { IconCheck, IconCopy } from "@/shared/ui/tabler-icons";
import { useApiQuery } from "@/shared/hooks/use-api-query";
import { SectionCard } from "./settings-menu-section-card";
import type { NavigationItem } from "./settings-menu.types";
import type { AppPage } from "@/app/api/pages/route";

export interface MenuEditorContentProps {
	editingItem: NavigationItem;
	setEditingItem: (updater: any) => void;
	roleOptions: { value: string; label: string }[];
	editingRolesSet: Set<string>;
	parentBreadcrumb: string | null;
	handleCopyUrl: () => void;
	items: NavigationItem[];
}

type PatchField = (field: keyof NavigationItem, value: unknown) => void;

function selectActivePages(pages: AppPage[] | undefined) {
	return (pages ?? []).filter(
		(page): page is AppPage & { path: string } =>
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

function MenuEditorSummary({
	editingItem,
	parentBreadcrumb,
	handleCopyUrl,
}: {
	editingItem: NavigationItem;
	parentBreadcrumb: string | null;
	handleCopyUrl: () => void;
}) {
	const isCategory = !editingItem.url;
	return (
		<div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
			<span className="rounded-lg bg-primary/10 p-2 text-primary">
				{React.createElement(
					getIconByName(editingItem.icon_name || "IconFolder"),
					{ className: "size-5" },
				)}
			</span>
			<div className="flex flex-1 flex-wrap items-center gap-2">
				<span className="max-w-[16rem] truncate text-sm font-semibold text-white">
					{editingItem.name || "Sin nombre"}
				</span>
				<Badge variant="outline" className="h-5 px-2">
					{isCategory ? "Categoría" : "Enlace"}
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
			{!isCategory && (
				<Button
					variant="outline"
					size="sm"
					className="gap-1.5"
					onClick={handleCopyUrl}
				>
					<IconCopy className="size-3.5" /> Copiar ruta
				</Button>
			)}
		</div>
	);
}

function MenuEditorContentFields({
	editingItem,
	patchField,
	nameInputRef,
	activePages,
	onSelectPage,
}: {
	editingItem: NavigationItem;
	patchField: PatchField;
	nameInputRef: React.RefObject<HTMLInputElement | null>;
	activePages: (AppPage & { path: string })[];
	onSelectPage: (pageId: string) => void;
}) {
	return (
		<div className="space-y-3">
			<div className="space-y-2">
				<Label>Nombre</Label>
				<Input
					ref={nameInputRef}
					value={editingItem.name}
					onChange={(e) => patchField("name", e.target.value)}
					placeholder="Nombre visible en el menú"
				/>
			</div>
			<div className="space-y-2">
				<Label>URL / Ruta</Label>
				<div className="flex gap-2">
					<Input
						value={editingItem.url || ""}
						onChange={(e) => patchField("url", e.target.value || null)}
						placeholder="/zona-raider/ruta"
						className="flex-1"
					/>
					<Select value="" onValueChange={onSelectPage}>
						<SelectTrigger className="w-44">
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
					Ruta absoluta. Vacío = categoría sin enlace.
				</p>
			</div>
			<div className="space-y-2">
				<Label>Icono</Label>
				<IconPicker
					value={editingItem.icon_name}
					onSelect={(name: string) => patchField("icon_name", name)}
				/>
			</div>
		</div>
	);
}

function MenuEditorPlacementFields({
	editingItem,
	patchField,
	items,
}: {
	editingItem: NavigationItem;
	patchField: PatchField;
	items: NavigationItem[];
}) {
	return (
		<div className="space-y-3">
			<div className="space-y-2">
				<Label>Padre (Nivel superior)</Label>
				<Select
					value={editingItem.parent_id || "null"}
					onValueChange={(v) => patchField("parent_id", v === "null" ? null : v)}
				>
					<SelectTrigger>
						<SelectValue placeholder="Ninguno (Raíz)" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="null">Ninguno (Raíz)</SelectItem>
						{buildParentOptions(items, editingItem.id)}
					</SelectContent>
				</Select>
			</div>
			<div className="space-y-2">
				<Label>App ID</Label>
				<Input
					value={editingItem.app_id || ""}
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
					value={editingItem.visibility || "all"}
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
			</div>
			<div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
				<div>
					<p className="text-sm font-medium">Activo</p>
					<p className="text-[11px] text-muted-foreground">
						Desactivado se oculta para todos.
					</p>
				</div>
				<Switch
					checked={editingItem.is_active}
					onCheckedChange={(v) => patchField("is_active", v)}
				/>
			</div>
		</div>
	);
}

function MenuEditorAdvancedFields({
	editingItem,
	patchField,
}: {
	editingItem: NavigationItem;
	patchField: PatchField;
}) {
	return (
		<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
			<div className="space-y-2 md:col-span-3">
				<Label>Descripción (Mega Menú)</Label>
				<Textarea
					value={editingItem.description || ""}
					onChange={(e) => patchField("description", e.target.value)}
					placeholder="Descripción breve para el mega menú…"
					rows={2}
				/>
			</div>
			<div className="space-y-2">
				<Label>Clase CSS</Label>
				<Input
					value={editingItem.css_class || ""}
					onChange={(e) => patchField("css_class", e.target.value)}
					placeholder="text-emerald-500"
				/>
			</div>
			<div className="space-y-2">
				<Label>ID Elemento</Label>
				<Input
					value={editingItem.element_id || ""}
					onChange={(e) => patchField("element_id", e.target.value)}
					placeholder="my-nav-item"
				/>
			</div>
		</div>
	);
}

function MenuEditorRoleGrid({
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
								{isSelected && <IconCheck className="size-3.5" />}
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

export function MenuEditorContent({
	editingItem,
	setEditingItem,
	roleOptions,
	editingRolesSet,
	parentBreadcrumb,
	handleCopyUrl,
	items,
}: MenuEditorContentProps) {
	const { data: pages } = useApiQuery<AppPage[]>("/api/pages", {});
	const nameInputRef = React.useRef<HTMLInputElement | null>(null);

	// A new item starts ready to be renamed: focus and select the suggested name.
	React.useEffect(() => {
		if (!editingItem.isDraft) return;
		const timer = setTimeout(() => {
			nameInputRef.current?.focus();
			nameInputRef.current?.select();
		}, 0);
		return () => clearTimeout(timer);
	}, [editingItem.isDraft]);

	const activePages = selectActivePages(pages);

	const patchField: PatchField = (field, value) =>
		setEditingItem((prev: any) => (prev ? { ...prev, [field]: value } : prev));

	const toggleRole = (roleValue: string) =>
		setEditingItem((prev: any) => {
			if (!prev) return prev;
			const current: string[] = prev.roles ?? [];
			return {
				...prev,
				roles: current.includes(roleValue)
					? current.filter((role) => role !== roleValue)
					: [...current, roleValue],
			};
		});

	const handlePageSelect = (pageId: string) => {
		const page = activePages.find((candidate) => candidate.id === pageId);
		if (!page) return;
		setEditingItem((prev: any) =>
			prev ? { ...prev, url: page.path, app_id: page.id } : prev,
		);
	};

	return (
		<div className="flex flex-col gap-4">
			<MenuEditorSummary
				editingItem={editingItem}
				parentBreadcrumb={parentBreadcrumb}
				handleCopyUrl={handleCopyUrl}
			/>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<SectionCard
					title="Contenido principal"
					description="Nombre, ruta visible e icono."
				>
					<MenuEditorContentFields
						editingItem={editingItem}
						patchField={patchField}
						nameInputRef={nameInputRef}
						activePages={activePages}
						onSelectPage={handlePageSelect}
					/>
				</SectionCard>

				<SectionCard
					title="Ubicación y estado"
					description="Jerarquía, App ID y dispositivos."
				>
					<MenuEditorPlacementFields
						editingItem={editingItem}
						patchField={patchField}
						items={items}
					/>
				</SectionCard>

				<SectionCard
					title="Presentación avanzada"
					description="Opcional: mega menú, estilos y anclas."
					className="lg:col-span-2"
				>
					<MenuEditorAdvancedFields
						editingItem={editingItem}
						patchField={patchField}
					/>
				</SectionCard>

				<SectionCard
					title="Permisos de visualización"
					description="Limita quién puede ver el elemento. Sin selección = todos."
					className="lg:col-span-2"
				>
					<MenuEditorRoleGrid
						roleOptions={roleOptions}
						editingRolesSet={editingRolesSet}
						onToggleRole={toggleRole}
					/>
				</SectionCard>
			</div>
		</div>
	);
}
