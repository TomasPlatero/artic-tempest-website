import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/infrastructure/auth/auth-options"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return new NextResponse("No autorizado", { status: 401 })
        }

        const { data, error } = await supabaseAdmin.from("cooldown_definitions")
            .select("*")
            .order("class_id", { ascending: true })

        if (error) throw error

        // Transform Blizzard render URLs (return 403) to Wowhead CDN URLs
        // Also fix known Blizzard icon name mismatches that 404 on Wowhead
        const ICON_NAME_FIXES: Record<string, string> = {
            'spell_holy_avenginwrath.jpg': 'spell_holy_avenginewrath.jpg',
            'spell_shadow_psychichorror.jpg': 'spell_shadow_psychichorrors.jpg',
            'spell_priest_voidblast.jpg': 'spell_priest_void-blast.jpg',
            'spell_priest_void_blast.jpg': 'spell_priest_void-blast.jpg',
        }
        const transformed = (data || []).map((cd: any) => {
            if (cd.icon && cd.icon.includes("render.worldofwarcraft.com")) {
                const parts = cd.icon.split("/")
                let iconName = parts[parts.length - 1]
                iconName = ICON_NAME_FIXES[iconName] || iconName
                cd.icon = `https://wow.zamimg.com/images/wow/icons/large/${iconName}`
            }
            return cd
        })

        return NextResponse.json(transformed)
    } catch (e: any) {
        console.error("GET /api/cd-planner/cooldowns error:", e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
