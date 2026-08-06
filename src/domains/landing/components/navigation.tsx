"use client";

import { useState, useSyncExternalStore } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/tailwind/tailwind-utils";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
} from "@/shared/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	TooltipProvider,
} from "@/shared/ui/tooltip";
import {
	Sheet,
	SheetContent,
	SheetTrigger,
	SheetHeader,
	SheetTitle,
} from "@/shared/ui/sheet";
import {
	IconUser,
	IconHome2,
	IconLogout,
	IconMenu2,
	IconChevronRight,
	IconFileSearch,
	IconMessageCircle,
	IconArticle,
	IconChartBar,
	IconShieldCheck,
	IconLogin2,
	IconUserPlus,
	IconBrandTwitch,
	IconBook,
} from "@/shared/ui/tabler-icons";
import { NotificationBell } from "@/domains/notifications/components/notification-bell";
import { useApiQuery } from "@/shared/hooks/use-api-query";
import { isActiveRecruitmentStatus } from "@/domains/recruitment/lib/application-status";
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

function RecruitmentBadge({
	canSeeRecruitmentBadge,
	recruitmentCount,
	hasApplicantMessages,
}: {
	canSeeRecruitmentBadge: boolean;
	recruitmentCount: number;
	hasApplicantMessages: boolean;
}) {
	if (!canSeeRecruitmentBadge) return null;

	const badge = (
		<span className="relative inline-flex">
			<span
				className={cn(
					"inline-flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-md border bg-zinc-950 px-2 text-[11px] font-semibold text-white shadow-[0_0_0_1px_rgba(239,68,68,0.15)] transition-opacity",
					recruitmentCount > 0
						? "border-red-500/60 opacity-100"
						: "border-white/15 opacity-45",
				)}
			>
				<IconUserPlus className="size-3.5 text-white" />
				<span>{recruitmentCount}</span>
			</span>
			{hasApplicantMessages && (
				<span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border border-zinc-950 bg-red-500 shadow-[0_0_0_2px_rgba(0,0,0,0.8)] motion-safe:animate-pulse" />
			)}
		</span>
	);

	if (recruitmentCount > 0) {
		return (
			<TooltipProvider delayDuration={300}>
				<Tooltip>
					<TooltipTrigger asChild>{badge}</TooltipTrigger>
					<TooltipContent sideOffset={4}>
						Hay {recruitmentCount} aplicaciones activas
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		);
	}

	return badge;
}

type MePayload = {
	role?: string;
	roleColor?: string | null;
};

