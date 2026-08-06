import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCachedServerSession } from "@/shared/auth/get-cached-server-session";
import { getAppPermission } from "@/shared/auth/permissions";
import { Forbidden } from "@/shared/components/forbidden";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import { PageEditorClient } from "@/domains/settings/components/page-editor-client";

export const metadata: Metadata = {
	title: "Editar página | Artic Tempest",
};

export default async function PageDetailPage({
	params,
}: {
	params: Promise<{ pageId: string }>;
}) {
	const [{ pageId }, session] = await Promise.all([
		params,
		getCachedServerSession(),
	]);
	if (!session) redirect("/login");

	const roleLevel = session?.user?.roleLevel ?? "invitado";
	const settingsPerm = await getAppPermission(roleLevel, "settings");

	if (!settingsPerm.canView) {
		return <Forbidden />;
	}

	const normalizedId = decodeURIComponent(pageId).trim().toLowerCase();

	const [{ data: page }, { data: roles }, { data: permissions }] =
		await Promise.all([
			supabaseAdmin
				.from("app_pages")
				.select("*")
				.eq("id", normalizedId)
				.maybeSingle(),
			supabaseAdmin
				.from("app_roles")
				.select("level,label,color,priority,is_super_admin,is_admin")
				.order("priority", { ascending: false }),
			supabaseAdmin
				.from("app_permissions")
				.select("role_level, can_view")
				.eq("app_id", normalizedId)
				.eq("can_view", true),
		]);

	if (!page) {
		return (
			<div className="flex flex-col gap-6 p-4 md:p-6 lg:px-8 w-full max-w-full">
				<div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
					<p className="font-semibold">Página no encontrada</p>
					<p className="text-sm mt-1">
						No existe ninguna página con el identificador &quot;{normalizedId}
						&quot;.
					</p>
				</div>
			</div>
		);
	}

	const viewRoles = new Set((permissions ?? []).map((p) => p.role_level));

	return (
		<PageEditorClient
			page={page}
			roles={roles ?? []}
			initialViewRoles={viewRoles}
		/>
	);
}
