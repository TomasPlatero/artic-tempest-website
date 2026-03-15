"use client"

import {
    IconUsers,
    IconRefresh,
    IconCalendarEvent,
    IconListSearch,
    IconSword,
    IconActivity,
    IconExternalLink,
    IconClock,
    IconSettings,
    IconUser,
    IconHeart
} from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { Button } from "@/shared/ui/button"

import Image from "next/image"
import { Badge } from "@/shared/ui/badge"
import { cn } from "@/shared/tailwind/tailwind-utils"
import { Loader2 } from "lucide-react"

import React from "react"
import { DonationSection } from "./donation-section"

const RAID_BG_MAP: Record<string, string> = {
    "Palacio Nerub'ar": "https://wow.zamimg.com/uploads/screenshots/normal/1175440.jpg",
    "Liberación de Minahonda": "https://bnetcmsus-a.akamaihd.net/cms/blog_header/2g/2GBQ9V0N95F91740612321487.png",
    "La Aguja del Vacío": "https://wow.zamimg.com/uploads/screenshots/normal/1179428.jpg",
    "Marcha a Quel'Danas": "https://wow.zamimg.com/uploads/screenshots/normal/1179429.jpg",
}

const CLASS_COLORS: Record<number, string> = {
    1: "#C69B6D", // Warrior
    2: "#F48CBA", // Paladin
    3: "#AAD372", // Hunter
    4: "#FFF468", // Rogue
    5: "#FFFFFF", // Priest
    6: "#C41E3A", // Death Knight
    7: "#0070DD", // Shaman
    8: "#3FC7EB", // Mage
    9: "#8788EE", // Warlock
    10: "#00FF98", // Monk
    11: "#FF7C0A", // Druid
    12: "#A330C9", // Demon Hunter
    13: "#33937F", // Evoker
}

