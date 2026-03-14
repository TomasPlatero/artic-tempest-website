import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/shared/auth/auth-options"
import { redirect } from "next/navigation"
import { AccountClient } from "@/domains/account/components/account-client"

export const runtime = "nodejs"

export default async function CuentaPage(props: {
    searchParams: Promise<{ error?: string, success?: string }>
}) {
    const searchParams = await props.searchParams
    const session = await getServerSession(authOptions)
    if (!session) {
        redirect("/")
    }

    if (session.user.roleLevel?.toLowerCase() === "invitado") {
        redirect("/mis-personajes")
    }

    // Fecth Profile & BattleTag
    const { data: profile } = await supabaseAdmin.from("profiles")
        .select("battlenet_battletag")
        .eq("user_id", session.user.id)
        .single()

    // Fetch characters
    const { data: characters } = await supabaseAdmin.from("bnet_characters")
        .select("*")
        .eq("user_id", session.user.id)
        .order("level", { ascending: false })
        .order("name", { ascending: true })

    return (
        <div className="flex flex-col py-6 px-4 lg:px-6 w-full gap-2 relative z-10 animate-in fade-in duration-500">
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

            <AccountClient
                battletag={profile?.battlenet_battletag || null}
                characters={characters || []}
            />
        </div>
    )
}
