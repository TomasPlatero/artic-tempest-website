import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/shared/auth/auth-options"

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        const roleLevel = session?.user?.roleLevel
        if (!session || (roleLevel !== "gm" && roleLevel !== "officer")) {
            return new NextResponse("No autorizado", { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get("file") as File | null
        const type = formData.get("type") as string | null

        if (!file) {
            return NextResponse.json({ error: "No se ha proporcionado ningún archivo" }, { status: 400 })
        }

        // Get guild info to update its icon
        const { data: guild, error: guildResError } = await supabaseAdmin.from("guilds_managed")
            .select("guild_id")
            .limit(1)
            .single()

        if (guildResError || !guild) {
            console.error("Guild fetch error:", guildResError)
            return NextResponse.json({ error: "No hay ninguna hermandad configurada" }, { status: 400 })
        }

        const isMobile = type === "mobile"
        const fileExt = file.name.split('.').pop()
        const suffix = isMobile ? "mobile" : "logo"
        const fileName = `icons/guild-${suffix}-${Date.now()}.${fileExt}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabaseAdmin.storage
            .from("guild_assets")
            .upload(fileName, file, { upsert: true })

        if (uploadError) {
            console.error("Storage upload error:", uploadError)
            return NextResponse.json({ error: uploadError.message }, { status: 500 })
        }

        // Get public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from("guild_assets")
            .getPublicUrl(fileName)

        // Update database
        const updateData = isMobile ? { mobile_icon_url: publicUrl } : { icon_url: publicUrl }
        const { error: updateError } = await supabaseAdmin.from("guilds_managed")
            .update(updateData)
            .eq("guild_id", guild.guild_id)

        if (updateError) {
            console.error("Database update error:", updateError)
            return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, icon_url: publicUrl })

    } catch (e: any) {
        console.error("API error:", e)
        return NextResponse.json({ error: e.message || "Error interno del servidor" }, { status: 500 })
    }
}
