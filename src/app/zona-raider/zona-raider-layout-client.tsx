"use client";

import * as React from "react";
import Link from "next/link";
import { SidebarProvider } from "@/shared/components/sidebar";
import { ZonaRaiderTopNav } from "@/shared/layout/zona-raider-top-nav";
import { AppSidebar } from "@/shared/layout/app-sidebar";
import { useSession } from "next-auth/react";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { redirect } from "next/navigation";
import { usePathname } from "next/navigation";
import { PresenceHeartbeat } from "@/shared/components/presence-heartbeat";
import { useApiQuery } from "@/shared/hooks/use-api-query";
import { ZonaRaiderTourEngine } from "@/domains/zona-raider/components/zona-raider-tour-engine";
import { RaiderTourOnboarding } from "@/domains/zona-raider/components/raider-tour-onboarding";
import { ZonaRaiderTourCharacterImage } from "@/domains/zona-raider/components/zona-raider-tour-character-image";
import { RAIDER_PAGE_FADE_IN_CLASSES } from "@/shared/components/raider-motion";
import { Season2Banner } from "@/domains/zona-raider/raider-hub/season-2-banner";

type OnboardingStatus = {
	isBnetLinked: boolean;
	charactersCount: number;
	hasMainCharacter: boolean;
	isBattleNetReady: boolean;
};

