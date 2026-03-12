import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/shared/auth/auth-options"
import { redirect } from "next/navigation"
import { LandingNavigation } from "@/domains/landing/components/navigation"
import { ApplyClient } from "@/domains/recruitment/components/apply-client"
import { IconShieldCheck } from "@tabler/icons-react"
import { Button } from "@/shared/ui/button"
import Link from "next/link"

export default async function ApplyPage({ searchParams }: { searchParams: Promise<{ simulate?: string }> }) {
    const { simulate } = await searchParams
    const session = await getServerSession(authOptions)

    if (!session) {
        // Redirigir al inicio para loguearse
        redirect("/")
    }

    // 0. Verificar si ya tiene una solicitud activa
    const { data: existingApps } = await supabaseAdmin
        .from("recruitment_applications")
        .select("id, status, created_at")
        .eq("user_id", session.user.id)
        .in("status", ["pending", "reviewing", "interview"])
        .limit(1)

    const existingApp = existingApps && existingApps.length > 0 ? existingApps[0] : null

    // 1. Verificar si tiene personajes de Bnet
    const { data: bnetCharacters } = await supabaseAdmin
        .from("bnet_characters")
        .select("id, name, realm, class_id, level, spec")
        .eq("user_id", session.user.id)
        .order("level", { ascending: false })

    // 2. Obtener preguntas dinámicas
    const { data: questions } = await supabaseAdmin
        .from("recruitment_questions")
        .select("*")
        .order("order_index", { ascending: true })

    // 3. Obtener constantes de clases para enriquecer el selector
    const { data: classConstants } = await supabaseAdmin
        .from("game_constants")
        .select("key, value")
        .eq("category", "wow_class")

    // 4. Verificar si ya es miembro (GM, Officer, Raider o Member)
    const canSimulate = ["gm", "officer"].includes(session.user.roleLevel)
    // Permitir saltar la comprobación solo si tiene permiso para simular Y viene con ?simulate=true
    const isMember = ["gm", "officer", "raider", "member"].includes(session.user.roleLevel) && !(canSimulate && simulate === "true")

    return (
        <main className="min-h-screen bg-black">
            <LandingNavigation />
            <div className="pt-32 pb-20 px-6 max-w-3xl mx-auto">
                <div className="mb-10 text-center md:text-left">
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight">Formulario de Aplicación</h1>
                    <p className="text-white/50 mt-2">Completa todos los campos para enviar tu solicitud a los oficiales de Artic Tempest.</p>
                </div>

                {isMember ? (
                    <div className="bg-card/20 border border-white/5 rounded-3xl p-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="size-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                            <IconShieldCheck className="size-10 text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Ya formas parte de nosotros</h2>
                        <p className="text-white/60 text-sm max-w-md mx-auto leading-relaxed mb-10">
                            Detectamos que ya tienes un rango activo en Artic Tempest. No es necesario que envíes una solicitud de reclutamiento.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/dashboard">
                                <Button size="lg" className="rounded-full font-bold px-10 h-14 active:scale-95 transition-all">
                                    Volver al Dashboard
                                </Button>
                            </Link>
                            {canSimulate && (
                                <Link href="/reclutamiento/apply?simulate=true">
                                    <Button variant="outline" size="lg" className="rounded-full font-bold px-10 h-14 border-white/10 hover:bg-white/5 active:scale-95 transition-all">
                                        Simular Apply
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                ) : existingApp ? (
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
