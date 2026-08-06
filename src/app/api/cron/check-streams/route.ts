import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireCronAuth } from "@/shared/security/cron-auth";
import { getGuildCredentials } from "@/shared/auth/credentials";

/**
 * CRON API Endpoint to check Twitch streams and notify in Discord
 * This endpoint should be called every 5-10 minutes.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
	const authError = requireCronAuth(req);
	if (authError) {
		return authError;
	}

	try {
		const sb = createClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.SUPABASE_SERVICE_ROLE_KEY!,
			{ auth: { persistSession: false } },
		);
		const creds = await getGuildCredentials();

		// 2. Fetch Discord config and streamers
		const { data: guild } = await sb
			.from("app_discord")
			.select(
				"discord_guild_id, discord_streams_channel_id, discord_recruitment_channel_id, discord_bot_token",
			)
			.single();
		if (!guild)
			return NextResponse.json({ error: "No guild found" }, { status: 404 });

		const { data: settings } = await sb
			.from("settings")
			.select("icon_url")
			.eq("id", 1)
			.maybeSingle();

		const guildIcon = settings?.icon_url || null;
		const guildId = guild.discord_guild_id;

		const targetChannelId =
			guild.discord_streams_channel_id ||
			creds.discord_streams_channel_id ||
			creds.discord_recruitment_channel_id ||
			guild.discord_recruitment_channel_id;
		const botToken = guild.discord_bot_token || creds.discord_bot_token;
		if (!targetChannelId || !botToken)
			return NextResponse.json(
				{ error: "Discord not configured" },
				{ status: 500 },
			);

		const { data: streamers } = await sb
			.from("guild_streamers")
			.select("*")
			.eq("guild_id", guildId);

		if (!streamers || streamers.length === 0)
			return NextResponse.json({ status: "No streamers to check" });

		const settledResults = await Promise.allSettled(
			streamers.map(async (streamer) => {
				const username = streamer.twitch_username.toLowerCase();

				// Check current status via decapi
				let isLive = false;
				let _statusText = "offline";
				let title = "";
				let viewers = "0";
				let game = "";

				try {
					const uptimeRes = await fetch(
						`https://decapi.me/twitch/uptime/${username}`,
						{ cache: "no-store" },
					);
					if (!uptimeRes.ok) {
						return null;
					}
					const uptimeText = await uptimeRes.text();
					isLive =
						!uptimeText.toLowerCase().includes("offline") &&
						!uptimeText.toLowerCase().includes("user not found");

					if (isLive) {
						_statusText = "online";
						// Get extra data
						const [titleRes, viewersRes, gameRes] = await Promise.all([
							fetch(`https://decapi.me/twitch/title/${username}`, {
								cache: "no-store",
							}),
							fetch(`https://decapi.me/twitch/viewercount/${username}`, {
								cache: "no-store",
							}),
							fetch(`https://decapi.me/twitch/game/${username}`, {
								cache: "no-store",
							}),
						]);
						if (titleRes.ok) title = await titleRes.text();
						if (viewersRes.ok) viewers = await viewersRes.text();
						if (gameRes.ok) game = await gameRes.text();
					}
				} catch (e) {
					console.error(`Error checking twitch for ${username}:`, e);
					return null;
				}

				// 4. Check previous notification state in DB
				const { data: prevNotify } = await sb
					.from("stream_notifications")
					.select("*")
					.eq("twitch_username", username)
					.single();

				const wasLive = prevNotify?.last_status === "online";
				const messageId = prevNotify?.discord_message_id;

				// Case A: Just went ONLINE -> Send new message
				if (isLive && !wasLive) {
					const newId = await sendDiscordNotification(
						targetChannelId,
						botToken,
						username,
						title,
						game,
						viewers,
						guildIcon,
						null,
					);
					if (newId) {
						await sb.from("stream_notifications").upsert(
							{
								twitch_username: username,
								discord_message_id: newId,
								last_status: "online",
								guild_id: guildId,
								updated_at: new Date().toISOString(),
							},
							{ onConflict: "twitch_username" },
						);
					}
					return `${username} went live!`;
				}
				// Case B: Still ONLINE -> Update existing message (refresh viewers/title)
				else if (isLive && wasLive && messageId) {
					await sendDiscordNotification(
						targetChannelId,
						botToken,
						username,
						title,
						game,
						viewers,
						guildIcon,
						messageId,
					);
					return `${username} updated (live)`;
				}
				// Case C: Just went OFFLINE -> Delete or edit message to show offline
				else if (!isLive && wasLive && messageId) {
					await sendDiscordNotification(
						targetChannelId,
						botToken,
						username,
						"Stream Finalizado",
						"-",
						"0",
						guildIcon,
						messageId,
						true,
					);
					await sb
						.from("stream_notifications")
						.update({
							last_status: "offline",
							updated_at: new Date().toISOString(),
						})
						.eq("twitch_username", username);
					return `${username} went offline`;
				}

				return null;
			}),
		);

		const results: string[] = [];
		for (const settled of settledResults) {
			if (settled.status === "fulfilled" && settled.value) {
				results.push(settled.value);
			}
		}

		return NextResponse.json({ status: "processed", results });
	} catch (err: any) {
		console.error("Cron check-streams error:", err);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

async function sendDiscordNotification(
	channelId: string,
	botToken: string,
	username: string,
	title: string,
	game: string,
	viewers: string,
	guildIcon: string | null,
	messageId: string | null = null,
	isOffline: boolean = false,
) {
	if (!botToken || !channelId) return null;

	const embedColor = isOffline ? 0x2b2d31 : 0x9146ff; // Grey or Twitch Purple
	const url = `https://twitch.tv/${username}`;

	const embed = {
		title: title || `${username} is live!`,
		url: url,
		color: embedColor,
		author: {
			name: username,
			icon_url:
				"https://static-cdn.jtvnw.net/jtv_user_pictures/twitch-profile-image.png",
		},
		fields: [
			{ name: "Juego", value: game || "Unknown", inline: true },
			{ name: "Espectadores", value: viewers || "0", inline: true },
		],
		image: {
			url: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${username}-1280x720.jpg?t=${Date.now()}`,
		},
		footer: {
			text: `Twitch • ${new Date().toLocaleString()}`,
			icon_url: guildIcon || undefined,
		},
	};

	const payload = {
		content: isOffline
			? `${username} ha terminado su directo.`
			: `¡Hey @everyone, **${username}** está en directo en ${url}!`,
		embeds: [embed],
	};

	const method = messageId ? "PATCH" : "POST";
	const endpoint = messageId
		? `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`
		: `https://discord.com/api/v10/channels/${channelId}/messages`;

	try {
		const res = await fetch(endpoint, {
			method,
			cache: "no-store",
			headers: {
				Authorization: `Bot ${botToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		if (!res.ok) {
			console.error(`Discord API error (${method}):`, await res.text());
			return null;
		}

		const data = await res.json();
		return data.id;
	} catch (e) {
		console.error("Discord fetch fatal error:", e);
		return null;
	}
}
