"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
    IconArrowLeft,
    IconUsers,
    IconDeviceFloppy,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
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
    rankColors: (string | null)[];
};

export function SettingsRosterClient({
    rankVisibility: initialRankVisibility,
    rankNames: initialRankNames,
    rankRoles: initialRankRoles,
    rankColors: initialRankColors,
}: SettingsRosterClientProps) {
    const [ranks, setRanks] = useState<boolean[]>(initialRankVisibility);
    const [names, setNames] = useState<string[]>(initialRankNames);
    const [roles, setRoles] = useState<string[]>(initialRankRoles);
    const [colors, setColors] = useState<(string | null)[]>(initialRankColors);

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
                    appRole: roles[rankId],
                    color: colors[rankId]
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.details || data.error || "API error");

            toast.success(isVisible ? "Rango Visible" : "Rango Oculto", {
                description: `El rango ${names[rankId]} ahora ${isVisible ? 'se muestra' : 'está oculto'} en el Roster.`,
            });
        } catch (err: any) {
            toast.error("Error", {
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
                    appRole: roles[rankId],
                    color: colors[rankId]
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.details || data.error || "API error");
            toast.success("Guardado", {
                description: "Nombre de rango actualizado.",
            });
        } catch (err: any) {
            toast.error("Error", {
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
                    appRole: newRole,
                    color: colors[rankId]
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.details || data.error || "API error");
            toast.success("Guardado", {
                description: "Permiso base del rango actualizado.",
            });
        } catch (err: any) {
            setRoles([...roles]);
            toast.error("Error", {
                description: err.message || "No se pudo actualizar el permiso del rango.",
            });
        }
    };

    const handleSaveColor = async (rankId: number, newColor: string) => {
        const nextColors = [...colors];
        nextColors[rankId] = newColor;
        setColors(nextColors);

        try {
            const res = await fetch("/api/guild/ranks", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    rankId,
                    isVisible: ranks[rankId],
                    name: names[rankId],
                    appRole: roles[rankId],
                    color: newColor
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.details || data.error || "API error");
            toast.success("Guardado", {
                description: "Color de rango actualizado.",
            });
        } catch (err: any) {
            setColors([...colors]);
            toast.error("Error", {
                description: err.message || "No se pudo actualizar el color del rango.",
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

                                    <div className="flex items-center gap-2 px-3 border-l border-border/40 ml-1 shrink-0">
                                        <div className="relative flex items-center gap-3">
                                            <div className="relative group/picker">
                                                <input
                                                    type="color"
                                                    value={colors[rankId] || "#ffffff"}
                                                    onChange={(e) => {
                                                        const next = [...colors];
                                                        next[rankId] = e.target.value;
                                                        setColors(next);
                                                    }}
                                                    onBlur={(e) => handleSaveColor(rankId, e.target.value)}
                                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                                    title="Elegir color"
                                                />
                                                <div
                                                    className="size-7 rounded-full border-2 border-white/10 shadow-[0_0_10px_rgba(255,255,255,0.05)] shrink-0 transition-transform group-hover/picker:scale-110"
                                                    style={{
                                                        backgroundColor: colors[rankId] || "#ffffff",
                                                        boxShadow: colors[rankId] ? `0 0 12px ${colors[rankId]}44` : 'none'
                                                    }}
                                                />
                                            </div>
                                            <div className="relative flex items-center">
                                                <span className="absolute left-2.5 text-[10px] text-muted-foreground font-mono select-none">#</span>
                                                <Input
                                                    value={(colors[rankId] || "#ffffff").replace('#', '')}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
                                                        const next = [...colors];
                                                        next[rankId] = `#${val}`;
                                                        setColors(next);
                                                    }}
                                                    onBlur={(e) => {
                                                        const val = `#${e.target.value.replace(/[^0-9A-Fa-f]/g, '')}`;
                                                        if (val.length === 4 || val.length === 7) {
                                                            handleSaveColor(rankId, val);
                                                        }
                                                    }}
                                                    className="h-8 w-24 text-[11px] font-mono bg-background/40 border-border/30 pl-5 pr-2 focus-visible:ring-primary/30 focus-visible:border-primary/50 uppercase italic"
                                                    placeholder="FFFFFF"
                                                />
                                            </div>
                                        </div>
                                    </div>
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
        </div>
    );
}
