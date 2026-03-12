import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/shared/auth/auth-options"
import { redirect } from "next/navigation"
import { LandingNavigation } from "@/domains/landing/components/navigation"
import { AccountClient } from "@/domains/account/components/account-client"

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Mis Personajes - Artic Tempest",
        description: "Gestiona tus personajes de World of Warcraft vinculados a Artic Tempest mediante Battle.net.",
        robots: {
            index: false,
            follow: false
        }
    }
}

export default async function MisPersonajesPage(props: {
    searchParams: Promise<{ error?: string, success?: string }>
}) {
    const searchParams = await props.searchParams
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect("/")
    }

    // Fetch Profile & BattleTag
    const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("battlenet_battletag")
        .eq("user_id", session.user.id)
        .single()

    // Fetch characters
    const { data: characters } = await supabaseAdmin
        .from("bnet_characters")
        .select("*")
        .eq("user_id", session.user.id)
        .order("level", { ascending: false })
        .order("name", { ascending: true })

    return (
        <main className="min-h-screen bg-black">
            <LandingNavigation />
            <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
                <div className="mb-10 text-center md:text-left">
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight">Mis Personajes</h1>
                    <p className="text-white/50 mt-2">Gestiona tu vinculación con Battle.net y sincroniza tus personajes.</p>
                </div>

                {searchParams.error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 rounded-md p-4 mb-4 text-sm font-medium">
                        {searchParams.error === "auth_failed" && "El inicio de sesión de Battle.net fue cancelado o falló."}
                        {searchParams.error === "token_exchange" && "No pudimos intercambiar tus credenciales en los servidores de Blizzard."}
                        {searchParams.error === "invalid_state" && "Sesión caducada por seguridad. Inténtalo de nuevo."}
                        {searchParams.error === "unknown" && "Ha ocurrido un error inesperado al vincular tu cuenta de WoW."}
                    </div>
                )}
                {searchParams.success === "linked" && (
                    <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 rounded-md p-4 mb-4 text-sm font-medium">
                        ¡Cuenta de Battle.net vinculada correctamente y personajes actualizados!
                    </div>
                )}

                <div className="bg-zinc-950/40 border border-white/5 p-8 rounded-3xl backdrop-blur-md">
                    <AccountClient
                        battletag={profile?.battlenet_battletag || null}
                        characters={characters || []}
                    />
                </div>
            </div>
        </main>
    )
}
