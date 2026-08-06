"use server";

import { auth } from "@/auth";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { getGuildCredentials } from "@/shared/auth/credentials";
import { getAuthzSnapshot } from "@/shared/auth/authz";
import { isAtLeast } from "@/shared/auth/permissions";
import { z } from "zod";

const STREAMERS_CACHE_TAG = "streamers-public";

const twitchUsernameSchema = z
	.string()
	.min(4, "Twitch username must be at least 4 characters")
	.max(25, "Twitch username must be at most 25 characters")
	.regex(
		/^[a-zA-Z0-9_]+$/,
		"Twitch username must be alphanumeric with underscores",
	);

const uuidSchema = z.uuid();

const streamerItemsSchema = z
	.array(
		z.object({
			id: z.uuid(),
			sort_order: z.number().int().min(0).max(9999),
		}),
	)
	.max(200, "Too many streamers");

const discordChannelIdSchema = z
	.string()
	.min(17, "Invalid Discord channel ID")
	.max(20, "Invalid Discord channel ID")
	.regex(/^\d+$/, "Discord channel ID must be numeric");

async function fetchEnrichedStreamersInternal() {
	try {
		const { data: guild } = await supabaseAdmin
			.from("settings")
			.select("guild_id")
			.eq("id", 1)
			.maybeSingle();

		if (!guild) return [];

		const { data: streamers, error } = await supabaseAdmin
			.from("guild_streamers")
			.select("*")
			.eq("guild_id", guild.guild_id)
			.order("sort_order", { ascending: true })
			.order("created_at", { ascending: true });

		if (error || !streamers) return [];

		const enrichedStreamers = await Promise.all(
			streamers.map(async (st) => {
				try {
					const [uptimeRes, avatarRes] = await Promise.all([
						fetch(`https://decapi.me/twitch/uptime/${st.twitch_username}`, {
							next: { revalidate: 60 },
						}),
						fetch(`https://decapi.me/twitch/avatar/${st.twitch_username}`, {
							next: { revalidate: 3600 },
						}),
					]);

					const text = await uptimeRes.text();
					const isLive =
						!text.toLowerCase().includes("offline") &&
						!text.includes("User not found");

					let avatarUrl = null;
					try {
						const avatarText = await avatarRes.text();
						if (avatarText.startsWith("http")) avatarUrl = avatarText;
					} catch {
						// Ignore avatar failures.
					}

					const thumbnailUrl = isLive
						? `https://static-cdn.jtvnw.net/previews-ttv/live_user_${st.twitch_username.toLowerCase()}-440x248.jpg`
						: null;

					return {
						...st,
						is_live: isLive,
						avatar_url: avatarUrl,
						thumbnail_url: thumbnailUrl,
					};
				} catch {
					return { ...st, is_live: false, avatar_url: null };
				}
			}),
		);

		enrichedStreamers.sort((a, b) => {
			if (a.is_live !== b.is_live) return a.is_live ? -1 : 1;
			return (a.sort_order || 0) - (b.sort_order || 0);
		});

		return enrichedStreamers;
	} catch (err) {
		console.error("Error fetching streamers:", err);
		return [];
	}
}

export const getEnrichedStreamers = unstable_cache(
	fetchEnrichedStreamersInternal,
	["streamers-public-v1"],
	{ revalidate: 60, tags: [STREAMERS_CACHE_TAG] },
);

export async function addStreamer(twitchUsername: string) {
	const session = await auth();
	if (!session) throw new Error("Unauthorized");
	const authz = await getAuthzSnapshot(session);
	if (
		!(await isAtLeast(
			authz.roleSlug ?? session.user?.roleLevel ?? "",
			"officer",
		))
	) {
		throw new Error("Unauthorized: Administrative access required");
	}

	const parsed = twitchUsernameSchema.safeParse(twitchUsername);
	if (!parsed.success) {
		throw new Error(
			parsed.error.issues[0]?.message ?? "Invalid Twitch username",
		);
	}

	const { data: guild } = await supabaseAdmin
		.from("settings")
		.select("guild_id")
		.eq("id", 1)
		.maybeSingle();
	if (!guild) throw new Error("Guild not found");

	const { data, error } = await supabaseAdmin
		.from("guild_streamers")
		.insert({
			guild_id: guild.guild_id,
			twitch_username: parsed.data.toLowerCase().trim(),
		})
		.select()
		.single();

	if (error) throw new Error("Error interno del servidor");
	revalidatePath("/");
	revalidatePath("/streamers");
	revalidateTag(STREAMERS_CACHE_TAG, "max");
	return data;
}

