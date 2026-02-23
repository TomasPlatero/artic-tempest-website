"use client"

import { IconUsers, IconRefresh, IconCalendarEvent, IconListSearch, IconSword } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

import Image from "next/image"

export function DashboardClient({ data, roleLevel }: { data: any, roleLevel: string }) {
    const router = useRouter()
    const isOfficer = roleLevel === "gm" || roleLevel === "officer"
    const { isBnetLinked, myCharacters } = data

    return (
        <div className="flex flex-col gap-6 w-full">
            {/* Welcome Banner */}
            <div className="relative w-full h-48 sm:h-64 rounded-xl overflow-hidden shadow-sm border border-border/50">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-purple-900/60 z-10" />
                <div
                    className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-50"
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1623846666872-97b52047ff96?q=80&w=2000&auto=format&fit=crop')" }}
                />
                <div className="relative z-20 flex flex-col items-start justify-center h-full p-6 sm:p-10">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 drop-shadow-md">
                        ¡Bienvenido a <span className="text-blue-300">{data.guildName}</span>!
                    </h1>
                    <p className="text-blue-50/90 max-w-lg text-sm sm:text-base drop-shadow-sm">
                        Comprueba tus personajes, mantente al día de las próximas raids en el calendario y revisa el estado de reclutamiento de la hermandad.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Personajes de Battle.net */}
                <div className="bg-card text-card-foreground border rounded-xl p-5 flex flex-col items-center justify-center text-center gap-3 shadow-sm hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-2 font-semibold text-lg">
                        <IconUsers className="size-5 text-muted-foreground" />
                        Mis Personajes
                    </div>
                    {isBnetLinked ? (
                        <div className="w-full flex flex-col gap-2">
                            {myCharacters.length > 0 ? (
                                <div className="space-y-2 w-full">
                                    {myCharacters.map((char: any) => (
                                        <div key={char.id} className="flex items-center justify-between bg-muted/30 p-2 rounded-lg border border-border/50 text-xs">
                                            <div className="flex items-center gap-2">
                                                <Image
                                                    src={`/assets/images/classes/${char.class_id}.jpg`}
                                                    alt="Clase"
                                                    width={20}
                                                    height={20}
                                                    className="rounded-full shadow-inner border border-border/30"
                                                />
                                                <span className="font-semibold text-foreground">{char.name}</span>
                                                <span className="text-muted-foreground/70">Nvl {char.level}</span>
                                            </div>
                                            <span className="text-muted-foreground truncate max-w-[80px]">{char.realm}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-muted/50 w-full rounded-md p-4 text-sm text-muted-foreground border border-border/50">
                                    No se encontraron personajes en tu cuenta.
                                </div>
                            )}
                            <Button variant="ghost" size="sm" className="mt-1 h-8 text-xs text-muted-foreground hover:text-foreground" onClick={() => router.push('/dashboard/cuenta')}>
                                Gestionar personajes
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="bg-muted/50 w-full rounded-md p-4 text-sm text-muted-foreground border border-border/50">
                                Todavía no has vinculado tu cuenta de Battle.net.
                            </div>
                            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/cuenta')}>
                                Vincular Cuenta
                            </Button>
                        </>
                    )}
                </div>

                {/* Upcoming Raid — Enhanced Preview */}
                <div className="bg-card text-card-foreground border rounded-xl overflow-hidden shadow-sm hover:border-primary/50 transition-colors relative">
                    {/* Raid background */}
                    <div className="absolute inset-0 z-0">
                        <div
                            className="absolute inset-0 bg-cover bg-center opacity-15"
                            style={{ backgroundImage: "url('https://bnetcmsus-a.akamaihd.net/cms/blog_header/2g/2GBQ9V0N95F91740612321487.png')" }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-card/40" />
                    </div>

                    <div className="relative z-10 p-5 flex flex-col items-center justify-center text-center gap-2">
                        <div className="flex items-center gap-2 font-semibold text-lg">
                            <IconCalendarEvent className="size-5 text-muted-foreground" />
                            Próxima Raid
                        </div>
                        {data.nextRaid ? (
                            <>
                                <p className="text-xl font-bold text-foreground mt-1">
                                    {data.nextRaid.destination || data.nextRaid.title}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {new Date(data.nextRaid.event_date).toLocaleDateString("es-ES", {
                                        weekday: "long",
                                        day: "numeric",
                                        month: "long",
                                        hour: "2-digit",
                                        minute: "2-digit"
                                    })}
                                </p>
                                <div className="flex items-center gap-2 text-emerald-500 font-semibold mt-1 text-sm">
                                    <div className="rounded-full border border-emerald-500 size-4 flex items-center justify-center text-[10px]">✓</div>
                                    <span className="text-muted-foreground font-normal">Planificada en el calendario</span>
                                </div>
                                <button
                                    onClick={() => router.push('/dashboard/bis')}
                                    className="mt-2 px-4 py-1.5 rounded-md bg-purple-600/80 hover:bg-purple-600 text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                                >
                                    <IconSword className="size-3.5" />
                                    Configurar BiS
                                </button>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground mt-1">No hay raids próximas en el calendario.</p>
                        )}
                    </div>
                </div>

                {/* GM / Officer exclusive cards */}
                {isOfficer && (
                    <>
                        <div className="bg-card text-card-foreground border rounded-xl p-5 flex flex-col items-center justify-center text-center gap-2 shadow-sm">
                            <div className="flex items-center gap-2 font-semibold text-lg">
                                <IconListSearch className="size-5 text-muted-foreground" />
                                Reclutamiento
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Tu equipo actualmente tiene</p>
                            <div className="flex items-center gap-2 text-emerald-500 font-semibold mt-1 text-lg">
                                <div className="rounded-full border border-emerald-500 size-5 flex items-center justify-center text-xs">✓</div>
                                0
                            </div>
                            <p className="text-sm text-muted-foreground max-w-[90%] mt-1">
                                aplicaciones pendientes. Podrás visitar la <span className="text-primary cursor-pointer hover:underline opacity-50 cursor-not-allowed">vista de aplicaciones</span> pronto.
                            </p>
                        </div>

                        <div className="bg-card text-card-foreground border rounded-xl p-5 flex flex-col items-center justify-center text-center gap-2 shadow-sm hover:border-primary/50 transition-colors">
                            <div className="flex items-center gap-2 font-semibold text-lg">
                                <IconRefresh className="size-5 text-muted-foreground" />
                                Estado del Roster
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Tu base de datos de miembros rastrea un total de <span className="text-foreground font-semibold">{data.rosterCount}</span> personajes.</p>
                            <div className="text-xl font-semibold my-1 text-foreground">
                                Actualizada
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Puedes ir a la <span className="text-primary cursor-pointer hover:underline" onClick={() => router.push('/dashboard/roster')}>página de roster</span> para forzar una sincronización y ver la actividad.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
