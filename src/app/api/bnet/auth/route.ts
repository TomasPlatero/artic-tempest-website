import { NextResponse } from "next/server"
import { parseRequestUrl } from "@/shared/lib/request-url"
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
    const reqUrl = parseRequestUrl(request)
    if (!reqUrl) {
        return NextResponse.json({ error: "invalid_request_url" }, { status: 400 })
    }
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

    const authUrl = buildBattleNetAuthUrl({ clientId, redirectUri, scope, state })
    if (!authUrl) {
        return NextResponse.json({ error: "bnet_auth_url_failed" }, { status: 500 })
    }

    return NextResponse.json({ redirect: authUrl.toString() })
}

/** Builds the Battle.net authorize URL; returns null if it cannot be assembled. */
function buildBattleNetAuthUrl({
    clientId,
    redirectUri,
    scope,
    state,
}: {
    clientId: string | null | undefined;
    redirectUri: string;
    scope: string;
    state: string;
}): string | null {
    try {
        const authUrl = new URL("https://oauth.battle.net/authorize")
        authUrl.searchParams.set("client_id", clientId ?? "")
        authUrl.searchParams.set("redirect_uri", redirectUri)
        authUrl.searchParams.set("response_type", "code")
        authUrl.searchParams.set("scope", scope)
        authUrl.searchParams.set("state", state)
        return authUrl.toString()
    } catch {
        return null
    }
}
