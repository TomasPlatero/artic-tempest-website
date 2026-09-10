"use client";

import { useState, useSyncExternalStore } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { cn } from "@/shared/tailwind/tailwind-utils";

import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	TooltipProvider,
} from "@/shared/ui/tooltip";

import { IconUser, IconHome2, IconFileSearch, IconArticle, IconChartBar, IconBrandTwitch, IconBook } from "@/shared/ui/tabler-icons";

import { useApiQuery } from "@/shared/hooks/use-api-query";

import {
	getScrollBehavior,
	usePrefersReducedMotion,
} from "@/shared/lib/use-prefers-reduced-motion";
import {
	getRoleBadgeStyle,
	getRoleRingStyle,
	resolveRoleColorFromMe,
} from "@/shared/lib/role-color-styles";
import { DEFAULT_PUBLIC_LOGO } from "@/shared/guild/guild-constants";
import { LandingNavActions } from "./landing-nav-actions";
import { resolveApplyCta, resolveRoleRingStyle } from "./landing-nav-view-state";
import type { ApplyCta } from "./landing-nav-view-state";
import { LandingNavMainSection } from "./landing-nav-main-section";
import { NAV_LINKS, SessionData } from "./landing-nav-view-state";

type MePayload = {
	role?: string;
	roleColor?: string | null;
};


function resolveInitialApplyStatus(initialApplyStatus: string | null | undefined) {
	return initialApplyStatus ?? null;
}

function resolveUserRole(session: SessionData | null) {
	return session?.user?.roleLevel?.toLowerCase() || "";
}

function resolveDisplayRole(
	meData: MePayload | null | undefined,
	session: SessionData | null,
) {
	return meData?.role ?? session?.user?.roleLevel;
}

function resolveCanSeeZonaRaider(session: SessionData | null) {
	return session?.user?.roleFlags?.canAccessZonaRaider ?? false;
}

type RecruitmentData = { count: number; applicantMessageCount: number } | null | undefined;

function resolveRecruitmentCountKey(canSeeRecruitmentBadge: boolean) {
	return canSeeRecruitmentBadge ? "/api/recruitment/count" : null;
}

function resolveRecruitmentCount(
	canSeeRecruitmentBadge: boolean,
	recruitmentData: RecruitmentData,
) {
	return canSeeRecruitmentBadge ? (recruitmentData?.count ?? 0) : 0;
}

function resolveHasApplicantMessages(
	canSeeRecruitmentBadge: boolean,
	recruitmentData: RecruitmentData,
) {
	return canSeeRecruitmentBadge && (recruitmentData?.applicantMessageCount ?? 0) > 0;
}

function resolveHasLiveStreamer(streamers: { is_live: boolean }[] | null | undefined) {
	return Array.isArray(streamers) && streamers.some((s) => s.is_live);
}

function resolveEffectiveSectionId(activeSectionId: string | null | undefined) {
	return activeSectionId ?? null;
}

function resolveApplyIcon(applyCta: ApplyCta) {
	return applyCta?.icon ?? IconFileSearch;
}





function LandingNavigation(props: {
	showApplyReminder?: boolean;
	initialApplyStatus?: any;
	activeSectionId?: string;
	heroVisible?: boolean;
	heroScrollProgress?: number;
	publicLogoUrl?: string | null;
}) {
	return useLandingNavigation(props as any);
}

export { LandingNavigation };

