// src/infrastructure/verification/sync-engine.ts
import { sb } from "@/infrastructure/auth/auth-options"
import { getGuildCredentials } from "@/infrastructure/auth/credentials"
import { toSlug } from "@/infrastructure/bnet/bnet-client"
import { RoleLevel } from "@/types/auth"

export type SyncResult = {
    discord: boolean
    bnet: boolean
    oldRole: RoleLevel
    newRole: RoleLevel
    error?: string
}

/** 
 * Refresca un token de Discord si es necesario 
 */
async function refreshDiscordToken(refreshToken: string) {
    const res = await fetch('https://discord.com/api/v10/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID!,
            client_secret: process.env.DISCORD_CLIENT_SECRET!,
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        }).toString(),
    })

    if (!res.ok) throw new Error(`Discord Refresh Error: ${res.status}`)
    return await res.json()
}

/** 
 * Verifica si el usuario está en el servidor de Discord 
 */
async function checkDiscordMembership(accessToken: string, guildId: string): Promise<boolean> {
    const res = await fetch(`https://discord.com/api/users/@me/guilds/${guildId}/member`, {
        headers: { Authorization: `Bearer ${accessToken}` }
    })
    return res.ok // 200 means member, 404/others mean not member
}

/** 
 * Verifica si alguno de los personajes de Bnet del usuario está en la hermandad 
 */
async function checkBnetMembership(userId: string): Promise<boolean> {
    // 1. Obtener personajes vinculados del usuario (de nuestra tabla bnet_characters)
    const { data: bnetChars } = await sb
        .from("bnet_characters")
        .select("name, realm")
        .eq("user_id", userId)

    if (!bnetChars || bnetChars.length === 0) return false

    // 2. Consultar si alguno de esos personajes está en el Roster (guild_members)
    // Nota: Podríamos hacer un JOIN o un rpc, pero para simplicidad inmediata:
    const { count } = await sb
        .from("guild_members")
        .select("*", { count: 'exact', head: true })
        .in("name", bnetChars.map(c => c.name))
        .in("realm", bnetChars.map(c => c.realm))

    return (count ?? 0) > 0
}

/**
 * Ejecuta la verificación completa para un usuario 
 */
export async function verifyUser(userId: string): Promise<SyncResult> {
    const { data: profile, error: dbError } = await sb
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

    if (dbError || !profile) throw new Error("Perfil no encontrado")

    const creds = await getGuildCredentials()
    let discordValid = false
    let bnetValid = false
    let newRefreshToken = profile.discord_refresh_token

    // --- CHECK DISCORD ---
    if (profile.discord_refresh_token) {
        try {
            // Intentamos refrescar para asegurar que tenemos acceso
            const refreshed = await refreshDiscordToken(profile.discord_refresh_token)
            newRefreshToken = refreshed.refresh_token
            discordValid = await checkDiscordMembership(refreshed.access_token, creds.discord_guild_id)
        } catch (e) {
            console.error(`Verification Discord fail for ${userId}:`, e)
        }
    }

    // --- CHECK BNET ---
    try {
        bnetValid = await checkBnetMembership(userId)
    } catch (e) {
        console.error(`Verification Bnet fail for ${userId}:`, e)
    }

    const oldRole = profile.role_level as RoleLevel
    let newRole = oldRole

    // Lógica de ascenso/degradación
    const isActuallyInGuild = discordValid || bnetValid

    if (isActuallyInGuild) {
        // Promocionar a Miembro si era Invitado
        if (oldRole === 'invitado') newRole = 'member'
    } else {
        // Degradación automática si no cumple requisitos
        // Solo degradamos si era Miembro (no tocamos Raider/Officer/GM manualmente)
        if (oldRole === 'member') {
            newRole = 'invitado'
        }
    }

    // --- ACTUALIZAR PERFIL ---
    await sb.from('profiles').update({
        role_level: newRole,
        discord_refresh_token: newRefreshToken,
        last_verification_check: new Date().toISOString(),
        verification_status: { discord: discordValid, bnet: bnetValid },
        tokens_invalidated: !newRefreshToken // Marcar si el refresh falló
    }).eq('user_id', userId)

    // --- LOG ---
    await sb.from('verification_logs').insert({
        user_id: userId,
        old_role: oldRole,
        new_role: newRole,
        method: 'sync_engine',
        results: { discord: discordValid, bnet: bnetValid },
        status: 'success'
    })

    return { discord: discordValid, bnet: bnetValid, oldRole, newRole }
}

/**
 * Procesa un lote de usuarios (Cron Job)
 */
export async function processVerificationBatch(limit: number = 20) {
    // Seleccionamos usuarios que no han sido verificados recientemente
    const { data: users, error } = await sb
        .from('profiles')
        .select('user_id')
        .order('last_verification_check', { ascending: true, nullsFirst: true })
        .limit(limit)

    if (error || !users) return []

    const results = []
    for (const user of users) {
        try {
            const res = await verifyUser(user.user_id)
            results.push({ userId: user.user_id, ...res })
        } catch (e) {
            results.push({ userId: user.user_id, error: String(e) })
        }
    }
    return results
}
