import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.roleLevel !== 'gm' && session.user.roleLevel !== 'officer')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { type, data } = body

        if (type === 'spot') {
            const { class_id, spec_name, urgency } = data
            const { data: result, error } = await sb
                .from("recruitment_spots")
                .upsert({
                    class_id,
                    spec_name,
                    urgency,
                    guild_id: '00000000-0000-0000-0000-000000000000'
                }, { onConflict: 'class_id, spec_name' }) // Error: recruitment_spots might not have this unique constraint yet
                .select()
                .single()

            if (error) throw error
            return NextResponse.json(result)
        }

        if (type === 'question_save') {
            const isTemp = data.id?.startsWith('temp-')
            const payload = { ...data }
            if (isTemp) delete payload.id

            const { data: result, error } = isTemp
                ? await sb.from("recruitment_questions").insert(payload).select().single()
                : await sb.from("recruitment_questions").update(payload).eq("id", data.id).select().single()

            if (error) throw error
            return NextResponse.json(result)
        }

        if (type === 'question_delete') {
            const { error } = await sb.from("recruitment_questions").delete().eq("id", data.id)
            if (error) throw error
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    } catch (error: any) {
        console.error("Recruitment API Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
