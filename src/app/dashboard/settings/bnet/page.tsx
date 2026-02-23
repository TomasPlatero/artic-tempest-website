import { sb } from "@/infrastructure/auth/auth-options"
import { SettingsBnetClient } from "@/components/settings/settings-bnet"
import { getGuildCredentials } from "@/infrastructure/auth/credentials"

export const runtime = "nodejs"

async function getBnetData() {
    const { count: memberCount } = await sb
        .from("guild_members")
        .select("*", { count: "exact", head: true })

    const { data: lastSynced } = await sb
        .from("guild_members")
        .select("synced_at")
        .order("synced_at", { ascending: false })
        .limit(1)
        .single()

    const { data: guild } = await sb
        .from("guilds_managed")
        .select("id")
        .limit(1)
        .single()

    const creds = await getGuildCredentials()
    const bnetConfigured = !!creds.bnet_client_id && !!creds.bnet_client_secret

    return {
        memberCount: memberCount ?? 0,
        lastSync: lastSynced?.synced_at ?? null,
        bnetConfigured,
        hasGuild: !!guild,
    }
}

export default async function SettingsBnetPage() {
    const data = await getBnetData()
    return <SettingsBnetClient {...data} />
}
