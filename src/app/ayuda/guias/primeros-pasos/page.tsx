import { GuideLayout } from "@/components/support/guide-layout"
import { IconUser, IconLink, IconCheck } from "@tabler/icons-react"

export const metadata = {
    title: "Primeros Pasos | Centro de Ayuda",
    description: "Guía para vincular tu cuenta de Discord y Battle.net correctamente."
}

export default function PrimerosPasosPage() {
    return (
        <GuideLayout
            title="Primeros Pasos"
            description="Configura tu perfil de usuario y vincula tus cuentas externas para tener acceso total a las funcionalidades de la hermandad."
            category="Guía de Inicio"
            icon={<IconUser className="size-4" />}
            color="text-blue-400"
        >
            <div className="space-y-12">
                <section className="space-y-6">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <IconLink className="size-5" />
                        </div>
                        Vinculación de Discord
                    </h2>
                    <p className="text-white/60 leading-relaxed">
                        GuildBoard utiliza Discord como sistema principal de identificación. Para acceder a la web, debes estar en el servidor oficial de Artic Tempest.
                    </p>
                    <ul className="space-y-4">
                        {[
                            "Inicia sesión en la web pulsando el botón superior derecho.",
                            "Autoriza la aplicación de GuildBoard en tu cuenta de Discord.",
                            "Asegúrate de tener el rango de 'Miembro' en el servidor para ver todo el contenido."
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
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Vincular Battle.net</h2>
                    <p className="text-white/60 leading-relaxed">
                        Es fundamental vincular tu Battle.net para que la web pueda leer tus personajes, sus logros y su equipo automáticamente.
                    </p>
                    <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-4">
                        <p className="text-white/50 text-sm font-medium">
                            Ve a tu <a href="/dashboard/cuenta" className="text-blue-400 hover:underline">Perfil de Usuario</a> y busca la sección de Conexiones. Pulsa en el botón azul de Battle.net y sigue los pasos en la web de Blizzard.
                        </p>
                    </div>
                </section>

                <section className="p-8 rounded-[2rem] bg-amber-500/5 border border-amber-500/10">
                    <h4 className="text-amber-400 font-bold uppercase text-xs tracking-widest mb-2 italic">⚠️ Importante</h4>
                    <p className="text-sm text-white/40 leading-relaxed font-medium">
                        Si tus personajes no aparecen después de vincular la cuenta, espera unos minutos a que el sistema sincronice con la API de Blizzard.
                    </p>
                </section>
            </div>
        </GuideLayout>
    )
}
