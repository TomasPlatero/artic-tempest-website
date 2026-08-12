import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import { ensureAppPermission } from "@/shared/auth/permissions";
import { getGuildCredentials } from "@/shared/auth/credentials";
import { handleRouteError } from "@/shared/api/errors";
import { POST as submitApplication } from "@/app/api/recruitment/submit/route";

export const dynamic = "force-dynamic";

type Step = {
	step: string;
	ok: boolean;
	detail?: string;
};

/**
 * Busca el evento del bot para una aplicación con reintentos, porque
 * `publishRecruitmentBotEvent` se dispara en "fire and forget" desde submit.
 */
async function findBotEventId(
	applicationId: string,
	timeoutMs = 3000,
): Promise<string | null> {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		const { data } = await supabaseAdmin
			.from("recruitment_bot_events")
			.select("id, payload")
			.eq("type", "recruitment.application.created")
			.limit(50);

		const match = (data ?? []).find(
			(e: { payload?: { applicationId?: string } }) =>
				e.payload?.applicationId === applicationId,
		);
		if (match) return match.id;

		await new Promise((r) => setTimeout(r, 300));
	}
	return null;
}

export async function POST(req: Request) {
	const steps: Step[] = [];
	let applicationId: string | null = null;
	let discordMessageId: string | null = null;
	let testChannelId: string | null = null;

	try {
		const session = await ensureAppPermission("settings-testing", "manage");
		steps.push({ step: "auth", ok: true, detail: "sesión válida" });

		// 1. Canal de test configurado
		const { data: settings } = await supabaseAdmin
			.from("settings")
			.select("recruitment_test_channel_id")
			.eq("id", 1)
			.maybeSingle();

		testChannelId = settings?.recruitment_test_channel_id?.trim() || null;
		if (!testChannelId) {
			return NextResponse.json(
				{
					ok: false,
					steps: [
						...steps,
						{
							step: "canal_test",
							ok: false,
							detail: "Configurá primero el canal de Discord de test",
						},
					],
				},
				{ status: 200 },
			);
		}
		steps.push({ step: "canal_test", ok: true, detail: testChannelId });

		// 2. Personaje (por id o el de mayor nivel)
		const body = await req.json().catch(() => ({}));
		const characterId: string | undefined = body?.character_id;

		const { data: character } = characterId
			? await supabaseAdmin
					.from("bnet_characters")
					.select("id, name, realm, class_id, spec, level")
					.eq("user_id", session.user.id)
					.eq("id", characterId)
					.maybeSingle()
			: await supabaseAdmin
					.from("bnet_characters")
					.select("id, name, realm, class_id, spec, level")
					.eq("user_id", session.user.id)
					.order("level", { ascending: false })
					.limit(1)
					.maybeSingle();

		if (!character) {
			return NextResponse.json(
				{
					ok: false,
					steps: [
						...steps,
						{
							step: "personaje",
							ok: false,
							detail: "No tenés personajes de Battle.net vinculados",
						},
					],
				},
				{ status: 200 },
			);
		}
		steps.push({
			step: "personaje",
			ok: true,
			detail: `${character.name} — ${character.realm}`,
		});

		// 3. Respuestas válidas generadas a partir de las preguntas reales
		const { data: questions } = await supabaseAdmin
			.from("recruitment_questions")
			.select("id, type, options")
			.order("order_index", { ascending: true });

		const answers: Record<string, string> = {};
		for (const q of questions ?? []) {
			if (
				(q.type === "select" || q.type === "multiselect") &&
				q.options?.length
			) {
				answers[q.id] = q.options[0];
			} else if (q.type === "number") {
				answers[q.id] = "1";
			} else {
				answers[q.id] =
					`Respuesta de prueba (self-test ${new Date().toISOString()})`;
			}
		}

		// 4. Reutiliza el handler REAL de submit, con override de canal de test.
		const forwarded = new Request(
			new URL("/api/recruitment/submit", req.url).toString(),
			{
				method: "POST",
				headers: {
					"content-type": "application/json",
					cookie: req.headers.get("cookie") || "",
				},
				body: JSON.stringify({
					selectedChar: {
						id: character.id,
						name: character.name,
						realm: character.realm,
					},
					answers,
					simulate: false,
					discord_channel_id: testChannelId,
				}),
			},
		);

		const submitRes = await submitApplication(forwarded);
		const submitJson = await submitRes.json().catch(() => ({}));

		if (!submitRes.ok) {
			return NextResponse.json(
				{
					ok: false,
					steps: [
						...steps,
						{
							step: "submit",
							ok: false,
							detail: submitJson.error || `HTTP ${submitRes.status}`,
						},
					],
				},
				{ status: 200 },
			);
		}

		applicationId = submitJson.application?.id ?? null;
		steps.push({
			step: "submit",
			ok: Boolean(applicationId),
			detail: applicationId ?? "Sin id de aplicación en la respuesta",
		});

		if (!applicationId) {
			return NextResponse.json({ ok: false, steps }, { status: 200 });
		}

		// 5. Verifica que notify-apply guardó el id del mensaje de Discord
		const { data: appRow } = await supabaseAdmin
			.from("recruitment_applications")
			.select("id, discord_message_id")
			.eq("id", applicationId)
			.maybeSingle();

		discordMessageId = appRow?.discord_message_id ?? null;
		steps.push({
			step: "mensaje_discord",
			ok: Boolean(discordMessageId),
			detail: discordMessageId ?? "No se generó discord_message_id",
		});

		// 6. Verifica el evento del bot
		const botEventId = await findBotEventId(applicationId);
		steps.push({
			step: "evento_bot",
			ok: Boolean(botEventId),
			detail: botEventId ?? "No se encontró el evento del bot",
		});

		// 7. Rollback: borra el mensaje de Discord
		const creds = await getGuildCredentials();
		const botToken = creds.discord_bot_token;

		if (discordMessageId && botToken) {
			const delRes = await fetch(
				`https://discord.com/api/v10/channels/${testChannelId}/messages/${discordMessageId}`,
				{
					method: "DELETE",
					headers: { Authorization: `Bot ${botToken}` },
				},
			);
			const deleted = delRes.ok || delRes.status === 404;
			steps.push({
				step: "rollback_discord",
				ok: deleted,
				detail: `status ${delRes.status}`,
			});
		} else {
			steps.push({
				step: "rollback_discord",
				ok: false,
				detail: "Sin mensaje o sin bot token para borrar",
			});
		}

		// 8. Rollback: borra respuestas, evento y aplicación
		if (applicationId) {
			await supabaseAdmin
				.from("application_answers")
				.delete()
				.eq("application_id", applicationId);
			if (botEventId) {
				await supabaseAdmin
					.from("recruitment_bot_events")
					.delete()
					.eq("id", botEventId);
			}
			await supabaseAdmin
				.from("recruitment_applications")
				.delete()
				.eq("id", applicationId);
		}
		steps.push({
			step: "rollback_db",
			ok: true,
			detail: "aplicación, respuestas y evento eliminados",
		});

		const ok = steps.every((s) => s.ok);
		return NextResponse.json({ ok, steps });
	} catch (e) {
		console.error("[POST /api/recruitment/self-test]", e);
		return handleRouteError(e);
	}
}
