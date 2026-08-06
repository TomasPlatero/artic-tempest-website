import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from '@/auth';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
const MAIN_CHARACTER_COOKIE = "artic-tempest-main-character-id"

export async function DELETE() {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const profileId = session.user.id

        const { data: characters, error: charactersLookupError } = await supabaseAdmin
            .from("bnet_characters")
            .select("id")
            .eq("user_id", profileId)

        if (charactersLookupError) {
            throw charactersLookupError
        }

        const characterIds = (characters ?? []).flatMap((character) =>
            character.id ? [character.id] : [],
        )

        if (characterIds.length > 0) {
            const { error: guildMembersError } = await supabaseAdmin
                .from("guild_members")
                .update({ bnet_character_id: null })
                .in("bnet_character_id", characterIds)

            if (guildMembersError) {
                throw guildMembersError
            }
        }

        const { error: profileError } = await supabaseAdmin.from("profiles")
            .update({
                battlenet_id: null,
                battlenet_battletag: null,
                main_character_id: null,
            })
            .eq("user_id", profileId)

        if (profileError) {
            throw profileError
        }

        const { error: charactersError } = await supabaseAdmin
            .from("bnet_characters")
            .delete()
            .eq("user_id", profileId)

        if (charactersError) {
            throw charactersError
        }

        const response = NextResponse.json({ success: true, message: "Cuenta de Battle.net desvinculada." })
        response.cookies.set(MAIN_CHARACTER_COOKIE, "", {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            maxAge: 0,
        })

        revalidatePath("/zona-raider")
        revalidatePath("/zona-raider/cuenta")
        revalidatePath("/mis-personajes")

        return response
    } catch (e: any) {
        console.error("[BNET UNLINK ERROR]", e)
        return NextResponse.json({ error: e.message || "Error interno del servidor" }, { status: 500 })
    }
}
