"use client";

import * as React from "react";
import Image from "next/image";
import { NavMain } from "@/shared/navigation/nav-main";
import { NavUser } from "@/shared/navigation/nav-user";
import { useSession } from "next-auth/react";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuButton,
	useSidebar,
} from "@/shared/components/sidebar";
import { Badge } from "@/shared/ui/badge";
import {
	IconInnerShadowTop,
	IconArrowBarLeft,
	IconArrowBarRight,
} from "@/shared/ui/tabler-icons";
import { usePathname } from "next/navigation";
import { useApiQuery } from "@/shared/hooks/use-api-query";

function GuildSidebarHeader({
	iconUrl,
	guildName,
	appVersion,
}: {
	iconUrl: string | null;
	guildName: string;
	appVersion: string;
}) {
	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<div className="flex w-full items-center gap-2 overflow-hidden rounded-md py-1 px-2 text-left text-sm h-12">
					<div className="flex items-center gap-2 text-sidebar-foreground">
						{iconUrl ? (
							<Image
								src={iconUrl}
								alt="Guild Logo"
								width={20}
								height={20}
								priority
								className="size-5 rounded-full object-cover shrink-0 border border-border/30"
							/>
						) : (
							<IconInnerShadowTop className="size-5 shrink-0" />
						)}
						<div className="flex flex-col truncate">
							<span className="text-base font-semibold leading-none">
								{guildName}
							</span>
							<div className="flex items-center gap-1.5 mt-0.5">
								<Badge
									variant="outline"
									className="text-[9px] px-1 py-0 h-3.5 bg-blue-500/10 text-blue-400 border-blue-500/20 font-semibold"
								>
									{appVersion}
								</Badge>
							</div>
						</div>
					</div>
				</div>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}

function resolveApiPath(hasSession: boolean, path: string) {
	return hasSession ? path : null;
}

function resolveRecruitmentApiPath(
	hasSession: boolean,
	canSeeRecruitmentBadge: boolean,
) {
	return hasSession && canSeeRecruitmentBadge
		? "/api/recruitment/count"
		: null;
}

