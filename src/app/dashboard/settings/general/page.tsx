// src/app/dashboard/settings/general/page.tsx
import { sb } from "@/infrastructure/auth/auth-options"
import { SettingsGeneralClient } from "@/components/settings/settings-general"

export const runtime = "nodejs"

const MASK = "••••••••••••••••"

async function getGeneralData() {
    const { data: guild } = await sb
        .from("guilds_managed")
        .select("name, realm, region, icon_url, discord_client_id, discord_client_secret, discord_guild_id, bnet_client_id, bnet_client_secret, wcl_client_id, wcl_client_secret")
        .limit(1)
        .single()

    const { data: rawRanks } = await sb
        .from("guild_ranks")
        .select("rank, name, is_visible, app_role")

    const defaultNames = ["Guild Master", "Officer", "Officer Alt", "Raider", "Trial", "Social", "Alt", "Initiate", "Recruit", "Member"]

    const maxRank = Math.max(10, ...(rawRanks?.map(r => r.rank) || []))
    const rankIndices = Array.from({ length: maxRank + 1 }, (_, i) => i)

    const rankVisibility = rankIndices.map(i => {
        const found = rawRanks?.find(v => v.rank === i)
        return found ? found.is_visible : false
    })

    const rankNames = rankIndices.map(i => {
        const found = rawRanks?.find(v => v.rank === i)
        return found?.name || defaultNames[i] || `Rank ${i}`
    })

    const rankRoles = rankIndices.map(i => {
        const found = rawRanks?.find(v => v.rank === i)
        return found?.app_role || 'raider'
    })

    return {
        guild: guild ? { name: guild.name, realm: guild.realm, region: guild.region, iconUrl: guild.icon_url } : null,
        rankVisibility,
        rankNames,
        rankRoles,
        credentials: {
            discord_client_id: guild?.discord_client_id || "",
            discord_client_secret: guild?.discord_client_secret ? MASK : "",
            discord_guild_id: guild?.discord_guild_id || "",
            bnet_client_id: guild?.bnet_client_id || "",
            bnet_client_secret: guild?.bnet_client_secret ? MASK : "",
            wcl_client_id: guild?.wcl_client_id || "",
            wcl_client_secret: guild?.wcl_client_secret ? MASK : "",
        }
    }
}

export default async function SettingsGeneralPage() {
    const data = await getGeneralData()
    return <SettingsGeneralClient {...data} />
}