function useLandingNavigation({
	showApplyReminder = false,
	initialApplyStatus,
	activeSectionId,
	heroVisible = false,
	heroScrollProgress = 0,
	publicLogoUrl,
}: {
	showApplyReminder?: boolean;
	initialApplyStatus?: string | null;
	activeSectionId?: string | null;
	heroVisible?: boolean;
	heroScrollProgress?: number;
	publicLogoUrl?: string | null;
} = {}) {
	const { data: session } = useSession();
	const pathname = usePathname();
	const router = useRouter();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [applyStatus, _setApplyStatus] = useState<string | null>(
		() => resolveInitialApplyStatus(initialApplyStatus),
	);
	const userRole = resolveUserRole(session);
	const { data: meData } = useApiQuery<MePayload>(
		session ? ["/api/me", { credentials: "include", cache: "no-store" }] : null,
	);
	const roleColor = resolveRoleColorFromMe({
		meRoleColor: meData?.roleColor,
		sessionRoleColor: session?.user?.roleColor,
	});
	const displayRole = resolveDisplayRole(meData, session);
	const ringStyle = resolveRoleRingStyle(roleColor);
	const roleAvatarRingStyle = getRoleRingStyle(roleColor);
	const roleBadgeStyle = getRoleBadgeStyle(roleColor);
	const canSeeRecruitmentBadge = ["officer", "gm"].includes(userRole);
	const canSeeZonaRaider = resolveCanSeeZonaRaider(session);

	const { data: streamers } = useApiQuery<any[]>("/api/streamers", {
		refreshInterval: 5 * 60 * 1000,
	});
	const { data: recruitmentData } = useApiQuery<{
		count: number;
		applicantMessageCount: number;
	}>(resolveRecruitmentCountKey(canSeeRecruitmentBadge), {
		refreshInterval: 2 * 60 * 1000,
	});

	const recruitmentCount = resolveRecruitmentCount(canSeeRecruitmentBadge, recruitmentData);
	const hasApplicantMessages = resolveHasApplicantMessages(canSeeRecruitmentBadge, recruitmentData);
	const hasLiveStreamer = resolveHasLiveStreamer(streamers);

	const clampedHeroProgress = Math.min(Math.max(heroScrollProgress, 0), 1);
	const prefersReducedMotion = usePrefersReducedMotion();

	const effectiveSectionId = resolveEffectiveSectionId(activeSectionId);

	const handleHomeClick = () => {
		setMobileMenuOpen(false);

		if (pathname !== "/") {
			router.push("/");
			return;
		}

		window.scrollTo({
			top: 0,
			behavior: getScrollBehavior(prefersReducedMotion),
		});
	};

	const isNavLinkActive = (href: string, sectionId?: string) => {
		if (sectionId) return pathname === "/" && effectiveSectionId === sectionId;
		if (href === "/") return pathname === "/" && effectiveSectionId === null;
		return pathname === href || pathname.startsWith(`${href}/`);
	};

	const handleSectionClick = (sectionId: string) => {
		setMobileMenuOpen(false);

		if (pathname !== "/") {
			sessionStorage.setItem("landing-scroll-target", sectionId);
			router.push("/");
			return;
		}

		document
			.getElementById(sectionId)
			?.scrollIntoView({ behavior: getScrollBehavior(prefersReducedMotion) });
	};

	const applyCta = resolveApplyCta({ showApplyReminder, applyStatus, session });
	const ApplyIcon = resolveApplyIcon(applyCta);

	const mounted = useSyncExternalStore(
		() => () => {},
		() => true,
		() => false,
	);

	if (!mounted) {
		return (
			<div className="fixed top-0 left-0 right-0 z-50">
				<nav className="bg-zinc-950/50 backdrop-blur-md border-b border-white/10 h-16" />
			</div>
		);
	}

	return (
		<div className="fixed top-0 left-0 right-0 z-50 space-y-0 pointer-events-none">
			<nav
				className="bg-zinc-950/80 backdrop-blur-md border-b border-white/10 dark pointer-events-auto"
				aria-label="Navegación principal"
			>
				<div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 md:px-6">
					<LandingNavMainSection
						ApplyIcon={ApplyIcon}
						applyCta={applyCta}
						canSeeZonaRaider={canSeeZonaRaider}
						handleHomeClick={handleHomeClick}
						handleSectionClick={handleSectionClick}
						hasLiveStreamer={hasLiveStreamer}
						heroVisible={heroVisible}
						mobileMenuOpen={mobileMenuOpen}
						publicLogoUrl={publicLogoUrl}
						session={session}
						setMobileMenuOpen={setMobileMenuOpen}
					/>

					<LandingNavActions
						canSeeRecruitmentBadge={canSeeRecruitmentBadge}
						canSeeZonaRaider={canSeeZonaRaider}
						displayRole={displayRole}
						hasApplicantMessages={hasApplicantMessages}
						recruitmentCount={recruitmentCount}
						ringStyle={ringStyle}
						roleAvatarRingStyle={roleAvatarRingStyle}
						roleBadgeStyle={roleBadgeStyle}
						session={session}
					/>

					<Link
						href="/"
						className={cn(
							"absolute left-1/2 top-0 z-10 h-16 -translate-x-1/2 items-center justify-center  ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
							heroVisible
								? "hidden lg:flex pointer-events-none opacity-0 -translate-y-2 scale-95 blur-sm"
								: "flex pointer-events-auto opacity-100 translate-y-0 scale-100 blur-0",
						)}
						aria-label="Ir a inicio"
					>
						<div
							className="relative h-9 w-[min(46vw,13rem)] transition-[transform,opacity] duration-300 ease-out md:h-12 md:w-64"
							style={{
								transform: `scale(${0.9 + clampedHeroProgress * 0.1})`,
								opacity: 0.85 + clampedHeroProgress * 0.15,
							}}
						>
							<Image
								src={publicLogoUrl || DEFAULT_PUBLIC_LOGO}
								alt="Artic Tempest Logo"
								width={512}
								height={128}
								className="absolute inset-0 size-full object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.6)]"
								sizes="(max-width: 768px) 180px, 256px"
								priority
							/>
						</div>
					</Link>
				</div>

				<div
					className={cn(
						"hidden h-11 border-t border-white/20 bg-zinc-950/70 backdrop-blur-md  ease-out lg:block",
						heroVisible ? "opacity-80" : "opacity-100",
					)}
				>
					<div className="mx-auto flex h-full max-w-7xl items-center justify-center gap-5 px-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500 motion-reduce:animate-none md:px-6">
						{NAV_LINKS.map((link, index) => (
							<div
								key={`secondary-${link.href}-${link.sectionId ?? "root"}`}
								className={cn(
									"flex items-center gap-5 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300 motion-reduce:animate-none",
									index < 3
										? "motion-safe:animate-delay-75"
										: "motion-safe:animate-delay-150",
								)}
							>
								<TooltipProvider delayDuration={300}>
									<Tooltip>
										<TooltipTrigger asChild>
											{link.sectionId ? (
												<button
													type="button"
													onClick={() => handleSectionClick(link.sectionId!)}
													className={cn(
														"group relative inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors focus-visible:outline-2 focus-visible:outline-blue-400 focus-visible:outline-offset-2",
														isNavLinkActive(link.href, link.sectionId)
															? "text-cyan-300"
															: "text-white/80 hover:text-cyan-300",
													)}
													{...(isNavLinkActive(link.href, link.sectionId)
														? { "aria-current": "page" as const }
														: {})}
												>
													{link.label === "Inicio" && (
														<IconHome2 className="size-3.5" />
													)}
													{link.label === "Noticias" && (
														<IconArticle className="size-3.5" />
													)}
													{link.label === "Progreso" && (
														<IconChartBar className="size-3.5" />
													)}
													{link.label === "Reclutamiento" && (
														<IconUser className="size-3.5" />
													)}
													{link.label === "Streamers" && (
														<IconBrandTwitch className="size-3.5" />
													)}
													{link.label === "Historia y Cultura" && (
														<IconBook className="size-3.5" />
													)}
													{link.label}
													{link.label === "Streamers" && hasLiveStreamer && (
														<span className="relative ml-0.5 flex size-2">
															<span className="absolute inline-flex size-2 animate-ping rounded-full bg-red-400 opacity-75" />
															<span className="relative inline-flex size-2 rounded-full bg-red-500" />
														</span>
													)}
												</button>
											) : link.label === "Inicio" ? (
												<button
													type="button"
													onClick={handleHomeClick}
													className={cn(
														"group relative inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors focus-visible:outline-2 focus-visible:outline-blue-400 focus-visible:outline-offset-2",
														isNavLinkActive(link.href)
															? "text-cyan-300"
															: "text-white/80 hover:text-cyan-300",
													)}
													{...(isNavLinkActive(link.href)
														? { "aria-current": "page" as const }
														: {})}
												>
													<IconHome2 className="size-3.5" />
													{link.label}
												</button>
											) : (
												<Link
													href={link.href}
													className={cn(
														"group relative inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors focus-visible:outline-2 focus-visible:outline-blue-400 focus-visible:outline-offset-2",
														isNavLinkActive(link.href)
															? "text-cyan-300"
															: "text-white/80 hover:text-cyan-300",
													)}
													{...(isNavLinkActive(link.href)
														? { "aria-current": "page" as const }
														: {})}
												>
													{link.label === "Inicio" && (
														<IconHome2 className="size-3.5" />
													)}
													{link.label === "Noticias" && (
														<IconArticle className="size-3.5" />
													)}
													{link.label === "Progreso" && (
														<IconChartBar className="size-3.5" />
													)}
													{link.label === "Reclutamiento" && (
														<IconUser className="size-3.5" />
													)}
													{link.label === "Streamers" && (
														<IconBrandTwitch className="size-3.5" />
													)}
													{link.label === "Historia y Cultura" && (
														<IconBook className="size-3.5" />
													)}
													{link.label}
												</Link>
											)}
										</TooltipTrigger>
										<TooltipContent side="bottom" sideOffset={4}>
											{link.title}
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
								{index < NAV_LINKS.length - 1 && (
									<span
										aria-hidden="true"
										className="size-1 rounded-full bg-white/20"
									/>
								)}
							</div>
						))}
					</div>
				</div>
			</nav>
		</div>
	);
}