export async function removeStreamer(id: string) {
	const session = await auth();
	if (!session) throw new Error("Unauthorized");
	const authz = await getAuthzSnapshot(session);
	if (
		!(await isAtLeast(
			authz.roleSlug ?? session.user?.roleLevel ?? "",
			"officer",
		))
	) {
		throw new Error("Unauthorized: Administrative access required");
	}

	const parsed = uuidSchema.safeParse(id);
	if (!parsed.success) throw new Error("Invalid streamer ID format");

	const { error } = await supabaseAdmin
		.from("guild_streamers")
		.delete()
		.eq("id", parsed.data);

	if (error) throw new Error("Error interno del servidor");
	revalidatePath("/");
	revalidatePath("/streamers");
	revalidateTag(STREAMERS_CACHE_TAG, "max");
}

export async function updateStreamersOrder(
	items: { id: string; sort_order: number }[],
) {
	const session = await auth();
	if (!session) throw new Error("Unauthorized");
	const authz = await getAuthzSnapshot(session);
	if (
		!(await isAtLeast(
			authz.roleSlug ?? session.user?.roleLevel ?? "",
			"officer",
		))
	) {
		throw new Error("Unauthorized: Administrative access required");
	}

	const parsed = streamerItemsSchema.safeParse(items);
	if (!parsed.success) {
		throw new Error(parsed.error.issues[0]?.message ?? "Invalid order data");
	}

	const updates = parsed.data.map((item) =>
		supabaseAdmin
			.from("guild_streamers")
			.update({ sort_order: item.sort_order })
			.eq("id", item.id),
	);

	const results = await Promise.allSettled(updates);
	const failed = results.filter((r) => r.status === "rejected");
	if (failed.length > 0) throw new Error("Error interno del servidor");

	revalidatePath("/");
	revalidatePath("/streamers");
	revalidateTag(STREAMERS_CACHE_TAG, "max");
}

async function _getStreamerConfig() {
	const session = await auth();
	if (!session) throw new Error("Unauthorized");
	const authz = await getAuthzSnapshot(session);
	if (
		!(await isAtLeast(
			authz.roleSlug ?? session.user?.roleLevel ?? "",
			"officer",
		))
	) {
		throw new Error("Unauthorized: Administrative access required");
	}
	const { data, error } = await supabaseAdmin
		.from("app_discord")
		.select("discord_streams_channel_id")
		.limit(1)
		.single();

	if (error) throw new Error("Error interno del servidor");
	return data;
}

async function _updateStreamerConfig(discordChannelId: string) {
	const session = await auth();
	if (!session) throw new Error("Unauthorized");
	const authz = await getAuthzSnapshot(session);
	if (
		!(await isAtLeast(
			authz.roleSlug ?? session.user?.roleLevel ?? "",
			"officer",
		))
	) {
		throw new Error("Unauthorized: Administrative access required");
	}

	const parsed = discordChannelIdSchema.safeParse(discordChannelId);
	if (!parsed.success) throw new Error("Invalid Discord channel ID");

	const { data: guild } = await supabaseAdmin
		.from("settings")
		.select("guild_id")
		.eq("id", 1)
		.maybeSingle();
	if (!guild) throw new Error("Guild not found");

	const { error } = await supabaseAdmin
		.from("app_discord")
		.update({ discord_streams_channel_id: parsed.data })
		.eq("guild_id", guild.guild_id);

	if (error) throw new Error("Error interno del servidor");
}

async function _getDiscordChannels() {
	const session = await auth();
	if (!session) throw new Error("Unauthorized");
	const authz = await getAuthzSnapshot(session);
	if (
		!(await isAtLeast(
			authz.roleSlug ?? session.user?.roleLevel ?? "",
			"officer",
		))
	) {
		throw new Error("Unauthorized: Administrative access required");
	}
	const creds = await getGuildCredentials();
	if (!creds.discord_bot_token || !creds.discord_guild_id) {
		throw new Error("Discord not configured");
	}

	const res = await fetch(
		`https://discord.com/api/v10/guilds/${creds.discord_guild_id}/channels`,
		{
			headers: { Authorization: `Bot ${creds.discord_bot_token}` },
		},
	);

	if (!res.ok) throw new Error("Failed to fetch channels");
	const channels = await res.json();

	const filteredChannels = [] as Array<{ id: string; name: string }>;

	for (const c of channels as Array<{
		id: string;
		name: string;
		type: number;
	}>) {
		if (c.type === 0 || c.type === 5) {
			filteredChannels.push({ id: c.id, name: c.name });
		}
	}

	return filteredChannels.sort((a, b) => a.name.localeCompare(b.name));
}
