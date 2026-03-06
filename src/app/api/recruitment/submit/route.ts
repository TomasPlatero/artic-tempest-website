import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/infrastructure/auth/auth-options"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { selectedChar, answers } = body

        if (!selectedChar) {
            return NextResponse.json({ error: "Faltan datos del personaje" }, { status: 400 })
        }

        // 1. Final safety check: Ya tiene una aplicación activa?
        const { data: activeApps } = await supabaseAdmin.from("recruitment_applications")
            .select("id")
            .eq("user_id", session.user.id)
            .in("status", ["pending", "reviewing", "interview"])
            .limit(1)

        if (activeApps && activeApps.length > 0) {
            return NextResponse.json({ error: "Ya tienes una solicitud activa" }, { status: 400 })
        }

        // 2. Create Application
        // Usamos 'sb' (Service Role) que se salta las políticas RLS del frontend y nos evita este error.
        const { data: application, error: appError } = await supabaseAdmin.from("recruitment_applications")
            .insert({
                user_id: session.user.id,
                character_name: selectedChar.name,
                character_realm: selectedChar.realm,
                character_class: selectedChar.class_id,
                character_spec: selectedChar.spec || "Unknown",
                status: "pending"
            })
            .select()
            .single()

        if (appError) throw appError

        // 3. Create Answers
        if (answers && Object.keys(answers).length > 0) {
            const answersToInsert = Object.entries(answers).map(([qId, val]) => ({
                application_id: application.id,
                question_id: qId,
                answer_text: val
            }))

            const { error: ansError } = await supabaseAdmin.from("application_answers")
                .insert(answersToInsert)

            if (ansError) {
                console.error("Error al guardar respuestas (ignorado para notificar)", ansError)
            }
        }

        // 4. Trigger Discord Notification internally (Server to Server)
        try {
            await fetch(`${process.env.NEXTAUTH_URL}/api/discord/notify-apply`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Cookie": req.headers.get("cookie") || "" // Pasamos cookies para que authOptions lo valide
                },
                body: JSON.stringify({ application_id: application.id })
            })
        } catch (discordErr) {
            console.error("No se pudo notificar a Discord internamente:", discordErr)
        }

        return NextResponse.json({ success: true, application })

    } catch (error: any) {
        console.error("API Submit Apply Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
