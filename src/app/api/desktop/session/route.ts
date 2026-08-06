import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import { getRoleFlags } from "@/shared/auth/roles";
import { createDesktopSessionToken } from "@/shared/api/desktop-auth";

type DiscordUser = {
	id: string;
	username?: string;
};

export const runtime = "nodejs";

function jsonError(error: string, code: string, status: number) {
	return NextResponse.json({ error, code }, { status });
}

async function fetchDiscordUser(
	accessToken: string,
): Promise<DiscordUser | null> {
	try {
		const response = await fetch("https://discord.com/api/users/@me", {
			headers: { Authorization: `Bearer ${accessToken}` },
			cache: "no-store",
		});

		if (!response.ok) {
			return null;
		}

		return (await response.json()) as DiscordUser;
	} catch (error) {
		console.error("[DesktopSession] Discord fetch error", error);
		return null;
	}
}

function isBanActive(profile?: {
	is_banned?: boolean | null;
	ban_expires_at?: string | null;
}) {
	if (!profile?.is_banned) return false;
	if (!profile.ban_expires_at) return true;
	const expires = new Date(profile.ban_expires_at);
	if (Number.isNaN(expires.getTime())) return true;
	return expires > new Date();
}

export async function POST(request: NextRequest) {
	const discordToken = request.headers.get("x-discord-access-token")?.trim();
	if (!discordToken) {
		return jsonError(
			"Missing Discord access token",
			"MISSING_DISCORD_ACCESS_TOKEN",
			401,
		);
	}

	if (discordToken.length > 4096) {
		return jsonError(
			"Invalid Discord access token",
			"INVALID_DISCORD_ACCESS_TOKEN",
			401,
		);
	}

	const discordUser = await fetchDiscordUser(discordToken);
	if (!discordUser?.id) {
		return jsonError("Invalid Discord token", "INVALID_DISCORD_TOKEN", 401);
	}

	const { data: profile, error } = await supabaseAdmin
		.from("profiles")
		.select(
			"user_id, role_level, is_banned, ban_expires_at, banned_at, ban_reason",
		)
		.eq("discord_user_id", discordUser.id)
		.maybeSingle();

	if (error) {
		console.error("[DesktopSession] Profile lookup failed", error);
		return jsonError("Could not fetch profile", "PROFILE_LOOKUP_FAILED", 500);
	}

	if (!profile) {
		return jsonError("Profile not found", "PROFILE_NOT_FOUND", 404);
	}

	if (isBanActive(profile)) {
		return jsonError("Account banned", "ACCOUNT_BANNED", 403);
	}

	const [{ token, expiresIn }, roleFlags] = await Promise.all([
		createDesktopSessionToken({
			userId: profile.user_id,
			discordId: discordUser.id,
			roleLevel: profile.role_level ?? "member",
		}),
		getRoleFlags(profile.role_level ?? "member"),
	]);

	return NextResponse.json(
		{
			token,
			expiresIn,
			tokenType: "desktop_session",
			role: {
				level: profile.role_level,
				canAccessZonaRaider: roleFlags.canAccessZonaRaider,
				canUseRaiderApp: roleFlags.canUseRaiderApp,
				isSuperAdmin: roleFlags.isSuperAdmin,
				isAdmin: roleFlags.isAdmin,
				priority: roleFlags.priority,
				label: roleFlags.label,
			},
		},
		{ headers: { "Cache-Control": "no-store" } },
	);
}
