"use server";

import { auth } from '@/auth';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { revalidatePath } from "next/cache";
import { getAppPermission } from "@/shared/auth/permissions";
import { getAuthzSnapshot } from "@/shared/auth/authz";
import type { SaveResult } from "./constants";
import { SEASON_NAME } from "./constants";

// ──────────────────────────────────────────────
// Mutations — require auth
// ──────────────────────────────────────────────

/** Save (insert/update) the current user's roster entry */
export async function saveMyEntry(data: {
	entry_id?: string;
	bnet_character_id: string;
	main_spec: string;
	off_spec?: string;
	profession_1?: string;
	profession_2?: string;
}): Promise<SaveResult> {
	try {
		const session = await auth();
		if (!session?.user?.id)
			return { ok: false, error: "No has iniciado sesión" };

		const {
			entry_id,
			bnet_character_id,
			main_spec,
			off_spec,
			profession_1,
			profession_2,
		} = data;

		if (!bnet_character_id || !main_spec) {
			return {
				ok: false,
				error: "Personaje y especialización principal son obligatorios",
			};
		}

		// Ensure the character belongs to this user
		const { data: char } = await supabaseAdmin
			.from("bnet_characters")
			.select("id")
			.eq("id", bnet_character_id)
			.eq("user_id", session.user.id)
			.maybeSingle();

		if (!char) {
			return { ok: false, error: "Ese personaje no te pertenece" };
		}

		if (entry_id) {
			// Editing existing entry — verify ownership
			const { data: existing } = await supabaseAdmin
				.from("season_rosters")
				.select("id")
				.eq("id", entry_id)
				.eq("user_id", session.user.id)
				.maybeSingle();

			if (!existing) {
				return {
					ok: false,
					error: "No puedes editar una entrada que no te pertenece",
				};
			}

			const { error } = await supabaseAdmin
				.from("season_rosters")
				.update({
					main_spec,
					off_spec: off_spec || null,
					profession_1: profession_1 || null,
					profession_2: profession_2 || null,
				})
				.eq("id", entry_id);

			if (error) {
				console.error("update error:", error);
				return { ok: false, error: "Error al actualizar" };
			}
		} else {
			// New entry — check max 3 per user
			const { count } = await supabaseAdmin
				.from("season_rosters")
				.select("id", { count: "exact", head: true })
				.eq("season_name", SEASON_NAME)
				.eq("user_id", session.user.id);

			if (count != null && count >= 3) {
				return {
					ok: false,
					error: "Máximo 3 personajes por jugador en Season 2",
				};
			}

			const { error } = await supabaseAdmin.from("season_rosters").insert({
				season_name: SEASON_NAME,
				user_id: session.user.id,
				bnet_character_id,
				main_spec,
				off_spec: off_spec || null,
				profession_1: profession_1 || null,
				profession_2: profession_2 || null,
			});

			if (error) {
				console.error("insert error:", error);
				return { ok: false, error: "Error al guardar" };
			}
		}

		revalidatePath("/zona-raider/roster/season-2");
		return { ok: true };
	} catch (err) {
		console.error("saveMyEntry error:", err);
		return { ok: false, error: "Error inesperado al guardar" };
	}
}

/** Delete the current user's own roster entry */
export async function deleteMyEntry(entryId: string): Promise<SaveResult> {
	try {
		const session = await auth();
		if (!session?.user?.id)
			return { ok: false, error: "No has iniciado sesión" };

		// Verify ownership
		const { data: existing } = await supabaseAdmin
			.from("season_rosters")
			.select("id, user_id")
			.eq("id", entryId)
			.eq("user_id", session.user.id)
			.maybeSingle();

		if (!existing) {
			return {
				ok: false,
				error: "No puedes eliminar una entrada que no te pertenece",
			};
		}

		const { error } = await supabaseAdmin
			.from("season_rosters")
			.delete()
			.eq("id", entryId);

		if (error) return { ok: false, error: "Error al eliminar" };

		revalidatePath("/zona-raider/roster/season-2");
		return { ok: true };
	} catch {
		return { ok: false, error: "Error inesperado al eliminar" };
	}
}

