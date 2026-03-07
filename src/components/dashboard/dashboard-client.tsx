"use client"

import {
    IconUsers,
    IconRefresh,
    IconCalendarEvent,
    IconListSearch,
    IconSword,
    IconActivity,
    IconExternalLink,
    IconClock
} from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/infrastructure/tailwind/tailwind-utils"
import { Loader2 } from "lucide-react"

import React from "react"

const RAID_BG_MAP: Record<string, string> = {
    "Palacio Nerub'ar": "https://wow.zamimg.com/uploads/screenshots/normal/1175440.jpg",
    "Liberación de Minahonda": "https://bnetcmsus-a.akamaihd.net/cms/blog_header/2g/2GBQ9V0N95F91740612321487.png",
    "La Aguja del Vacío": "https://wow.zamimg.com/uploads/screenshots/normal/1179428.jpg",
    "Marcha a Quel'Danas": "https://wow.zamimg.com/uploads/screenshots/normal/1179429.jpg",
}

export function DashboardClient({ data, blocks, roleLevel }: { data: any, blocks: any[], roleLevel: string }) {
    const router = useRouter()
    const isOfficer = roleLevel === "gm" || roleLevel === "officer"
    const [mounted, setMounted] = React.useState(false)
    const [isSyncing, setIsSyncing] = React.useState(false)
    const { isBnetLinked, myCharacters } = data

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return <div className="animate-pulse flex flex-col gap-6 w-full h-[600px] bg-white/5 rounded-2xl" />

    const renderBlock = (block: any) => {
        const config = block.content || {}

        switch (block.type) {
            case 'banner':
                return (
                    <div key={block.id} className="relative w-full h-48 sm:h-64 rounded-xl overflow-hidden shadow-2xl border border-border/50 group shrink-0">
                        <div className={`absolute inset-0 bg-gradient-to-r ${config.gradient || "from-black/80 via-black/40 to-transparent"} z-10`} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-10" />
                        <div
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                            style={{ backgroundImage: `url('${config.bg_image || "/assets/images/midnight-battle.webp"}')` }}
                        />
                        <div className="relative z-20 flex flex-col items-start justify-center h-full p-6 sm:p-10">
                            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2 drop-shadow-md leading-tight">
                                {config.title ? config.title.replace('{guildName}', data.guildName) : `¡Bienvenido a ${data.guildName}!`}
                            </h1>
                            <p className="text-blue-50/90 max-w-full sm:max-w-lg text-sm sm:text-base drop-shadow-sm">
                                {config.description || "Comprueba tus personajes, mantente al día de las próximas raids en el calendario y revisa el estado de reclutamiento de la hermandad."}
                            </p>
                        </div>
                    </div>
                )

            case 'characters':
                return (
                    <div key={block.id} className="bg-card text-card-foreground border rounded-xl p-5 flex flex-col items-center justify-center text-center gap-3 shadow-sm hover:border-primary/50 transition-colors h-full">
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
                                                <span className="text-muted-foreground truncate max-w-[80px] sm:max-w-none ml-auto">{char.realm}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-muted/50 w-full rounded-md p-4 text-sm text-muted-foreground border border-border/50">
                                        No se encontraron personajes en tu cuenta.
                                    </div>
                                )}
                                <Button
                                    variant="glass"
                                    size="sm"
                                    className="mt-2"
                                    onClick={() => router.push('/dashboard/cuenta')}
                                >
                                    <IconUsers className="size-3.5" />
                                    Gestionar personajes
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="bg-muted/50 w-full rounded-md p-4 text-sm text-muted-foreground border border-border/50">
                                    Todavía no has vinculado tu cuenta de Battle.net.
                                </div>
                                <Button
                                    variant="glow"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => router.push('/dashboard/cuenta')}
                                >
                                    Vincular Cuenta
                                </Button>
                            </>
                        )}
                    </div>
                )

            case 'next_raid':
                const raidBg = data.nextRaid?.destination ? (RAID_BG_MAP[data.nextRaid.destination] || RAID_BG_MAP["Liberación de Minahonda"]) : RAID_BG_MAP["Liberación de Minahonda"]

                return (
                    <div key={block.id} className="bg-card text-card-foreground border rounded-xl overflow-hidden shadow-sm hover:border-primary/50 transition-all duration-300 relative group/raid h-full">
                        <div className="absolute inset-0 z-0">
                            <div
                                className="absolute inset-0 bg-cover bg-center opacity-15 transition-transform duration-500 group-hover/raid:scale-110"
                                style={{ backgroundImage: `url('${raidBg}')` }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-card/40" />
                        </div>
                        <div className="relative z-10 p-5 flex flex-col items-center justify-center text-center gap-2 h-full">
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
                                    <div className="flex items-center gap-2 mt-2">
                                        <Button
                                            variant="glass"
                                            size="sm"
                                            onClick={() => router.push(`/dashboard/calendario/${data.nextRaid.id}`)}
                                        >
                                            <IconCalendarEvent className="size-3.5" />
                                            {isOfficer ? "Ver Evento" : "Ver Detalles"}
                                        </Button>
                                        <Button
                                            variant="glass"
                                            size="sm"
                                            onClick={() => router.push('/dashboard/bis')}
                                        >
                                            <IconSword className="size-3.5" />
                                            Configurar BiS
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground mt-1">No hay raids próximas en el calendario.</p>
                            )}
                        </div>
                    </div>
                )

            case 'recruitment':
                if (!isOfficer) return null;
                const pendingCount = data.recruitmentApplications?.pendingCount || 0
                return (
                    <div key={block.id} className="bg-card text-card-foreground border rounded-xl p-5 flex flex-col items-center justify-center text-center gap-3 shadow-sm hover:border-primary/50 transition-colors h-full">
                        <div className="flex items-center gap-2 font-semibold text-lg">
                            <IconListSearch className="size-5 text-muted-foreground" />
                            Reclutamiento
                        </div>
                        {data.recruitmentApplications?.length > 0 ? (
                            <div className="w-full space-y-2">
                                <p className="text-xs text-muted-foreground mb-1">Últimas aplicaciones pendientes:</p>
                                {data.recruitmentApplications.map((app: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg border border-border/50 text-xs">
                                        <div className="flex items-center gap-2">
                                            <Image
                                                src={`/assets/images/classes/${app.character_class}.jpg`}
                                                alt=""
                                                width={16}
                                                height={16}
                                                className="rounded-full shadow-inner"
                                            />
                                            <span className="font-semibold text-foreground">{app.character_name}</span>
                                        </div>
                                        <span className="text-muted-foreground/70">{app.character_spec}</span>
                                    </div>
                                ))}
                                <Button variant="glass" size="sm" className="w-full mt-2" onClick={() => router.push('/dashboard/reclutamiento')}>
                                    Ver {pendingCount} aplicaciones
                                </Button>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm text-muted-foreground mt-1">Tu equipo actualmente tiene</p>
                                <div className="flex items-center gap-2 text-emerald-500 font-semibold mt-1 text-lg">
                                    <div className="rounded-full border border-emerald-500 size-5 flex items-center justify-center text-xs">✓</div>
                                    {pendingCount}
                                </div>
                                <p className="text-sm text-muted-foreground max-w-[90%] mt-1">
                                    aplicaciones pendientes.
                                </p>
                                <Button variant="glass" size="sm" className="w-full mt-2" onClick={() => router.push('/dashboard/reclutamiento')}>
                                    Ir a Reclutamiento
                                </Button>
                            </>
                        )}
                    </div>
                )

            case 'roster_stats':
                if (!isOfficer) return null;

                const handleSync = async () => {
                    setIsSyncing(true)
                    try {
                        const res = await fetch('/api/guild/sync', { method: 'POST' })
                        if (res.ok) router.refresh()
                    } catch (e) {
                        console.error(e)
                    } finally {
                        setIsSyncing(false)
                    }
                }

                return (
                    <div key={block.id} className="bg-card text-card-foreground border rounded-xl p-5 flex flex-col items-center justify-center text-center gap-2 shadow-sm hover:border-primary/50 transition-colors h-full">
                        <div className="flex items-center gap-2 font-semibold text-lg">
                            <IconRefresh className="size-5 text-muted-foreground" />
                            Estado del Roster
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Miembros rastreados: <span className="text-foreground font-semibold">{data.rosterCount}</span></p>
                        <div className="text-xl font-semibold my-1 text-foreground">
                            {data.lastBnetSync ? (
                                <div className="flex flex-col items-center">
                                    <span className="text-emerald-500">Actualizada</span>
                                    <span className="text-[10px] text-muted-foreground font-normal">
                                        {new Date(data.lastBnetSync).toLocaleDateString("es-ES", {
                                            day: "numeric",
                                            month: "short",
                                            hour: "2-digit",
                                            minute: "2-digit"
                                        })}
                                    </span>
                                </div>
                            ) : (
                                "No sincronizada"
                            )}
                        </div>
                        <div className="flex items-center gap-2 w-full mt-2">
                            <Button
                                variant="glass"
                                size="sm"
                                className="flex-1"
                                onClick={handleSync}
                                disabled={isSyncing}
                            >
                                {isSyncing ? <Loader2 className="size-3.5 animate-spin mr-2" /> : <IconRefresh className="size-3.5 mr-2" />}
                                Sincronizar
                            </Button>
                            <Button
                                variant="glass"
                                size="sm"
                                className="flex-1"
                                onClick={() => router.push('/dashboard/roster')}
                            >
                                Ver Roster
                            </Button>
                        </div>
                    </div>
                )

            case 'bis':
                return (
                    <div key={block.id} className="bg-card text-card-foreground border rounded-xl p-5 flex flex-col items-center justify-center text-center gap-3 shadow-sm hover:border-primary/50 transition-colors h-full">
                        <div className="flex items-center gap-2 font-semibold text-lg">
                            <IconSword className="size-5 text-muted-foreground" />
                            Mi Lista BiS
                        </div>
                        {data.myBisSelections?.length > 0 ? (
                            <div className="w-full space-y-2">
                                {data.myBisSelections.map((bis: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg border border-border/50 text-xs">
                                        {bis.item_icon ? (
                                            <img src={bis.item_icon} className="size-8 rounded shadow-sm border border-white/10" alt="" />
                                        ) : (
                                            <div className="size-8 rounded bg-white/5 border border-white/10" />
                                        )}
                                        <div className="flex flex-col items-start flex-1 min-w-0">
                                            <span className="font-semibold text-foreground truncate w-full text-left">{bis.item_name}</span>
                                            <span className="text-muted-foreground/70 truncate w-full text-left">{bis.boss_name}</span>
                                        </div>
                                        <Badge variant="outline" className="text-[9px] h-4 bg-primary/5 text-primary border-primary/20 shrink-0">
                                            {bis.ilvl}
                                        </Badge>
                                    </div>
                                ))}
                                <Button variant="glass" size="sm" className="w-full mt-2" onClick={() => router.push('/dashboard/bis')}>
                                    Gestionar BiS
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 py-4">
                                <p className="text-sm text-muted-foreground">No tienes objetos BiS seleccionados.</p>
                                <Button variant="glow" size="sm" onClick={() => router.push('/dashboard/bis')}>
                                    Configurar BiS
                                </Button>
                            </div>
                        )}
                    </div>
                )

            case 'logs':
                return (
                    <div key={block.id} className="bg-card text-card-foreground border rounded-xl p-5 flex flex-col items-center justify-center text-center gap-3 shadow-sm hover:border-primary/50 transition-colors h-full">
                        <div className="flex items-center gap-2 font-semibold text-lg">
                            <IconActivity className="size-5 text-muted-foreground" />
                            Últimos Logs
                        </div>
                        {data.recentLogs?.length > 0 ? (
                            <div className="w-full space-y-2">
                                {data.recentLogs.map((log: any) => (
                                    <a
                                        key={log.code}
                                        href={`https://www.warcraftlogs.com/reports/${log.code}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-2 bg-muted/30 rounded-lg border border-border/50 text-xs hover:bg-muted/50 transition-colors group"
                                    >
                                        <div className="flex flex-col items-start flex-1 min-w-0">
                                            <span className="font-semibold text-foreground truncate w-full text-left group-hover:text-primary transition-colors">{log.title}</span>
                                            <span className="text-muted-foreground/70 truncate w-full text-left">{log.zone?.name || "Raid"}</span>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                                            <span className="text-muted-foreground/50 text-[10px]">
                                                {new Date(log.startTime).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                                            </span>
                                            <IconExternalLink className="size-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </a>
                                ))}
                                <Button variant="glass" size="sm" className="w-full mt-2" onClick={() => window.open('https://www.warcraftlogs.com/guild/id/743623', '_blank')}>
                                    Ver en WarcraftLogs
                                </Button>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground py-4">No se han encontrado logs recientes o API no configurada.</p>
                        )}
                    </div>
                )
            case 'custom':
                return (
                    <div
                        key={block.id}
                        className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 h-full"
                        dangerouslySetInnerHTML={{ __html: block.content.html || '' }}
                    />
                )
            default:
                return null;
        }
    }

    const bannerBlock = blocks.find(b => b.type === 'banner')
    const gridBlocks = blocks.filter(b => b.type !== 'banner')

    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Banner block renders full width */}
            {bannerBlock && renderBlock(bannerBlock)}

            {/* Grid blocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                {gridBlocks.map((block, index) => {
                    const isLast = index === gridBlocks.length - 1
                    const isFirstInRow = index % 2 === 0
                    const isFullWidth = isLast && isFirstInRow

                    return (
                        <div key={block.id} className={cn(isFullWidth && "md:col-span-2", "h-full")}>
                            {renderBlock(block)}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
