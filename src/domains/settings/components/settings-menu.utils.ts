"use client";
import type { NavigationItem } from "./settings-menu.types";

export function buildNavigationTree(items: NavigationItem[]): any[] {
	const map = new Map<string, NavigationItem & { children: NavigationItem[] }>();
	const roots: (NavigationItem & { children: NavigationItem[] })[] = [];
	for (const item of items) {
		map.set(item.id, { ...item, children: [] });
	}
	for (const item of map.values()) {
		if (item.parent_id && map.has(item.parent_id)) {
			map.get(item.parent_id)!.children.push(item);
		} else {
			roots.push(item);
		}
	}
	const sortFn = (a: NavigationItem, b: NavigationItem) =>
		a.order_index - b.order_index;
	roots.sort(sortFn);
	for (const item of map.values()) {
		item.children.sort(sortFn);
	}
	return roots;
}

export function filterTreeByQuery(nodes: any[], rawQuery: string): any[] {
	const q = rawQuery.trim().toLowerCase();
	if (!q) return nodes;
	return nodes.flatMap((node) => {
		const match =
			node.name.toLowerCase().includes(q) ||
			(node.url || "").toLowerCase().includes(q);
		const children = filterTreeByQuery(node.children || [], rawQuery);
		if (match || children.length > 0) {
			return [{ ...node, children }];
		}
		return [];
	}) as NavigationItem[];
}

export function buildParentBreadcrumb(
	items: NavigationItem[],
	parentId?: string | null,
): string | null {
	if (!parentId) return null;
	const parent = items.find((item) => item.id === parentId);
	if (!parent) return null;
	const grandparent = parent.parent_id
		? items.find((item) => item.id === parent.parent_id)
		: null;
	return grandparent ? `${grandparent.name} → ${parent.name}` : parent.name;
}
