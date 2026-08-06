import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import { ensureAppPermission } from "@/shared/auth/permissions";

export async function PATCH(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const [{ id }, body] = await Promise.all([params, req.json()]);
	await ensureAppPermission("settings", "edit");
	const normalizedId = id.trim().toLowerCase();

	// Update page metadata (if provided)
	if (body.name !== undefined) {
		const name = body.name?.toString()?.trim();
		if (!name) {
			return NextResponse.json(
				{ error: "El nombre no puede estar vacío" },
				{ status: 400 },
			);
		}

		const { error: updateError } = await supabaseAdmin
			.from("app_pages")
			.update({ name })
			.eq("id", normalizedId);

		if (updateError) {
			console.error(
				`[pages] PATCH name error for ${normalizedId}`,
				updateError,
			);
			return NextResponse.json(
				{ error: "No se pudo actualizar la página" },
				{ status: 500 },
			);
		}
	}

	// Sync role permissions (if provided)
	if (Array.isArray(body.roleLevels)) {
		const allowedRoles: string[] = body.roleLevels.map((r: string) =>
			r.trim().toLowerCase(),
		);

		// Get all roles that currently have view permission for this page
		const { data: currentPermissions } = await supabaseAdmin
			.from("app_permissions")
			.select("role_level")
			.eq("app_id", normalizedId)
			.eq("can_view", true);

		const currentRoleLevels = new Set(
			(currentPermissions ?? []).map((p) => p.role_level),
		);
		const newRoleLevels = new Set(allowedRoles);

		// Roles to add permission for
		const toAdd = allowedRoles.filter((r) => !currentRoleLevels.has(r));
		// Roles to remove permission from
		const toRemove = [...currentRoleLevels].filter(
			(r) => !newRoleLevels.has(r),
		);

		if (toAdd.length > 0) {
			const inserts = toAdd.map((roleLevel) => ({
				role_level: roleLevel,
				app_id: normalizedId,
				can_view: true,
				can_edit: false,
				can_manage: false,
			}));
			const { error: insertError } = await supabaseAdmin
				.from("app_permissions")
				.insert(inserts);

			if (insertError) {
				console.error(
					`[pages] PATCH insert permissions error for ${normalizedId}`,
					insertError,
				);
				return NextResponse.json(
					{ error: "No se pudieron guardar los permisos" },
					{ status: 500 },
				);
			}
		}

		if (toRemove.length > 0) {
			const { error: deleteError } = await supabaseAdmin
				.from("app_permissions")
				.delete()
				.eq("app_id", normalizedId)
				.in("role_level", toRemove);

			if (deleteError) {
				console.error(
					`[pages] PATCH delete permissions error for ${normalizedId}`,
					deleteError,
				);
			}
		}
	}

	return NextResponse.json({ success: true });
}
