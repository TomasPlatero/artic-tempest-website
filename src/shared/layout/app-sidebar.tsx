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
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  useSidebar,
} from "@/shared/components/sidebar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/tailwind/tailwind-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import {
  IconChartBar,
  IconDashboard,
  IconSettings,
  IconUsers,
  IconCalendarEvent,
  IconListCheck,
  IconTimeline,
  IconWorld,
  IconFileText,
  IconSearch,
  IconRefresh,
  IconListSearch,
  IconAdjustments,
  IconHistory,
  IconShieldCheck,
  IconInnerShadowTop,
  IconBell,
  IconArrowBarLeft,
  IconArrowBarRight,
  IconDownload,
} from "@tabler/icons-react";
import { usePathname, useSearchParams } from "next/navigation";

const navigationData = {
  general: [
    {
      title: "Inicio",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Notificaciones",
      url: "/dashboard/notificaciones",
      icon: IconBell,
      badgeKey: "notifications",
    },
    {
      title: "Volver a la web",
      url: "/",
      icon: IconWorld,
    },
  ],
  raider: [
    {
      title: "Roster",
      url: "/dashboard/roster",
      icon: IconUsers,
      appId: "roster",
    },
    {
      title: "Calendario",
      url: "/dashboard/calendario",
      icon: IconCalendarEvent,
      appId: "calendar",
    },
    {
      title: "Lista de Deseos",
      url: "/dashboard/bis",
      icon: IconListCheck,
      appId: "bis",
    },
    {
      title: "Planificador",
      url: "/dashboard/planificador-cds",
      icon: IconTimeline,
      appId: "planificador-cds",
    },
    {
      title: "Estadísticas y Logs",
      url: "/dashboard/estadisticas",
      icon: IconChartBar,
      appId: "stats",
    },
  ],
  admin: [
    {
      title: "Reclutamiento",
      url: "/dashboard/configuracion/reclutamiento",
      icon: IconListSearch,
      appId: "settings-recruitment",
      badgeKey: "recruitment",
    },
    {
      title: "Gestión BiS",
      url: "/dashboard/bis/admin",
      icon: IconListCheck,
      appId: "bis-admin",
    },
    {
      title: "Ajustes",
      url: "/dashboard/configuracion",
      icon: IconAdjustments,
      appId: "settings",
    },
  ],
};

