"use client";

import { IconArrowLeft, IconApi, IconLock, IconWorld, IconUser, IconCalendar, IconSword, IconSettings, IconChevronDown, IconCopy, IconCheck, IconUsers, IconListSearch } from "@tabler/icons-react";
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
        title: "Reclutamiento",
        icon: <IconListSearch className="w-4 h-4" />,
        endpoints: [
            {
                path: "/api/recruitment/applications",
                method: "GET | POST",
                description: "GET: Lista de solicitudes pendientes. POST: Envío de nueva solicitud.",
                auth: "Público (POST) / Officer (GET)",
                response: `[ { "id": "uuid", "character_name": "...", "status": "pending", ... } ]`
            },
            {
                path: "/api/recruitment/applications/[id]",
                method: "PATCH",
                description: "Acepta, rechaza o pone en espera una solicitud de ingreso.",
                auth: "Officer / GM",
                body: `{ "status": "approved", "officer_note": "Bienvenido!" }`
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
                description: "Fetch de reportes o combates específicos desde la API V2 de WarcraftLogs.",
                auth: "Sesión",
                params: "?code=ReportCode (opcional)",
                response: `{ "reportData": { "reports": { "data": [...] } } }`
            },
            {
                path: "/api/guild/roles",
                method: "POST | DELETE",
                description: "Mapeo de roles de Discord con niveles de acceso web (GM, Officer, Raider).",
                auth: "Guild Master",
                body: "POST: { discord_role_id: '...', app_role: 'officer' }"
            },
            {
                path: "/api/guild/permissions",
                method: "GET | PATCH",
                description: "Gestión de la matriz de permisos para cada módulo del panel.",
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
                bg: "bg-blue-500/10",
                text: "text-blue-400",
                border: "border-blue-500/20",
                badge: "bg-blue-500/10 text-blue-400 border-blue-500/20"
            };
            case "POST": return {
                bg: "bg-emerald-500/10",
                text: "text-emerald-400",
                border: "border-emerald-500/20",
                badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            };
            case "PATCH":
            case "PUT": return {
                bg: "bg-amber-500/10",
                text: "text-amber-400",
                border: "border-amber-500/20",
                badge: "bg-amber-500/10 text-amber-400 border-amber-500/20"
            };
            case "DELETE": return {
                bg: "bg-rose-500/10",
                text: "text-rose-400",
                border: "border-rose-500/20",
                badge: "bg-rose-500/10 text-rose-400 border-rose-500/20"
            };
            default: return {
                bg: "bg-zinc-500/10",
                text: "text-zinc-400",
                border: "border-zinc-500/20",
                badge: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
            };
        }
    };

    return (
        <div className="flex flex-col gap-10 p-4 md:p-6 lg:px-8 pb-40 w-full max-w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col gap-8 relative">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/dashboard/settings">
                            <Button variant="outline" size="icon" className="size-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 transition-all shadow-xl">
                                <IconArrowLeft className="size-6" />
                            </Button>
                        </Link>
                        <Badge variant="outline" className="bg-purple-500/5 text-purple-400 border-purple-500/20 px-4 py-1.5 text-[10px] font-mono tracking-widest uppercase">
                            INTERNAL API v1.0
                        </Badge>
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black font-heading italic tracking-tighter text-white uppercase">
                        DEVELOPERS GUIDE
                    </h1>
                    <p className="text-sm font-medium text-white/40 max-w-3xl leading-relaxed uppercase tracking-widest">
                        Referencia técnica exhaustiva. Todos los endpoints están protegidos por <span className="text-blue-400 font-bold italic">Row Level Security</span> y requieren sesión válida.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-20 mt-4">
                {categories.map((cat, i) => (
                    <section key={i} className="space-y-8">
                        <div className="flex items-center gap-5 border-b border-white/5 pb-6">
                            <div className="size-14 rounded-[1.25rem] bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                                {cat.icon}
                            </div>
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tight text-white">{cat.title}</h2>
                                <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] mt-1">{cat.endpoints.length} Endpoints disponibles</p>
                            </div>
                        </div>

                        <Accordion type="single" collapsible className="space-y-5">
                            {cat.endpoints.map((ep, j) => {
                                const styles = getMethodConfig(ep.method);
                                return (
                                    <AccordionItem
                                        key={j}
                                        value={`${i}-${j}`}
                                        className={cn(
                                            "group rounded-[2rem] overflow-hidden transition-all duration-500 border border-white/5",
                                            "bg-zinc-900/40 backdrop-blur-3xl hover:bg-zinc-900/60 hover:border-white/10 shadow-2xl"
                                        )}
                                    >
                                        <AccordionTrigger className="hover:no-underline p-6 data-[state=open]:bg-white/[0.03] transition-all">
                                            <div className="flex items-center gap-6 w-full text-left">
                                                <div className={cn(
                                                    "w-24 h-11 flex items-center justify-center rounded-xl font-black text-[11px] tracking-[0.2em] shadow-xl transition-all group-hover:scale-105 border",
                                                    styles.bg,
                                                    styles.text,
                                                    styles.border
                                                )}>
                                                    {ep.method.split(" | ")[0]}
                                                </div>
                                                <div className="flex flex-col gap-1 min-w-0">
                                                    <code className="text-base font-mono font-bold text-white tracking-tighter overflow-hidden text-ellipsis whitespace-nowrap">
                                                        {ep.path}
                                                    </code>
                                                    <span className="text-[10px] text-white/20 font-black uppercase tracking-widest md:hidden">
                                                        {ep.description}
                                                    </span>
                                                </div>
                                                <div className="hidden md:block flex-1 border-b border-dashed border-white/5 mx-4 opacity-50" />
                                                <div className="hidden md:block text-[11px] font-bold text-white/40 uppercase tracking-wider max-w-[350px] truncate group-hover:text-white/60 transition-colors">
                                                    {ep.description}
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="p-0 border-t border-white/5">
                                            <div className="p-8 md:p-10 space-y-12 bg-black/40">
                                                {/* Meta Info */}
                                                <div className="flex flex-wrap items-center justify-between gap-8">
                                                    <div className="space-y-3">
                                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Descripción del Recurso</h3>
                                                        <p className="text-xl font-black text-white tracking-tight">{ep.description}</p>
                                                    </div>
                                                    <div className="flex items-center gap-4 bg-primary/5 px-6 py-4 rounded-3xl border border-primary/10 shadow-xl backdrop-blur-md">
                                                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/10">
                                                            <IconLock className="size-4" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Nivel de Acceso</h3>
                                                            <p className="text-xs font-black text-primary uppercase tracking-widest mt-0.5">{ep.auth}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Request Section */}
                                                <div className="space-y-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-4 w-1 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                                                        <h3 className="text-xs font-black uppercase tracking-[0.25em] text-white/60">Estructura de Petición</h3>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        {ep.params || ep.body ? (
                                                            <>
                                                                {ep.params && (
                                                                    <div className="space-y-3">
                                                                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-1">URL Parameters</span>
                                                                        <div className="bg-zinc-950/80 rounded-2xl p-5 border border-white/5 font-mono text-xs text-blue-300/80 shadow-2xl ring-1 ring-white/5">
                                                                            {ep.params}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {ep.body && (
                                                                    <div className="space-y-3">
                                                                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest ml-1">Payload (JSON)</span>
                                                                        <div className="bg-zinc-950/80 rounded-2xl p-5 border border-white/5 font-mono text-xs text-emerald-300/80 shadow-2xl ring-1 ring-white/5">
                                                                            <pre className="whitespace-pre-wrap">{ep.body}</pre>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <div className="col-span-2 bg-zinc-950/40 rounded-2xl p-6 border border-dashed border-white/10 flex items-center justify-center gap-4 text-white/20 italic text-sm font-medium">
                                                                <IconApi className="size-5" />
                                                                Este endpoint no requiere parámetros ni cuerpo de mensaje.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Response Section */}
                                                {ep.response && (
                                                    <div className="space-y-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-4 w-1 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                                                            <h3 className="text-xs font-black uppercase tracking-[0.25em] text-amber-500/80">Modelo de Respuesta</h3>
                                                        </div>
                                                        <div className="relative group/example">
                                                            <div className="bg-[#050505] rounded-[2rem] p-8 border border-white/5 shadow-[0_30px_60px_rgba(0,0,0,0.6)] ring-1 ring-white/5">
                                                                <pre className="text-xs font-mono text-white/50 overflow-x-auto leading-relaxed scrollbar-hide no-scrollbar">
                                                                    {ep.response}
                                                                </pre>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="absolute top-6 right-6 size-10 rounded-xl bg-white/5 text-white/20 hover:text-white hover:bg-white/10 opacity-0 group-hover/example:opacity-100 transition-all shadow-xl backdrop-blur-xl border border-white/10"
                                                                onClick={() => copyToClipboard(ep.response || "", 'example')}
                                                            >
                                                                <IconCopy className="size-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Quick Actions */}
                                                <div className="flex items-center justify-between pt-10 border-t border-white/5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                                                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Service Status: Operational</span>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        className="h-12 px-8 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] gap-3 border-white/10 hover:bg-white/5 hover:border-white/20 text-white transition-all active:scale-95 shadow-2xl"
                                                        onClick={() => copyToClipboard(ep.path, 'path')}
                                                    >
                                                        {copiedPath === ep.path ? (
                                                            <><IconCheck className="size-4 text-emerald-500" /> Copiado</>
                                                        ) : (
                                                            <><IconCopy className="size-4" /> Copiar Endpoint</>
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

            <footer className="py-32 flex flex-col items-center gap-8 border-t border-white/5 mt-20 opacity-40">
                <div className="p-4 rounded-3xl bg-white/5 border border-white/10 grayscale">
                    <IconApi className="size-12" />
                </div>
                <div className="text-center space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.6em] text-white/40">GuildBoard Developers Portal</p>
                    <p className="text-[10px] font-bold text-white/20 italic tracking-widest">© 2024 Artic Tempest - Powered by Artic API v1.0</p>
                </div>
            </footer>
        </div>
    );
}
