"use client";
import { IconArrowLeft, IconApi } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { sileo } from "sileo";
import { useState } from "react";
import Link from "next/link";
// Mock data for the Swagger-style documentation
const endpoints = [
    // --- CORE GUILD ---
    {
        path: "/api/guild/info",
        method: "GET",
        color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        description: "Obtiene los metadatos básicos de la hermandad (Nombre, Facción, Región, Servidor).",
        auth: "Public / Session",
        body: "N/A"
    },
    {
        path: "/api/guild/sync",
        method: "POST",
        color: "bg-green-500/10 text-green-500 border-green-500/20",
        description: "Desencadena una sincronización manual del Roster completo contra la API de Battle.net. Actualiza perfiles, avatares, rangos y niveles.",
        auth: "Guild Master",
        body: "N/A"
    },
    {
        path: "/api/guild/roster",
        method: "DELETE",
        color: "bg-red-500/10 text-red-500 border-red-500/20",
        description: "Borra de forma permanente toda la tabla de personajes (Guild Roster) en la base de datos. Acción destructiva.",
        auth: "Guild Master",
        body: "N/A"
    },
    // --- MEMBER MANAGEMENT ---
    {
        path: "/api/guild/members/plannable",
        method: "GET",
        color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        description: "Obtiene los miembros marcados como 'visibles' para la planificación de raids, excluyendo alters automáticos.",
        auth: "Session",
        body: "N/A"
    },
    {
        path: "/api/guild/members/[id]",
        method: "PATCH",
        color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        description: "Actualiza metadatos locales de un miembro (Rol interno, Rango visual) por su ID de Supabase.",
        auth: "Officer / GM",
        body: "{ role?: string, rank?: string }"
    },
    {
        path: "/api/guild/ranks",
        method: "GET",
        color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        description: "Lista todos los rangos oficiales de la hermandad sincronizados desde WoW.",
        auth: "Session",
        body: "N/A"
    },
    // --- EVENTS & CALENDAR ---
    {
        path: "/api/guild/events",
        method: "GET | POST",
        color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
        description: "GET: Lista eventos de calendario. POST: Crea un nuevo evento de raid.",
        auth: "Session / Officer",
        body: "POST: { title, start_time, type, description }"
    },
    {
        path: "/api/guild/events/[id]",
        method: "PATCH | DELETE",
        color: "bg-orange-500/10 text-orange-500 border-orange-500/20",
        description: "PATCH: Modifica fecha o detalles. DELETE: Elimina permanentemente el evento.",
        auth: "Officer / GM",
        body: "PATCH: { title?, start_time? }"
    },
    {
        path: "/api/guild/events/[id]/roster",
        method: "PATCH",
        color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        description: "Guarda la composición de la raid (jugadores activos, banca) y bosses seleccionados.",
        auth: "Officer / GM",
        body: "{ signups: Array<RosterSignup>, bosses: string[] }"
    },
    {
        path: "/api/guild/schedule",
        method: "GET",
        color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        description: "Recupera la configuración semanal de horarios de raid recurrentes.",
        auth: "Session",
        body: "N/A"
    },
    {
        path: "/api/guild/schedule/sync",
        method: "POST",
        color: "bg-green-500/10 text-green-500 border-green-500/20",
        description: "Genera automáticamente eventos en el calendario basados en el Schedule semanal.",
        auth: "Officer / GM",
        body: "N/A"
    },
    // --- LOOT & BIS ---
    {
        path: "/api/loot/raid",
        method: "GET",
        color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        description: "Obtiene el loot de una raid desde Blizzard (con caché de 24h). Soporta ?refresh=true para forzar actualización.",
        auth: "Public / Session",
        body: "N/A"
    },
    {
        path: "/api/bis",
        method: "GET | POST | DELETE",
        color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
        description: "Gestión de listas Best-in-Slot. Permite guardar, borrar y consultar selecciones por personaje.",
        auth: "Session (Owner)",
        body: "POST: { member_id, item_id, slot, difficulty }"
    },
    // --- SECURITY & SYSTEM ---
    {
        path: "/api/guild/settings/credentials",
        method: "PATCH",
        color: "bg-orange-500/10 text-orange-500 border-orange-500/20",
        description: "Actualiza las claves de API (Battle.net, WCL, Discord) de la hermandad.",
        auth: "Guild Master",
        body: "{ discord_client_id?, bnet_client_secret?, ... }"
    },
    {
        path: "/api/me",
        method: "GET",
        color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
        description: "Devuelve el perfil del usuario actual, incluyendo sus personajes vinculados y rol global.",
        auth: "Session",
        body: "N/A"
    },
    {
        path: "/api/guild/auth/[...nextauth]",
        method: "GET | POST",
        color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
        description: "Endpoints de control de NextAuth para gestión de sesiones OAuth2.",
        auth: "Public",
        body: "N/A"
    }
];

interface SettingsApiClientProps {
    wclClientId?: string;
    wclClientSecret?: string;
    bnetClientId?: string;
    bnetClientSecret?: string;
    discordClientId?: string;
    discordClientSecret?: string;
    discordGuildId?: string;
}

export function SettingsApiClient({
    wclClientId,
    wclClientSecret,
    bnetClientId,
    bnetClientSecret,
    discordClientId,
    discordClientSecret,
    discordGuildId,
}: SettingsApiClientProps) {
    return (
        <div className="flex flex-col gap-6 p-4 md:p-6 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/settings">
                    <Button variant="outline" size="icon" className="h-8 w-8 hover:bg-muted">
                        <IconArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        API Documentation <IconApi className="w-6 h-6 text-purple-500" />
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Documentación técnica de los endpoints internos de GuildBoard.
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-6 mt-2">
                <div className="grid gap-4">
                    {endpoints.map((ep, i) => (
                        <Card key={i} className="overflow-hidden border-border/40 shadow-sm transition-all hover:border-primary/20 bg-card/40">
                            <CardHeader className="flex flex-row items-center gap-4 py-2.5 bg-muted/10 border-b border-border/10">
                                <Badge variant="outline" className={`w-20 justify-center font-mono text-[10px] rounded-sm py-0 h-5 ${ep.color}`}>
                                    {ep.method}
                                </Badge>
                                <span className="font-mono text-xs tracking-tight text-foreground/90 font-medium">
                                    {ep.path}
                                </span>
                                <div className="flex-1" />
                                <Badge variant="secondary" className="font-normal text-[10px] bg-card/60 border border-border h-5 px-1.5 py-0">
                                    Auth: {ep.auth}
                                </Badge>
                            </CardHeader>
                            <CardContent className="pt-3 pb-3">
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {ep.description}
                                </p>
                                {ep.body !== "N/A" && (
                                    <div className="mt-3 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60">Payload (Body)</span>
                                        <pre className="text-[11px] font-mono bg-[#1a1b1e] text-gray-400 p-2 rounded border border-border/30 overflow-x-auto">
                                            {ep.body}
                                        </pre>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
