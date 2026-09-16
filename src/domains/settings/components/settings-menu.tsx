"use client";
import React, { useMemo, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { Tree, type TreeApi } from "react-arborist";
import { Card, CardContent } from "@/shared/ui/card";
import { useApiQuery } from "@/shared/hooks/use-api-query";
import { toast } from "sonner";
import { AdminPageHeader } from "@/shared/components/admin-page-header";
import { AddMenuDropdown, MenuSearchToolbar } from "./settings-menu-toolbar";
import { ArboristNodeRenderer } from "./settings-menu-tree";
import {
	type NavigationItem,
	initialMenuUiState,
	menuUiReducer,
} from "./settings-menu.types";
import { buildNavigationTree, filterTreeByQuery } from "./settings-menu.utils";
import {
	buildMenuEditorHref,
	normalizeNavigationItem,
	type NavigationItemRecord,
} from "@/domains/settings/lib/menu-editor";

function useSettingsMenuClient() {
	const router = useRouter();
	const [items, setItems] = useState<NavigationItem[]>([]);
	const [ui, dispatch] = useReducer(menuUiReducer, initialMenuUiState);

	const {
		data: navigationData,
		isLoading,
		mutate: mutateNavigation,
	} = useApiQuery<NavigationItemRecord[]>("/api/admin/navigation");

	const setSearchQuery = (value: string) => {
		dispatch({ type: "setSearchQuery", value });
	};

	// react-doctor-disable-next-line
	React.useEffect(() => {
		dispatch({ type: "mounted" });
	}, []);

	React.useEffect(() => {
		if (Array.isArray(navigationData)) {
			// react-doctor-disable-next-line
			setItems(navigationData.map(normalizeNavigationItem));
		}
	}, [navigationData]);

	const refreshItems = async () => {
		await mutateNavigation();
	};

	const loading = isLoading && items.length === 0;

	const { mounted, searchQuery } = ui;

	const tree = useMemo(() => buildNavigationTree(items), [items]);

	// react-arborist keeps the open/closed state itself: the toolbar buttons use the
	// tree API instead of passing `isOpen` back through `data` (which it ignores).
	const treeRef = React.useRef<TreeApi<NavigationItem> | undefined>(undefined);

	const filteredTree = useMemo(
		() => filterTreeByQuery(tree, searchQuery),
		[tree, searchQuery],
	);

	const expandAll = () => {
		treeRef.current?.openAll();
	};

	const collapseAll = () => {
		treeRef.current?.closeAll();
	};

	// ── Editor navigation: create/edit happen on their own page ──
	const openEditor = (href: string) => {
		router.push(href);
	};

	const openCreateEditor = (
		kind: "category" | "link",
		options: { parentId?: string | null; insertAfterId?: string | null } = {},
	) => {
		openEditor(buildMenuEditorHref({ kind, ...options }));
	};

	// «+» on a link adds a sibling right below it; on a category, a link inside it.
	const handleQuickAdd = (item: NavigationItem) => {
		if (!item.url) {
			openCreateEditor("link", { parentId: item.id });
			return;
		}
		openCreateEditor("link", {
			parentId: item.parent_id ?? null,
			insertAfterId: item.id,
		});
	};

	const handleDuplicate = async (item: NavigationItem) => {
		const siblings = items.filter((i) => i.parent_id === item.parent_id);
		const maxOrder = siblings.reduce((max, i) => Math.max(max, i.order_index), 0);
		const response = await fetch("/api/admin/navigation", {
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
				roles: item.roles ?? [],
			}),
		});
		if (!response.ok) {
			toast.error("No se pudo duplicar el elemento");
			return;
		}
		await refreshItems();
		router.refresh();
		toast.success("Elemento duplicado");
	};

	const handleToggleActive = async (item: NavigationItem) => {
		const response = await fetch("/api/admin/navigation", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id: item.id, is_active: !item.is_active }),
		});
		if (!response.ok) {
			toast.error("No se pudo cambiar la visibilidad del elemento");
			return;
		}
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

		const response = await fetch(`/api/admin/navigation?id=${id}`, {
			method: "DELETE",
		});
		if (!response.ok) {
			toast.error("No se pudo eliminar el elemento");
			return;
		}
		await refreshItems();
		router.refresh();
		toast.success("Elemento eliminado");
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

		const response = await fetch("/api/admin/navigation/reorder", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ items: payload }),
		});
		if (!response.ok) {
			toast.error("No se pudo guardar el nuevo orden");
		}

		await refreshItems();
		router.refresh();
	};

	if (!mounted) return null;

	return (
		<div className="flex flex-col gap-6 w-full">
			<AdminPageHeader
				title="GESTIÓN DEL MENÚ"
				description="Estructura, orden y permisos de la navegación lateral."
				backHref="/zona-raider/configuracion"
			/>

			<div className="flex items-center justify-end">
				<AddMenuDropdown onCreate={(type) => openCreateEditor(type)} />
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
							ref={treeRef}
							data={filteredTree}
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
									onEdit={(item) => openEditor(buildMenuEditorHref({ id: item.id }))}
									onDelete={(id) => void handleDelete(id)}
									onDuplicate={(item) => void handleDuplicate(item)}
									onToggleActive={(item) => void handleToggleActive(item)}
									onAddChild={(parentId: string) =>
										openCreateEditor("link", { parentId })
									}
									onAddCategory={(parentId: string) =>
										openCreateEditor("category", { parentId })
									}
									onQuickAdd={handleQuickAdd}
								/>
							)}
						</Tree>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

export function SettingsMenuClient() {
	return useSettingsMenuClient();
}
