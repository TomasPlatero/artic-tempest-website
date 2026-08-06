"use client";

import * as React from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import Link from "next/link";

import {
	IconLogout,
	IconNotification,
	IconUserCircle,
	IconHelp,
	IconFileText,
	IconPackage,
} from "@/shared/ui/tabler-icons";

import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { cn } from "@/shared/tailwind/tailwind-utils";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Button } from "@/shared/ui/button";
import {
	getRoleAvatarBorderColor,
	getRoleBadgeStyle,
	resolveRoleColorFromMe,
} from "@/shared/lib/role-color-styles";

type MePayload = {
	name: string;
	avatar: string;
	role?: string;
	roleColor?: string | null;
};

import { useApiQuery } from "@/shared/hooks/use-api-query";

async function handleLogout() {
	toast.info("Sesión cerrada", {
		description: "¡Hasta pronto!",
	});
	await signOut({ callbackUrl: "/" });
}

export function NavUser({
	hideNameOnMobile = false,
}: {
	hideNameOnMobile?: boolean;
}) {
	const { data: userData } = useApiQuery<MePayload>([
		"/api/me",
		{ credentials: "include", cache: "no-store" },
	]);

	const { data: notifications, mutate: mutateNotifications } = useApiQuery<
		any[]
	>("/api/notifications", {
		refreshInterval: 60 * 1000,
	});

	const unreadCount = (() => {
		if (!Array.isArray(notifications)) return 0;
		return notifications.filter((n: any) => !n.isRead).length;
	})();

	const mutateNotificationsRef = React.useRef(mutateNotifications);

	React.useEffect(() => {
		mutateNotificationsRef.current = mutateNotifications;
	}, [mutateNotifications]);

	React.useEffect(() => {
		const handleLocalUpdate = () => {
			void mutateNotificationsRef.current();
		};
		window.addEventListener("notifications-updated", handleLocalUpdate);

		return () => {
			window.removeEventListener("notifications-updated", handleLocalUpdate);
		};
	}, []);

	const displayName = userData?.name ?? "Usuario";
	const displayAvatar = userData?.avatar ?? "";
	const roleColor = resolveRoleColorFromMe({
		meRoleColor: userData?.roleColor,
	});
	const avatarBorderColor = getRoleAvatarBorderColor(roleColor);
	const roleBadgeStyle = getRoleBadgeStyle(roleColor);

	return (
		<div className="flex items-center">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="lg"
						className="h-10 px-2 sm:px-3 rounded-xl hover:bg-white/[0.05]  gap-3 group/navuser border border-transparent hover:border-white/5 shadow-none"
						data-tour-step="zona-raider-topnav-user"
					>
						<div className="relative">
							{unreadCount > 0 && (
								<div className="absolute -inset-[2px] rounded-lg ring-2 ring-blue-500 ring-offset-2 ring-offset-[#0d0d12] animate-pulse z-20 pointer-events-none" />
							)}
							<Avatar
								className="size-7 sm:size-8 rounded-lg relative z-10  group-hover/navuser:scale-105 group-hover/navuser:rotate-2 shadow-xl border border-white/10"
								style={
									avatarBorderColor
										? { borderColor: avatarBorderColor }
										: undefined
								}
							>
								<AvatarImage src={displayAvatar} alt={displayName} />
								<AvatarFallback className="rounded-lg bg-blue-500/10 text-blue-400 font-bold">
									{displayName?.[0]?.toUpperCase() ?? "?"}
								</AvatarFallback>
							</Avatar>
						</div>
						<div
							className={cn(
								"flex flex-col text-left text-sm leading-relaxed",
								hideNameOnMobile && "hidden sm:flex",
							)}
						>
							<div className="flex items-center gap-2 overflow-hidden">
								<span className="truncate font-semibold text-zinc-100 group-hover/navuser:text-white transition-colors">
									{displayName}
								</span>
								{userData?.role && (
									<span
										className="text-[9px] font-semibold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 uppercase tracking-widest shrink-0"
										style={roleBadgeStyle}
									>
										{userData.role}
									</span>
								)}
							</div>
						</div>
					</Button>
				</DropdownMenuTrigger>

				<DropdownMenuContent
					className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
					side="bottom"
					align="end"
					sideOffset={4}
				>
					<DropdownMenuGroup>
						<DropdownMenuItem asChild>
							<Link href="/zona-raider/cuenta">
								<IconUserCircle />
								Cuenta
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild>
							<Link
								href="/zona-raider/notificaciones"
								className="flex items-center justify-between w-full"
							>
								<div className="flex items-center gap-2">
									<IconNotification className="text-blue-500" />
									Notificaciones
								</div>
								{unreadCount > 0 && (
									<span className="flex size-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white animate-pulse">
										{unreadCount}
									</span>
								)}
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild>
							<Link href="/zona-raider/normativa-raider">
								<IconFileText className="text-cyan-400" />
								Normativa Raider
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild>
							<Link href="/zona-raider/bosteos">
								<IconPackage className="text-blue-400" />
								Bosteos
							</Link>
						</DropdownMenuItem>
					</DropdownMenuGroup>

					<DropdownMenuSeparator />

					<DropdownMenuGroup>
						<DropdownMenuItem asChild>
							<Link href="/ayuda">
								<IconHelp className="text-zinc-400" />
								Ayuda
							</Link>
						</DropdownMenuItem>
					</DropdownMenuGroup>

					<DropdownMenuSeparator />

					<DropdownMenuItem onClick={() => void handleLogout()}>
						<IconLogout />
						Desconectarse
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
