"use client";

import React, { useMemo, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { Tree } from "react-arborist";
import { Card, CardContent } from "@/shared/ui/card";
import { useApiQuery } from "@/shared/hooks/use-api-query";
import { Sheet, SheetContent, SheetTitle } from "@/shared/ui/sheet";
import { toast } from "sonner";
import { AdminPageHeader } from "@/shared/components/admin-page-header";
import { AddMenuDropdown, MenuSearchToolbar } from "./settings-menu-toolbar";
import {
	SettingsEditSheetHeader,
	SettingsEditSheetFooter,
} from "./settings-menu-sheet";
import { ArboristNodeRenderer } from "./settings-menu-tree";

import {
	type NavigationItem,
	initialMenuUiState,
	menuUiReducer,
} from "./settings-menu.types";
import {
	collectCategoryIds,
	buildNavigationTree,
	filterTreeByQuery,
	buildRoleOptions,
	createEditDraft,
	buildParentBreadcrumb,
} from "./settings-menu.utils";

function useSettingsMenuClient() {
	const router = useRouter();
	const [items, setItems] = useState<NavigationItem[]>([]);
	const [ui, dispatch] = useReducer(menuUiReducer, initialMenuUiState);

	const {
		data: navigationData,
		isLoading,
		mutate: mutateNavigation,
	} = useApiQuery<NavigationItem[]>("/api/admin/navigation");

	const { data: rolesData } = useApiQuery<any[]>("/api/guild/roles");

	const setSearchQuery = (value: string) => {
		dispatch({ type: "setSearchQuery", value });
	};

	const setEditingItem = (
		value: NavigationItem | null | ((prev: NavigationItem) => NavigationItem),
	) => {
		if (typeof value === "function") {
			dispatch({ type: "patchEditingItem", updater: value as any });
			return;
		}
		dispatch({ type: "setEditingItem", value: value as any });
	};

	// react-doctor-disable-next-line
	React.useEffect(() => {
		dispatch({ type: "mounted" });
	}, []);

	React.useEffect(() => {
		if (Array.isArray(navigationData)) {
			// react-doctor-disable-next-line
			setItems(navigationData);
			dispatch({
				type: "setExpandedCategories",
				value: collectCategoryIds(navigationData),
			});
		}
	}, [navigationData]);

	const refreshItems = async () => {
		await mutateNavigation();
	};

	const loading = isLoading && items.length === 0;

	const roleOptions = useMemo(() => buildRoleOptions(rolesData), [rolesData]);

	const { mounted, searchQuery, editingItem } = ui;

	const tree = useMemo(() => buildNavigationTree(items), [items]);

	const [openIds, setOpenIds] = useState<Set<string>>(() =>
		collectCategoryIds(items),
	);

	const filteredTree = useMemo(() => {
		const addOpenFlag = (nodes: any[]): any[] =>
			nodes.map((n) => ({
				...n,
				isOpen: openIds.has(n.id),
				children: n.children ? addOpenFlag(n.children) : undefined,
			}));
		return addOpenFlag(filterTreeByQuery(tree, searchQuery));
	}, [tree, searchQuery, openIds]);

	const expandAll = () => {
		// Not available with uncontrolled tree
	};

	const collapseAll = () => {
		// Not available with uncontrolled tree
	};

	const handleCreate = async (type: "category" | "link", parentId?: string) => {
		const siblings = items.filter((i) => i.parent_id === parentId);
		const maxOrder = siblings.reduce(
			(max, i) => Math.max(max, i.order_index),
			0,
		);

		await fetch("/api/admin/navigation", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name: type === "category" ? "Nueva Categoría" : "Nuevo Enlace",
				url: type === "category" ? null : "/zona-raider/cambiame",
				icon_name: type === "category" ? "IconFolder" : "IconLink",
				order_index: maxOrder + 10,
				parent_id: parentId || null,
				is_active: true,
			}),
		});

		await refreshItems();
		router.refresh();
		toast.success(type === "category" ? "Categoría creada" : "Enlace creado");
	};

	const handleDuplicate = async (item: NavigationItem) => {
		const siblings = items.filter((i) => i.parent_id === item.parent_id);
		const maxOrder = siblings.reduce(
			(max, i) => Math.max(max, i.order_index),
			0,
		);

		await fetch("/api/admin/navigation", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name: `${item.name} (copia)`,
				url: item.url,
				icon_name: item.icon_name,
				order_index: maxOrder + 10,
				parent_id: item.parent_id,
				is_active: false,
				app_id: item.app_id,
				description: item.description,
				css_class: item.css_class,
				element_id: item.element_id,
				visibility: item.visibility,
			}),
		});

		await refreshItems();
		router.refresh();
		toast.success("Elemento duplicado");
	};

	const handleToggleActive = async (item: NavigationItem) => {
		await fetch("/api/admin/navigation", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id: item.id, is_active: !item.is_active }),
		});
		await refreshItems();
		router.refresh();
	};

	const handleDelete = async (id: string) => {
		const item = items.find((i) => i.id === id);
		const children = items.filter((i) => i.parent_id === id);
		const msg =
			children.length > 0
				? `¿Borrar "${item?.name}" y sus ${children.length} subelementos?`
				: `¿Borrar "${item?.name}"?`;

		if (!confirm(msg)) return;

		await fetch(`/api/admin/navigation?id=${id}`, { method: "DELETE" });
		await refreshItems();
		router.refresh();
		toast.success("Elemento eliminado");
	};

	const handleSaveEdit = async () => {
		if (!editingItem) return;

		const {
			id,
			name,
			url,
			icon_name,
			order_index,
			parent_id,
			app_id,
			css_class,
			element_id,
			visibility,
			description,
			roles,
		} = editingItem;

		await fetch("/api/admin/navigation", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				id,
				name,
				url: url || null,
				icon_name,
				order_index,
				parent_id: parent_id || null,
				app_id,
				css_class,
				element_id,
				visibility,
				description,
				roles,
			}),
		});

		dispatch({ type: "setEditingItem", value: null as any });
		await refreshItems();
		router.refresh();
		toast.success("Cambios guardados");
	};

	const openEdit = (item: NavigationItem) => {
		dispatch({
			type: "setEditingItem",
			value: createEditDraft(item) as any,
		});
	};

	// ── react-arborist onMove: reorder and persist ──
	const handleMove = async ({
		dragIds,
		parentId,
		index,
	}: {
		dragIds: string[];
		parentId: string | null;
		index: number;
	}) => {
		if (dragIds.length !== 1) return;
		const dragId = dragIds[0];
		const dragged = items.find((i) => i.id === dragId);
		if (!dragged) return;

		// Build the new order within the target parent
		const siblings = items.filter(
			(i) => i.parent_id === parentId && i.id !== dragId,
		);
		siblings.sort((a, b) => a.order_index - b.order_index);

		// Insert at the index position
		siblings.splice(index, 0, dragged);

		const updated = items.map((item) => {
			if (item.id === dragId) {
				return { ...item, parent_id: parentId, order_index: index * 10 };
			}
			// Re-index the target parent's siblings
			const idx = siblings.findIndex((s) => s.id === item.id);
			if (idx !== -1 && item.parent_id === parentId) {
				return { ...item, order_index: idx * 10 };
			}
			return item;
		});

		setItems(updated);
		const payload = updated.map((item) => ({
			id: item.id,
			order_index: item.order_index,
			parent_id: item.parent_id,
		}));

		await fetch("/api/admin/navigation/reorder", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ items: payload }),
		});

		await refreshItems();
		router.refresh();
	};

	const parentBreadcrumb = useMemo(
		() => buildParentBreadcrumb(items, editingItem?.parent_id),
		[editingItem, items],
	);

	const handleCopyUrl = () => {
		if (!editingItem?.url) return;
		if (typeof navigator === "undefined" || !navigator?.clipboard) {
			toast.error("Portapapeles no disponible");
			return;
		}
		navigator.clipboard
			.writeText(editingItem.url)
			.then(() => toast.success("Ruta copiada al portapapeles"))
			.catch(() => toast.error("No se pudo copiar la ruta"));
	};

	if (!mounted) return null;

	const editingRolesSet = new Set(editingItem?.roles || []);

	return (
		<div className="flex flex-col gap-6 w-full">
			<AdminPageHeader
				title="GESTIÓN DEL MENÚ"
				description="Estructura, orden y permisos de la navegación lateral."
				backHref="/zona-raider/configuracion"
			/>

			<div className="flex items-center justify-end">
				<AddMenuDropdown onCreate={(type, parentId) => void handleCreate(type, parentId)} />
			</div>

			<MenuSearchToolbar
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				onExpand={expandAll}
				onCollapse={collapseAll}
			/>

			<Card className="border-border/40 overflow-hidden">
				<CardContent className="p-0">
					{loading ? (
						<div className="p-12 text-center text-muted-foreground">
							<div className="animate-spin size-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
							<span className="text-xs font-medium">Cargando menú…</span>
						</div>
					) : (
						<Tree
							data={filteredTree}
							onToggle={(id: string) => {
								setOpenIds((prev) => {
									const next = new Set(prev);
									if (next.has(id)) next.delete(id);
									else next.add(id);
									return next;
								});
							}}
							onMove={(args) => void handleMove(args)}
							width="100%"
							height={Math.max(200, items.length * 48 + 40)}
							indent={28}
							rowHeight={48}
							padding={4}
						>
							{(props: any) => (
								<ArboristNodeRenderer
									{...props}
									onEdit={openEdit}
									onDelete={(id) => void handleDelete(id)}
									onDuplicate={(item) => void handleDuplicate(item)}
									onToggleActive={(item) => void handleToggleActive(item)}
									onAddChild={(parentId: string) =>
										void handleCreate("link", parentId)
									}
									onAddCategory={(parentId: string) =>
										void handleCreate("category", parentId)
									}
								/>
							)}
						</Tree>
					)}
				</CardContent>
			</Card>

			<Sheet
				open={!!editingItem}
				onOpenChange={(open) => !open && setEditingItem(null)}
			>
				<SheetContent className="w-full sm:max-w-4xl lg:max-w-5xl overflow-y-auto">
					<SheetTitle className="sr-only">Editar elemento del menú</SheetTitle>
					<SettingsEditSheetHeader />

					{editingItem && (
						<React.Suspense fallback={null}>
							<LazyEditSheetContent
								editingItem={editingItem}
								setEditingItem={setEditingItem}
								roleOptions={roleOptions}
								editingRolesSet={editingRolesSet}
								parentBreadcrumb={parentBreadcrumb}
								handleCopyUrl={handleCopyUrl}
								items={items}
							/>
						</React.Suspense>
					)}

					<SettingsEditSheetFooter
						onCancel={() => setEditingItem(null)}
						onSave={() => void handleSaveEdit()}
					/>
				</SheetContent>
			</Sheet>
		</div>
	);
}

const LazyEditSheetContent = React.lazy(() =>
	import("./settings-menu-edit-sheet-content").then((m) => ({
		default: m.EditSheetContent,
	})),
);

export function SettingsMenuClient() {
	return useSettingsMenuClient();
}
