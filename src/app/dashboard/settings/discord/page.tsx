
import { getServerSession } from "next-auth"
import { authOptions } from "@/infrastructure/auth/auth-options"
import { redirect } from "next/navigation"
import { SettingsDiscordClient } from "../../../../components/settings/settings-discord"
import { getGuildCredentials } from "@/infrastructure/auth/credentials"

export default async function DiscordSettingsPage() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.roleLevel !== 'gm') {
        redirect("/dashboard")
    }

    const credentials = await getGuildCredentials()

    const { createClient } = await import("@supabase/supabase-js")
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
    const { data: commands } = await sb.from("discord_commands").select("*").order("name")

    return (
        <SettingsDiscordClient
            initialCredentials={credentials}
            initialCommands={commands || []}
        />
    )
}
