"use client";

import { useState } from "react";
import { sileo } from "sileo";
import {
    IconArrowLeft,
    IconUsers,
    IconDeviceFloppy,
    IconRefresh,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

type SettingsRosterClientProps = {
    rankVisibility: boolean[];
    rankNames: string[];
    rankRoles: string[];
};

export function SettingsRosterClient({
    rankVisibility: initialRankVisibility,
    rankNames: initialRankNames,
    rankRoles: initialRankRoles,
}: SettingsRosterClientProps) {
    const [ranks, setRanks] = useState<boolean[]>(initialRankVisibility);
    const [names, setNames] = useState<string[]>(initialRankNames);
    const [roles, setRoles] = useState<string[]>(initialRankRoles);

    const handleToggleRank = async (rankId: number, isVisible: boolean) => {
        const orig = [...ranks];
        const next = [...ranks];
        next[rankId] = isVisible;
        setRanks(next);

        try {
            const res = await fetch("/api/guild/ranks", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    rankId,
                    isVisible,
                    name: names[rankId],
                    appRole: roles[rankId]
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.details || data.error || "API error");
        } catch (err: any) {
            sileo.error({
                title: "Error",
                description: err.message || "No se pudo guardar la configuración del rango.",
            });
            setRanks(orig);
        }
    };

    const handleSaveName = async (rankId: number, newName: string) => {
        try {
            const res = await fetch("/api/guild/ranks", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    rankId,
                    isVisible: ranks[rankId],
                    name: newName,
                    appRole: roles[rankId]
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.details || data.error || "API error");
            sileo.success({
                title: "Guardado",
                description: "Nombre de rango actualizado.",
            });
        } catch (err: any) {
            sileo.error({
                title: "Error",
                description: err.message || "No se pudo actualizar el nombre del rango.",
            });
        }
    };

    const handleSaveRole = async (rankId: number, newRole: string) => {
        const nextRoles = [...roles];
        nextRoles[rankId] = newRole;
        setRoles(nextRoles);

        try {
            const res = await fetch("/api/guild/ranks", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    rankId,
                    isVisible: ranks[rankId],
                    name: names[rankId],
                    appRole: newRole
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.details || data.error || "API error");
            sileo.success({
                title: "Guardado",
                description: "Permiso base del rango actualizado.",
            });
        } catch (err: any) {
            setRoles([...roles]);
            sileo.error({
                title: "Error",
                description: err.message || "No se pudo actualizar el permiso del rango.",
            });
        }
    };

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/settings/apps">
                    <Button variant="outline" size="icon" className="h-8 w-8">
                        <IconArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold font-heading italic tracking-tight flex items-center gap-3">
                        <IconUsers className="size-6 text-blue-500" />
                        Ajustes de Roster
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Configura qué personajes son visibles según su rango de hermandad.
                    </p>
                </div>
            </div>

            <Card className="border-border/40 bg-card/30 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Visibilidad por Rango</CardTitle>
                    <CardDescription>
                        Desactiva un rango para que sus miembros no aparezcan en la vista pública del Roster.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {names.map((name, rankId) => (
                            <div
                                key={rankId}
                                className="group flex flex-row items-center gap-3 p-3 border rounded-md hover:bg-muted/40 transition-colors bg-card/30"
                            >
                                <span className="text-muted-foreground text-xs font-mono w-4 shrink-0">{rankId}</span>
                                <div className="flex flex-1 items-center gap-2 min-w-0">
                                    <Input
                                        value={names[rankId]}
                                        onChange={(e) => {
                                            const next = [...names];
                                            next[rankId] = e.target.value;
                                            setNames(next);
                                        }}
                                        onBlur={(e) => handleSaveName(rankId, e.target.value)}
                                        className="h-8 flex-1 min-w-[100px] text-sm bg-background border-border/40"
                                        placeholder={`Rango ${rankId}`}
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8 text-muted-foreground hover:text-primary shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleSaveName(rankId, names[rankId])}
                                        title="Guardar nombre"
                                    >
                                        <IconDeviceFloppy className="size-4" />
                                    </Button>
                                </div>
                                <Switch
                                    checked={ranks[rankId]}
                                    onCheckedChange={(val: boolean) => handleToggleRank(rankId, val)}
                                    className="scale-90"
                                />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-xs text-muted-foreground leading-relaxed">
                <p>
                    <strong className="text-blue-400">Nota:</strong> Los cambios en la visibilidad se aplican inmediatamente. Los personajes de los rangos desactivados seguirán existiendo en la base de datos pero no se renderizarán en las columnas del Roster.
                </p>
            </div>
        </div>
    );
}