function ZonaRaiderLayoutClientContent({
	children,
	onboardingStatus: serverOnboardingStatus,
	tourViewableAppIds: serverTourViewableAppIds,
	tourEnabled: serverTourEnabled,
}: {
	children: React.ReactNode;
	onboardingStatus: OnboardingStatus;
	tourViewableAppIds?: string[];
	tourEnabled?: boolean;
}) {
	const { data: session, status } = useSession();
	const { data: guildInfo } = useApiQuery<{
		name?: string | null;
		icon_url?: string | null;
	}>(status === "authenticated" ? "/api/guild/info" : null, {
		refreshInterval: 10 * 60 * 1000,
	});

	const isMobile = useIsMobile();
	const pathname = usePathname();
	const roleLevel = session?.user?.roleLevel?.toLowerCase() ?? "member";
	const [showTourPrompt, setShowTourPrompt] = React.useState(false);

	React.useEffect(() => {
		if (typeof window === "undefined") return;
		// react-doctor-disable-next-line
		setShowTourPrompt(
			new URLSearchParams(window.location.search).get("tourPrompt") === "1",
		);
	}, []);

	// Datos resueltos en servidor — no hay flash
	const onboardingStatus = serverOnboardingStatus;
	const tourViewableAppIds = serverTourViewableAppIds ?? [];
	const tourEnabledFromDB = serverTourEnabled ?? true;

	const needsBattleNetLink = !onboardingStatus.isBnetLinked;
	const needsCharacters = onboardingStatus.charactersCount === 0;
	const needsAccountSetup = needsBattleNetLink || needsCharacters;
	const isAccountPage = pathname === "/zona-raider/cuenta";

	if (status === "loading") return null;
	if (status === "unauthenticated") {
		redirect("/");
	}

	return (
		<SidebarProvider>
			<div className="relative flex min-h-dvh w-full bg-[#020203] overflow-hidden">
				{/* Premium Background Layers */}
				<div
					className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-[0.25] pointer-events-none"
					style={{
						backgroundImage: 'url("/assets/images/midnight-battle.webp")',
					}}
				/>
				<div className="fixed inset-0 z-0 bg-linear-to-t from-[#020203] via-[#020203]/40 to-transparent pointer-events-none" />
				<div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.15),transparent)] pointer-events-none hidden desktop:block" />

				{isMobile && <AppSidebar />}

				<div className="relative z-10 flex flex-1 flex-col overflow-hidden">
					{session?.user?.id && <PresenceHeartbeat userId={session.user.id} />}
					<ZonaRaiderTopNav
						guildName={guildInfo?.name || "Artic Tempest"}
						iconUrl={guildInfo?.icon_url || null}
					/>
					{!needsAccountSetup && (
						<ZonaRaiderTourEngine
							enabled={!isMobile && tourEnabledFromDB}
							roleLevel={roleLevel}
							allowAutoStart={!showTourPrompt}
							viewableAppIds={tourViewableAppIds}
						/>
					)}
					{!needsAccountSetup && <RaiderTourOnboarding enabled={!isMobile} />}
					{needsAccountSetup && !isAccountPage && (
						<div className="fixed inset-0 z-[90] flex items-center justify-center bg-zinc-950/75 px-4 backdrop-blur-[2px]">
							<div className="w-full max-w-2xl rounded-3xl border border-rose-500/20 bg-[#0d1220] p-6 text-white shadow-2xl shadow-black/60">
								<div className="space-y-4">
									<div>
										<p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-rose-300/80">
											Obligatorio
										</p>
										<h2 className="mt-2 text-2xl font-semibold uppercase tracking-tight">
											Vincula Battle.net
										</h2>
										<p className="mt-3 text-sm leading-relaxed text-white/65">
											Debes vincular tu cuenta de Battle.net antes de seguir
											navegando por la Zona Raider.
										</p>
									</div>

									<div className="grid gap-4 sm:grid-cols-[160px_1fr] sm:items-center rounded-3xl border border-white/10 bg-white/[0.03] p-3">
										<ZonaRaiderTourCharacterImage
											src="/assets/images/tour/gnome-talking.webp"
											alt="Gnomito del tour"
											className="h-[160px]"
										/>
										<div className="space-y-2">
											<p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-300/70">
												Zona Raider
											</p>
											<p className="text-sm leading-relaxed text-white/70">
												Sin Battle.net vinculado no podrás seguir.
											</p>
										</div>
									</div>

									<div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-white/70">
										Ve a tu cuenta y completa la vinculación antes de volver
										aquí.
									</div>

									<div className="flex flex-wrap gap-3 justify-end">
										<Link
											href="/zona-raider/cuenta"
											className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold uppercase tracking-widest text-black transition-colors hover:bg-white/90"
										>
											Ir a Cuenta
										</Link>
									</div>
								</div>
							</div>
						</div>
					)}
					{needsAccountSetup && isAccountPage && (
						<div className="mx-auto mb-4 max-w-[1600px] px-4 md:px-6">
							<div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm leading-relaxed text-rose-100 shadow-lg shadow-black/20">
								<strong className="uppercase tracking-wide">
									Obligatorio:
								</strong>{" "}
								revisa que tu Battle.net esté vinculado. Si ya lo tienes, entra
								en la cuenta y marca tu personaje principal si todavía no lo has
								hecho.
							</div>
						</div>
					)}
					{!needsAccountSetup &&
						!pathname.startsWith("/zona-raider/roster") && <Season2Banner />}
					<main
						id="main-content"
						className={`flex-1 overflow-y-auto ${RAIDER_PAGE_FADE_IN_CLASSES}`}
					>
						<div className="mx-auto max-w-[1600px] w-full px-4 md:px-6 py-6 ease-in-out">
							{children}
						</div>
					</main>
				</div>
			</div>
		</SidebarProvider>
	);
}

export function ZonaRaiderLayoutClient({
	children,
	onboardingStatus,
	tourViewableAppIds,
	tourEnabled,
}: {
	children: React.ReactNode;
	onboardingStatus: OnboardingStatus;
	tourViewableAppIds?: string[];
	tourEnabled?: boolean;
}) {
	return (
		<React.Suspense fallback={null}>
			<ZonaRaiderLayoutClientContent
				onboardingStatus={onboardingStatus}
				tourViewableAppIds={tourViewableAppIds}
				tourEnabled={tourEnabled}
			>
				{children}
			</ZonaRaiderLayoutClientContent>
		</React.Suspense>
	);
}
