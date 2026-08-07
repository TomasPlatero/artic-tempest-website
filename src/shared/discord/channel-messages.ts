// Server-only: fetch recent messages from a Discord channel using the guild bot token.
import { getGuildCredentials } from "@/shared/auth/credentials";

export const DISCORD_RAIDER_ANNOUNCEMENTS_CHANNEL_ID = "1318544823954968647";

export type DiscordChannelMessage = {
	id: string;
	author: {
		id: string;
		displayName: string;
		avatarUrl: string | null;
		roleColor: string | null;
	};
	content: string;
	createdAt: string;
	formattedTime: string;
	attachments: DiscordChannelAttachment[];
	youtubeId: string | null;
	poll: DiscordPoll | null;
};

export type DiscordChannelAttachment = {
	id: string;
	url: string;
	width: number | null;
	height: number | null;
	contentType: string | null;
};

export type DiscordPollAnswer = {
	answerId: number;
	text: string;
	voteCount: number;
};

export type DiscordPoll = {
	question: string;
	answers: DiscordPollAnswer[];
	isFinalized: boolean;
	allowMultiselect: boolean;
	totalVotes: number;
};

const CACHE_TTL_MS = 60_000;
const cache = new Map<
	string,
	{ data: DiscordChannelMessage[]; fetchedAt: number }
>();

// Guild context (roles, members, channels) changes rarely; cache longer than messages.
const GUILD_CONTEXT_TTL_MS = 5 * 60_000;

type GuildMemberContext = {
	colorByUserId: Map<string, string | null>;
	nameByUserId: Map<string, string>;
	nameByRoleId: Map<string, string>;
	colorByRoleId: Map<string, string>;
	nameByChannelId: Map<string, string>;
};

const EMPTY_CONTEXT: GuildMemberContext = {
	colorByUserId: new Map(),
	nameByUserId: new Map(),
	nameByRoleId: new Map(),
	colorByRoleId: new Map(),
	nameByChannelId: new Map(),
};

let guildContextCache: {
	guildId: string;
	ctx: GuildMemberContext;
	fetchedAt: number;
} | null = null;