const NAV_LINKS = [
	{ href: "/", label: "Inicio", title: "Inicio de Artic Tempest" },
	{
		href: "/",
		label: "Noticias",
		title: "Consulta las últimas novedades de la hermandad",
		sectionId: "noticias",
	},
	{
		href: "/",
		label: "Reclutamiento",
		title: "Mira las clases que necesitamos en Artic Tempest",
		sectionId: "reclutamiento",
	},
	{
		href: "/",
		label: "Progreso",
		title: "Consulta nuestro progreso en Midnight",
		sectionId: "progreso",
	},
	{
		href: "/",
		label: "Streamers",
		title: "Sigue en directo a nuestros creadores de contenido",
		sectionId: "streamers",
	},
	{
		href: "/",
		label: "Historia y Cultura",
		title: "Conoce la trayectoria de nuestra hermandad",
		sectionId: "historia",
	},
];

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
		initialApplyStatus ?? null,
	);
	const userRole = session?.user?.roleLevel?.toLowerCase() || "";
	const { data: meData } = useApiQuery<MePayload>(
		session ? ["/api/me", { credentials: "include", cache: "no-store" }] : null,
	);
	const roleColor = resolveRoleColorFromMe({
		meRoleColor: meData?.roleColor,
		sessionRoleColor: session?.user?.roleColor,
	});
	const displayRole = meData?.role ?? session?.user?.roleLevel;
	const ringStyle = roleColor
		? { backgroundColor: roleColor, boxShadow: `0 0 10px ${roleColor}66` }
		: undefined;
	const roleAvatarRingStyle = getRoleRingStyle(roleColor);
	const roleBadgeStyle = getRoleBadgeStyle(roleColor);
	const canSeeRecruitmentBadge = ["officer", "gm"].includes(userRole);
	const canSeeZonaRaider =
		session?.user?.roleFlags?.canAccessZonaRaider ?? false;

	const { data: streamers } = useApiQuery<any[]>("/api/streamers", {
		refreshInterval: 5 * 60 * 1000,
	});
	const { data: recruitmentData } = useApiQuery<{
		count: number;
		applicantMessageCount: number;
	}>(canSeeRecruitmentBadge ? "/api/recruitment/count" : null, {
		refreshInterval: 2 * 60 * 1000,
	});

	const recruitmentCount = canSeeRecruitmentBadge
		? (recruitmentData?.count ?? 0)
		: 0;
	const hasApplicantMessages =
		canSeeRecruitmentBadge && (recruitmentData?.applicantMessageCount ?? 0) > 0;
	const hasLiveStreamer =
		Array.isArray(streamers) && streamers.some((s) => s.is_live);

	const clampedHeroProgress = Math.min(Math.max(heroScrollProgress, 0), 1);
	const prefersReducedMotion = usePrefersReducedMotion();

	const effectiveSectionId = activeSectionId ?? null;

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

	const applyCta = (() => {
		if (
			!showApplyReminder ||
			!session ||
			!isActiveRecruitmentStatus(applyStatus)
		) {
			return null;
		}

		const isInterview = applyStatus === "interview";
		const theme =
			applyStatus === "pending"
				? {
						accent: "from-blue-500/20 to-blue-600/10 border-blue-400/25",
						chip: "bg-blue-400/10 text-blue-100 border-blue-300/20",
						label: "text-blue-300",
					}
				: applyStatus === "reviewing"
					? {
							accent:
								"from-purple-500/22 to-purple-600/10 border-purple-400/25",
							chip: "bg-purple-400/10 text-purple-100 border-purple-300/20",
							label: "text-purple-300",
						}
					: applyStatus === "interview"
						? {
								accent:
									"from-orange-500/22 to-orange-600/10 border-orange-400/25",
								chip: "bg-orange-400/10 text-orange-100 border-orange-300/20",
								label: "text-orange-300",
							}
						: {
								accent: "from-cyan-500/20 to-blue-500/10 border-cyan-400/25",
								chip: "bg-cyan-400/10 text-cyan-100 border-cyan-300/20",
								label: "text-cyan-300",
							};
		const statusLabel =
			applyStatus === "reviewing"
				? "En Revisión"
				: applyStatus === "interview"
					? "Entrevista"
					: applyStatus === "simulated"
						? "Simulado"
						: applyStatus === "pending"
							? "Nuevo"
							: "Activo";

		return {
			href: isInterview
				? "/reclutamiento/apply-en-curso/chat"
				: "/reclutamiento/apply-en-curso",
			mainHref: "/reclutamiento/apply-en-curso",
			title: isInterview ? "Chatear ahora" : "Revisar mi Apply",
			label: isInterview ? "Chatear ahora" : "Revisar mi Apply",
			subtitle: statusLabel,
			icon: isInterview ? IconMessageCircle : IconFileSearch,
			actionLabel: isInterview ? "Chatear ahora" : null,
			actionHref: isInterview ? "/reclutamiento/apply-en-curso/chat" : null,
			accent: theme.accent,
			badge: theme.chip,
			labelClass: theme.label,
		};
	})();
	const ApplyIcon = applyCta?.icon ?? IconFileSearch;

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
					<div className="relative z-20 flex min-w-0 items-center gap-3">
						{/* Botón de Menú Mobile */}
						<Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
							<SheetTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className={cn(
										"lg:hidden size-10 text-white/90 hover:text-white hover:bg-white/5 transition-colors -ml-2",
										applyCta && "lg:flex xl:hidden",
									)}
									aria-label={
										mobileMenuOpen
											? "Cerrar menú de navegación"
											: "Abrir menú de navegación"
									}
								>
									<IconMenu2 className="size-6" />
								</Button>
							</SheetTrigger>
							<SheetContent
								side="left"
								className="bg-zinc-950/95 backdrop-blur-xl border-white/10 p-0 text-white w-[300px]"
							>
								<SheetHeader className="p-6 border-b border-white/5">
									<SheetTitle className="text-left">
										<div className="relative h-8 w-32">
											<Image
												src={publicLogoUrl || DEFAULT_PUBLIC_LOGO}
												alt="Artic Tempest Logo"
												width={512}
												height={128}
												className="absolute inset-0 size-full object-contain"
												sizes="128px"
											/>
										</div>
									</SheetTitle>
								</SheetHeader>
								<div className="p-4 flex flex-col gap-2 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300 motion-reduce:animate-none">
									{NAV_LINKS.map((link, index) => (
										<TooltipProvider
											key={link.href + (link.sectionId ?? link.label)}
											delayDuration={300}
										>
											<Tooltip>
												<TooltipTrigger asChild>
													{link.sectionId ? (
														<button
															type="button"
															onClick={() =>
																handleSectionClick(link.sectionId!)
															}
															className={cn(
																"group flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5  active:scale-[0.98] text-left motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300 motion-reduce:animate-none",
																index < 3
																	? "motion-safe:animate-delay-75"
																	: "motion-safe:animate-delay-150",
															)}
														>
															<div className="flex items-center gap-2">
																<span className="font-bold tracking-tight">
																	{link.label}
																</span>
																{link.label === "Streamers" &&
																	hasLiveStreamer && (
																		<span className="flex size-2 relative">
																			<span className="animate-ping absolute inline-flex size-full rounded-full bg-red-400 opacity-75"></span>
																			<span className="relative inline-flex rounded-full size-2 bg-red-500"></span>
																		</span>
																	)}
															</div>
															<IconChevronRight className="size-4 text-white/30 group-hover:text-white/70 transition-colors" />
														</button>
													) : link.label === "Inicio" ? (
														<button
															type="button"
															onClick={handleHomeClick}
															className={cn(
																"group flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5  active:scale-[0.98] text-left motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300 motion-reduce:animate-none",
																index < 3
																	? "motion-safe:animate-delay-75"
																	: "motion-safe:animate-delay-150",
															)}
														>
															<div className="flex items-center gap-2">
																<span className="font-bold tracking-tight">
																	{link.label}
																</span>
															</div>
															<IconChevronRight className="size-4 text-white/30 group-hover:text-white/70 transition-colors" />
														</button>
													) : (
														<Link
															href={link.href}
															onClick={() => setMobileMenuOpen(false)}
															className={cn(
																"group flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5  active:scale-[0.98] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300 motion-reduce:animate-none",
																index < 3
																	? "motion-safe:animate-delay-75"
																	: "motion-safe:animate-delay-150",
															)}
														>
															<div className="flex items-center gap-2">
																<span className="font-bold tracking-tight">
																	{link.label}
																</span>
															</div>
															<IconChevronRight className="size-4 text-white/30 group-hover:text-white/70 transition-colors" />
														</Link>
													)}
												</TooltipTrigger>
												<TooltipContent side="bottom" sideOffset={4}>
													{link.title}
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									))}
									{session && canSeeZonaRaider && (
										<Link
											href="/zona-raider"
											onClick={() => setMobileMenuOpen(false)}
											className="group flex items-center justify-between p-4 rounded-2xl bg-linear-to-r from-blue-600/20 to-blue-600/20 hover:from-blue-600/30 hover:to-blue-600/30 border border-blue-500/20  active:scale-[0.98]"
										>
											<div className="flex flex-col gap-1 text-left">
												<span className="text-[10px] font-semibold uppercase text-blue-400 tracking-widest leading-none">
													Acceso Raider
												</span>
												<span className="font-bold tracking-tight text-white">
													Zona Raider
												</span>
											</div>
											<IconShieldCheck className="size-5 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
										</Link>
									)}
									{applyCta &&
										(applyCta.actionHref ? (
											<div
												className={cn(
													"group relative overflow-hidden flex flex-col gap-2 rounded-2xl border p-2  active:scale-[0.98]",
													"bg-linear-to-r",
													applyCta.accent,
													"hover:scale-[1.01]",
												)}
											>
												<Link
													href={applyCta.mainHref}
													onClick={() => setMobileMenuOpen(false)}
													className="relative z-10 flex min-w-0 items-center justify-between rounded-xl px-3 py-2 text-left"
													title="Revisar mi Apply"
												>
													<div className="flex min-w-0 flex-col gap-1 text-left">
														<span
															className={cn(
																"text-[10px] font-semibold uppercase tracking-widest leading-none",
																applyCta.labelClass,
															)}
														>
															Aplicación activa
														</span>
														<span className="font-bold tracking-tight text-white">
															{applyCta.subtitle}
														</span>
													</div>
												</Link>
												<Link
													href={applyCta.actionHref}
													onClick={() => setMobileMenuOpen(false)}
													className="relative z-10 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-400/10 p-3 text-orange-50 hover:bg-orange-400/15 transition-colors border border-orange-300/15"
													title={applyCta.title}
												>
													<ApplyIcon className="size-4 text-orange-100" />
													<span className="text-[10px] font-semibold uppercase tracking-[0.18em] whitespace-nowrap text-orange-50">
														{applyCta.actionLabel}
													</span>
												</Link>
												<div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
											</div>
										) : (
											<Link
												href={applyCta.href}
												onClick={() => setMobileMenuOpen(false)}
												className={cn(
													"group relative overflow-hidden flex items-center justify-between gap-3 p-4 rounded-2xl border  active:scale-[0.98]",
													"bg-linear-to-r",
													applyCta.accent,
													"hover:scale-[1.01]",
												)}
												title={applyCta.title}
											>
												<div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
												<div className="flex flex-col gap-1 text-left">
													<span
														className={cn(
															"text-[10px] font-semibold uppercase tracking-widest leading-none",
															applyCta.labelClass,
														)}
													>
														Aplicación activa
													</span>
													<span className="font-bold tracking-tight text-white flex items-center gap-2">
														{applyCta.label}
														<span
															className={cn(
																"rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em]",
																applyCta.badge,
															)}
														>
															{applyCta.subtitle}
														</span>
													</span>
												</div>
												<ApplyIcon className="size-5 text-cyan-100 shadow-[0_0_10px_rgba(34,211,238,0.35)]" />
											</Link>
										))}
									{!session && (
										<>
											<div className="h-px bg-white/5 my-2 mx-4" />
											<Link
												href="/login"
												onClick={() => setMobileMenuOpen(false)}
												className="group flex items-center justify-between p-4 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/10  active:scale-[0.98]"
											>
												<span className="font-semibold uppercase text-[10px] tracking-widest text-blue-400">
													Acceso Miembros
												</span>
												<IconUser className="size-4 text-blue-400/70" />
											</Link>
										</>
									)}
								</div>
								<div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-zinc-950 to-transparent">
									<p className="text-[10px] text-white/60 font-medium uppercase tracking-[0.2em]">
										Artic Tempest Hermandad
									</p>
								</div>
							</SheetContent>
						</Sheet>

						<div
							className={cn(
								"hidden items-center gap-2  ease-out lg:flex",
								heroVisible
									? "opacity-70 translate-y-1"
									: "opacity-100 translate-y-0",
							)}
						>
							<TooltipProvider delayDuration={300}>
								<Tooltip>
									<TooltipTrigger asChild>
										<Link
											href="https://shop.restedxp.com/ref/artictempest/"
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex h-8 items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-2.5 pr-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-orange-100  hover:bg-orange-500/15 hover:border-orange-400/35"
										>
											<span className="flex size-5 items-center justify-center overflow-hidden rounded bg-zinc-950/30 ring-1 ring-white/10">
												<Image
													src="/assets/images/ads/restedxp-logo_icon.svg"
													alt="RestedXP"
													width={24}
													height={24}
													className="size-full object-contain p-0.5"
													sizes="20px"
												/>
											</span>
											<span className="leading-none text-left">
												<span className="block text-[9px] font-semibold uppercase tracking-[0.12em] text-orange-300/90">
													5% de descuento
												</span>
												<span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
													RestedXP
												</span>
											</span>
										</Link>
									</TooltipTrigger>
									<TooltipContent sideOffset={4}>
										RestedXP — 5% de descuento con nuestro enlace
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
							<TooltipProvider delayDuration={300}>
								<Tooltip>
									<TooltipTrigger asChild>
										<Link
											href="https://account.proton.me/refer-a-friend?referrer=6FT15FKW"
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex h-8 items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-2.5 pr-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-100  hover:bg-violet-500/15 hover:border-violet-400/35"
										>
											<span className="flex size-5 items-center justify-center overflow-hidden rounded bg-white/10 ring-1 ring-white/10">
												<Image
													src="/assets/images/ads/proton-vpn-seeklogo.webp"
													alt="Proton VPN"
													width={24}
													height={24}
													className="size-full object-contain p-0.5"
													sizes="20px"
												/>
											</span>
											<span className="leading-none text-left">
												<span className="block text-[9px] font-semibold uppercase tracking-[0.12em] text-violet-200/90">
													14 días gratis
												</span>
												<span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
													Proton VPN
												</span>
											</span>
										</Link>
									</TooltipTrigger>
									<TooltipContent sideOffset={4}>
										Proton VPN — 14 días gratis con nuestro enlace
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>
					</div>

					<div className="relative z-20 flex shrink-0 items-center gap-2 px-1 md:gap-4">
						{session && canSeeZonaRaider && (
							<TooltipProvider delayDuration={300}>
								<Tooltip>
									<TooltipTrigger asChild>
										<Link
											href="/zona-raider"
											className="hidden lg:inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-linear-to-r from-blue-600 via-blue-500 to-blue-600 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]  hover:scale-[1.02] active:scale-95 hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]"
										>
											Zona Raider
										</Link>
									</TooltipTrigger>
									<TooltipContent sideOffset={4}>
										Ir a la zona privada para Raiders de Artic Tempest.
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						)}
						{canSeeRecruitmentBadge && recruitmentCount > 0 && (
							<Link
								href="/zona-raider/configuracion/reclutamiento?tab=inbox"
								className="inline-flex"
							>
								<RecruitmentBadge
									canSeeRecruitmentBadge={canSeeRecruitmentBadge}
									recruitmentCount={recruitmentCount}
									hasApplicantMessages={hasApplicantMessages}
								/>
							</Link>
						)}
						<NotificationBell />
						{session ? (
							canSeeZonaRaider ? (
								<DropdownMenu>
									<TooltipProvider delayDuration={300}>
										<Tooltip>
											<TooltipTrigger asChild>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														className={cn(
															"relative size-10 rounded-full hover:bg-white/5 p-0 overflow-hidden ring-offset-black ",
															!ringStyle && "border border-white/10",
														)}
														style={roleAvatarRingStyle}
													>
														{session.user.avatarUrl ? (
															<Image
																src={session.user.avatarUrl}
																alt={session.user.username || "Usuario"}
																width={160}
																height={160}
																className="absolute inset-0 size-full object-cover"
																sizes="40px"
															/>
														) : (
															<IconUser className="size-5 text-white/70" />
														)}
													</Button>
												</DropdownMenuTrigger>
											</TooltipTrigger>
											<TooltipContent sideOffset={4}>
												Haz click para ver el menú personal
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
									<DropdownMenuContent
										align="end"
										className="w-64 bg-zinc-950 border-white/10 text-white p-2 animate-in fade-in zoom-in-95 duration-200"
									>
										<div className="px-2 py-3 flex items-center justify-between gap-4">
											<p className="text-sm font-bold truncate">
												{session.user.username}
											</p>
											{displayRole && (
												<span
													className="text-[9px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 uppercase tracking-widest whitespace-nowrap"
													style={roleBadgeStyle}
												>
													{displayRole.toUpperCase()}
												</span>
											)}
										</div>
										<DropdownMenuSeparator className="bg-white/10 mb-1" />
										<DropdownMenuItem
											asChild
											className="focus:bg-white/5 cursor-pointer rounded-lg h-10 mb-0.5"
										>
											<Link
												href="/mis-personajes"
												className="flex items-center gap-2"
											>
												<IconUser className="size-4" />
												<span>Mis Personajes</span>
											</Link>
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => void signOut()}
											className="focus:bg-rose-500/10 text-rose-400 cursor-pointer rounded-lg h-10"
										>
											<IconLogout className="size-4" />
											<span>Cerrar Sesión</span>
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							) : (
								<Button
									variant="ghost"
									className={cn(
										"relative size-10 rounded-full hover:bg-white/5 p-0 overflow-hidden ring-offset-black  cursor-default",
										!ringStyle && "border border-white/10",
									)}
									style={roleAvatarRingStyle}
									aria-label={session.user.username || "Usuario"}
									type="button"
								>
									{session.user.avatarUrl ? (
										<Image
											src={session.user.avatarUrl}
											alt={session.user.username || "Usuario"}
											width={160}
											height={160}
											className="absolute inset-0 size-full object-cover"
											sizes="40px"
										/>
									) : (
										<IconUser className="size-5 text-white/70" />
									)}
								</Button>
							)
						) : (
							<Button
								asChild
								variant="landingTinted"
								size="sm"
								className="group relative h-9 min-w-0 -mr-1 overflow-hidden rounded-full px-3.5 text-[10px] font-semibold tracking-[0.12em] text-white shadow-[0_10px_26px_rgba(8,47,73,0.18)]"
							>
								<Link href="/login" className="flex items-center gap-2">
									<div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
									<span className="relative z-10 flex items-center gap-2">
										<IconLogin2 className="size-4 text-blue-400 group-hover:scale-110 transition-transform duration-300" />
										<span className="hidden xs:inline font-bold tracking-tight">
											Acceso Miembros
										</span>
										<span className="xs:hidden font-bold tracking-tight">
											Entrar
										</span>
									</span>
								</Link>
							</Button>
						)}
					</div>

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
