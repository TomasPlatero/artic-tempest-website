// src/app/dashboard/configuracion/donaciones/page.tsx
import { supabaseAdmin, authOptions } from "@/shared/auth/auth-options"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { getAppPermission } from "@/shared/auth/permissions"
import * as flags from "@/flags"
import { Forbidden } from "@/shared/components/forbidden"
import { SettingsDonationsClient } from "@/domains/settings/components/settings-donations"
import { AdminPageHeader } from "@/shared/components/admin-page-header"
import React from "react"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function SettingsDonationsPage() {
    const session = await getServerSession(authOptions)
    const roleLevel = session?.user?.roleLevel?.toLowerCase() ?? "invitado"
    
    // Check permission
    const permission = await getAppPermission(roleLevel, "donations")
    if (!permission.canManage || !(await flags.enableEconomy())) {
        redirect("/dashboard")
    }

    // Fetch all logs
    const { data: donations } = await supabaseAdmin
        .from("guild_donations")
        .select("*")
        .order("created_at", { ascending: false })

    // Fetch all goals
    const { data: goals } = await supabaseAdmin
        .from("guild_goals")
        .select("*")
        .order("created_at", { ascending: false })

    // Fetch guild settings (Bizum, PayPal)
    const { data: guildSettings } = await supabaseAdmin
        .from("guilds_managed")
        .select("bizum_number, paypal_link")
        .limit(1)
        .maybeSingle()

    return (
        <div className="flex flex-col gap-4 py-6 px-4 lg:px-6 w-full animate-in fade-in duration-500">
            <AdminPageHeader 
                title="ECONOMÍA DE HERMANDAD" 
                description="Gestiona las metas de recaudación y visualiza el historial de aportaciones."
                backHref="/dashboard/configuracion"
            />
            
            <SettingsDonationsClient 
                donations={donations || []} 
                goals={goals || []} 
                guildSettings={guildSettings || { bizum_number: "", paypal_link: "" }}
            />
        </div>
    )
}
