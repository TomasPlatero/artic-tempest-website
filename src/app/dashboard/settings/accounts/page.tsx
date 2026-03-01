// src/app/dashboard/settings/accounts/page.tsx
import { sb } from "@/infrastructure/auth/auth-options"
import { AccountsClient } from "@/components/settings/accounts-client"
import { IconArrowLeft } from "@tabler/icons-react"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function AccountsSettingsPage() {
    // Fetch all profiles
    const { data: profiles } = await sb
        .from('profiles')
        .select('*')
        .order('discord_username', { ascending: true })

    // Fetch character counts per user
    const { data: charCounts } = await sb
        .from('bnet_characters')
        .select('user_id')

    const countMap: Record<string, number> = {}
    charCounts?.forEach(c => {
        countMap[c.user_id] = (countMap[c.user_id] || 0) + 1
    })

    const profilesWithCounts = profiles?.map(p => ({
        ...p,
        character_count: countMap[p.user_id] || 0
    })) || []

    return (
        <div className="flex flex-col gap-6 p-6 lg:px-8 w-full max-w-full">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/settings" className="p-2 rounded-full hover:bg-white/5 transition-colors">
                    <IconArrowLeft className="size-5 text-white/50" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Gestión de Cuentas</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Control de identidades, vinculación de APIs y salud de tokens OAuth.
                    </p>
                </div>
            </div>

            <AccountsClient initialProfiles={profilesWithCounts} />
        </div>
    )
}
