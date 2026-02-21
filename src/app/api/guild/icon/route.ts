import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user?.roleLevel !== "gm") {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get("file") as File | null

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 })
        }

        // Get guild info to update its icon
        const { data: guild, error: guildResError } = await sb
            .from("guilds_managed")
            .select("guild_id")
            .limit(1)
            .single()

        if (guildResError || !guild) {
            console.error("Guild fetch error:", guildResError)
            return NextResponse.json({ error: "No guild configured" }, { status: 400 })
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `icons/guild-logo-${Date.now()}.${fileExt}`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await sb
            .storage
            .from("guild_assets")
            .upload(fileName, file, { upsert: true })

        if (uploadError) {
            console.error("Storage upload error:", uploadError)
            return NextResponse.json({ error: uploadError.message }, { status: 500 })
        }

        // Get public URL
        const { data: { publicUrl } } = sb
            .storage
            .from("guild_assets")
            .getPublicUrl(fileName)

        // Update database
        const { error: updateError } = await sb
            .from("guilds_managed")
            .update({ icon_url: publicUrl })
            .eq("guild_id", guild.guild_id)

        if (updateError) {
            console.error("Database update error:", updateError)
            return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, icon_url: publicUrl })

    } catch (e: any) {
        console.error("API error:", e)
        return NextResponse.json({ error: e.message || "Internal server error" }, { status: 500 })
    }
}
