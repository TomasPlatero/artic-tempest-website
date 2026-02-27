"use client";

import { IconArrowLeft, IconApi, IconLock, IconWorld, IconUser, IconCalendar, IconSword, IconSettings, IconChevronDown, IconCopy, IconCheck, IconUsers } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/infrastructure/tailwind/tailwind-utils";

interface Endpoint {
    path: string;
    method: string;
    description: string;
    auth: string;
    body?: string;
    params?: string;
    response?: string;
}

interface Category {
    title: string;
    icon: React.ReactNode;
    endpoints: Endpoint[];
}

const categories: Category[] = [
    {
        title: "Hermandad & Roster",
        icon: <IconWorld className="w-4 h-4" />,
        endpoints: [
            {
                path: "/api/guild/info",
                method: "GET",
                description: "Obtiene los metadatos de la hermandad vinculada (nombre y URL del icono).",
                auth: "Sesión",
                response: `{ "name": "Artic Tempest", "icon_url": "https://..." }`
            },
            {
                path: "/api/guild/sync",
                method: "POST",
                description: "Sincronización manual con Battle.net. Actualiza el roster local y sincroniza permisos de perfiles basados en el rango de WoW.",
                auth: "Guild Master / Officer",
                response: `{ "success": true, "imported": 245, "guild": "Artic Tempest (Sanguino - EU)" }`
            },
            {
                path: "/api/guild/roster",
                method: "DELETE",
                description: "Elimina todos los personajes del roster. Acción peligrosa para reinicio de datos.",
                auth: "Guild Master",
                response: `{ "success": true }`
            },
            {
                path: "/api/guild/ranks",
                method: "PATCH",
                description: "Actualiza la configuración de visibilidad, nombre o rol web asignado a un rango de WoW (0-9).",
                auth: "Guild Master",
                body: `{ "rankId": 0, "isVisible": true, "name": "Guild Master", "appRole": "gm" }`,
                response: `{ "success": true }`
            },
            {
                path: "/api/guild/icon",
                method: "POST",
                description: "Sube y actualiza el logotipo de la hermandad. El archivo se guarda en el storage de Supabase.",
                auth: "Guild Master",
                body: "FormData { file: File }",
                response: `{ "url": "https://..." }`
            }
        ]
    },
    {
        title: "Gestión de Miembros",
        icon: <IconUsers className="w-4 h-4" />,
        endpoints: [
            {
                path: "/api/guild/members/plannable",
                method: "GET",
                description: "Lista de personajes habilitados para el planificador de raids (is_plannable=true).",
                auth: "Sesión",
                response: `[ { "id": "uuid", "character_name": "Zatoshi", "rank": 0, ... }, ... ]`
            },
            {
                path: "/api/guild/members/[id]",
                method: "PATCH | DELETE",
                description: "PATCH: Actualiza rol, rango visual o estado plannable. DELETE: Elimina al miembro del roster local.",
                auth: "Officer / GM",
                body: `{ "role": "tank", "rank": 2, "is_plannable": true }`,
                response: `{ "success": true, "data": { ... } }`
            }
        ]
    },
    {
        title: "Calendario & Eventos",
        icon: <IconCalendar className="w-4 h-4" />,
        endpoints: [
            {
                path: "/api/guild/events",
                method: "GET | POST",
                description: "GET: Retorna eventos de la hermandad. POST: Crea una nueva raid.",
                auth: "Sesión (Lectura) / Officer (Escritura)",
                params: "?start=2024-01-01&end=2024-01-31",
                body: `{ "destination": "Voidspire", "difficulty": "Mythic", "event_date": "...", "selected_bosses": [...] }`
            },
            {
                path: "/api/guild/events/[id]",
                method: "PATCH | DELETE",
                description: "Actualiza metadatos del evento o lo elimina definitivamente.",
                auth: "Officer / GM",
                body: `{ "description": "Llegar puntuales", "difficulty": "Heroic" }`
            },
            {
                path: "/api/guild/events/[id]/roster",
                method: "PATCH",
                description: "Guarda la composición final (quien va, quien es banca) y bosses seleccionados.",
                auth: "Officer / GM",
                body: `{ "signups": [...], "selected_bosses": ["id1", "id2"] }`
            },
            {
                path: "/api/guild/schedule",
                method: "GET",
                description: "Horario semanal recurrente configurado para la hermandad.",
                auth: "Sesión",
                response: `[ { "day_of_week": 1, "start_time": "22:00", ... } ]`
            }
        ]
    },
    {
        title: "BiS & Loot",
        icon: <IconSword className="w-4 h-4" />,
        endpoints: [
            {
                path: "/api/loot/raid",
                method: "GET",
                description: "Proxy de Blizzard Journal. Cachea el loot de bandas por 24h.",
                auth: "Público",
                params: "?instance_id=1200&difficulty=heroic&refresh=true",
                response: `{ "instance_name": "Voidspire", "bosses": [...] }`
            },
            {
                path: "/api/bis",
                method: "GET | POST | DELETE",
                description: "CRUD de la lista de Best-in-Slot del usuario actual.",
                auth: "Sesión (Dueño)",
                params: "GET: ?member_id=uuid&instance_id=1200",
                body: "POST: { member_id: 'uuid', item_id: 123, slot: 'HEAD', ... }",
                response: `{ "id": "uuid", "item_name": "...", ... }`
            }
        ]
    },
    {
        title: "Integraciones (WCL & Discord)",
        icon: <IconSettings className="w-4 h-4" />,
        endpoints: [
            {
                path: "/api/wcl",
                method: "GET",
                description: "Fetch de reportes o combates específicos desde WarcraftLogs V2.",
                auth: "Sesión",
                params: "?code=ReportCode (opcional para detalles)",
                response: `{ "reportData": { "reports": [...] } }`
            },
            {
                path: "/api/guild/roles",
                method: "POST | DELETE",
                description: "Vincula roles de Discord con 'App Roles' (GM, Officer, Raider).",
                auth: "Guild Master",
                body: "POST: { discord_role_id: '...', role_name: '...', app_role: 'officer' }"
            },
            {
                path: "/api/guild/roles/discord",
                method: "POST | PUT | DELETE",
                description: "Mantenimiento de la tabla de roles de Discord conocidos.",
                auth: "Guild Master",
                body: "POST: { roleId: '...', name: '...', level: 'officer' }"
            },
            {
                path: "/api/guild/permissions",
                method: "GET | PATCH",
                description: "Matriz de permisos por sección. Define qué nivel de rol puede editar/ver.",
                auth: "GM (Escritura) / Sesión (Lectura)",
                body: "PATCH: { role_level: 'raider', app_id: 'roster', can_view: true }"
            }
        ]
    },
    {
        title: "CD Planner",
        icon: <IconSword className="w-4 h-4" />,
        endpoints: [
            {
                path: "/api/cd-planner/assignments",
                method: "GET | POST | DELETE",
                description: "Gestión de asignaciones de CDs por boss y tiempo en segundos.",
                auth: "Sesión (Lectura) / Officer (Escritura)",
                params: "GET: ?event_id=uuid&boss_name=BossName",
                body: "POST: { event_id: 'uuid', boss_name: 'Fyrakk', cooldown_id: '...', time_seconds: 45 }"
            },
            {
                path: "/api/cd-planner/cooldowns",
                method: "GET",
                description: "Diccionario de CDs soportados con sus iconos y metadatos de clase.",
                auth: "Sesión",
                response: `[ { "id": "shield-wall", "name": "Muro de Escudo", ... } ]`
            },
            {
                path: "/api/cd-planner/boss-summaries",
                method: "GET",
                description: "Obtiene un resumen de eventos que ya tienen planificaciones de CD guardadas, agrupados por jefe.",
                auth: "Sesión",
                response: `[ { "id": "event-uuid", "boss_name": "Imperator Averzian", "assignment_count": 12, ... } ]`
            }
        ]
    },
    {
        title: "Sistema & Auth",
        icon: <IconLock className="w-4 h-4" />,
        endpoints: [
            {
                path: "/api/me",
                method: "GET",
                description: "Información extendida de la sesión: perfil y personajes WoW vinculados.",
                auth: "Sesión",
                response: `{ "user": { "role_level": "officer", ... }, "characters": [...] }`
            },
            {
                path: "/api/cron/sync-roster",
                method: "GET",
                description: "Trigger automatizado para sincronización nocturna del roster.",
                auth: "CRON (Secret Key)",
                params: "?key=VITE_CRON_SECRET"
            },
            {
                path: "/api/guild/settings/credentials",
                method: "PATCH",
                description: "Gestión de secrets de API guardados de forma segura.",
                auth: "Guild Master",
                body: `{ "bnet_client_id": "...", "wcl_client_secret": "..." }`
            }
        ]
    }
];

