"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
    IconRefresh,
    IconCheck,
    IconX,
    IconTrash,
    IconArrowLeft,
    IconUserPlus,
    IconSearch,
} from "@tabler/icons-react";
import { Button } from "@/shared/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui/select";
import { WOW_REALMS } from "@/shared/integrations/bnet/realms";
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
    
    // Manual character add state
    const [manualName, setManualName] = useState("");
    const [manualRealm, setManualRealm] = useState("");
    const [addingManual, setAddingManual] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await fetch("/api/guild/sync", {
                method: "POST",
                credentials: "include",
            });
            const data = await res.json();

            if (!res.ok) {
                toast.error("Error al sincronizar", {
                    description: data.error ?? "Error desconocido",
                });
                return;
            }

            toast.success("Roster sincronizado", {
                description: `${data.imported} personajes importados de ${data.guild}`,
            });

            window.location.reload();
        } catch {
            toast.error("Error de conexión", {
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
                toast.error("Error al borrar", {
                    description: data.error ?? "No se pudo vaciar la lista de personajes.",
                });
                return;
            }

            toast.success("Roster eliminado", {
                description: "Se han borrado todos los personajes de la base de datos.",
            });

            window.location.reload();
        } catch {
            toast.error("Error de conexión", {
                description: "No se pudo contactar con el servidor.",
            });
        } finally {
            setWiping(false);
        }
    };

    const handleAddManual = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualName || !manualRealm) {
            toast.error("Faltan datos", { description: "Reino y nombre son obligatorios." });
            return;
        }

        setAddingManual(true);
        try {
            const res = await fetch("/api/guild/roster", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: manualName,
                    realm: manualRealm,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error("Error", { 
                    description: data.details ? `${data.error}: ${data.details}` : (data.error || "No se pudo añadir el personaje.") 
                });
                return;
            }

            toast.success("Personaje añadido", {
                description: `${data.character.character_name} se ha añadido correctamente al roster.`,
            });
            
            setOpenDialog(false);
            setManualName("");
            setManualRealm("");
            
            // Refresh counts/data
            window.location.reload();
        } catch {
            toast.error("Error de conexión");
        } finally {
            setAddingManual(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6 italic">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 not-italic">
                <div className="flex items-center gap-6">
                    <Link href="/dashboard/configuracion">
                        <Button variant="outline" size="icon" className="size-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 transition-all shadow-xl">
                            <IconArrowLeft className="size-6 text-white/50" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black font-heading italic tracking-tight uppercase flex items-center gap-3">
                            SINCRONIZACIÓN BATTLE.NET
                        </h1>
                        <p className="text-sm font-medium text-white/40 mt-2 uppercase tracking-widest leading-tight">
                            Gestiona la importación de miembros y datos desde la API oficial de Blizzard.
                        </p>
                    </div>
                </div>

                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="h-12 px-6 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 transition-all shadow-xl font-bold uppercase tracking-widest text-xs gap-2 shrink-0">
                            <IconUserPlus className="size-5" />
                            Añadir Personaje a Mano
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-zinc-950 border-white/5 shadow-2xl rounded-2xl sm:rounded-3xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black uppercase tracking-tight italic">AÑADIR PERSONAJE</DialogTitle>
                            <DialogDescription className="text-white/40 font-medium">
                                Introduce el nombre y el reino del personaje para buscarlo en la API de Blizzard y añadirlo al roster.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddManual} className="space-y-6 pt-4">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="char-name" className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Nombre del Personaje</Label>
                                    <Input
                                        id="char-name"
                                        placeholder="Ej: Thrall"
                                        value={manualName}
                                        onChange={(e) => setManualName(e.target.value)}
                                        className="bg-white/5 border-white/5 h-12 rounded-xl text-lg font-bold placeholder:text-white/10 placeholder:font-normal"
                                        autoFocus
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="char-realm" className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Reino</Label>
                                    <Select 
                                        value={manualRealm} 
                                        onValueChange={setManualRealm}
                                    >
                                        <SelectTrigger className="bg-white/5 border-white/5 h-12 rounded-xl text-lg font-bold">
                                            <SelectValue placeholder="Selecciona el reino" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-950 border-white/5 max-h-[300px]">
                                            {WOW_REALMS.map((realm) => (
                                                <SelectItem 
                                                    key={realm.slug} 
                                                    value={realm.slug}
                                                    className="font-bold py-3"
                                                >
                                                    {realm.name}
                                                </SelectItem>
                                            ))}
                                            <Separator className="my-2 bg-white/5" />
                                            <div className="p-2 text-[10px] text-white/20 italic text-center">
                                                Si no aparece el reino, puedes escribirlo manualmente arriba
                                            </div>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter className="pt-4">
                                <Button
                                    type="submit"
                                    disabled={addingManual || !manualName || !manualRealm}
                                    className="w-full h-14 rounded-xl font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/20 group"
                                >
                                    {addingManual ? (
                                        <IconRefresh className="size-5 animate-spin" />
                                    ) : (
                                        <>
                                            <IconSearch className="size-5 mr-2 group-hover:scale-110 transition-transform" />
                                            Buscar y Añadir
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="not-italic">
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
                            <Link href="/dashboard/configuracion/general">
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

            <Card className="border-red-500/20 bg-red-500/5 not-italic">
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
