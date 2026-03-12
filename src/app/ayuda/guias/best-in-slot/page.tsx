import { GuideLayout } from "@/domains/support/components/guide-layout"
import { IconSword, IconCheck } from "@tabler/icons-react"

export const metadata = {
    title: "Best-in-Slot | Centro de Ayuda",
    description: "Cómo gestionar tu Wishlist y sincronizarla con el bot."
}

export default function BestInSlotPage() {
    return (
        <GuideLayout
            title="Best-in-Slot"
            description="Gestiona tu Wishlist de equipo y asegúrate de que el bot de loot tenga tus prioridades actualizadas."
            category="Guía de Loot"
            icon={<IconSword className="size-4" />}
            color="text-amber-400"
        >
            <div className="space-y-12">
                <section className="space-y-6">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                            <IconSword className="size-5" />
                        </div>
                        Tu Wishlist
                    </h2>
                    <p className="text-white/60 leading-relaxed">
                        GuildBoard te permite crear una lista de deseos con el equipo que necesitas de cada boss.
                    </p>
                    <ul className="space-y-4">
                        {[
                            "Ve a la sección de tu personaje en el Dashboard.",
                            "Busca la pestaña de 'Equipamiento' o 'Wishlist'.",
                            "Selecciona los objetos BiS (Best in Slot) para tu especialización principal."
                        ].map((step, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-white/50">
                                <IconCheck className="size-5 text-emerald-400 shrink-0 mt-0.5" />
                                <span>{step}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                <div className="h-px bg-white/5" />

                <section className="p-8 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 space-y-4">
                    <h4 className="text-white font-black text-sm uppercase tracking-widest italic">¿Necesitas ayuda adicional?</h4>
                    <p className="text-sm text-white/40 leading-relaxed font-medium">
                        Si tienes dudas sobre qué equipo es mejor para tu clase, consulta las guías de clase en el canal correspondiente de Discord o pregunta a tus oficiales de clase.
                    </p>
                </section>
            </div>
        </GuideLayout>
    )
}
