import { SettingsNotificationsClient } from "@/components/settings/settings-notifications";
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/common/sidebar"
import React from "react"

export const metadata = {
    title: "Notificaciones de Sistema | GuildBoard Settings",
};

export default function SettingsNotificationsPage() {
    return <SettingsNotificationsClient />;
}