/** Admin: add a manual entry (any character, no Battle.net link required) */
export async function adminAddManualEntry(data: {
	character_name: string;
	realm_slug: string;
	class_id: number;
	main_spec: string;
	off_spec?: string;
	profession_1?: string;
	profession_2?: string;
}): Promise<SaveResult> {
	try {
		const session = await auth();
		if (!session?.user?.id)
			return { ok: false, error: "No has iniciado sesión" };

		// Check manage permission via app_permissions system
		const authz = await getAuthzSnapshot(session);
		const roleLevel = authz.roleSlug ?? session.user?.roleLevel ?? "";
		const { canManage } = await getAppPermission(roleLevel, "roster-season-2");

		if (!canManage) {
			return { ok: false, error: "No tienes permisos para editar este roster" };
		}

		const {
			character_name,
			realm_slug,
			class_id,
			main_spec,
			off_spec,
			profession_1,
			profession_2,
		} = data;

		if (!character_name || !realm_slug || !class_id || !main_spec) {
			return {
				ok: false,
				error:
					"Faltan campos obligatorios: nombre, reino, clase y espec principal",
			};
		}

		const { error } = await supabaseAdmin.from("season_rosters").insert({
			season_name: SEASON_NAME,
			user_id: session.user.id,
			bnet_character_id: null,
			character_name: character_name.trim(),
			realm_slug: realm_slug.trim(),
			class_id,
			main_spec,
			off_spec: off_spec || null,
			profession_1: profession_1 || null,
			profession_2: profession_2 || null,
		});

		if (error) {
			console.error("adminAddManualEntry error:", error);
			return { ok: false, error: "Error al añadir personaje" };
		}

		revalidatePath("/zona-raider/roster/season-2");
		return { ok: true };
	} catch (err) {
		console.error("adminAddManualEntry error:", err);
		return { ok: false, error: "Error inesperado" };
	}
}

/** Admin update — officer+ can edit any entry */
export async function adminUpdateEntry(
	entryId: string,
	data: {
		main_spec: string;
		off_spec?: string;
		profession_1?: string;
		profession_2?: string;
	},
): Promise<SaveResult> {
	try {
		const session = await auth();
		if (!session?.user?.id)
			return { ok: false, error: "No has iniciado sesión" };

		// Check manage permission via app_permissions system
		const authz = await getAuthzSnapshot(session);
		const roleLevel = authz.roleSlug ?? session.user?.roleLevel ?? "";
		const { canManage } = await getAppPermission(roleLevel, "roster-season-2");

		if (!canManage) {
			return {
				ok: false,
				error: "No tienes permisos para editar este roster",
			};
		}

		const { main_spec, off_spec, profession_1, profession_2 } = data;
		if (!main_spec)
			return { ok: false, error: "Falta especialización principal" };

		const { error } = await supabaseAdmin
			.from("season_rosters")
			.update({
				main_spec,
				off_spec: off_spec || null,
				profession_1: profession_1 || null,
				profession_2: profession_2 || null,
			})
			.eq("id", entryId);

		if (error) return { ok: false, error: "Error al actualizar" };

		revalidatePath("/zona-raider/roster/season-2");
		return { ok: true };
	} catch {
		return { ok: false, error: "Error inesperado al actualizar" };
	}
}

/** Admin delete */
export async function adminDeleteEntry(entryId: string): Promise<SaveResult> {
	try {
		const session = await auth();
		if (!session?.user?.id)
			return { ok: false, error: "No has iniciado sesión" };

		// Check manage permission via app_permissions system
		const authz = await getAuthzSnapshot(session);
		const roleLevel = authz.roleSlug ?? session.user?.roleLevel ?? "";
		const { canManage } = await getAppPermission(roleLevel, "roster-season-2");

		if (!canManage) {
			return {
				ok: false,
				error: "No tienes permisos para editar este roster",
			};
		}

		const { error } = await supabaseAdmin
			.from("season_rosters")
			.delete()
			.eq("id", entryId);

		if (error) return { ok: false, error: "Error al eliminar" };

		revalidatePath("/zona-raider/roster/season-2");
		return { ok: true };
	} catch {
		return { ok: false, error: "Error inesperado al eliminar" };
	}
}
