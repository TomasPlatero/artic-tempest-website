import { NextResponse } from "next/server";
import { getGuildCredentials } from "@/shared/auth/credentials";
import { ensureAppPermission } from "@/shared/auth/permissions";
import { buildDiscordLinkedRolesMetadataRecords } from "@/shared/discord/linked-roles";
import { getDiscordLinkedRolesVerificationUrl } from "@/shared/discord/linked-roles";

async function getDiscordApplicationId() {
	const creds = await getGuildCredentials();
	return creds.discord_app_id || creds.discord_client_id || null;
}

async function getDiscordBotToken() {
	const creds = await getGuildCredentials();
	return creds.discord_bot_token || null;
}

export async function GET(_request: Request) {
	try {
		await ensureAppPermission("settings-discord", "edit");
		const applicationId = await getDiscordApplicationId();
		const botToken = await getDiscordBotToken();

		if (!applicationId || !botToken) {
			return NextResponse.json(
				{ error: "Discord no configurado" },
				{ status: 400 },
			);
		}

		const response = await fetch(
			`https://discord.com/api/v10/applications/${applicationId}/role-connections/metadata`,
			{
				headers: { Authorization: `Bot ${botToken}` },
				cache: "no-store",
			},
		);

		if (!response.ok) {
			return NextResponse.json(
				{ error: "Failed to fetch Discord metadata" },
				{ status: response.status },
			);
		}
		const payload = await response.json().catch(() => null);
		return NextResponse.json(payload);
	} catch (error: any) {
		return NextResponse.json(
			{ error: error.message || "Error interno" },
			{ status: 500 },
		);
	}
}

export async function PUT(request: Request) {
	try {
		await ensureAppPermission("settings-discord", "edit");
		const applicationId = await getDiscordApplicationId();
		const botToken = await getDiscordBotToken();

		if (!applicationId || !botToken) {
			return NextResponse.json(
				{ error: "Discord no configurado" },
				{ status: 400 },
			);
		}

		const records = buildDiscordLinkedRolesMetadataRecords();
		const verificationUrl = getDiscordLinkedRolesVerificationUrl(request);

		const [metadataResponse, applicationResponse] = await Promise.all([
			fetch(
				`https://discord.com/api/v10/applications/${applicationId}/role-connections/metadata`,
				{
					method: "PUT",
					headers: {
						Authorization: `Bot ${botToken}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify(records),
				},
			),
			fetch(`https://discord.com/api/v10/applications/${applicationId}`, {
				method: "PATCH",
				headers: {
					Authorization: `Bot ${botToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					role_connections_verification_url: verificationUrl,
				}),
			}),
		]);

		const metadataPayload = await metadataResponse.json().catch(() => null);
		const applicationPayload = await applicationResponse
			.json()
			.catch(() => null);
		return NextResponse.json(
			{
				metadata: metadataPayload,
				application: applicationPayload,
			},
			{ status: metadataResponse.ok && applicationResponse.ok ? 200 : 207 },
		);
	} catch (error: any) {
		return NextResponse.json(
			{ error: error.message || "Error interno" },
			{ status: 500 },
		);
	}
}
