import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import { getCachedServerSession } from "@/shared/auth/get-cached-server-session";
import { cookies } from "next/headers";
import { getAppPermission } from "@/shared/auth/permissions";
import { desktopZonaRaiderTourSteps } from "@/domains/zona-raider/components/zona-raider-tour.config";

export async function GET() {
	const session = await getCachedServerSession();
	if (!session) {
		return NextResponse.json({ onboardingStatus: null }, { status: 401 });
	}

	const roleLevel = session.user?.roleLevel ?? "member";

	const [
		tourGatedAppIds,
		{ data: tourSettings },
		{ data: profile },
		{ data: characters },
		cookieStore,
	] = await Promise.all([
		Promise.all(
			[
				...new Set(
					desktopZonaRaiderTourSteps.flatMap((s) => (s.appId ? [s.appId] : [])),
				),
			].map(async (appId) => {
				const { canView } = await getAppPermission(roleLevel, appId);
				return canView ? appId : null;
			}),
		),
		supabaseAdmin
			.from("settings")
			.select("tour_enabled")
			.eq("id", 1)
			.maybeSingle(),
		supabaseAdmin
			.from("profiles")
			.select("battlenet_battletag, battlenet_id, main_character_id")
			.eq("user_id", session.user.id)
			.maybeSingle(),
		supabaseAdmin
			.from("bnet_characters")
			.select("id, name, realm_slug")
			.eq("user_id", session.user.id),
		cookies(),
	]);

	const tourViewableAppIds: string[] = tourGatedAppIds.filter(
		Boolean,
	) as string[];
	const tourEnabled = tourSettings?.tour_enabled ?? true;

	const cookieMainCharacterId =
		cookieStore.get("artic-tempest-main-character-id")?.value ?? null;

	const resolvedMainCharacterId =
		profile?.main_character_id || cookieMainCharacterId || null;

	return NextResponse.json({
		onboardingStatus: {
			isBnetLinked: Boolean(
				profile?.battlenet_id || profile?.battlenet_battletag,
			),
			charactersCount: characters?.length ?? 0,
			hasMainCharacter: Boolean(resolvedMainCharacterId),
			isBattleNetReady: Boolean(
				profile?.battlenet_id || profile?.battlenet_battletag,
			),
		},
		tourViewableAppIds,
		tourEnabled,
	});
}
