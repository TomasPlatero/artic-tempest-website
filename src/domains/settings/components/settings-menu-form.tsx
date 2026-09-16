"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { Button } from "@/shared/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/shared/ui/card";
import { IconCheck, IconDeviceFloppy } from "@/shared/ui/tabler-icons";
import { SectionCard } from "./settings-menu-section-card";
import {
	MenuAdvancedFields,
	MenuContentFields,
	MenuItemSummary,
	MenuPlacementFields,
	MenuRolesGrid,
	type PatchField,
} from "./settings-menu-editor-fields";
import { buildParentBreadcrumb } from "./settings-menu.utils";
import {
	buildInsertAfterPayload,
	computeSiblingOrderIndex,
	type RoleOption,
} from "@/domains/settings/lib/menu-editor";
import type { NavigationItem } from "./settings-menu.types";

export const MENU_LIST_PATH = "/zona-raider/configuracion/menu";

export interface SettingsMenuFormProps {
	mode: "create" | "edit";
	item: NavigationItem;
	items: NavigationItem[];
	roleOptions: RoleOption[];
	insertAfterId?: string | null;
}

type SaveResult =
	| { ok: true; message: string; warning?: string }
	| { ok: false; error: string };

/**
 * Persists the item (create or update) plus its permissions. Kept outside the
 * component so the form itself has no async control flow to reason about.
 */
async function saveMenuItem({
	isCreate,
	item,
	items,
	orderIndex,
	insertAfterId,
}: {
	isCreate: boolean;
	item: NavigationItem;
	items: NavigationItem[];
	orderIndex: number;
	insertAfterId: string | null;
}): Promise<SaveResult> {
	const payload = {
		name: item.name,
		url: item.url || null,
		icon_name: item.icon_name,
		order_index: orderIndex,
		parent_id: item.parent_id || null,
		app_id: item.app_id,
		css_class: item.css_class,
		element_id: item.element_id,
		visibility: item.visibility,
		description: item.description,
		roles: item.roles ?? [],
	};

	try {
		const response = await fetch("/api/admin/navigation", {
			method: isCreate ? "POST" : "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(isCreate ? payload : { id: item.id, ...payload }),
		});

		if (!response.ok) {
			const errorPayload = await response.json().catch(() => null);
			return {
				ok: false,
				error:
					errorPayload?.error ||
					(isCreate
						? "No se pudo crear el elemento"
						: "No se pudieron guardar los cambios"),
			};
		}

		const message = isCreate
			? payload.url
				? "Enlace creado"
				: "Categoría creada"
			: "Cambios guardados";

		if (!isCreate || !insertAfterId) {
			return { ok: true, message };
		}

		const created = await response.json().catch(() => null);
		if (!created?.id) {
			return { ok: true, message };
		}

		const level = buildInsertAfterPayload(
			items,
			payload.parent_id,
			insertAfterId,
			created.id,
		);
		if (level.length === 0) {
			return { ok: true, message };
		}

		const reorderResponse = await fetch("/api/admin/navigation/reorder", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ items: level }),
		});
		if (!reorderResponse.ok) {
			return {
				ok: true,
				message,
				warning: "Creado, pero se ha colocado al final del nivel",
			};
		}

		return { ok: true, message };
	} catch (error) {
		return {
			ok: false,
			error:
				error instanceof Error ? error.message : "No se pudo guardar el elemento",
		};
	}
}

export function SettingsMenuForm({
	mode,
	item: initialItem,
	items,
	roleOptions,
	insertAfterId = null,
}: SettingsMenuFormProps) {
	const router = useRouter();
	const { mutate } = useSWRConfig();
	const [item, setItem] = React.useState<NavigationItem>(initialItem);
	const [saving, setSaving] = React.useState(false);
	const nameInputRef = React.useRef<HTMLInputElement | null>(null);

	const isCreate = mode === "create";

	// A new item starts ready to be named: focus and select whatever is suggested.
	React.useEffect(() => {
		if (!isCreate) return;
		nameInputRef.current?.focus();
		nameInputRef.current?.select();
	}, [isCreate]);

	const patchField: PatchField = (field, value) =>
		setItem((prev) => ({ ...prev, [field]: value }));

	const toggleRole = (roleValue: string) =>
		setItem((prev) => {
			const current = prev.roles ?? [];
			return {
				...prev,
				roles: current.includes(roleValue)
					? current.filter((role) => role !== roleValue)
					: [...current, roleValue],
			};
		});

	const goBackToList = async () => {
		await mutate("/api/admin/navigation");
		router.push(MENU_LIST_PATH);
		router.refresh();
	};

	const handleSubmit = async () => {
		if (saving) return;
		setSaving(true);

		const movedToAnotherParent =
			!isCreate && (item.parent_id ?? null) !== (initialItem.parent_id ?? null);

		const result = await saveMenuItem({
			isCreate,
			item,
			items,
			insertAfterId,
			orderIndex: movedToAnotherParent
				? computeSiblingOrderIndex(items, item.parent_id ?? null)
				: item.order_index,
		});

		setSaving(false);

		if (!result.ok) {
			toast.error(result.error);
			return;
		}

		if (result.warning) {
			toast.error(result.warning);
		}

		await goBackToList();
		toast.success(result.message);
	};

	const parentBreadcrumb = buildParentBreadcrumb(items, item.parent_id);

	return (
		<div className="flex flex-col gap-6 w-full">
			<MenuItemSummary item={item} parentBreadcrumb={parentBreadcrumb} />

			<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
				<SectionCard
					title="Contenido principal"
					description="Nombre, ruta visible e icono que verán los usuarios."
				>
					<MenuContentFields
						item={item}
						patchField={patchField}
						nameInputRef={nameInputRef}
					/>
				</SectionCard>

				<SectionCard
					title="Ubicación y estado"
					description="Jerarquía, App ID y dispositivos donde aparece."
				>
					<MenuPlacementFields item={item} patchField={patchField} items={items} />
				</SectionCard>
			</div>

			<SectionCard
				title="Presentación avanzada"
				description="Campos opcionales para mega menús o personalizaciones."
			>
				<MenuAdvancedFields item={item} patchField={patchField} />
			</SectionCard>

			<Card className="border-border/40">
				<CardHeader>
					<CardTitle className="text-base font-semibold">
						Permisos de visualización
					</CardTitle>
					<CardDescription>
						Limita quién puede ver el elemento. Sin selección = todos los roles.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<MenuRolesGrid
						roleOptions={roleOptions}
						editingRolesSet={new Set(item.roles ?? [])}
						onToggleRole={toggleRole}
					/>
				</CardContent>
			</Card>

			<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
				<Button
					variant="outline"
					onClick={() => void goBackToList()}
					disabled={saving}
				>
					Cancelar
				</Button>
				<Button
					onClick={() => void handleSubmit()}
					disabled={saving}
					className="gap-2"
				>
					{isCreate ? (
						<IconCheck className="size-4" />
					) : (
						<IconDeviceFloppy className="size-4" />
					)}
					{isCreate ? "Crear elemento" : "Guardar cambios"}
				</Button>
			</div>
		</div>
	);
}
