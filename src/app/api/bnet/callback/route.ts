import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"
import { cookies } from "next/headers"
import { getGuildCredentials } from "@/infrastructure/auth/credentials"

export const runtime = "nodejs"

export async function GET(request: Request) {
    try {
        const reqUrl = new URL(request.url)
        const baseUrl = process.env.NEXTAUTH_URL || reqUrl.origin

        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.redirect(new URL("/", baseUrl))
        }

        const { searchParams } = reqUrl
        const code = searchParams.get("code")
        const state = searchParams.get("state")
        const error = searchParams.get("error")

        if (error || !code) {
            console.error("Bnet OAuth error:", error)
            return NextResponse.redirect(new URL("/dashboard/cuenta?error=auth_failed", baseUrl))
        }

        const cookieStore = await cookies()
        const savedState = cookieStore.get("bnet_oauth_state")?.value

        if (!state || state !== savedState) {
            console.error("Bnet OAuth state mismatch")
            return NextResponse.redirect(new URL("/dashboard/cuenta?error=invalid_state", baseUrl))
        }

        const creds = await getGuildCredentials()
        const clientId = creds.bnet_client_id
        const clientSecret = creds.bnet_client_secret
        const redirectUri = `${baseUrl}/api/bnet/callback`

        if (!clientId || !clientSecret) {
            throw new Error("Faltan credenciales de Battle.net (configúralas en Ajustes > Dashboard)")
        }

        const authString = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

        // 1. Intercambiar code por token
        const tokenParams = new URLSearchParams()
        tokenParams.append("redirect_uri", redirectUri)
        tokenParams.append("scope", "wow.profile")
        tokenParams.append("grant_type", "authorization_code")
        tokenParams.append("code", code)

        const tokenRes = await fetch("https://oauth.battle.net/token", {
            method: "POST",
            headers: {
                "Authorization": `Basic ${authString}`,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: tokenParams.toString()
        })

        if (!tokenRes.ok) {
            const errBody = await tokenRes.text()
            console.error("Bnet token exchange failed:", errBody)
            return NextResponse.redirect(new URL("/dashboard/cuenta?error=token_exchange", baseUrl))
        }

        const tokenData = await tokenRes.json()
        const accessToken = tokenData.access_token

        // 2. Fetch Account User profile (BattleTag + Account ID)
        const userInfoRes = await fetch("https://oauth.battle.net/userinfo", {
            headers: { "Authorization": `Bearer ${accessToken}` }
        })

        if (!userInfoRes.ok) {
            throw new Error("Failed to fetch Battle.net user info")
        }

        const userInfo = await userInfoRes.json()
        const bnetId = userInfo.id?.toString()
        const bnetTag = userInfo.battletag

        // 3. Fetch WoW Profile (Characters)
        const wowRes = await fetch("https://eu.api.blizzard.com/profile/user/wow?namespace=profile-eu&locale=es_ES", {
            headers: { "Authorization": `Bearer ${accessToken}` }
        })

        // El usuario puede no tener cuenta de WoW
        let characters: any[] = []
        if (wowRes.ok) {
            const wowProfile = await wowRes.json()
            console.log("[BNET CALLBACK] WOW Profile base:", JSON.stringify({
                id: wowProfile.id,
                accounts_count: wowProfile.wow_accounts?.length || 0
            }))

            characters = wowProfile.wow_accounts?.flatMap((acc: any) => acc.characters || []) || []
            console.log(`[BNET CALLBACK] Flattened characters array length: ${characters.length}`)
        } else {
            console.error("[BNET CALLBACK] WOW Profile fetch failed", await wowRes.text())
        }

        // 4. Update the DB: profiles -> bnet_characters -> link guild_members
        const userId = session.user.id

        // Guardamos battletag en su perfil
        await sb.from("profiles").update({
            battlenet_id: bnetId,
            battlenet_battletag: bnetTag
        }).eq("user_id", userId)

        // Limpiamos y reinsertamos sus pjs
        if (characters.length > 0) {
            await sb.from("bnet_characters").delete().eq("user_id", userId)

            const charRows = characters.map(c => ({
                user_id: userId,
                name: c.name,
                realm: c.realm.name,
                realm_slug: c.realm.slug,
                class_id: c.playable_class.id,
                race_id: c.playable_race.id,
                level: c.level,
                faction: c.faction?.type?.toLowerCase() || 'neutral'
            }))

            const { error: insertErr } = await sb.from("bnet_characters").insert(charRows)
            if (insertErr) {
                console.error("[BNET CALLBACK] DB Insert Error:", insertErr)
            } else {
                console.log(`[BNET CALLBACK] Inserted ${charRows.length} characters successfully`)
            }

            // Finalmente: "Reclamar" los que ya estén en la hermandad (guild_members)
            for (const c of charRows) {
                await sb.from("guild_members")
                    .update({ profile_id: userId })
                    .match({ character_name: c.name, realm_slug: c.realm_slug, profile_id: null })
            }
        }

        return NextResponse.redirect(new URL("/dashboard/cuenta?success=linked", baseUrl))

    } catch (e: any) {
        console.error("Bnet callback unhandled error:", e)
        const errUrl = new URL(request.url)
        const baseUrl = process.env.NEXTAUTH_URL || errUrl.origin
        return NextResponse.redirect(new URL("/dashboard/cuenta?error=unknown", baseUrl))
    }
}
