// Extracted from navigation.tsx (ATW-20): keeps each component in its own file.

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/shared/ui/dropdown-menu";
import { IconUser, IconLogout, IconLogin2 } from "@/shared/ui/tabler-icons";
import { NotificationBell } from "@/domains/notifications/components/notification-bell";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/shared/ui/tooltip";
import { cn } from "@/shared/tailwind/tailwind-utils";
import { getRoleBadgeStyle, getRoleRingStyle } from "@/shared/lib/role-color-styles";
import { signOut } from "next-auth/react";
import { RecruitmentBadge } from "./landing-nav-recruitment-badge";
import type { RoleRingStyle, SessionData } from "./landing-nav-view-state";

type NavUserMenuProps = {
	canSeeZonaRaider: boolean;
	displayRole: string | null | undefined;
	ringStyle: RoleRingStyle;
	roleAvatarRingStyle: ReturnType<typeof getRoleRingStyle>;
	roleBadgeStyle: ReturnType<typeof getRoleBadgeStyle>;
	session: SessionData | null;
};

function NavUserMenu({
	canSeeZonaRaider,
	displayRole,
	ringStyle,
	roleAvatarRingStyle,
	roleBadgeStyle,
	session,
}: NavUserMenuProps) {
	return session ? (
		canSeeZonaRaider ? (
			<>
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
			</>
		) : (
			<>
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
			</>
		)
	) : (
		<>
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
		</>
	);
}

export type LandingNavActionsProps = {
	canSeeRecruitmentBadge: boolean;
	canSeeZonaRaider: boolean;
	displayRole: string | null | undefined;
	hasApplicantMessages: boolean;
	recruitmentCount: number;
	ringStyle: RoleRingStyle;
	roleAvatarRingStyle: ReturnType<typeof getRoleRingStyle>;
	roleBadgeStyle: ReturnType<typeof getRoleBadgeStyle>;
	session: SessionData | null;
};

export function LandingNavActions({
	canSeeRecruitmentBadge,
	canSeeZonaRaider,
	displayRole,
	hasApplicantMessages,
	recruitmentCount,
	ringStyle,
	roleAvatarRingStyle,
	roleBadgeStyle,
	session,
}: LandingNavActionsProps) {
	return (
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
			<NavUserMenu
				canSeeZonaRaider={canSeeZonaRaider}
				displayRole={displayRole}
				ringStyle={ringStyle}
				roleAvatarRingStyle={roleAvatarRingStyle}
				roleBadgeStyle={roleBadgeStyle}
				session={session}
			/>
		</div>
	);
}