function resolveSidebarBadges({
	canSeeRecruitmentBadge,
	recruitmentCount,
	notificationsData,
}: {
	canSeeRecruitmentBadge: boolean;
	recruitmentCount?: number;
	notificationsData: unknown;
}): Record<string, number> {
	return {
		recruitment: canSeeRecruitmentBadge ? (recruitmentCount ?? 0) : 0,
		notifications: Array.isArray(notificationsData)
			? notificationsData.filter((n: any) => !n.isRead).length
			: 0,
	};
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { data: session } = useSession();
	const { toggleSidebar, state: sidebarState, isMobile } = useSidebar();
	const showCollapseToggle = !isMobile;
	const pathname = usePathname();
	const roleLevel = session?.user?.roleLevel ?? "member";
	const canSeeRecruitmentBadge = ["officer", "gm"].includes(
		roleLevel.toLowerCase(),
	);

	const { data: navigationData } = useApiQuery<any[]>(
		session ? "/api/navigation" : null,
		{
			refreshInterval: 5 * 60 * 1000,
		},
	);
	const { data: guildInfo } = useApiQuery<{
		icon_url?: string | null;
		name?: string | null;
		version?: string | null;
	}>(resolveApiPath(Boolean(session), "/api/guild/info"), {
		refreshInterval: 10 * 60 * 1000,
	});
	const { data: notificationsData, mutate: mutateNotifications } = useApiQuery<
		any[]
	>(resolveApiPath(Boolean(session), "/api/notifications"), {
		refreshInterval: 60 * 1000,
	});
	const { data: recruitmentData } = useApiQuery<{
		count: number;
	}>(resolveRecruitmentApiPath(Boolean(session), canSeeRecruitmentBadge), {
		refreshInterval: 2 * 60 * 1000,
	});

	const iconUrl = guildInfo?.icon_url ?? null;
	const guildName = guildInfo?.name ?? "Artic Tempest";
	const appVersion = guildInfo?.version ?? "Zona Raider";
	const navigation = navigationData ?? [];

	const badges = resolveSidebarBadges({
		canSeeRecruitmentBadge,
		recruitmentCount: recruitmentData?.count,
		notificationsData,
	});

	const badgesRef = React.useRef(badges);

	React.useEffect(() => {
		badgesRef.current = badges;
	});

	React.useEffect(() => {
		if (!session?.user?.id) return;

		const handleNotificationUpdate = () => {
			void mutateNotifications();
		};

		window.addEventListener("notifications-updated", handleNotificationUpdate);

		return () => {
			window.removeEventListener(
				"notifications-updated",
				handleNotificationUpdate,
			);
		};
	}, [mutateNotifications, session?.user?.id]);

	// Update PWA OS Badge when notification or recruitment numbers change
	React.useEffect(() => {
		const currentBadges = badgesRef.current;
		if (typeof navigator !== "undefined" && "setAppBadge" in navigator) {
			const totalBadges =
				(currentBadges.notifications || 0) + (currentBadges.recruitment || 0);
			if (totalBadges > 0) {
				// @ts-ignore
				navigator
					.setAppBadge(totalBadges)
					.catch((err) => console.error("Could not set app badge", err));
			} else {
				// @ts-ignore
				navigator
					.clearAppBadge()
					.catch((err) => console.error("Could not clear app badge", err));
			}
		}
	}, [badges.notifications, badges.recruitment]);

	const processedNavigation = (() => {
		const inject = (items: any[]): any[] => {
			return items.reduce((acc: any[], item) => {
				if (
					!item.visibility ||
					item.visibility === "all" ||
					item.visibility === "mobile-only"
				) {
					acc.push({
						...item,
						badge: item.badge_key ? badges[item.badge_key] : undefined,
						children: item.children ? inject(item.children) : [],
					});
				}
				return acc;
			}, []);
		};
		return inject(navigation);
	})();

	// Separate top-level links from groups
	const { topLevelLinks, groupedLinks } = (() => {
		const topLevel: any[] = [];
		const groups: any[] = [];

		processedNavigation.forEach((item) => {
			if (item.url) {
				topLevel.push(item);
			} else {
				groups.push(item);
			}
		});

		return {
			topLevelLinks: topLevel,
			groupedLinks: groups,
		};
	})();

	// Calculate the best matching URL from the entire navigation tree
	// to avoid double highlighting
	const activeUrl = (() => {
		let bestMatch: { url: string; length: number } | null = null as {
			url: string;
			length: number;
		} | null;

		const traverse = (items: any[]) => {
			for (const item of items) {
				if (
					item.url &&
					(pathname === item.url || pathname.startsWith(item.url + "/"))
				) {
					if (!bestMatch || item.url.length > bestMatch.length) {
						bestMatch = { url: item.url, length: item.url.length };
					}
				}
				if (item.children?.length > 0) {
					traverse(item.children);
				}
			}
		};

		// Traverse all groups
		processedNavigation.forEach((group) => {
			if (group.url) {
				traverse([group]);
			} else if (group.children) {
				traverse(group.children);
			}
		});

		return bestMatch?.url || null;
	})();

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<GuildSidebarHeader
					iconUrl={iconUrl}
					guildName={guildName}
					appVersion={appVersion}
				/>
			</SidebarHeader>
			<SidebarContent>
				{topLevelLinks.length > 0 && (
					<NavMain
						items={topLevelLinks}
						activeUrl={activeUrl || undefined}
						ariaLabel="Enlaces rápidos de Zona Raider"
					/>
				)}
				{groupedLinks.map((group: any) => (
					<NavMain
						key={group.id || group.name}
						label={group.name}
						items={group.children}
						activeUrl={activeUrl || undefined}
						ariaLabel={`Sección ${group.name}`}
					/>
				))}
			</SidebarContent>
			<SidebarFooter>
				{showCollapseToggle && (
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton
								onClick={() => toggleSidebar()}
								tooltip={
									sidebarState === "collapsed"
										? "Expandir menú"
										: "Colapsar menú"
								}
							>
								{sidebarState === "collapsed" ? (
									<IconArrowBarRight className="size-4" />
								) : (
									<IconArrowBarLeft className="size-4" />
								)}
								<span>Colapsar menú</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				)}
				{!isMobile && <NavUser />}
			</SidebarFooter>
		</Sidebar>
	);
}
