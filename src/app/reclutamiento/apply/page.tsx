import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"
import { redirect } from "next/navigation"
import { LandingNavigation } from "@/components/landing/navigation"
import { ApplyClient } from "@/components/recruitment/apply-client"
import { IconShieldCheck } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function ApplyPage() {
    const session = await getServerSession(authOptions)

    if (!session) {
        // Redirigir al inicio para loguearse
        redirect("/")
    }

    // 0. Verificar si ya tiene una solicitud activa
    const { data: existingApps } = await sb
        .from("recruitment_applications")
        .select("id, status, created_at")
        .eq("user_id", session.user.id)
        .in("status", ["pending", "reviewing", "interview"])
        .limit(1)

    const existingApp = existingApps && existingApps.length > 0 ? existingApps[0] : null

    // 1. Verificar si tiene personajes de Bnet
    const { data: bnetCharacters } = await sb
        .from("bnet_characters")
        .select("id, name, realm, class_id, level, spec")
        .eq("user_id", session.user.id)
        .order("level", { ascending: false })

    // 2. Obtener preguntas dinámicas
    const { data: questions } = await sb
        .from("recruitment_questions")
        .select("*")
        .order("order_index", { ascending: true })

    // 3. Obtener constantes de clases para enriquecer el selector
    const { data: classConstants } = await sb
        .from("game_constants")
        .select("key, value")
        .eq("category", "wow_class")

    return (
        <main className="min-h-screen bg-black">
            <LandingNavigation />
            <div className="pt-32 pb-20 px-6 max-w-3xl mx-auto">
                <div className="mb-10 text-center md:text-left">
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight">Formulario de Aplicación</h1>
                    <p className="text-white/50 mt-2">Completa todos los campos para enviar tu solicitud a los oficiales de Artic Tempest.</p>
                </div>

                {existingApp ? (
                    redirect("/reclutamiento/apply-en-curso")
                ) : (
                    <ApplyClient
                        user={session.user}
                        characters={bnetCharacters || []}
                        questions={questions || []}
                        classConstants={classConstants || []}
                    />
                )}
            </div>
        </main>
    )
}
