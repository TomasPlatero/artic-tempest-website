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
    const { data: existingApp } = await sb
        .from("recruitment_applications")
        .select("id, status, created_at")
        .eq("user_id", session.user.id)
        .in("status", ["pending", "accepted"])
        .maybeSingle()

    // 1. Verificar si tiene personajes de Bnet
    const { data: bnetCharacters } = await sb
        .from("bnet_characters")
        .select("id, name, realm, class_id, level")
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
                    <div className="bg-blue-600/5 border border-blue-500/20 rounded-3xl p-12 text-center animate-in fade-in zoom-in duration-500">
                        <div className="size-20 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <IconShieldCheck className="size-10" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-4 uppercase">Aplicación en Curso</h2>
                        <p className="text-zinc-400 max-w-sm mx-auto mb-8">
                            Ya tienes una solicitud {existingApp.status === 'pending' ? 'pendiente de revisión' : 'aceptada'}.
                            Enviada el {new Date(existingApp.created_at).toLocaleDateString()}.
                        </p>
                        <Button variant="outline" className="rounded-xl" asChild>
                            <Link href="/">Volver al Inicio</Link>
                        </Button>
                    </div>
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
