import { NextResponse } from "next/server";
import { sb } from "@/infrastructure/auth/auth-options";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/infrastructure/auth/auth-options";
import { invalidateCredentialsCache } from "@/infrastructure/auth/credentials";

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse("No autorizado", { status: 401 });
        }

        // Verify GM role
        const { data: profile } = await sb
            .from("profiles")
            .select("role_level")
            .eq("user_id", session.user.id)
            .maybeSingle();

        // If the database was reset, the profile might be missing. Allow saving credentials 
        // initially so the Discord integration can work on the next login.
        if (profile && profile.role_level !== "gm" && profile.role_level !== "officer") {
            return new NextResponse("Sin permisos", { status: 403 });
        }

        const body = await req.json();
        const {
            discord_client_id,
            discord_client_secret,
            discord_app_id,
            discord_bot_token,
            discord_public_key,
            discord_guild_id,
            bnet_client_id,
            bnet_client_secret,
            wcl_client_id,
            wcl_client_secret,
        } = body;

        const MASK = "••••••••••••••••";

        // Build update object, skipping masked secrets (user didn't change them)
        const updates: Record<string, any> = {
            updated_at: new Date().toISOString(),
        };

        // IDs always update (not secrets)
        if (discord_client_id !== undefined) updates.discord_client_id = discord_client_id || null;
        if (discord_app_id !== undefined) updates.discord_app_id = discord_app_id || null;
        if (discord_guild_id !== undefined) updates.discord_guild_id = discord_guild_id || null;
        if (bnet_client_id !== undefined) updates.bnet_client_id = bnet_client_id || null;
        if (wcl_client_id !== undefined) updates.wcl_client_id = wcl_client_id || null;

        // Secrets only update if not masked
        if (discord_client_secret !== undefined && discord_client_secret !== MASK) {
            updates.discord_client_secret = discord_client_secret || null;
        }
        if (discord_bot_token !== undefined && discord_bot_token !== MASK) {
            updates.discord_bot_token = discord_bot_token || null;
        }
        if (discord_public_key !== undefined && discord_public_key !== MASK) {
            updates.discord_public_key = discord_public_key || null;
        }
        if (bnet_client_secret !== undefined && bnet_client_secret !== MASK) {
            updates.bnet_client_secret = bnet_client_secret || null;
        }
        if (wcl_client_secret !== undefined && wcl_client_secret !== MASK) {
            updates.wcl_client_secret = wcl_client_secret || null;
        }

        const { error } = await sb
            .from("guilds_managed")
            .update(updates)
            .neq("guild_id", "00000000-0000-0000-0000-000000000000");

        if (error) {
            console.error(error);
            return new NextResponse("Error de base de datos", { status: 500 });
        }

        // Clear the in-memory credentials cache so next read picks up new values
        invalidateCredentialsCache();

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Error saving credentials:", e.message);
        return new NextResponse("Error interno", { status: 500 });
    }
}
