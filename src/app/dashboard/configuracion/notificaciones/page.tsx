import { SettingsNotificationsClient } from "@/domains/settings/components/settings-notifications";
import { AppSidebar } from "@/shared/layout/app-sidebar"
import { SiteHeader } from "@/shared/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/shared/components/sidebar"
import React from "react"

export const metadata = {
    title: "Notificaciones de Sistema | GuildBoard Settings",
};

export default function SettingsNotificationsPage() {
    return <SettingsNotificationsClient />;
}
