"use client";

import { IconChevronRight } from "@/shared/ui/tabler-icons";
import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/shared/components/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible";
import { cn } from "@/shared/tailwind/tailwind-utils";
import { getIconByName } from "@/shared/lib/icon-utils";
import { normalizeZonaRaiderPath } from "@/shared/lib/zona-raider-path";

export function NavMain({
  items,
  label,
  activeUrl,
  ariaLabel,
}: {
  label?: string;
  ariaLabel?: string;
  items: any[];
  activeUrl?: string;
}) {
  const pathname = usePathname();
  const currentPathname = normalizeZonaRaiderPath(pathname);

  const renderItem = (item: any) => {
    const checkActive = (navItem: any): boolean => {
      const urlToMatch = activeUrl || pathname;
      const normalizedUrlToMatch = normalizeZonaRaiderPath(urlToMatch);
      if (navItem.url) {
        const normalizedNavUrl = normalizeZonaRaiderPath(navItem.url);
        if (normalizedUrlToMatch === normalizedNavUrl) return true;
      }
      return (
        navItem.children?.some((child: any) => checkActive(child)) || false
      );
    };

    const renderSubItem = (subItem: any): React.ReactNode => {
      const subHasChildren =
        subItem.children && subItem.children.length > 0;
      const subIsActive = checkActive(subItem);
      const SubIcon = getIconByName(subItem.icon_name);
      const normalizedSubUrl = subItem.url
        ? normalizeZonaRaiderPath(subItem.url)
        : "";
      const normalizedActiveUrl = activeUrl
        ? normalizeZonaRaiderPath(activeUrl)
        : null;

      if (subHasChildren) {
        return (
          <Collapsible
            key={subItem.id || subItem.name}
            asChild
            defaultOpen={subIsActive}
            className="group/nested-collapsible"
          >
            <SidebarMenuSubItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuSubButton
                  id={subItem.element_id}
                  className={cn(
                    " rounded-lg h-8.5",
                    subIsActive
                      ? "text-blue-400 font-semibold bg-blue-500/[0.05]"
                      : "text-white/70 hover:text-white hover:bg-white/[0.03]",
                    subItem.css_class,
                  )}
                >
                  {SubIcon && (
                    <SubIcon className="size-3.5 shrink-0" />
                  )}
                  <span className="text-[13px] tracking-wide">
                    {subItem.name}
                  </span>
                  <IconChevronRight className="ml-auto size-3 opacity-40 transition-transform duration-300 group-data-[state=open]/nested-collapsible:rotate-90" />
                </SidebarMenuSubButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub className="border-l border-white/5 ml-4 pl-3 gap-1.5 py-1">
                  {subItem.children.map((child: any) =>
                    renderSubItem(child),
                  )}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuSubItem>
          </Collapsible>
        );
      }

      return (
        <SidebarMenuSubItem key={subItem.id || subItem.name}>
          <SidebarMenuSubButton
            id={subItem.element_id}
            asChild
            className={cn(
              " rounded-lg h-8.5",
              (
                activeUrl
                  ? normalizedActiveUrl === normalizedSubUrl
                  : currentPathname === normalizedSubUrl
              )
                ? "text-blue-400 font-semibold bg-blue-500/[0.05]"
                : "text-white/70 hover:text-white hover:bg-white/[0.03]",
              subItem.css_class,
            )}
            isActive={
              activeUrl
                ? normalizedActiveUrl === normalizedSubUrl
                : currentPathname === normalizedSubUrl
            }
          >
            <a
              href={subItem.url}
              aria-current={
                activeUrl
                  ? normalizedActiveUrl === normalizedSubUrl
                    ? "page"
                    : undefined
                  : currentPathname === normalizedSubUrl
                    ? "page"
                    : undefined
              }
            >
              <span className="text-[13px] tracking-wide">
                {subItem.name}
              </span>
            </a>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      );
    };

    const isActive = checkActive(item);
    const hasChildren = item.children && item.children.length > 0;
    const IconComponent = getIconByName(item.icon_name);

    if (hasChildren) {
      return (
        <SidebarMenuItem key={item.id || item.name}>
          <Collapsible
            asChild
            defaultOpen={isActive}
            className="group/collapsible"
          >
            <div className="flex flex-col">
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  id={item.element_id}
                  tooltip={item.name}
                  className={cn(
                    " h-10 rounded-xl",
                    isActive
                      ? "bg-blue-500/[0.08] text-white font-semibold border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.05)]"
                      : "text-white/70 hover:text-white hover:bg-white/[0.03] hover:border hover:border-white/[0.05] active:bg-white/10",
                    item.css_class,
                  )}
                >
                  <IconComponent
                    className={cn(
                      "size-4.5 transition-transform duration-300 group-hover/collapsible:scale-110",
                      isActive &&
                        "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]",
                    )}
                  />
                  <span className="ml-3 tracking-wide text-[13.5px]">
                    {item.name}
                  </span>
                  <IconChevronRight className="ml-auto size-3.5 opacity-40 transition-transform duration-300 group-data-[state=open]/collapsible:rotate-90" />
                  {isActive && (
                    <>
                      <div className="absolute left-0 top-2.5 bottom-2.5 w-[2px] bg-blue-500 rounded-r-full shadow-[0_0_8px_rgba(59,130,246,1)]" />
                      <div className="absolute inset-0 bg-linear-to-r from-blue-500/[0.05] to-transparent pointer-events-none" />
                    </>
                  )}
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub className="border-l border-white/5 ml-4.5 pl-4 gap-1.5 py-1">
                  {item.children.map((child: any) =>
                    renderSubItem(child),
                  )}
                </SidebarMenuSub>
              </CollapsibleContent>
            </div>
          </Collapsible>
        </SidebarMenuItem>
      );
    }

    return (
      <SidebarMenuItem key={item.id || item.name}>
        <SidebarMenuButton
          id={item.element_id}
          tooltip={item.name}
          asChild
          className={cn(
            "relative  group/nav-item overflow-hidden rounded-xl h-10",
            isActive
              ? "bg-blue-500/[0.08] text-white font-semibold border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)] active:scale-[0.98]"
              : "text-white/70 hover:text-white hover:bg-white/[0.03] hover:border hover:border-white/[0.05] active:bg-white/10 active:scale-[0.98]",
            item.css_class,
          )}
        >
          <a
            href={item.url}
            aria-current={isActive ? "page" : undefined}
            className="flex items-center w-full px-3"
          >
            <IconComponent
              className={cn(
                "size-4.5 ",
                isActive
                  ? "text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.6)]"
                  : "group-hover/nav-item:scale-110 group-hover/nav-item:text-white",
              )}
            />
            <span className="ml-3 tracking-wide text-[13.5px]">
              {item.name}
            </span>
            {item.badge !== undefined &&
              item.badge !== null &&
              item.badge !== 0 && (
                <span className="ml-auto flex min-size-4.5 px-1.5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[9px] font-semibold text-white border border-blue-400/20 shadow-[0_0_10px_rgba(37,99,235,0.3)] animate-in fade-in zoom-in duration-500">
                  {item.badge}
                </span>
              )}
            {isActive && (
              <>
                <div className="absolute left-0 top-2.5 bottom-2.5 w-[2px] bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,1)]" />
                <div className="absolute inset-0 bg-linear-to-r from-blue-500/[0.05] to-transparent pointer-events-none" />
              </>
            )}
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <nav aria-label={ariaLabel || label || "Navegación"}>
      <SidebarGroup>
        {label && (
          <SidebarGroupLabel className="text-[10px] font-semibold tracking-[0.25em] text-white/50 uppercase pt-6 pb-2 px-4 select-none">
            {label}
          </SidebarGroupLabel>
        )}
        <SidebarGroupContent>
          <SidebarMenu>{items.map(renderItem)}</SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </nav>
  );
}
