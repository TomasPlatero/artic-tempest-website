"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
	IconHome2,
	IconChevronDown,
	IconUserPlus,
	IconArrowLeft,
} from "@/shared/ui/tabler-icons";
import { cn } from "@/shared/tailwind/tailwind-utils";
import { NavUser } from "@/shared/navigation/nav-user";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Button } from "@/shared/ui/button";
import { SidebarTrigger } from "@/shared/components/sidebar";
import { getIconByName } from "@/shared/lib/icon-utils";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { useApiQuery } from "@/shared/hooks/use-api-query";
import { normalizeZonaRaiderPath } from "@/shared/lib/zona-raider-path";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	TooltipProvider,
} from "@/shared/ui/tooltip";

/** Resolves an icon by name at the module level to avoid creating components during render. */
function IconResolver({
	name,
	className,
	stroke = 1.5,
	...props
}: {
	name?: string;
	className?: string;
	stroke?: number;
	[key: string]: unknown;
}) {
	/* eslint-disable react-hooks/static-components -- dynamic icon resolution is the only scalable pattern for DB-driven icon names */
	const Icon = getIconByName(name);
	return <Icon className={className} stroke={stroke} {...props} />;
	/* eslint-enable react-hooks/static-components */
}

function RecruitmentBadge({
	canSeeRecruitmentBadge,
	recruitmentCount,
	hasApplicantMessages,
	className,
}: {
	canSeeRecruitmentBadge: boolean;
	recruitmentCount: number;
	hasApplicantMessages: boolean;
	className?: string;
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
					className,
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

// ──────────────────────────────────────────────
// Nav dropdown card (sub-item inside a dropdown)
// ──────────────────────────────────────────────

function resolveCardClassName({
	isChildActive,
	childHasChildren,
	hasUrl,
}: {
	isChildActive: boolean;
	childHasChildren: boolean;
	hasUrl: boolean;
}) {
	return cn(
		"flex items-start gap-4 rounded-xl border  group/item p-3 size-full min-h-[110px]",
		isChildActive
			? "bg-blue-500/5 border-blue-500/30 shadow-[0_20px_45px_rgba(59,130,246,0.09)]"
			: childHasChildren
				? "border-blue-500/10 bg-blue-500/[0.02] hover:border-blue-500/30 hover:bg-blue-500/[0.05] cursor-pointer"
				: "border-white/5 bg-zinc-950/20 hover:border-white/15 hover:bg-white/5",
		!hasUrl && !childHasChildren && "opacity-75",
	);
}

function resolveCardRole({
	childHasChildren,
	hasUrl,
}: {
	childHasChildren: boolean;
	hasUrl: boolean;
}) {
	if (childHasChildren) return "button";
	return hasUrl ? undefined : "presentation";
}

function toggleHoveredChildIcon(
	prev: Record<string, string | undefined>,
	parentKey: string,
	iconName: string | undefined,
	entering: boolean,
): Record<string, string | undefined> {
	if (!entering && !prev[parentKey]) return prev;
	const next = { ...prev };
	if (entering) next[parentKey] = iconName;
	else delete next[parentKey];
	return next;
}

function NavDropdownCard({
	child,
	parentKey,
	pathname: _pathname,
	isChildActive,
	childHasChildren,
	setActiveCategory,
	setHoveredChildIconByParent,
}: {
	child: any;
	parentKey: string;
	pathname: string;
	isChildActive: boolean;
	childHasChildren: boolean;
	setActiveCategory: React.Dispatch<React.SetStateAction<any>>;
	setHoveredChildIconByParent: React.Dispatch<
		React.SetStateAction<Record<string, string | undefined>>
	>;
}) {
	const hasUrl = Boolean(child.url);

	const handleHover = (entering: boolean) => {
		setHoveredChildIconByParent((prev) =>
			toggleHoveredChildIcon(prev, parentKey, child.icon_name, entering),
		);
	};

	const cardClassName = resolveCardClassName({
		isChildActive,
		childHasChildren,
		hasUrl,
	});

	const content = (
		<div
			className={cn(cardClassName, "relative")}
			onMouseEnter={() => handleHover(true)}
			onMouseLeave={() => handleHover(false)}
			onFocus={() => handleHover(true)}
			onBlur={() => handleHover(false)}
			role={resolveCardRole({ childHasChildren, hasUrl })}
		>
			<div
				className={cn(
					"p-2 rounded-lg  group-hover/item:scale-110",
					isChildActive
						? "bg-blue-500/20 text-blue-400"
						: childHasChildren
							? "bg-blue-500/10 text-blue-400 group-hover/item:bg-blue-500/20"
							: "bg-zinc-800/40 text-zinc-500 group-hover/item:bg-blue-500/10 group-hover/item:text-blue-400",
				)}
			>
				<IconResolver name={child.icon_name} className="size-5" stroke={1.5} />
			</div>
			<div className="flex flex-col gap-1 min-w-0 flex-1">
				<div className="flex flex-wrap items-center gap-2 pr-4">
					<span
						className={cn(
							"font-sans text-[13px] font-bold transition-colors",
							isChildActive
								? "text-blue-400"
								: "text-zinc-200 group-hover/item:text-white",
						)}
					>
						{child.name}
					</span>
				</div>
				{isChildActive && (
					<span
						className="absolute right-3 top-3 size-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse"
						aria-hidden="true"
					/>
				)}
				<p className="text-[11px] text-zinc-500 font-medium leading-snug break-words opacity-80 group-hover/item:text-zinc-400 transition-colors">
					{child.description || "Acceder a " + child.name}
				</p>
			</div>
		</div>
	);

	if (childHasChildren) {
		return (
			<DropdownMenuItem
				key={child.id}
				className="rounded-xl outline-none focus:bg-white/[0.03] p-0 mb-0.5  h-full"
				onSelect={(e) => {
					e.preventDefault();
					setActiveCategory(child);
				}}
			>
				{content}
			</DropdownMenuItem>
		);
	}

	if (hasUrl) {
		return (
			<DropdownMenuItem
				key={child.id}
				asChild
				className="rounded-xl outline-none focus:bg-white/[0.03] p-0 mb-0.5  h-full"
			>
				<Link
					href={child.url}
					id={child.element_id}
					aria-current={isChildActive ? "page" : undefined}
					className="block focus:outline-none h-full"
				>
					{content}
				</Link>
			</DropdownMenuItem>
		);
	}

	return (
		<DropdownMenuItem
			key={child.id}
			className="rounded-xl p-0 mb-0.5 h-full"
			disabled
		>
			{content}
		</DropdownMenuItem>
	);
}

function DesktopNavigation({
	navItems,
	pathname,
	hoveredChildIconByParent,
	setHoveredChildIconByParent,
}: {
	navItems: any[];
	pathname: string;
	hoveredChildIconByParent: Record<string, string | undefined>;
	setHoveredChildIconByParent: React.Dispatch<
		React.SetStateAction<Record<string, string | undefined>>
	>;
}) {
	const [activeCategory, setActiveCategory] = React.useState<any>(null);

	return (
		<nav
			aria-label="Navegación principal de Zona Raider"
			className="hidden desktop:flex items-center gap-1 px-8 font-sans"
			data-tour-step="zona-raider-topnav-main"
		>
			{navItems.reduce<React.ReactNode[]>((acc, item) => {
				if (
					item.visibility &&
					item.visibility !== "all" &&
					item.visibility !== "pc-only"
				) {
					return acc;
				}
				const checkActive = (navItem: any): boolean => {
					const currentPathname = normalizeZonaRaiderPath(pathname);
					if (navItem.url) {
						const normalizedUrl = normalizeZonaRaiderPath(navItem.url);
						if (normalizedUrl === "/zona-raider") {
							return currentPathname === "/zona-raider";
						}
						if (
							currentPathname === normalizedUrl ||
							currentPathname?.startsWith(normalizedUrl + "/")
						)
							return true;
					}
					return (
						navItem.children?.some((child: any) => checkActive(child)) || false
					);
				};
				const isActive = checkActive(item);

				const hasChildren = item.children && item.children.length > 0;
				const customClass = item.css_class || "";
				const elementId = item.element_id || undefined;

				if (hasChildren) {
					const parentKey = String(item.id);
					const displayChildren = activeCategory
						? (activeCategory.children ?? [])
						: item.children;
					const panelIconName = activeCategory
						? activeCategory.icon_name || item.icon_name
						: hoveredChildIconByParent[parentKey] || item.icon_name;

					const renderDropdownCard = (child: any) => {
						const hasUrl = Boolean(child.url);
						const childHasChildren =
							child.children && child.children.length > 0;
						const isChildActive =
							hasUrl &&
							normalizeZonaRaiderPath(pathname) ===
								normalizeZonaRaiderPath(child.url);

						return (
							<NavDropdownCard
								key={child.id}
								child={child}
								parentKey={parentKey}
								pathname={pathname}
								isChildActive={isChildActive}
								childHasChildren={childHasChildren}
								setActiveCategory={setActiveCategory}
								setHoveredChildIconByParent={setHoveredChildIconByParent}
							/>
						);
					};

					const childCards = displayChildren.map(renderDropdownCard);

					acc.push(
						<DropdownMenu
							key={item.id}
							onOpenChange={(open) => {
								if (!open) setActiveCategory(null);
							}}
						>
							<DropdownMenuTrigger asChild>
								<Button
									id={elementId}
									variant="ghost"
									className={cn(
										"h-9 px-4 rounded-xl font-sans text-[13px] font-bold gap-2 ",
										isActive
											? "text-blue-400"
											: "text-white/70 hover:text-white hover:bg-white/[0.05]",
										customClass,
									)}
									aria-current={isActive ? "page" : undefined}
								>
									<IconResolver
										name={item.icon_name}
										className={cn(
											"size-4",
											isActive ? "text-blue-400" : "text-zinc-500",
										)}
									/>
									{item.name}
									<IconChevronDown className="size-3 opacity-40 ml-1" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="start"
								sideOffset={12}
								onMouseLeave={() => {
									setHoveredChildIconByParent((prev) => {
										if (!prev[parentKey]) return prev;
										const next = { ...prev };
										delete next[parentKey];
										return next;
									});
								}}
								className="w-[620px] bg-zinc-950/95 backdrop-blur-3xl border-white/10 p-0 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
							>
								<div className="flex h-full min-h-[320px]">
									<div className="w-[200px] bg-linear-to-br from-primary/20 via-primary/10 to-transparent p-6 flex flex-col border-r border-white/[0.05] relative overflow-hidden group/sidebar">
										<div className="absolute top-0 right-0 size-32 bg-blue-500/10 blur-[60px] rounded-full -mr-16 -mt-16 group-hover/sidebar:bg-blue-400/20 " />
										<div className="absolute -bottom-8 -left-8 opacity-[0.03] group-hover/sidebar:opacity-[0.06] transition-opacity duration-700 pointer-events-none rotate-12 group-hover/sidebar:rotate-0 group-hover/sidebar:scale-110 ">
											<IconResolver
												name={panelIconName}
												className="size-48 text-white"
												stroke={1}
											/>
										</div>
										<div className="relative z-10 flex flex-col h-full pt-2">
											{activeCategory ? (
												<>
													<button
														type="button"
														onClick={() => setActiveCategory(null)}
														className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-white transition-colors mb-3 font-medium uppercase tracking-wider"
													>
														<IconArrowLeft className="size-3.5" />
														{item.name}
													</button>
													<h3 className="text-base font-semibold text-white uppercase tracking-tight mb-2 leading-relaxed">
														{activeCategory.name}
													</h3>
													<p className="text-[11px] text-zinc-400 font-medium leading-relaxed uppercase tracking-widest opacity-60">
														{activeCategory.description ||
															"Subcategorías disponibles."}
													</p>
												</>
											) : (
												<>
													<h3 className="text-lg font-semibold text-white uppercase tracking-tight mb-2 leading-none">
														{item.name}
													</h3>
													<p className="text-[11px] text-zinc-400 font-medium leading-relaxed uppercase tracking-widest opacity-60">
														{item.description ||
															"Gestión y herramientas avanzadas."}
													</p>
												</>
											)}
										</div>
									</div>
									<div className="flex-1 bg-white/[0.01] flex flex-col">
										<div className="px-4 pb-2 pt-3">
											<span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.2em]">
												{activeCategory
													? activeCategory.name
													: "Enlaces Rápidos"}
											</span>
										</div>
										<div className="flex-1 px-3 pb-3 grid grid-cols-1 md:grid-cols-2 gap-2 auto-rows-[minmax(110px,auto)] content-start">
											{childCards}
										</div>
									</div>
								</div>
							</DropdownMenuContent>
						</DropdownMenu>,
					);
				}

				if (item.url) {
					acc.push(
						<Link
							key={item.id}
							id={elementId}
							href={item.url}
							aria-current={isActive ? "page" : undefined}
							className={cn(
								"relative h-9 px-4 flex items-center gap-2.5 rounded-xl font-sans text-[13px] font-bold  group",
								isActive
									? "text-blue-400"
									: "text-white/70 hover:text-white hover:bg-white/[0.05]",
								customClass,
							)}
						>
							<IconResolver
								name={item.icon_name}
								className={cn(
									"size-4 transition-transform group-hover:scale-110",
									isActive
										? "text-blue-400"
										: "text-white/60 group-hover:text-blue-400",
								)}
							/>
							{item.name}
							{isActive && (
								<span className="absolute -bottom-[17px] left-1/2 -translate-x-1/2 w-8 h-[2px] bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
							)}
						</Link>,
					);
				}

				return acc;
			}, [])}
		</nav>
	);
}

export function ZonaRaiderTopNav({
	guildName,
	iconUrl,
}: {
	guildName: string;
	iconUrl?: string | null;
}) {
	const pathname = usePathname();
	const { data: session, status } = useSession();
	const isMobile = useIsMobile();
	const canSeeRecruitmentBadge = ["officer", "gm"].includes(
		session?.user?.roleLevel?.toLowerCase() || "",
	);

	const isAuthenticated = status === "authenticated";
	const { data: navData } = useApiQuery<any[]>(
		isAuthenticated ? "/api/navigation" : null,
		{
			refreshInterval: 5 * 60 * 1000,
		},
	);

	const { data: guildInfo } = useApiQuery<{
		mobile_icon_url?: string | null;
		version?: string | null;
	}>(isAuthenticated ? "/api/guild/info" : null, {
		refreshInterval: 10 * 60 * 1000,
	});

	const { data: _notifications } = useApiQuery<any[]>(
		isAuthenticated ? "/api/notifications" : null,
		{
			refreshInterval: 60 * 1000,
		},
	);

	const { data: recruitmentData } = useApiQuery<{
		count: number;
		applicantMessageCount: number;
	}>(
		isAuthenticated && canSeeRecruitmentBadge ? "/api/recruitment/count" : null,
		{
			refreshInterval: 2 * 60 * 1000,
		},
	);

	const navItems = navData ?? [];
	const [hoveredChildIconByParent, setHoveredChildIconByParent] =
		React.useState<Record<string, string | undefined>>({});
	const mobileIconUrl = guildInfo?.mobile_icon_url ?? null;
	const version = guildInfo?.version ?? "Zona Raider";
	const recruitmentCount = recruitmentData?.count ?? 0;
	const hasApplicantMessages =
		(recruitmentData?.applicantMessageCount ?? 0) > 0;

	return (
		<header className="sticky top-0 z-50 w-full border-b border-white/[0.05] bg-zinc-950/80 backdrop-blur-3xl">
			<div className="mx-auto max-w-[1600px] h-16 px-4 desktop:px-6 flex items-center justify-between gap-4 relative">
				{/* Sidebar Trigger (Left) - Hidden on Desktop (desktop+) */}
				<SidebarTrigger
					aria-label="Abrir o cerrar menú lateral"
					className="size-9 text-white/70 hover:text-white hover:bg-white/[0.05] rounded-xl z-20 desktop:hidden"
				/>

				<div
					className={cn(
						"flex items-center flex-1 ",
						"justify-center absolute inset-x-0 desktop:relative desktop:inset-auto desktop:justify-start desktop:gap-4 desktop:flex-none",
					)}
				>
					{/* Logo & Guild Info */}
					<Link
						href="/zona-raider"
						className="flex items-center gap-3 group "
						data-tour-step="zona-raider-topnav-home"
					>
						<div
							className={cn(
								"relative rounded-xl overflow-hidden bg-linear-to-br from-blue-500/20 to-violet-500/20 border border-white/10 group-hover:border-blue-500/30  shadow-xl shadow-blue-500/5",
								"h-10 w-auto bg-transparent border-none shadow-none overflow-visible rounded-none desktop:size-10 desktop:bg-linear-to-br desktop:border desktop:shadow-xl desktop:rounded-xl desktop:overflow-hidden",
							)}
						>
							<div className="desktop:hidden">
								{mobileIconUrl && (
									<Image
										src={mobileIconUrl}
										alt={guildName}
										width={100}
										height={40}
										priority
										className="h-full w-auto object-contain"
										style={{ width: "auto" }}
									/>
								)}
							</div>
							<div className="hidden desktop:block size-full">
								{iconUrl ? (
									<Image
										src={iconUrl}
										alt={guildName}
										width={40}
										height={40}
										priority
										className="size-full object-cover"
									/>
								) : (
									<div className="size-full flex items-center justify-center">
										<IconHome2 className="size-5 text-blue-400" />
									</div>
								)}
								<div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
							</div>
						</div>
						<div className="hidden desktop:flex flex-col">
							<span className="font-sans text-sm font-semibold text-white tracking-tight leading-none group-hover:text-blue-400 transition-colors uppercase">
								{guildName}
							</span>
							<span className="font-sans text-[10px] text-blue-400 font-bold uppercase tracking-widest leading-none mt-1.5 flex items-center gap-1.5">
								<span className="size-1 rounded-full bg-blue-500 animate-pulse" />
								{version}
							</span>
						</div>
					</Link>

					{/* Navigation Links - Desktop Only (1440px+) */}
					<DesktopNavigation
						navItems={navItems}
						pathname={pathname}
						hoveredChildIconByParent={hoveredChildIconByParent}
						setHoveredChildIconByParent={setHoveredChildIconByParent}
					/>
				</div>

				{/* Right Section: Actions & User */}
				<div className="flex items-center gap-2 sm:gap-3 z-20">
					{canSeeRecruitmentBadge && (
						<Link
							href="/zona-raider/configuracion/reclutamiento?tab=inbox"
							className="hidden desktop:inline-flex"
						>
							<RecruitmentBadge
								canSeeRecruitmentBadge={canSeeRecruitmentBadge}
								recruitmentCount={recruitmentCount}
								hasApplicantMessages={hasApplicantMessages}
							/>
						</Link>
					)}

					{/* Notifications - Desktop Only
          {!isMobile && (
            <Link href="/zona-raider/notificaciones">
              <Button variant="ghost" size="icon" className="relative size-9 text-zinc-400 hover:text-white hover:bg-white/[0.03] rounded-xl group/bell">
                <IconBell className={cn("size-5 transition-transform group-hover/bell:rotate-12", unreadCount > 0 && "text-blue-400")} />
                {unreadCount > 0 && (
                  <>
                    <div className="absolute top-1.5 right-1.5 size-2 bg-blue-500 rounded-full border-2 border-[#0d0d12] z-10" />
                    <div className="absolute top-1.5 right-1.5 size-2 bg-blue-400 rounded-full animate-ping opacity-75" />
                  </>
                )}
              </Button>
            </Link>
          )} */}

					<NavUser hideNameOnMobile={isMobile} />
				</div>
			</div>

			{/* Floating actions moved to the body layout */}
		</header>
	);
}
