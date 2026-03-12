import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/shared/auth/auth-options"
import { cookies } from "next/headers"
import crypto from "crypto"
import { getGuildCredentials } from "@/shared/auth/credentials"

export async function GET(request: Request) {
    const session = await getServerSession(authOptions)
    const reqUrl = new URL(request.url)
    const baseUrl = process.env.NEXTAUTH_URL || reqUrl.origin

    if (!session) {
        return NextResponse.redirect(new URL("/", baseUrl))
    }

    // Generar un state token para seguridad CSRF
    const state = crypto.randomBytes(16).toString("hex")

    const cookieStore = await cookies()
    cookieStore.set("bnet_oauth_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 10, // 10 minutes
        path: "/",
    })

    const creds = await getGuildCredentials()
    const clientId = creds.bnet_client_id
    const redirectUri = `${baseUrl}/api/bnet/callback`
    // "wow.profile" is the scope required to read a user's characters
    const scope = "wow.profile"

    const authUrl = new URL("https://oauth.battle.net/authorize")
    authUrl.searchParams.set("client_id", clientId!)
    authUrl.searchParams.set("redirect_uri", redirectUri)
    authUrl.searchParams.set("response_type", "code")
    authUrl.searchParams.set("scope", scope)
    authUrl.searchParams.set("state", state)

    return NextResponse.redirect(authUrl.toString())
}
