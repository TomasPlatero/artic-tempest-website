import { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";

import { cookies, headers } from "next/headers";
import { getCachedServerSession } from "@/shared/auth/get-cached-server-session";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import { getAuthzSnapshot } from "@/shared/auth/authz";
import { getAppPermission } from "@/shared/auth/permissions";
import { desktopZonaRaiderTourSteps } from "@/domains/zona-raider/components/zona-raider-tour.config";
import RaiderNormativePage from "./normativa-raider/page";
import { ZonaRaiderLayoutClient } from "./zona-raider-layout-client";
import { Forbidden } from "@/shared/components/forbidden";
import { getRaiderRulesStatus } from "@/shared/lib/raider-rules.server";
import { PageFallback } from "@/shared/ui/skeletons";

export const metadata: Metadata = {
	title: "Zona Raider | Artic Tempest",
	robots: {
		index: false,
		follow: false,
	},
};

type RaiderRulesStatus = Awaited<ReturnType<typeof getRaiderRulesStatus>>;

function isRaiderBotUnavailable(status: RaiderRulesStatus) {
	return (
		!status.discordHasVerifiedRole &&
		(!status.discordIntegrationReady ||
			Boolean(status.discordRoleError) ||
			Boolean(status.discordVerificationError) ||
			Boolean(status.acceptedAt && status.discordRoleStatus !== "assigned"))
	);
}

function needsNormativeAcceptance(status: RaiderRulesStatus) {
	return status.discordRoleError === "debug" || !status.discordHasVerifiedRole;
}

async function resolveTourViewableAppIds(roleLevel: string): Promise<string[]> {
	const appIds = [
		...new Set(
			desktopZonaRaiderTourSteps.flatMap((s) => (s.appId ? [s.appId] : [])),
		),
	];

	const permissions = await Promise.all(
		appIds.map(async (appId) => {
			const { canView } = await getAppPermission(roleLevel, appId);
			return canView ? appId : null;
		}),
	);

	return permissions.filter((appId): appId is string => appId !== null);
}

function resolveOnboardingStatus({
	profile,
	charactersCount,
	resolvedMainCharacterId,
}: {
	profile: {
		battlenet_battletag?: string | null;
		battlenet_id?: string | null;
	} | null;
	charactersCount: number;
	resolvedMainCharacterId: string | null;
}) {
	const isBnetLinked = Boolean(
		profile?.battlenet_id || profile?.battlenet_battletag,
	);

	return {
		isBnetLinked,
		charactersCount,
		hasMainCharacter: Boolean(resolvedMainCharacterId),
		isBattleNetReady: isBnetLinked,
	};
}

export default async function ZonaRaiderLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await getCachedServerSession();
	if (!session) redirect("/login?redirectPath=/zona-raider");

	const requestHeaders = await headers();
	const pathname = requestHeaders.get("x-pathname") ?? "/zona-raider";

	if (pathname === "/zona-raider/error") {
		return <>{children}</>;
	}

	const snapshot = await getAuthzSnapshot(session);
	if (!snapshot.route.zonaRaider && !snapshot.route.internalAdmin) {
		return (
			<div className="w-full max-w-full p-6 lg:px-8">
				<Forbidden />
			</div>
		);
	}

	const roleLevel = snapshot.roleSlug ?? session.user?.roleLevel ?? "member";

	const getCachedRaiderRulesStatus = unstable_cache(
		async (id: string) => getRaiderRulesStatus(id),
		["raider-rules-status"],
		{ revalidate: 300 },
	);

	// ── Queries rápidas (Supabase, ~10-20ms) que corren en paralelo con Discord ──
	const [
		tourViewableAppIds,
		{ data: tourSettings },
		{ data: profile },
		{ data: characters },
		raiderRulesStatus,
	] = await Promise.all([
		resolveTourViewableAppIds(roleLevel),
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
		getCachedRaiderRulesStatus(session.user.id),
	]);

	const raiderBotUnavailable = isRaiderBotUnavailable(raiderRulesStatus);

	if (raiderBotUnavailable) {
		redirect("/zona-raider/error");
	}

	if (needsNormativeAcceptance(raiderRulesStatus)) {
		return (
			<div className="min-h-dvh w-full bg-[#020203] py-6 md:py-8">
				<div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8">
					<RaiderNormativePage />
				</div>
			</div>
		);
	}

	const tourEnabled = tourSettings?.tour_enabled ?? true;

	const cookieStore = await cookies();
	const cookieMainCharacterId =
		cookieStore.get("artic-tempest-main-character-id")?.value ?? null;
	const resolvedMainCharacterId =
		profile?.main_character_id || cookieMainCharacterId || null;

	const onboardingStatus = resolveOnboardingStatus({
		profile,
		charactersCount: characters?.length ?? 0,
		resolvedMainCharacterId,
	});

	return (
		<Suspense fallback={<PageFallback />}>
			<ZonaRaiderLayoutClient
				onboardingStatus={onboardingStatus}
				tourViewableAppIds={tourViewableAppIds}
				tourEnabled={tourEnabled}
			>
				{children}
			</ZonaRaiderLayoutClient>
		</Suspense>
	);
}
