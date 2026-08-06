import { NextResponse } from "next/server";
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { auth } from '@/auth';
export async function PATCH(req: Request) {
    try {
        const session = await auth();
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

        // If the secret is perfectly masked ("••••••••••••••••"), it means the user didn't change it, so don't save it
        let updates: any = { id: 1, wcl_client_id: clientId || null, updated_at: new Date().toISOString() };
        if (clientSecret !== "••••••••••••••••") {
            updates.wcl_client_secret = clientSecret || null;
        }

        const { error } = await supabaseAdmin
            .from("app_wcl")
            .upsert(updates, { onConflict: "id" });

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
