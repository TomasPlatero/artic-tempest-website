import { notFound, redirect } from "next/navigation";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import { getCachedServerSession } from "@/shared/auth/get-cached-server-session";
import { getAppPermission } from "@/shared/auth/permissions";
import { getAuthzSnapshot } from "@/shared/auth/authz";
import { Forbidden } from "@/shared/components/forbidden";
import { AdminPageHeader } from "@/shared/components/admin-page-header";
import { SettingsMenuForm } from "@/domains/settings/components/settings-menu-form";
import {
	buildRoleOptions,
	normalizeNavigationItem,
	type NavigationItemRecord,
} from "@/domains/settings/lib/menu-editor";

export default async function EditMenuItemPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const [{ id }, session] = await Promise.all([
		params,
		getCachedServerSession(),
	]);
	if (!session) {
		redirect("/");
	}

	const authz = await getAuthzSnapshot(session);
	const { canEdit } = await getAppPermission(
		authz.roleSlug ?? session.user?.roleLevel ?? "invitado",
		"settings-menu",
	);
	if (!canEdit) {
		return <Forbidden />;
	}

	const [{ data: itemRow }, { data: itemRows }, { data: roleRows }] =
		await Promise.all([
			supabaseAdmin
				.from("navigation_items")
				.select(`*, navigation_item_roles (role_level)`)
				.eq("id", id)
				.maybeSingle(),
			supabaseAdmin
				.from("navigation_items")
				.select(
					"id,name,url,icon_name,order_index,parent_id,is_active,app_id,css_class,element_id,visibility,description",
				)
				.order("order_index", { ascending: true }),
			supabaseAdmin
				.from("app_roles")
				.select("level,label")
				.order("priority", { ascending: false }),
		]);

	if (!itemRow) {
		notFound();
	}

	const items = (itemRows ?? []).map((row) =>
		normalizeNavigationItem(row as NavigationItemRecord),
	);
	const item = normalizeNavigationItem(itemRow as NavigationItemRecord);

	return (
		<div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6 lg:px-8">
			<AdminPageHeader
				title="EDITAR ELEMENTO"
				description="Nombre, ruta, icono, permisos y visibilidad del elemento del menú."
				backHref="/zona-raider/configuracion/menu"
			/>
			<SettingsMenuForm
				mode="edit"
				item={item}
				items={items}
				roleOptions={buildRoleOptions(roleRows ?? [])}
			/>
		</div>
	);
}
