// Extracted from navigation.tsx (ATW-20): keeps each component in its own file.

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { DEFAULT_PUBLIC_LOGO } from "@/shared/guild/guild-constants";
import { IconUser, IconMenu2, IconChevronRight, IconFileSearch, IconShieldCheck } from "@/shared/ui/tabler-icons";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/shared/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/shared/ui/tooltip";
import { cn } from "@/shared/tailwind/tailwind-utils";
import { NAV_LINKS } from "./landing-nav-view-state";
import type { ApplyCta, SessionData } from "./landing-nav-view-state";

export type LandingNavMainSectionProps = {
	ApplyIcon: typeof IconFileSearch;
	applyCta: ApplyCta;
	canSeeZonaRaider: boolean;
	handleHomeClick: () => void;
	handleSectionClick: (sectionId: string) => void;
	hasLiveStreamer: boolean;
	heroVisible: boolean;
	mobileMenuOpen: boolean;
	publicLogoUrl?: string | null;
	session: SessionData | null;
	setMobileMenuOpen: (open: boolean) => void;
};

export function LandingNavMainSection({
	ApplyIcon,
	applyCta,
	canSeeZonaRaider,
	handleHomeClick,
	handleSectionClick,
	hasLiveStreamer,
	heroVisible,
	mobileMenuOpen,
	publicLogoUrl,
	session,
	setMobileMenuOpen,
}: LandingNavMainSectionProps) {
	return (
		<div className="relative z-20 flex min-w-0 items-center gap-3">
			{/* Botón de Menú Mobile */}
			<NavMobileSheet
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
	);
}

function NavMobileSheet({
	ApplyIcon,
	applyCta,
	canSeeZonaRaider,
	handleHomeClick,
	handleSectionClick,
	hasLiveStreamer,
	mobileMenuOpen,
	publicLogoUrl,
	session,
	setMobileMenuOpen,
}: LandingNavMainSectionProps) {
	return (
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
	);
}
