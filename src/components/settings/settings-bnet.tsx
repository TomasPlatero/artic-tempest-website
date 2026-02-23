"use client";

import { useState } from "react";
import { sileo } from "sileo";
import {
    IconRefresh,
    IconCheck,
    IconX,
    IconTrash,
    IconArrowLeft,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

type SettingsBnetClientProps = {
    memberCount: number;
    lastSync: string | null;
    bnetConfigured: boolean;
    hasGuild: boolean;
};

export function SettingsBnetClient({
    memberCount,
    lastSync,
    bnetConfigured,
    hasGuild,
}: SettingsBnetClientProps) {
    const [syncing, setSyncing] = useState(false);
    const [wiping, setWiping] = useState(false);

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await fetch("/api/guild/sync", {
                method: "POST",
                credentials: "include",
            });
            const data = await res.json();

            if (!res.ok) {
                sileo.error({
                    title: "Error al sincronizar",
                    description: data.error ?? "Error desconocido",
                });
                return;
            }

            sileo.success({
                title: "Roster sincronizado",
                description: `${data.imported} personajes importados de ${data.guild}`,
            });

            window.location.reload();
        } catch {
            sileo.error({
                title: "Error de conexión",
                description: "No se pudo contactar con el servidor",
            });
        } finally {
            setSyncing(false);
        }
    };

    const handleWipeRoster = async () => {
        if (
            !confirm(
                "⚠️ ATENCIÓN: Estás a punto de borrar TODO el roster importado de la hermandad. ¿Estás seguro?",
            )
        ) {
            return;
        }

        setWiping(true);
        try {
            const res = await fetch("/api/guild/roster", {
                method: "DELETE",
            });
            const data = await res.json();

            if (!res.ok) {
                sileo.error({
                    title: "Error al borrar",
                    description: data.error ?? "No se pudo vaciar la lista de personajes.",
                });
                return;
            }

            sileo.success({
                title: "Roster eliminado",
                description: "Se han borrado todos los personajes de la base de datos.",
            });

            window.location.reload();
        } catch {
            sileo.error({
                title: "Error de conexión",
                description: "No se pudo contactar con el servidor.",
            });
        } finally {
            setWiping(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/settings">
                    <Button variant="outline" size="icon" className="h-8 w-8">
                        <IconArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Configuración de Battle.net</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Conexión con la API de Blizzard, sincronización y borrado de la caché.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Estado y Sincronización</CardTitle>
                    <CardDescription>
                        Importa y actualiza los datos de la hermandad desde la Armería de
                        World of Warcraft.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                    <div className="grid gap-3 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Estado API</span>
                            {bnetConfigured ? (
                                <Badge
                                    variant="outline"
                                    className="bg-green-500/10 text-green-500 border-green-500/20"
                                >
                                    <IconCheck className="size-3 mr-1" />
                                    Configurado
                                </Badge>
                            ) : (
                                <Badge
                                    variant="outline"
                                    className="bg-red-500/10 text-red-500 border-red-500/20"
                                >
                                    <IconX className="size-3 mr-1" />
                                    Sin configurar
                                </Badge>
                            )}
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Miembros importados</span>
                            <span className="font-medium tabular-nums text-lg">{memberCount}</span>
                        </div>
                        {lastSync && (
                            <>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Última sincronización</span>
                                    <span className="font-medium">
                                        {new Date(lastSync).toLocaleString("es-ES", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    {!bnetConfigured && (
                        <div className="rounded-lg bg-orange-500/10 border border-orange-500/30 p-4">
                            <h4 className="font-semibold text-orange-500 mb-2">Acción Requerida</h4>
                            <p className="text-sm text-orange-500/80 mb-3">
                                No se han detectado las credenciales de la API de Battle.net.
                                Necesitas configurarlas para activar la sincronización automática.
                            </p>
                            <Link href="/dashboard/settings/api">
                                <Button variant="outline" size="sm" className="bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20 text-orange-600">
                                    Configurar Credenciales API
                                </Button>
                            </Link>
                        </div>
                    )}

                    <Button
                        onClick={handleSync}
                        disabled={syncing || !bnetConfigured || !hasGuild}
                        className="w-full sm:w-auto self-start"
                        size="lg"
                    >
                        <IconRefresh className={`mr-2 h-5 w-5 ${syncing ? "animate-spin" : ""}`} />
                        {syncing ? "Sincronizando con Armería..." : "Sincronizar Roster Ahora"}
                    </Button>
                </CardContent>
            </Card>

            <Card className="border-red-500/20 bg-red-500/5">
                <CardHeader>
                    <CardTitle className="text-red-500">Zona de Peligro</CardTitle>
                    <CardDescription className="text-red-500/70">
                        Acciones destructivas e irreversibles
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-red-500/20 bg-card">
                        <div>
                            <p className="font-medium text-sm">Vaciar Configuración de Roster</p>
                            <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                                Elimina todos los personajes y miembros de la caché. Se
                                tendrá que sincronizar todo desde cero para repoblar la base de datos.
                                Afectará a los eventos de raid en curso que referencian a estos personajes.
                            </p>
                        </div>
                        <Button
                            variant="destructive"
                            onClick={handleWipeRoster}
                            disabled={wiping || memberCount === 0}
                            className="w-full sm:w-auto shrink-0"
                        >
                            {wiping ? (
                                <IconRefresh className="size-4 mr-2 animate-spin" />
                            ) : (
                                <IconTrash className="size-4 mr-2" />
                            )}
                            Borrar todo el Roster
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
