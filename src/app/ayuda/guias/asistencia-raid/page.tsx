import { GuideLayout } from "@/domains/support/components/guide-layout"
import { IconCalendar, IconBell, IconCheck } from "@tabler/icons-react"

export const metadata = {
    title: "Calendario Raid | Centro de Ayuda",
    description: "Uso del calendario y cómo confirmar tu asistencia en segundos."
}

export default function CalendarioRaidPage() {
    return (
        <GuideLayout
            title="Calendario Raid"
            description="Aprende a gestionar tu asistencia en el calendario oficial de Artic Tempest."
            category="Guía de Raid"
            icon={<IconCalendar className="size-4" />}
            color="text-emerald-400"
        >
            <div className="space-y-12">
                <section className="space-y-6">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                            <IconCalendar className="size-5" />
                        </div>
                        El Calendario
                    </h2>
                    <p className="text-white/60 leading-relaxed">
                        En el <a href="/dashboard/calendario" className="text-emerald-400 hover:underline">Calendario de Raid</a> verás todos los eventos programados para la semana actual y la siguiente.
                    </p>
                    <ul className="space-y-4">
                        {[
                            "Pulsa en un evento para ver los detalles.",
                            "Confirma tu asistencia eligiendo el personaje con el que asistirás.",
                            "Si no vas a asistir, selecciona 'Falta' para que los oficiales puedan organizar el roster."
                        ].map((step, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-white/50">
                                <IconCheck className="size-5 text-emerald-400 shrink-0 mt-0.5" />
                                <span>{step}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                <div className="h-px bg-white/5" />

                <section className="space-y-6">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <IconBell className="size-5" />
                        </div>
                        Notificaciones
                    </h2>
                    <p className="text-white/60 leading-relaxed">
                        Recibirás una notificación en Discord cuando se publique un nuevo evento de raid y 15 minutos antes de que empiece la raid.
                    </p>
                    <div className="p-8 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 space-y-4">
                        <p className="text-sm text-white/40 leading-relaxed font-medium">
                            Si eres raider titular y no confirmas tu asistencia antes de las 20:00h del día de raid, tu puesto pasará a estar disponible para raiders reserva.
                        </p>
                    </div>
                </section>
            </div>
        </GuideLayout>
    )
}