function buildAvatarUrl(
	userId: string,
	avatarHash: string | null | undefined,
): string | null {
	if (!avatarHash) return null;
	const ext = avatarHash.startsWith("a_") ? "gif" : "png";
	return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${ext}?size=64`;
}

// Discord-style label, computed server-side so the client never formats
// dates: avoids hydration mismatches between Node and browser Intl output and
// server/client "now" drift. Today → HH:MM, yesterday → "Ayer", within the
// week → weekday, otherwise → DD/MM/YYYY (all in UTC).
function formatDiscordTime(iso: string): string {
	if (!iso) return "";
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "";
	const now = new Date();
	const dayStartMs = (d: Date) =>
		Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
	const diffDays = Math.round(
		(dayStartMs(now) - dayStartMs(date)) / 86_400_000,
	);

	if (diffDays <= 0) {
		return date.toLocaleTimeString("es-ES", {
			hour: "2-digit",
			minute: "2-digit",
			timeZone: "UTC",
		});
	}
	if (diffDays === 1) {
		return "Ayer";
	}
	if (diffDays < 7) {
		const weekday = date.toLocaleDateString("es-ES", {
			weekday: "long",
			timeZone: "UTC",
		});
		return weekday.charAt(0).toUpperCase() + weekday.slice(1);
	}
	return date.toLocaleDateString("es-ES", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		timeZone: "UTC",
	});
}

function extractYoutubeId(url: string | null | undefined): string | null {
	if (!url) return null;
	const match = url.match(
		new RegExp(
			"(?:youtube[.]com/(?:watch[?](?:[^#]*[&])?v=|embed/|shorts/|live/)|youtu[.]be/)([A-Za-z0-9_-]{11})",
		),
	);
	return match ? match[1] : null;
}

function mapPoll(raw: any): DiscordPoll | null {
	if (!raw?.poll?.question) return null;
	const rawPoll = raw.poll;
	const answers: DiscordPollAnswer[] = (rawPoll.answers ?? []).map((a: any) => {
		const voteCount =
			rawPoll.results?.answer_counts?.find((ac: any) => ac.id === a.answer_id)
				?.count ?? 0;
		return {
			answerId: a.answer_id ?? 0,
			text: a.poll_media?.text ?? "",
			voteCount,
		};
	});
	const totalVotes = answers.reduce((sum, a) => sum + a.voteCount, 0);
	return {
		question: rawPoll.question.text ?? "",
		answers,
		isFinalized: rawPoll.results?.is_finalized ?? false,
		allowMultiselect: rawPoll.allow_multiselect ?? false,
		totalVotes,
	};
}

function mapMessage(raw: any): DiscordChannelMessage {
	const rawAttachments = Array.isArray(raw.attachments) ? raw.attachments : [];
	const rawEmbeds = Array.isArray(raw.embeds) ? raw.embeds : [];

	let youtubeId: string | null = null;
	for (const embed of rawEmbeds) {
		const candidate =
			extractYoutubeId(embed?.url) ?? extractYoutubeId(embed?.video?.url);
		if (candidate) {
			youtubeId = candidate;
			break;
		}
	}

	return {
		id: raw.id ?? "",
		author: {
			id: raw.author?.id ?? "",
			displayName:
				raw.author?.global_name || raw.author?.username || "Desconocido",
			avatarUrl: buildAvatarUrl(raw.author?.id, raw.author?.avatar),
			roleColor: null,
		},
		content: raw.content ?? "",
		createdAt: raw.timestamp ?? "",
		formattedTime: formatDiscordTime(raw.timestamp ?? ""),
		attachments: rawAttachments.map((a: any) => ({
			id: a?.id ?? "",
			url: a?.url ?? "",
			width: typeof a?.width === "number" ? a.width : null,
			height: typeof a?.height === "number" ? a.height : null,
			contentType: a?.content_type ?? null,
		})),
		youtubeId,
		poll: mapPoll(raw),
	};
}

// Escapes markdown special characters so resolved mention names render literally.
function escapeMarkdown(value: string): string {
	return value.replace(/([\\`*_{}[\]()#+\-.!|>~])/g, "\\$1");
}

// Resolves Discord mention/emoji syntax to plain text BEFORE markdown rendering
// on the client. Mentions inside code blocks are a known minor edge case.
function resolveDiscordSyntax(
	content: string,
	ctx: GuildMemberContext,
): string {
	return content
		.replace(/<@!?(\d+)>/g, (_match, id: string) => {
			const name = ctx.nameByUserId.get(id);
			return name ? `@${escapeMarkdown(name)}` : "";
		})
		.replace(/<@&(\d+)>/g, (_match, id: string) => {
			const name = ctx.nameByRoleId.get(id);
			if (!name) return "";
			const color = ctx.colorByRoleId.get(id);
			return color ? `[[r|${color}|${name}]]` : `[[r|${name}]]`;
		})
		.replace(/<#(\d+)>/g, (_match, id: string) => {
			const name = ctx.nameByChannelId.get(id);
			return name ? `#${escapeMarkdown(name)}` : "";
		})
		.replace(/<a?:(\w+):(\d+)>/g, (_match, name: string) => `:${name}:`);
}