import { supabase } from "@/shared/supabase/client";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const { toggleSidebar, state: sidebarState } = useSidebar();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const showCollapseToggle =
    pathname === "/dashboard/planificador-cds" && searchParams.get("event_id");
  const roleLevel = session?.user?.roleLevel ?? "member";
  const [iconUrl, setIconUrl] = React.useState<string | null>(null);
  const [guildName, setGuildName] = React.useState<string>("Artic Tempest");
  const [appVersion, setAppVersion] =
    React.useState<string>("v1.0.0 (dynamic)");
  const [navigation, setNavigation] = React.useState<any[]>([]);
  const [mounted, setMounted] = React.useState(false);
  const [badges, setBadges] = React.useState<Record<string, number>>({
    recruitment: 0,
    calendar: 0,
    notifications: 0,
  });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    // Fetch Dynamic Navigation
    fetch("/api/navigation")
      .then((res) => res.json())
      .then((data) => setNavigation(data))
      .catch((err) => console.error("Failed to fetch navigation:", err));

    fetch("/api/guild/info")
      .then((res) => res.json())
      .then((data) => {
        if (data?.icon_url) setIconUrl(data.icon_url);
        if (data?.name) setGuildName(data.name);
        if (data?.version) setAppVersion(data.version);
      })
      .catch((err) => console.error("Failed to fetch guild info:", err));

    // Fetch notifications badge
    const fetchNotifications = () => {
      fetch("/api/notifications")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setBadges((prev) => ({
              ...prev,
              notifications: data.filter((n: any) => !n.isRead).length,
            }));
          }
        })
        .catch((err) =>
          console.error("Failed to fetch notification badges:", err),
        );
    };

    // Fetch recruitment badge
    const fetchRecruitmentCount = () => {
      fetch("/api/recruitment/count")
        .then(async (res) => {
          if (!res.ok) return { count: 0 };
          return res.json();
        })
        .then((data) => {
          setBadges((prev) => ({ ...prev, recruitment: data.count || 0 }));
        })
        .catch((err) =>
          console.error("Failed to fetch recruitment count:", err),
        );
    };

    /*
    // Refined subscription with retry logic
    let notifChannel: any = null
    
    const startRealtime = () => {
      notifChannel = supabase
        .channel('sidebar_notifications')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'system_notifications' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_notifications_read', filter: `user_id=eq.${session?.user?.id}` }, () => fetchNotifications())
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            console.error("Supabase Realtime (Notifications) failed. Check if Realtime is enabled for 'system_notifications' table.")
          }
        })
    }
    
    // Tiny delay to ensure WebSocket is ready in some edge cases
    const timer = setTimeout(startRealtime, 1000)
    */

    fetchNotifications();
    fetchRecruitmentCount();

    // Simple direct subscription for better production reliability
    const notifChannel = supabase
      .channel("sidebar_notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "system_notifications" },
        () => fetchNotifications(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_notifications_read",
          filter: `user_id=eq.${session?.user?.id}`,
        },
        () => fetchNotifications(),
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Realtime Notifications: Conectado (SUBSCRIBED)");
        } else {
          console.warn(`Realtime Notifications: ${status}`);
        }
      });

    // Real-time subscription for recruitment applications
    // Even if RLS prevents SELECT, the event payload might trigger a re-fetch of our secure API
    const recruitmentChannel = supabase
      .channel("sidebar_recruitment_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "recruitment_applications" },
        () => fetchRecruitmentCount(),
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Realtime Recruitment: Conectado (SUBSCRIBED)");
        } else {
          console.warn(`Realtime Recruitment: ${status}`);
        }
      });

    return () => {
      supabase.removeChannel(recruitmentChannel);
      supabase.removeChannel(notifChannel);
    };
  }, [roleLevel, session?.user?.id, mounted]);

  // Update PWA OS Badge when notification or recruitment numbers change
  React.useEffect(() => {
    if (typeof navigator !== "undefined" && "setAppBadge" in navigator) {
      const totalBadges =
        (badges.notifications || 0) + (badges.recruitment || 0);
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
  }, [badges]);

  const processedNavigation = React.useMemo(() => {
    const inject = (items: any[]): any[] => {
      return items.map((item) => ({
        ...item,
        badge: item.badge_key
          ? badges[item.badge_key]
          : item.app_id === "calendar"
            ? badges.calendar
            : undefined,
        children: item.children ? inject(item.children) : [],
      }));
    };
    return inject(navigation);
  }, [badges, navigation]);

  // Extract CTA item and separate top-level links from groups
  const { topLevelLinks, groupedLinks, ctaItem } = React.useMemo(() => {
    const filterRecursive = (items: any[]): any[] => {
      return items
        .filter((item) => item.app_id !== "desktop-app-cta")
        .map((item) => ({
          ...item,
          children: item.children ? filterRecursive(item.children) : [],
        }));
    };

    const findCta = (items: any[]): any | null => {
      for (const item of items) {
        if (item.app_id === "desktop-app-cta") return item;
        if (item.children) {
          const found = findCta(item.children);
          if (found) return found;
        }
      }
      return null;
    };

    const filteredItems = filterRecursive(processedNavigation);
    const topLevel: any[] = [];
    const groups: any[] = [];

    filteredItems.forEach((item) => {
      if (item.url) {
        topLevel.push(item);
      } else {
        groups.push(item);
      }
    });

    return {
      topLevelLinks: topLevel,
      groupedLinks: groups,
      ctaItem: findCta(processedNavigation),
    };
  }, [processedNavigation]);

  // Calculate the best matching URL from the entire navigation tree
  // to avoid double highlighting (e.g. /bis vs /bis/admin)
  const activeUrl = React.useMemo(() => {
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
  }, [processedNavigation, pathname]);

  if (!mounted) {
    return (
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader className="h-12" />
        <SidebarContent />
        <SidebarFooter className="h-16" />
      </Sidebar>
    );
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
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
                      className="text-[9px] px-1 py-0 h-3.5 bg-blue-500/10 text-blue-400 border-blue-500/20 font-black"
                    >
                      {appVersion}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {topLevelLinks.length > 0 && (
          <NavMain
             items={topLevelLinks}
             activeUrl={activeUrl || undefined}
          />
        )}
        {groupedLinks.map((group: any) => (
          <NavMain
            key={group.id || group.name}
            label={group.name}
            items={group.children}
            activeUrl={activeUrl || undefined}
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
        {ctaItem && (
          <div
            className={cn(
              "px-2",
              sidebarState === "collapsed"
                ? "flex justify-center mb-4"
                : "px-4 mb-4",
            )}
          >
            {sidebarState !== "collapsed" ? (
              <Button
                asChild
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black uppercase text-[10px] tracking-widest h-10 rounded-xl shadow-lg shadow-blue-500/20 border border-white/10"
              >
                <a
                  href={ctaItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  <IconDownload className="size-4" />
                  {ctaItem.name}
                </a>
              </Button>
            ) : (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-9 rounded-xl bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/10"
                    onClick={() => window.open(ctaItem.url, "_blank")}
                  >
                    <IconDownload className="size-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="bg-zinc-950 border-white/10 text-white font-bold text-xs"
                >
                  {ctaItem.name}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