const RANK_ICONS: Record<number, string> = {
    0: "/assets/images/ranks/GM.webp",
    1: "/assets/images/ranks/OFICIAL.webp",
    2: "/assets/images/ranks/OFICIAL.webp",
    3: "/assets/images/ranks/RAID_LEADER.webp",
    4: "/assets/images/ranks/ARTIC_RAIDER.webp",
    5: "/assets/images/ranks/RAIDER.webp",
    6: "/assets/images/ranks/TRIAL.webp",
    7: "/assets/images/ranks/ALTER_RAIDER.webp",
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
                    <div key={block.id} className="w-full py-12 flex flex-col items-center justify-center text-center mx-auto max-w-7xl">
                        <div className="flex flex-col items-center justify-center h-full px-6">
                            <h1 className="text-4xl sm:text-6xl font-black italic text-white mb-4 drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] leading-none tracking-tighter uppercase">
                                {config.title ? config.title.replace('{guildName}', data.guildName) : `¡Bienvenido a ${data.guildName}!`}
                            </h1>
                            <p className="text-white/60 max-w-full sm:max-w-2xl text-base sm:text-xl drop-shadow-md font-bold leading-tight uppercase tracking-widest">
                                {config.description || "Comprueba tus personajes, mantente al día de las próximas raids en el calendario y mucho más."}
                            </p>
                        </div>
                    </div>
                )

            case 'characters':
                return (
                    <div key={block.id} className="bg-card/40 backdrop-blur-md text-card-foreground border-border/40 border rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 shadow-xl hover:border-primary/40 transition-all duration-300 relative overflow-hidden group/card h-full">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
                        <div className="relative z-10 flex items-center gap-3 font-black italic uppercase tracking-widest text-lg text-muted-foreground/80">
                            <IconUsers className="size-6 text-primary" />
                            Mis Personajes
                        </div>
                        {isBnetLinked ? (
                            <div className="w-full flex flex-col gap-2">
                                {myCharacters.length > 0 ? (
                                    <div className="space-y-3 w-full">
                                        {myCharacters.map((char: any) => {
                                            const classColor = CLASS_COLORS[char.class_id] || "#FFFFFF"
                                            const rankIcon = RANK_ICONS[char.rank]
                                            return (
                                                <div key={char.id} className="flex items-center justify-between bg-muted/20 backdrop-blur-sm p-3 rounded-xl border border-white/5 text-sm transition-all hover:bg-muted/30 group/item">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative">
                                                            <Image
                                                                src={`/assets/images/classes/${char.class_id}.jpg`}
                                                                alt="Clase"
                                                                width={32}
                                                                height={32}
                                                                className="rounded-lg shadow-2xl border-2 object-cover"
                                                                style={{ borderColor: `${classColor}4D` }}
                                                                unoptimized
                                                            />
                                                            {rankIcon && (
                                                                <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 border border-white/10">
                                                                    <Image src={rankIcon} alt="Rango" width={16} height={16} className="size-4" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col items-start translate-y-[1px]">
                                                            <span className="font-black uppercase italic tracking-tighter" style={{ color: classColor }}>{char.name}</span>
                                                            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Nvl {char.level}</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-[11px] font-bold text-muted-foreground/40 uppercase tracking-widest truncate max-w-[100px] sm:max-w-none ml-auto">{char.realm}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="bg-muted/50 w-full rounded-md p-4 text-sm text-muted-foreground border border-border/50">
                                        No se encontraron personajes en tu cuenta.
                                    </div>
                                )}
                                <div className="flex items-center gap-2 w-full mt-2">
                                    <Button
                                        variant="glass"
                                        className="w-full text-[10px] uppercase font-black tracking-widest gap-2 h-11"
                                        onClick={() => router.push('/dashboard/cuenta')}
                                    >
                                        <IconUsers className="size-4" />
                                        Gestionar personajes
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="bg-muted/50 w-full rounded-md p-4 text-sm text-muted-foreground border border-border/50">
                                    Todavía no has vinculado tu cuenta de Battle.net.
                                </div>
                                <Button
                                    variant="glow"
                                    className="w-full text-[10px] uppercase font-black tracking-widest gap-2 h-11 shadow-lg shadow-primary/20"
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

                // Calendar logic
                const today = new Date()
                const daysOfWeek = Array.from({ length: 7 }, (_, i) => {
                    const date = new Date()
                    date.setDate(today.getDate() + i)
                    return date
                })

                const raidDate = data.nextRaid ? new Date(data.nextRaid.event_date) : null
                const isSameDay = (d1: Date, d2: Date) =>
                    d1.getDate() === d2.getDate() &&
                    d1.getMonth() === d2.getMonth() &&
                    d1.getFullYear() === d2.getFullYear()

                return (
                    <div key={block.id} className="bg-card/40 backdrop-blur-md text-card-foreground border-border/40 border rounded-2xl overflow-hidden shadow-xl hover:border-primary/40 transition-all duration-500 relative group/raid h-full min-h-[300px]">
                        <div className="absolute inset-0 z-0 opacity-20">
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover/raid:scale-110"
                                style={{ backgroundImage: `url('${raidBg}')` }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                        </div>

                        <div className="relative z-10 p-6 flex flex-col items-center gap-6 h-full w-full">
                            <div className="flex items-center gap-3 font-black italic uppercase tracking-widest text-lg text-muted-foreground/80">
                                <IconCalendarEvent className="size-6 text-primary" />
                                Calendario Semanal
                            </div>

                            {/* Mini Calendar View */}
                            <div className="grid grid-cols-7 gap-1 w-full max-w-sm">
                                {daysOfWeek.map((date, i) => {
                                    const hasRaid = raidDate && isSameDay(date, raidDate)
                                    const isToday = i === 0

                                    return (
                                        <div
                                            key={i}
                                            className={cn(
                                                "flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all duration-300",
                                                isToday ? "bg-primary/20 border-primary/40 shadow-[0_0_15px_rgba(var(--primary),0.1)]" : "bg-muted/10 border-white/5",
                                                hasRaid && !isToday && "border-amber-500/30 bg-amber-500/5"
                                            )}
                                        >
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-tighter mb-0.5",
                                                isToday ? "text-primary" : "text-muted-foreground/60"
                                            )}>
                                                {date.toLocaleDateString("es-ES", { weekday: "short" })}
                                            </span>
                                            <span className={cn(
                                                "text-sm font-black italic tabular-nums leading-none",
                                                isToday ? "text-white" : "text-muted-foreground/80"
                                            )}>
                                                {date.getDate()}
                                            </span>
                                            {hasRaid && (
                                                <div className="mt-1.5 size-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse" />
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Event Preview Area */}
                            <div className="w-full flex flex-col items-center justify-center text-center gap-2 mt-auto">
                                {data.nextRaid ? (
                                    <>
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-black italic uppercase tracking-tighter text-white drop-shadow-lg leading-none">
                                                {data.nextRaid.destination || data.nextRaid.title}
                                            </h3>
                                            <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest opacity-80">
                                                {new Date(data.nextRaid.event_date).toLocaleDateString("es-ES", {
                                                    weekday: "long",
                                                    day: "numeric",
                                                    month: "long",
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                })}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                            <div className="rounded-full bg-emerald-500 size-1.5 animate-pulse" />
                                            <span className="text-[9px] font-black italic text-emerald-400 uppercase tracking-widest">Próxima Raid Confirmada</span>
                                        </div>

                                        <div className="flex items-center gap-2 mt-4 w-full">
                                            <Button
                                                variant="glass"
                                                className="flex-1 text-[10px] uppercase font-black tracking-widest gap-2 h-10 px-4 shadow-xl border-white/5"
                                                onClick={() => router.push(`/dashboard/calendario/${data.nextRaid.id}`)}
                                            >
                                                <IconCalendarEvent className="size-3.5" />
                                                Ver Evento
                                            </Button>
                                            <Button
                                                variant="glass"
                                                className="flex-1 text-[10px] uppercase font-black tracking-widest gap-2 h-10 px-4 shadow-xl border-white/5"
                                                onClick={() => router.push('/dashboard/bis')}
                                            >
                                                <IconSword className="size-3.5" />
                                                Lista BiS
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-sm font-bold text-muted-foreground/60 uppercase tracking-widest">No hay eventos esta semana</p>
                                )}
                            </div>
                        </div>
                    </div>
                )

            case 'recruitment':
                if (!isOfficer) return null;
                const pendingCount = data.recruitmentApplications?.pendingCount || 0
                return (
                    <div key={block.id} className="bg-card/40 backdrop-blur-md text-card-foreground border-border/40 border rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 shadow-xl hover:border-primary/40 transition-all duration-300 relative overflow-hidden group/card h-full">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
                        <div className="relative z-10 flex items-center gap-3 font-black italic uppercase tracking-widest text-lg text-muted-foreground/80">
                            <IconListSearch className="size-6 text-primary" />
                            Reclutamiento
                        </div>
                        {data.recruitmentApplications?.length > 0 ? (
                            <div className="w-full space-y-3">
                                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-1 text-center">Últimas aplicaciones pendientes</p>
                                {data.recruitmentApplications.slice(0, 3).map((app: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between bg-muted/20 backdrop-blur-sm p-3 rounded-xl border border-white/5 text-sm transition-all hover:bg-muted/30 group/item">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <Image
                                                    src={`/assets/images/classes/${app.character_class}.jpg`}
                                                    alt=""
                                                    width={32}
                                                    height={32}
                                                    className="rounded-lg shadow-2xl border border-white/10 object-cover"
                                                />
                                            </div>
                                            <div className="flex flex-col items-start translate-y-[1px]">
                                                <span className="font-black uppercase italic tracking-tighter text-white">{app.character_name}</span>
                                                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">{app.character_spec}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[11px] font-black uppercase text-amber-500/80 tracking-widest bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">Pendiente</span>
                                        </div>
                                    </div>
                                ))}
                                <Button
                                    variant="glass"
                                    className="w-full mt-2 text-[10px] uppercase font-black tracking-widest gap-2 h-11"
                                    onClick={() => router.push('/dashboard/reclutamiento')}
                                >
                                    Ver {pendingCount} aplicaciones
                                </Button>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm font-bold text-muted-foreground mt-1 uppercase tracking-widest">Estado actual</p>
                                <div className="flex items-center gap-2 text-emerald-500 font-black italic mt-1 text-2xl drop-shadow-lg">
                                    <div className="rounded-full bg-emerald-500/10 border border-emerald-500/20 size-8 flex items-center justify-center text-xs">
                                        <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                                    </div>
                                    {pendingCount}
                                </div>
                                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">Aplicaciones pendientes</p>
                                <Button
                                    variant="glass"
                                    className="w-full mt-4 text-[10px] uppercase font-black tracking-widest gap-2 h-11"
                                    onClick={() => router.push('/dashboard/reclutamiento')}
                                >
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
                    <div key={block.id} className="bg-card/40 backdrop-blur-md text-card-foreground border-border/40 border rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 shadow-xl hover:border-primary/40 transition-all duration-300 relative overflow-hidden group/card h-full">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
                        <div className="relative z-10 flex items-center gap-3 font-black italic uppercase tracking-widest text-lg text-muted-foreground/80">
                            <IconRefresh className="size-6 text-primary" />
                            Estado del Roster
                        </div>
                        <p className="text-sm font-bold text-muted-foreground/80 uppercase tracking-widest mt-1">Miembros rastreados: <span className="text-white font-black italic">{data.rosterCount}</span></p>
                        <div className="flex flex-col items-center justify-center my-2 bg-primary/10 rounded-2xl py-5 px-8 border border-primary/20 shadow-inner relative overflow-hidden w-full max-w-[280px]">
                            <div className="absolute inset-0 bg-holo opacity-5" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80 mb-2 drop-shadow-sm relative z-10">Última sincronización</span>
                            {data.lastBnetSync ? (
                                <span className="text-xl font-black italic tracking-tighter text-white drop-shadow-lg relative z-10">
                                    {new Date(data.lastBnetSync).toLocaleString("es-ES", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit"
                                    })}
                                </span>
                            ) : (
                                <span className="text-sm font-black italic text-orange-400 uppercase tracking-widest relative z-10">Sin sincronizaciones</span>
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
                    <div key={block.id} className="bg-card/40 backdrop-blur-md text-card-foreground border-border/40 border rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 shadow-xl hover:border-primary/40 transition-all duration-300 relative overflow-hidden group/card h-full">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
                        <div className="relative z-10 flex items-center gap-3 font-black italic uppercase tracking-widest text-lg text-muted-foreground/80">
                            <IconSword className="size-6 text-primary" />
                            Mi Lista BiS
                        </div>
                        {data.myBisSelections?.length > 0 ? (
                            <div className="w-full space-y-3">
                                {data.myBisSelections.slice(0, 3).map((bis: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3 bg-muted/20 backdrop-blur-sm p-3 rounded-xl border border-white/5 text-sm transition-all hover:bg-muted/30 group/item">
                                        {bis.item_icon ? (
                                            <Image
                                                src={bis.item_icon.startsWith('http') ? bis.item_icon : `https://render.worldofwarcraft.com/eu/icons/56/${bis.item_icon}.jpg`}
                                                width={40}
                                                height={40}
                                                className="size-10 rounded-xl shadow-2xl border border-white/10 object-cover"
                                                alt=""
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="size-10 rounded-xl bg-white/5 border border-white/10" />
                                        )}
                                        <div className="flex flex-col items-start flex-1 min-w-0 translate-y-[1px]">
                                            <span className="font-black uppercase italic tracking-tighter text-white truncate w-full text-left">{bis.item_name}</span>
                                            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest truncate w-full text-left">{bis.boss_name}</span>
                                        </div>
                                        <Badge variant="outline" className="text-[10px] font-black italic h-5 bg-primary/10 text-primary border-primary/20 shrink-0 px-2 rounded-lg">
                                            {bis.ilvl}
                                        </Badge>
                                    </div>
                                ))}
                                <Button
                                    variant="glass"
                                    className="w-full mt-2 text-[10px] uppercase font-black tracking-widest gap-2 h-11"
                                    onClick={() => router.push('/dashboard/bis')}
                                >
                                    <IconSettings className="size-4" /> Gestionar BiS
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4 py-4 w-full">
                                <p className="text-sm font-bold text-muted-foreground/60 uppercase tracking-widest text-center">No tienes objetos BiS seleccionados.</p>
                                <Button
                                    variant="glow"
                                    className="w-full text-[10px] font-black uppercase tracking-widest gap-2 h-11 shadow-lg shadow-primary/20"
                                    onClick={() => router.push('/dashboard/bis')}
                                >
                                    <IconSword className="size-4" /> Configurar BiS
                                </Button>
                            </div>
                        )}
                    </div>
                )

            case 'logs':
                return (
                    <div key={block.id} className="bg-card/40 backdrop-blur-md text-card-foreground border-border/40 border rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 shadow-xl hover:border-primary/40 transition-all duration-300 relative overflow-hidden group/card h-full">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
                        <div className="relative z-10 flex items-center gap-3 font-black italic uppercase tracking-widest text-lg text-muted-foreground/80">
                            <IconActivity className="size-6 text-primary" />
                            Últimos Logs
                        </div>
                        {data.recentLogs?.length > 0 ? (
                            <div className="w-full space-y-3">
                                {data.recentLogs.slice(0, 3).map((log: any) => (
                                    <a
                                        key={log.code}
                                        href={`https://www.warcraftlogs.com/reports/${log.code}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between bg-muted/20 backdrop-blur-sm p-3 rounded-xl border border-white/5 text-sm transition-all hover:bg-muted/30 group/item"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner group-hover/item:border-primary/40 transition-colors">
                                                <IconActivity className="size-5 text-primary" />
                                            </div>
                                            <div className="flex flex-col items-start min-w-0 translate-y-[1px]">
                                                <span className="font-black uppercase italic tracking-tighter text-white truncate w-full text-left group-hover/item:text-primary transition-colors">{log.title}</span>
                                                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest truncate w-full text-left">{log.zone?.name || "Raid"}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                                            <span className="text-[10px] font-black italic text-primary/80 tracking-widest bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 uppercase">
                                                {log.difficulty || "NM"}
                                            </span>
                                            <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                                                {new Date(log.startTime).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                                            </span>
                                        </div>
                                    </a>
                                ))}
                                <Button
                                    variant="glass"
                                    className="w-full mt-2 text-[10px] uppercase font-black tracking-widest gap-2 h-11"
                                    onClick={() => window.open('https://www.warcraftlogs.com/guild/id/743623', '_blank')}
                                >
                                    <IconExternalLink className="size-4" /> Ver en WarcraftLogs
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
            case 'donations':
                return <DonationSection 
                    key={block.id} 
                    roleLevel={roleLevel} 
                    recentDonations={data.recentDonations} 
                    donationGoal={data.donationGoal}
                    donationGoals={data.donationGoals}
                    myCharacters={data.myCharacters}
                    guildSettings={data.guildSettings}
                />
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
