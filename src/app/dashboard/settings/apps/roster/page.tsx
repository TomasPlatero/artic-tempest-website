import { sb } from "@/infrastructure/auth/auth-options"
import { SettingsRosterClient } from "@/components/settings/settings-roster"

export const runtime = "nodejs"

async function getRosterSettings() {
    const { data: rawRanks } = await sb
        .from("guild_ranks")
        .select("rank, name, is_visible, app_role")
        .order("rank", { ascending: true })

    const defaultNames = ["Guild Master", "Officer", "Officer Alt", "Raider", "Trial", "Social", "Alt", "Initiate", "Recruit", "Member"]

    const maxRank = 9
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
        rankVisibility,
        rankNames,
        rankRoles
    }
}

export default async function RosterSettingsPage() {
    const data = await getRosterSettings()
    return <SettingsRosterClient {...data} />
}
