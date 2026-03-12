import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/auth/auth-options";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/shared/auth/auth-options";

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { clientId, clientSecret } = body;

        // Verify GM role
        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("role_level")
            .eq("user_id", session.user.id)
            .single();

        if (profile?.role_level !== "gm" && profile?.role_level !== "officer") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // We update the single guild record (assuming there's only one managed guild at a time)
        // If the secret is perfectly masked ("••••••••••••••••"), it means the user didn't change it, so don't save it
        let updates: any = { wcl_client_id: clientId || null, updated_at: new Date().toISOString() };
        if (clientSecret !== "••••••••••••••••") {
            updates.wcl_client_secret = clientSecret || null;
        }

        const { error } = await supabaseAdmin
            .from("guilds_managed")
            .update(updates)
            .neq("guild_id", "00000000-0000-0000-0000-000000000000"); // Update all, practically just 1

        if (error) {
            console.error(error);
            return new NextResponse("Database Error", { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Error saving WCL settings:", e.message);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
