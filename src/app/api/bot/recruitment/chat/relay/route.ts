import { NextRequest, NextResponse } from "next/server";
import { enforceBearerToken } from "@/shared/api/public-auth";
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { resolveActiveApplicationForDiscordUser } from "@/shared/lib/recruitment/active-application";
import { publishRecruitmentBotEvent } from "@/shared/lib/recruitment/bot-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MESSAGE_LENGTH = 2000;

export async function POST(request: NextRequest) {
	const authError = await enforceBearerToken(request);
	if (authError) return authError;

	try {
		const body = await request.json();
		const { discordUserId, content, attachments } = body ?? {};

		if (!discordUserId || typeof discordUserId !== "string") {
			return NextResponse.json(
				{ error: "Falta discordUserId" },
				{ status: 400 },
			);
		}

		const hasContent =
			content && typeof content === "string" && content.trim().length > 0;
		const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

		if (!hasContent && !hasAttachments) {
			return NextResponse.json(
				{ error: "El mensaje no puede estar vacío" },
				{ status: 400 },
			);
		}

		const normalizedContent = hasContent ? content.trim() : "";

		if (normalizedContent.length > MAX_MESSAGE_LENGTH) {
			return NextResponse.json(
				{ error: `El mensaje excede ${MAX_MESSAGE_LENGTH} caracteres` },
				{ status: 400 },
			);
		}

		const applicationResult =
			await resolveActiveApplicationForDiscordUser(discordUserId);

		if (!applicationResult.ok) {
			return NextResponse.json(
				{ error: applicationResult.error },
				{ status: applicationResult.status },
			);
		}

		const application = applicationResult.application;

		const { data: profile } = await supabaseAdmin
			.from("profiles")
			.select("user_id, discord_username")
			.eq("discord_user_id", discordUserId)
			.single();

		if (!profile) {
			return NextResponse.json(
				{ error: "Usuario no encontrado" },
				{ status: 404 },
			);
		}

		const insertPayload: any = {
			application_id: application.id,
			author_id: profile.user_id,
			content: normalizedContent,
			source: "discord",
		};

		if (Array.isArray(attachments) && attachments.length > 0) {
			insertPayload.attachments = attachments;
		}

		const { data: savedMsg, error: saveError } = await supabaseAdmin
			.from("application_messages")
			.insert(insertPayload)
			.select(
				"*, author:profiles(discord_username, discord_avatar, role_level)",
			)
			.single();

		if (saveError) throw saveError;

		const { data: lastStaffMsg } = await supabaseAdmin
			.from("application_messages")
			.select(
				"*, author:profiles(discord_username, discord_avatar, role_level, discord_user_id)",
			)
			.eq("application_id", application.id)
			.in("source", ["web"])
			.order("created_at", { ascending: false })
			.limit(1)
			.maybeSingle();

		const staffAuthor =
			lastStaffMsg?.author &&
			typeof lastStaffMsg.author === "object" &&
			!Array.isArray(lastStaffMsg.author)
				? (lastStaffMsg.author as { discord_user_id?: string | null })
				: null;

		if (staffAuthor?.discord_user_id) {
			void publishRecruitmentBotEvent({
				type: "recruitment.chat.applicant_reply",
				applicationId: application.id,
				officerDiscordUserId: staffAuthor.discord_user_id,
				applicantName: profile?.discord_username ?? "",
				characterName: application.characterName,
				characterRealm: application.characterRealm,
				content: normalizedContent,
				attachments: Array.isArray(attachments) ? attachments : undefined,
			});
		}

		return NextResponse.json({ success: true, message: savedMsg });
	} catch (error: any) {
		console.error("[Bot:Relay] Error:", error);
		return NextResponse.json(
			{ error: error.message || "Error interno del servidor" },
			{ status: 500 },
		);
	}
}
