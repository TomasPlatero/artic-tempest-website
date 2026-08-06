import { NextResponse } from "next/server"
import { auth } from '@/auth';
import { cookies } from "next/headers"
import crypto from "crypto"
import { getGuildCredentials } from "@/shared/auth/credentials"
import { toZonaRaiderPath } from "@/shared/lib/zona-raider-path"

const ALLOWED_RETURN_TO = new Set([
    "/mis-personajes",
    "/zona-raider/cuenta",
])

function resolveReturnTo(pathname: string | null) {
    return pathname && ALLOWED_RETURN_TO.has(pathname)
        ? toZonaRaiderPath(pathname)
        : null
}

export async function POST(request: Request) {
    const session = await auth()
    const reqUrl = new URL(request.url)
    const baseUrl = process.env.NEXTAUTH_URL || reqUrl.origin

    if (!session) {
        return NextResponse.json({ redirect: new URL("/", baseUrl).toString() }, { status: 401 })
    }

    const { returnTo: returnToParam } = await request.json().catch(() => ({ returnTo: null }))

    const state = crypto.randomBytes(16).toString("hex")
    const returnTo = resolveReturnTo(returnToParam)

    const cookieStore = await cookies()
    cookieStore.set("bnet_oauth_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 10,
        path: "/",
    })

    if (returnTo) {
        cookieStore.set("bnet_oauth_return_to", returnTo, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 10,
            path: "/",
        })
    } else {
        cookieStore.delete("bnet_oauth_return_to")
    }

    const creds = await getGuildCredentials()
    const clientId = creds.bnet_client_id
    const redirectUri = `${baseUrl}/api/bnet/callback`
    const scope = "wow.profile"

    const authUrl = new URL("https://oauth.battle.net/authorize")
    authUrl.searchParams.set("client_id", clientId!)
    authUrl.searchParams.set("redirect_uri", redirectUri)
    authUrl.searchParams.set("response_type", "code")
    authUrl.searchParams.set("scope", scope)
    authUrl.searchParams.set("state", state)

    return NextResponse.json({ redirect: authUrl.toString() })
}
