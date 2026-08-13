import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getAuthzSnapshot } from "@/shared/auth/authz";
import { apiErrorResponse } from "@/shared/api/errors";
import { submitApplicationCore } from "@/shared/lib/recruitment/submit-core";

export const dynamic = "force-dynamic";

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

		const authz = await getAuthzSnapshot(session);

		const result = await submitApplicationCore({
			userId: session.user.id,
			selectedChar: parsed.data.selectedChar,
			answers: parsed.data.answers,
			simulate: parsed.data.simulate,
			discordChannelId: parsed.data.discord_channel_id,
			internalAdmin: authz.route.internalAdmin,
		});

		if (!result.ok) {
			return NextResponse.json(
				{ error: result.error },
				{ status: result.status },
			);
		}

		return NextResponse.json({
			success: true,
			application: result.application,
		});
	} catch (error) {
		console.error("API Submit Apply Error:", error);
		return apiErrorResponse(error);
	}
}