// Fetches (and caches) the guild context needed to render messages: role colors
// by member, display names by member/role/channel. The bot needs the Server
// Members intent to read the member list; when missing, this degrades to an
// empty context (no colors, mentions stripped) — best effort.
async function getGuildMemberContext(
	guildId: string,
): Promise<GuildMemberContext> {
	if (
		guildContextCache &&
		guildContextCache.guildId === guildId &&
		Date.now() - guildContextCache.fetchedAt < GUILD_CONTEXT_TTL_MS
	) {
		return guildContextCache.ctx;
	}

	const creds = await getGuildCredentials();
	if (!creds.discord_bot_token) return EMPTY_CONTEXT;

	const headers = { Authorization: `Bot ${creds.discord_bot_token}` };

	try {
		const [rolesRes, membersRes, channelsRes] = await Promise.all([
			fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, { headers }),
			fetch(
				`https://discord.com/api/v10/guilds/${guildId}/members?limit=1000`,
				{
					headers,
				},
			),
			fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
				headers,
			}),
		]);
		// Each fetch is independent: role colors/names only need the roles list,
		// so a missing Server Members intent (members 403) or a failed channels
		// call still leaves role mentions colored and resolved.
		const roles = rolesRes.ok
			? ((await rolesRes.json()) as Array<{
					id: string;
					name: string;
					color: number;
					position: number;
				}>)
			: [];
		const members = membersRes.ok
			? ((await membersRes.json()) as Array<{
					user?: { id: string; global_name?: string | null; username?: string };
					roles?: string[];
				}>)
			: [];
		const channels = channelsRes.ok
			? ((await channelsRes.json()) as Array<{ id: string; name: string }>)
			: [];

		// Discord color precedence: the highest-position colored role wins.
		const coloredRoles = roles
			.filter((role) => role.color !== 0)
			.sort((a, b) => b.position - a.position);
		const colorByRoleId = new Map(
			coloredRoles.map((role) => [
				role.id,
				`#${role.color.toString(16).padStart(6, "0")}`,
			]),
		);

		const colorByUserId = new Map<string, string | null>();
		const nameByUserId = new Map<string, string>();
		for (const member of members) {
			const user = member.user;
			if (!user?.id) continue;
			const memberRoleSet = new Set(member.roles ?? []);
			const coloredRole = coloredRoles.find((role) =>
				memberRoleSet.has(role.id),
			);
			colorByUserId.set(
				user.id,
				coloredRole ? (colorByRoleId.get(coloredRole.id) ?? null) : null,
			);
			nameByUserId.set(
				user.id,
				user.global_name || user.username || "Desconocido",
			);
		}

		const ctx: GuildMemberContext = {
			colorByUserId,
			nameByUserId,
			nameByRoleId: new Map(roles.map((role) => [role.id, role.name])),
			colorByRoleId,
			nameByChannelId: new Map(
				channels.map((channel) => [channel.id, channel.name]),
			),
		};
		guildContextCache = { guildId, ctx, fetchedAt: Date.now() };
		return ctx;
	} catch (error) {
		console.error("[DISCORD] error fetching guild member context:", error);
		return EMPTY_CONTEXT;
	}
}

export async function getDiscordChannelMessages(
	channelId: string,
	limit = 50,
): Promise<DiscordChannelMessage[]> {
	const cacheKey = `${channelId}:${limit}`;
	const hit = cache.get(cacheKey);
	if (hit && Date.now() - hit.fetchedAt < CACHE_TTL_MS) return hit.data;

	const creds = await getGuildCredentials();
	if (!creds.discord_bot_token) return [];

	try {
		const res = await fetch(
			`https://discord.com/api/v10/channels/${channelId}/messages?limit=${limit}`,
			{
				headers: { Authorization: `Bot ${creds.discord_bot_token}` },
				next: { revalidate: 60 },
			},
		);
		if (!res.ok) {
			console.error(
				`[DISCORD] fetch channel ${channelId} messages failed: ${res.status}`,
			);
			return [];
		}
		const raw = (await res.json()) as any[];
		const messages = raw.map(mapMessage);

		// Attach role colors and resolve mentions best-effort; both fall back
		// gracefully when the guild context is unavailable.
		if (creds.discord_guild_id) {
			const ctx = await getGuildMemberContext(creds.discord_guild_id);
			for (const msg of messages) {
				msg.author.roleColor = ctx.colorByUserId.get(msg.author.id) ?? null;
				msg.content = resolveDiscordSyntax(msg.content, ctx);
			}
		}

		cache.set(cacheKey, { data: messages, fetchedAt: Date.now() });
		return messages;
	} catch (error) {
		console.error("[DISCORD] error fetching channel messages:", error);
		return [];
	}
}
