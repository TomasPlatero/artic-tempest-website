import { NextRequest, NextResponse } from "next/server";
import { enforceBearerToken } from "@/shared/api/public-auth";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import { fetchAppRoles } from "@/shared/auth/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MEMBERS_PER_REQUEST = 2000;

type SyncMemberInput = {
	discordUserId?: string;
	roles?: string[];
};

/**
 * POST /api/bot/sync-roles
 *
 * Recibe la lista de miembros actuales del guild (empujada por el bot de
 * Discord) y sincroniza `profiles.role_level` con el rol mapeado más alto de
 * cada miembro. Solo escribe las filas cuyo rol realmente cambió (diff), para
 * no presionar el pool de Supabase.
 *
 * Body: { members: [{ discordUserId, roles: string[] }] }
 */
export async function POST(request: NextRequest) {
	const authError = await enforceBearerToken(request);
	if (authError) return authError;

	let body: { members?: SyncMemberInput[] };
	try {
		body = (await request.json()) as { members?: SyncMemberInput[] };
	} catch {
		return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
	}

	const raw = Array.isArray(body.members) ? body.members : [];
	if (raw.length === 0) {
		return NextResponse.json(
			{ error: "members es obligatorio" },
			{ status: 400 },
		);
	}

	// Sanitizar entrada
	const members: { discordUserId: string; roles: string[] }[] = [];
	for (const member of raw.slice(0, MAX_MEMBERS_PER_REQUEST)) {
		if (
			!member ||
			typeof member.discordUserId !== "string" ||
			member.discordUserId.length === 0
		) {
			continue;
		}
		members.push({
			discordUserId: member.discordUserId,
			roles: Array.isArray(member.roles)
				? member.roles.filter(
						(roleId): roleId is string => typeof roleId === "string",
					)
				: [],
		});
	}

	if (members.length === 0) {
		return NextResponse.json({ error: "sin miembros válidos" }, { status: 400 });
	}

	// Cargar mapeo de roles de Discord y prioridades de la app
	const [{ data: mappings }, appRoles] = await Promise.all([
		supabaseAdmin.from("app_discord_roles").select("role_id, level"),
		fetchAppRoles(),
	]);

	const levelByRoleId = new Map<string, string>();
	for (const row of mappings ?? []) {
		if (row?.role_id && row?.level) {
			levelByRoleId.set(row.role_id, row.level);
		}
	}
	const priorityByLevel = new Map<string, number>();
	for (const role of appRoles) {
		priorityByLevel.set(role.level, role.priority);
	}

	// Calcular el nivel más alto mapeado de cada miembro.
	// Base "member": todos los que envía el bot son miembros actuales del guild.
	const computed: { discord_user_id: string; role_level: string }[] = [];
	for (const member of members) {
		let topLevel = "member";
		let topPriority = Number.NEGATIVE_INFINITY;
		for (const roleId of member.roles) {
			const level = levelByRoleId.get(roleId);
			if (!level) continue;
			const priority = priorityByLevel.get(level) ?? Number.NEGATIVE_INFINITY;
			if (priority > topPriority) {
				topPriority = priority;
				topLevel = level;
			}
		}
		computed.push({
			discord_user_id: member.discordUserId,
			role_level: topLevel,
		});
	}

	// Diff contra el estado actual: solo actualizar lo que cambió
	const discordIds = computed.map((entry) => entry.discord_user_id);
	const { data: existingRows, error: readError } = await supabaseAdmin
		.from("profiles")
		.select("discord_user_id, role_level")
		.in("discord_user_id", discordIds);

	if (readError) {
		return NextResponse.json(
			{ error: "Error leyendo perfiles" },
			{ status: 500 },
		);
	}

	const currentByDiscordId = new Map<string, string>();
	for (const row of existingRows ?? []) {
		if (row?.discord_user_id) {
			currentByDiscordId.set(row.discord_user_id, row.role_level);
		}
	}

	// Solo sincronizar perfiles que YA existen (usuarios que han hecho login).
	// No creamos perfiles nuevos para miembros que aún no han entrado en la web.
	const changed = computed
		.filter(
			(entry) =>
				currentByDiscordId.has(entry.discord_user_id) &&
				currentByDiscordId.get(entry.discord_user_id) !== entry.role_level,
		)
		.map((entry) => ({
			discord_user_id: entry.discord_user_id,
			role_level: entry.role_level,
			last_role_check: new Date().toISOString(),
		}));

	let updated = 0;
	if (changed.length > 0) {
		const { error: upsertError } = await supabaseAdmin
			.from("profiles")
			.upsert(changed, { onConflict: "discord_user_id" });

		if (upsertError) {
			return NextResponse.json(
				{ error: "Error actualizando roles" },
				{ status: 500 },
			);
		}
		updated = changed.length;
	}

	return NextResponse.json({
		success: true,
		received: members.length,
		updated,
	});
}
