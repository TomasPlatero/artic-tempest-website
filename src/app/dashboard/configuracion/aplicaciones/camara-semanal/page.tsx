import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/shared/auth/auth-options"
import { redirect } from "next/navigation"
import { WeeklyVaultAdminClient } from "./components/weekly-vault-admin-client"
import { Suspense } from "react"
import { IconLoader2, IconArrowLeft, IconCamera } from "@tabler/icons-react"
import Link from "next/link"
import { Button } from "@/shared/ui/button"

import { Forbidden } from "@/shared/components/forbidden"
import { getAppPermission } from "@/shared/auth/permissions"

export default async function WeeklyVaultAdminPage() {
    const session = await getServerSession(authOptions)
    if (!session) {
        redirect("/")
    }

    const roleLevel = session?.user?.roleLevel ?? "member"
    const { canView } = await getAppPermission(roleLevel, "weekly-vault-admin")

    if (!canView) {
        return (
            <div className="flex flex-col gap-6 py-6 px-4 lg:px-6 w-full">
                <Forbidden />
            </div>
        )
    }

    // Fetch data for the client component
    const { data: uploads } = await supabaseAdmin
        .from("weekly_vault_screenshots")
        .select(`
            id, created_at, week_start, image_url, character_id,
            profiles(discord_username, discord_avatar),
            bnet_characters(name, class_id, realm_slug)
        `)
        .order("created_at", { ascending: false })

    // Fetch ranks to map integers to names
    const { data: ranks } = await supabaseAdmin
        .from("guild_ranks")
        .select("rank, name")
    
    const rankMap = Object.fromEntries(ranks?.map((r) => [r.rank, r.name]) || [])

    // Fetch members to link characters to ranks
    const characterIds = uploads?.map(u => u.character_id) || [];
    const { data: members } = await supabaseAdmin
        .from("guild_members")
        .select("bnet_character_id, rank")
        .in("bnet_character_id", characterIds)

    const memberRankMap = Object.fromEntries(members?.filter(m => m.bnet_character_id).map((m) => [m.bnet_character_id, m.rank]) || [])

    const enrichedUploads = uploads?.map(u => ({
        ...u,
        guild_rank_level: memberRankMap[u.character_id] !== undefined ? memberRankMap[u.character_id] : 99,
        guild_rank_name: memberRankMap[u.character_id] !== undefined ? rankMap[memberRankMap[u.character_id]] : "Alter/Desconocido"
    })) || []

    return (
        <div className="flex flex-col gap-6 py-6 px-4 lg:px-6 w-full animate-in fade-in duration-500">
            <div className="flex items-start md:items-center gap-3 md:gap-4">
                <Link href="/dashboard/configuracion/aplicaciones">
                    <Button variant="outline" size="icon" className="size-10 md:size-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 transition-all shadow-xl shrink-0">
                        <IconArrowLeft className="size-5 md:size-6" />
                    </Button>
                </Link>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-black font-heading italic tracking-tight uppercase flex items-center gap-2 md:gap-3 flex-wrap">
                        <IconCamera className="size-6 md:size-8 text-white/50 shrink-0" />
                        <span>GESTIÓN CÁMARA SEMANAL</span>
                    </h1>
                    <p className="text-xs sm:text-sm font-medium text-white/40 mt-1 md:mt-2 uppercase tracking-widest leading-tight">
                        Revisa el loot que ha salido en la Gran Cámara a los miembros de la hermandad.
                    </p>
                </div>
            </div>

            <Suspense fallback={
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                    <IconLoader2 className="size-8 animate-spin" />
                    <p className="text-sm font-medium">Cargando capturas...</p>
                </div>
            }>
                <WeeklyVaultAdminClient initialUploads={enrichedUploads} />
            </Suspense>
        </div>
    )
}
