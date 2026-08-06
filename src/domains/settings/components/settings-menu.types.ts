"use client";

export type DropTarget = {
	id: string;
	type: "before" | "after" | "inside";
};

export type NavigationItem = {
	id: string;
	name: string;
	url: string | null;
	icon_name: string;
	order_index: number;
	parent_id: string | null;
	is_active: boolean;
	app_id?: string | null;
	css_class?: string | null;
	element_id?: string | null;
	visibility?: string | null;
	description?: string | null;
	roles?: string[];
};

export type MenuUiState = {
	mounted: boolean;
	searchQuery: string;
	expandedCategories: Set<string>;
	editingItem: NavigationItem | null;
	activeId: string | null;
	dropTarget: DropTarget | null;
};

export type MenuUiAction =
	| { type: "mounted" }
	| { type: "setSearchQuery"; value: string }
	| { type: "setExpandedCategories"; value: Set<string> }
	| { type: "toggleCategory"; id: string }
	| { type: "setEditingItem"; value: NavigationItem | null }
	| {
			type: "patchEditingItem";
			updater: (prev: NavigationItem) => NavigationItem;
	  }
	| { type: "setActiveId"; value: string | null }
	| { type: "setDropTarget"; value: DropTarget | null };

export const initialMenuUiState: MenuUiState = {
	mounted: false,
	searchQuery: "",
	expandedCategories: new Set(),
	editingItem: null,
	activeId: null,
	dropTarget: null,
};

export function menuUiReducer(
	state: MenuUiState,
	action: MenuUiAction,
): MenuUiState {
	switch (action.type) {
		case "mounted":
			return { ...state, mounted: true };
		case "setSearchQuery":
			return { ...state, searchQuery: action.value };
		case "setExpandedCategories":
			return { ...state, expandedCategories: action.value };
		case "toggleCategory": {
			const next = new Set(state.expandedCategories);
			if (next.has(action.id)) next.delete(action.id);
			else next.add(action.id);
			return { ...state, expandedCategories: next };
		}
		case "setEditingItem":
			return {
				...state,
				editingItem: action.value as MenuUiState["editingItem"],
			};
		case "patchEditingItem":
			return {
				...state,
				editingItem: state.editingItem
					? action.updater(state.editingItem)
					: null,
			};
		case "setActiveId":
			return { ...state, activeId: action.value };
		case "setDropTarget":
			return { ...state, dropTarget: action.value };
		default:
			return state;
	}
}
