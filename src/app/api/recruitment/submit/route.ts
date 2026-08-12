import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import { getAuthzSnapshot } from "@/shared/auth/authz";
import { apiErrorResponse } from "@/shared/api/errors";
import { ACTIVE_RECRUITMENT_STATUSES } from "@/domains/recruitment/lib/application-status";
import { publishRecruitmentBotEvent } from "@/shared/lib/recruitment/bot-events";
import { resolveDiscordUserIdForApplication } from "@/shared/lib/recruitment/active-application";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const MAX_SUBMISSIONS_PER_WINDOW = 2;

const recruitmentSubmitSchema = z.object({
	selectedChar: z.object({
		id: z.string().trim().optional(),
		name: z.string().trim().min(1),
		realm: z.string().trim().min(1),
	}),
	answers: z.record(z.string(), z.unknown()).default({}),
	simulate: z.boolean().optional().default(false),
	discord_channel_id: z.string().trim().optional(),
});

export async function POST(req: Request) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "No autorizado" }, { status: 401 });
		}

		const parsed = recruitmentSubmitSchema.safeParse(await req.json());
		if (!parsed.success) {
			return apiErrorResponse(parsed.error);
		}

		const { selectedChar, answers, simulate, discord_channel_id } = parsed.data;

		const authz = await getAuthzSnapshot(session);

		if (!selectedChar?.name || !selectedChar?.realm) {
			return NextResponse.json(
				{ error: "Faltan datos del personaje" },
				{ status: 400 },
			);
		}

		const selectedCharacterQuery = supabaseAdmin
			.from("bnet_characters")
			.select("id, name, realm, realm_slug, class_id, spec, level")
			.eq("user_id", session.user.id);

		const { data: selectedCharacter, error: characterError } = selectedChar.id
			? await selectedCharacterQuery.eq("id", selectedChar.id).maybeSingle()
			: await selectedCharacterQuery
					.eq("name", selectedChar.name.trim())
					.eq("realm", selectedChar.realm.trim())
					.maybeSingle();

		if (characterError || !selectedCharacter) {
			return NextResponse.json(
				{ error: "El personaje seleccionado no pertenece a tu cuenta" },
				{ status: 400 },
			);
		}

		const normalizedName = selectedCharacter.name.trim();
		const normalizedRealm = selectedCharacter.realm.trim();

		if (
			normalizedName.length < 2 ||
			normalizedName.length > 32 ||
			normalizedRealm.length < 2 ||
			normalizedRealm.length > 64
		) {
			return NextResponse.json(
				{ error: "Datos del personaje inválidos" },
				{ status: 400 },
			);
		}

		if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
			return NextResponse.json(
				{ error: "Respuestas inválidas" },
				{ status: 400 },
			);
		}

		const { data: recruitmentQuestions } = await supabaseAdmin
			.from("recruitment_questions")
			.select("id, label, type, is_required, options")
			.order("order_index", { ascending: true });

		const questionMap = new Map(
			(recruitmentQuestions || []).map((q) => [q.id, q]),
		);

		const sanitizedAnswers: Array<{
			application_id: string;
			question_id: string;
			answer_text: string;
		}> = [];

		for (const [questionId, rawValue] of Object.entries(answers)) {
			const question = questionMap.get(questionId);

			if (!question) {
				return NextResponse.json(
					{ error: "Hay una pregunta inválida en la solicitud" },
					{ status: 400 },
				);
			}

			const answerText =
				typeof rawValue === "string"
					? rawValue.trim()
					: String(rawValue).trim();

			if (question.is_required && !answerText) {
				return NextResponse.json(
					{ error: `La respuesta de "${question.label}" es obligatoria` },
					{ status: 400 },
				);
			}

			if (question.type === "select" && question.options?.length) {
				const allowed = new Set(question.options as string[]);
				if (answerText && !allowed.has(answerText)) {
					return NextResponse.json(
						{ error: "Una respuesta seleccionada no es válida" },
						{ status: 400 },
					);
				}
			}

			if (question.type === "multiselect" && question.options?.length) {
				const allowed = new Set(question.options as string[]);
				const values = answerText ? answerText.split(", ").filter(Boolean) : [];

				if (values.some((value) => !allowed.has(value))) {
					return NextResponse.json(
						{ error: "Una opción múltiple no es válida" },
						{ status: 400 },
					);
				}
			}

			if (
				question.type === "number" &&
				answerText &&
				Number.isNaN(Number(answerText))
			) {
				return NextResponse.json(
					{ error: "Una respuesta numérica no es válida" },
					{ status: 400 },
				);
			}

			if (answerText.length > 5000) {
				return NextResponse.json(
					{ error: "Respuesta demasiado larga" },
					{ status: 400 },
				);
			}

			sanitizedAnswers.push({
				application_id: "",
				question_id: questionId,
				answer_text: answerText,
			});
		}

		const missingRequired = (recruitmentQuestions || []).find(
			(q) =>
				q.is_required &&
				!sanitizedAnswers.some((a) => a.question_id === q.id && a.answer_text),
		);

		if (missingRequired) {
			return NextResponse.json(
				{
					error: `El campo requerido "${missingRequired.id}" no fue contestado`,
				},
				{ status: 400 },
			);
		}

		const recentApps = await supabaseAdmin
			.from("recruitment_applications")
			.select("id, created_at")
			.eq("user_id", session.user.id)
			.gte(
				"created_at",
				new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString(),
			)
			.limit(MAX_SUBMISSIONS_PER_WINDOW);

		if (
			recentApps.data &&
			recentApps.data.length >= MAX_SUBMISSIONS_PER_WINDOW
		) {
			return NextResponse.json(
				{ error: "Demasiados intentos. Espera unos minutos." },
				{ status: 429 },
			);
		}

		const { data: activeApps } = await supabaseAdmin
			.from("recruitment_applications")
			.select("id")
			.eq("user_id", session.user.id)
			.in("status", [...ACTIVE_RECRUITMENT_STATUSES])
			.limit(1);

		if (activeApps && activeApps.length > 0) {
			return NextResponse.json(
				{ error: "Ya tienes una solicitud activa" },
				{ status: 400 },
			);
		}

		const { data: application, error: appError } = await supabaseAdmin
			.from("recruitment_applications")
			.insert({
				user_id: session.user.id,
				character_name: normalizedName,
				character_realm: normalizedRealm,
				character_class: selectedCharacter.class_id || null,
				character_spec: selectedCharacter.spec || null,
				status:
					simulate === true && authz.route.internalAdmin
						? "simulated"
						: "pending",
			})
			.select()
			.single();

		if (appError) {
			if (appError.code === "23505") {
				return NextResponse.json(
					{ error: "Ya tienes una solicitud activa" },
					{ status: 400 },
				);
			}

			throw appError;
		}

		if (answers && Object.keys(answers).length > 0) {
			const answersToInsert = sanitizedAnswers.map((item) => ({
				...item,
				application_id: application.id,
			}));

			const { error: ansError } = await supabaseAdmin
				.from("application_answers")
				.insert(answersToInsert);

			if (ansError) {
				await supabaseAdmin
					.from("recruitment_applications")
					.delete()
					.eq("id", application.id);

				throw new Error(
					"No se pudieron guardar las respuestas. Solicitud cancelada.",
				);
			}
		}

		if (application.status !== "simulated") {
			const notifyRes = await fetch(
				new URL("/api/discord/notify-apply", req.url),
				{
					method: "POST",
					cache: "no-store",
					headers: {
						"Content-Type": "application/json",
						cookie: req.headers.get("cookie") || "",
					},
					body: JSON.stringify({
						application_id: application.id,
						channel_id: discord_channel_id,
					}),
				},
			);

			if (!notifyRes.ok) {
				const notifyText = await notifyRes.text().catch(() => "");
				console.error("Discord notify failed:", notifyRes.status, notifyText);
			}
		}

		if (application.status !== "simulated") {
			const applicantDiscordUserId = await resolveDiscordUserIdForApplication(
				application.id,
			);

			if (applicantDiscordUserId) {
				void publishRecruitmentBotEvent({
					type: "recruitment.application.created",
					applicationId: application.id,
					applicantDiscordUserId,
					characterName: normalizedName,
					characterRealm: normalizedRealm,
					status: application.status,
				});
			}
		}

		return NextResponse.json({ success: true, application });
	} catch (error) {
		console.error("API Submit Apply Error:", error);
		return apiErrorResponse(error);
	}
}
