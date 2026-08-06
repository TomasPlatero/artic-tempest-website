// src/app/api/me/route.ts
import { NextResponse } from "next/server";
import { auth } from '@/auth';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import {
	resolveWowauditRank,
	type WowauditRankRow,
} from "@/shared/integrations/wowaudit/wowaudit-ranks";
import {
	fetchWowauditRanks,
} from "@/shared/integrations/wowaudit/wowaudit-ranks.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getRoleColor(roleLevel: string): Promise<string | null> {
	const ranks: WowauditRankRow[] = await fetchWowauditRanks();
	const rank = resolveWowauditRank(roleLevel, { ranks });
	return ranks.find((entry: WowauditRankRow) => entry.rank === rank)?.color ?? null;
}

export async function GET() {
	const session = await auth();
	if (!session) {
		return NextResponse.json({ error: "No autorizado" }, { status: 401 });
	}

	const {
		user: {
			discordId,
			username: sessUsername,
			avatarUrl: sessAvatarUrl,
			roleLevel: sessRoleLevel,
			email: sessEmail,
		},
	} = session;

	if (!discordId) {
		return NextResponse.json(
			{ error: "Falta el ID de Discord en la sesión" },
			{ status: 400 },
		);
	}

	const { data, error } = await supabaseAdmin
		.from("profiles")
		.select("discord_username, discord_avatar, role_level")
		.eq("discord_user_id", discordId)
		.single();

	const roleLevel = data?.role_level ?? sessRoleLevel ?? "raider";
	const roleColor = await getRoleColor(roleLevel);

	if (!error && data) {
		return NextResponse.json(
			{
				name: data.discord_username ?? sessUsername ?? "Usuario",
				email: sessEmail ?? "",
				avatar: data.discord_avatar ?? sessAvatarUrl ?? "",
				role: roleLevel,
				roleColor,
			},
			{ status: 200, headers: { "Cache-Control": "no-store" } },
		);
	}

	// Fallback a lo que venga en la sesión (primer login, etc.)
	return NextResponse.json(
		{
			name: sessUsername ?? "Usuario",
			email: sessEmail ?? "",
			avatar: sessAvatarUrl ?? "",
			role: roleLevel,
			roleColor,
		},
		{ status: 200, headers: { "Cache-Control": "no-store" } },
	);
}