export function SettingsApiClient({ }: any) {
    const [copiedPath, setCopiedPath] = useState<string | null>(null);

    const copyToClipboard = (content: string, type: 'path' | 'example' = 'path') => {
        const text = type === 'path' ? `${window.location.origin}${content}` : content;
        navigator.clipboard.writeText(text);
        if (type === 'path') setCopiedPath(content);
        toast.success("Copiado", {
            description: type === 'path' ? "URL del endpoint copiada" : "Ejemplo copiado al portapapeles",
        });
        if (type === 'path') setTimeout(() => setCopiedPath(null), 2000);
    };

    const getMethodConfig = (method: string) => {
        const m = method.split(" | ")[0];
        switch (m) {
            case "GET": return {
                bg: "bg-[#61affe]",
                text: "text-white",
                border: "border-[#61affe]/20",
                ghost: "bg-[#61affe]/10 text-[#61affe] border-[#61affe]/30"
            };
            case "POST": return {
                bg: "bg-[#49cc90]",
                text: "text-white",
                border: "border-[#49cc90]/20",
                ghost: "bg-[#49cc90]/10 text-[#49cc90] border-[#49cc90]/30"
            };
            case "PATCH":
            case "PUT": return {
                bg: "bg-[#fca130]",
                text: "text-white",
                border: "border-[#fca130]/20",
                ghost: "bg-[#fca130]/10 text-[#fca130] border-[#fca130]/30"
            };
            case "DELETE": return {
                bg: "bg-[#f93e3e]",
                text: "text-white",
                border: "border-[#f93e3e]/20",
                ghost: "bg-[#f93e3e]/10 text-[#f93e3e] border-[#f93e3e]/30"
            };
            default: return {
                bg: "bg-slate-500",
                text: "text-white",
                border: "border-slate-500/20",
                ghost: "bg-slate-500/10 text-slate-400 border-slate-500/30"
            };
        }
    };

    return (
        <div className="flex flex-col gap-10 p-4 md:p-10 pb-40 w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col gap-6 relative">

                <div className="flex items-center gap-4">
                    <Link href="/dashboard/settings">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <IconArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 border-purple-500/20 px-3 py-1 text-[10px] font-mono tracking-tighter">
                        INTERNAL API v1.0
                    </Badge>
                </div>

                <div className="space-y-3">
                    <h1 className="text-4xl font-black tracking-tight flex items-center gap-4 bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent">
                        Developers Guide
                    </h1>
                    <p className="text-lg text-muted-foreground/80 max-w-3xl leading-relaxed">
                        Referencia técnica exhaustiva para desarrolladores. Todos los endpoints están protegidos por <span className="text-foreground font-semibold">Row Level Security</span> y requieren autenticación válida.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-16">
                {categories.map((cat, i) => (
                    <section key={i} className="space-y-6">
                        <div className="flex items-center gap-4 border-b border-border/40 pb-4">
                            <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-inner">
                                {cat.icon}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">{cat.title}</h2>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{cat.endpoints.length} Endpoints disponibles</p>
                            </div>
                        </div>

                        <Accordion type="single" collapsible className="space-y-4">
                            {cat.endpoints.map((ep, j) => {
                                const styles = getMethodConfig(ep.method);
                                return (
                                    <AccordionItem
                                        key={j}
                                        value={`${i}-${j}`}
                                        className={cn(
                                            "group rounded-xl overflow-hidden transition-all duration-300 border-2",
                                            styles.border,
                                            "bg-card/30 hover:bg-card/60"
                                        )}
                                    >
                                        <AccordionTrigger className="hover:no-underline p-5 data-[state=open]:bg-muted/10 transition-all">
                                            <div className="flex items-center gap-6 w-full text-left">
                                                <div className={cn(
                                                    "w-24 h-10 flex items-center justify-center rounded-lg font-black text-sm tracking-widest shadow-lg shadow-black/20",
                                                    styles.bg,
                                                    styles.text
                                                )}>
                                                    {ep.method.split(" | ")[0]}
                                                </div>
                                                <div className="flex flex-col gap-1 min-w-0">
                                                    <code className="text-base font-mono font-bold text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                                                        {ep.path}
                                                    </code>
                                                    <span className="text-xs text-muted-foreground/80 font-medium md:hidden">
                                                        {ep.description}
                                                    </span>
                                                </div>
                                                <div className="hidden md:block flex-1 border-b border-dashed border-border/20 mx-4" />
                                                <div className="hidden md:block text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider max-w-[300px] truncate">
                                                    {ep.description}
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="p-0 border-t border-border/20">
                                            <div className="p-8 space-y-10 bg-muted/5">
                                                {/* Meta Info */}
                                                <div className="flex flex-wrap items-center justify-between gap-6">
                                                    <div className="space-y-2">
                                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Recurso</h3>
                                                        <p className="text-lg font-semibold">{ep.description}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3 bg-indigo-500/5 px-4 py-3 rounded-2xl border border-indigo-500/10">
                                                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                                                            <IconLock className="size-4" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/50">Seguridad</h3>
                                                            <p className="text-sm font-bold text-indigo-300/90">{ep.auth}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Request Section */}
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-4 w-1 rounded-full bg-primary" />
                                                        <h3 className="text-xs font-black uppercase tracking-widest">Petición</h3>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {ep.params || ep.body ? (
                                                            <>
                                                                {ep.params && (
                                                                    <div className="space-y-3">
                                                                        <span className="text-[10px] font-bold text-blue-400/80 uppercase">Query Parameters</span>
                                                                        <div className="bg-[#090b10] rounded-xl p-4 border border-blue-500/20 font-mono text-xs text-blue-200/80 shadow-inner">
                                                                            {ep.params}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {ep.body && (
                                                                    <div className="space-y-3">
                                                                        <span className="text-[10px] font-bold text-emerald-400/80 uppercase">Request Body (JSON)</span>
                                                                        <div className="bg-[#090b10] rounded-xl p-4 border border-emerald-500/20 font-mono text-xs text-emerald-200/80 shadow-inner">
                                                                            {ep.body}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <div className="col-span-2 bg-[#090b10]/30 rounded-xl p-5 border border-dashed border-border/20 flex items-center gap-4 text-muted-foreground/30">
                                                                <IconApi className="size-4" />
                                                                <span className="text-xs font-semibold italic">Este endpoint no requiere parámetros ni cuerpo de mensaje.</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Response Section */}
                                                {ep.response && (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-4 w-1 rounded-full bg-amber-500" />
                                                            <h3 className="text-xs font-black uppercase tracking-widest text-amber-500/80">Respuesta</h3>
                                                        </div>
                                                        <div className="relative group/example">
                                                            <div className="bg-[#0d1117] rounded-xl p-6 border border-amber-500/20 shadow-2xl">
                                                                <pre className="text-xs font-mono text-amber-200/70 overflow-x-auto leading-relaxed">
                                                                    {ep.response}
                                                                </pre>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="absolute top-4 right-4 text-amber-500/40 hover:text-amber-500 hover:bg-amber-500/10 opacity-0 group-hover/example:opacity-100 transition-all"
                                                                onClick={() => copyToClipboard(ep.response || "", 'example')}
                                                            >
                                                                <IconCopy className="size-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Quick Actions */}
                                                <div className="flex items-center justify-between pt-6 border-t border-border/20">
                                                    <div className="flex items-center gap-2">
                                                        <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                        <span className="text-[10px] font-mono text-muted-foreground uppercase">Endpoint Operativo</span>
                                                    </div>
                                                    <Button
                                                        variant="glow"
                                                        size="sm"
                                                        className="h-10 px-6 font-black text-xs gap-3"
                                                        onClick={() => copyToClipboard(ep.path, 'path')}
                                                    >
                                                        {copiedPath === ep.path ? (
                                                            <><IconCheck className="size-4" /> Copiado</>
                                                        ) : (
                                                            <><IconCopy className="size-4" /> Copiar URL</>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                );
                            })}
                        </Accordion>
                    </section>
                ))}
            </div>

            <footer className="py-20 flex flex-col items-center gap-6 border-t border-border/20 mt-20">
                <IconApi className="size-16 text-muted-foreground/10" />
                <div className="text-center space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/40">GuildBoard Developers Portal</p>
                    <p className="text-xs text-muted-foreground/30">© 2024 Artic Tempest - All rights reserved</p>
                </div>
            </footer>
        </div>
    );
}
