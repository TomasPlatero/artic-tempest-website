"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
    IconArrowLeft,
    IconUsers,
    IconDeviceFloppy,
    IconSettings,
    IconPalette,
    IconEye,
    IconEyeOff,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [tempName, setTempName] = useState("");
    const [tempColor, setTempColor] = useState("");
    const [tempVisible, setTempVisible] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const openEditModal = (index: number) => {
        setEditingIndex(index);
        setTempName(names[index]);
        setTempColor(colors[index] || "#ffffff");
        setTempVisible(ranks[index]);
        setIsModalOpen(true);
    };

    const handleSaveRankSettings = async () => {
        if (editingIndex === null) return;
        setIsSaving(true);

        try {
            const res = await fetch("/api/guild/ranks", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    rankId: editingIndex,
                    isVisible: tempVisible,
                    name: tempName,
                    appRole: roles[editingIndex],
                    color: tempColor
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.details || data.error || "API error");

            // Update local state
            const nextRanks = [...ranks];
            nextRanks[editingIndex] = tempVisible;
            setRanks(nextRanks);

            const nextNames = [...names];
            nextNames[editingIndex] = tempName;
            setNames(nextNames);

            const nextColors = [...colors];
            nextColors[editingIndex] = tempColor;
            setColors(nextColors);

            toast.success("Configuración Guardada", {
                description: `El rango ${tempName} ha sido actualizado correctamente.`,
            });
            setIsModalOpen(false);
        } catch (err: any) {
            toast.error("Error", {
                description: err.message || "No se pudo guardar la configuración del rango.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-8 p-4 md:p-6 lg:px-8 w-full max-w-full">
            <div className="flex items-center gap-6">
                <Link href="/dashboard/settings/apps">
                    <Button variant="outline" size="icon" className="size-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 transition-all shadow-xl">
                        <IconArrowLeft className="size-6" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-black font-heading italic tracking-tight flex items-center gap-4 text-white">
                        <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                            <IconUsers className="size-8 text-blue-500" />
                        </div>
                        AJUSTES DE ROSTER
                    </h1>
                    <p className="text-sm font-medium text-white/40 mt-2 uppercase tracking-widest">
                        Configura la visibilidad y apariencia de los rangos en el Roster.
                    </p>
                </div>
            </div>

            <Card className="border-white/5 bg-zinc-950/40 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl overflow-hidden ring-1 ring-white/5">
                <CardHeader className="p-8 md:p-10 pb-4">
                    <CardTitle className="text-xl font-black uppercase tracking-widest text-primary">Visibilidad por Rango</CardTitle>
                    <CardDescription className="text-sm font-medium text-white/40">
                        Gestiona cómo se muestran los miembros según su rango de hermandad.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-10 pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {names.map((name, rankId) => (
                            <div
                                key={rankId}
                                className="group flex items-center justify-between p-5 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 shadow-lg relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full transition-colors" style={{ backgroundColor: colors[rankId] || "#ffffff" }} />

                                <div className="flex items-center gap-4 min-w-0">
                                    <span className="text-[10px] font-black font-mono text-white/20 select-none w-4 shrink-0">{rankId}</span>
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                        <span className={`text-[13px] font-black uppercase tracking-wider truncate transition-colors ${ranks[rankId] ? 'text-white' : 'text-zinc-600'}`}>
                                            {names[rankId]}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <div className="size-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.1)]" style={{ backgroundColor: colors[rankId] || "#ffffff" }} />
                                            <span className="text-[8px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
                                                {colors[rankId] || "#FFFFFF"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {!ranks[rankId] && <IconEyeOff className="size-4 text-rose-500/50 mr-1" />}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-10 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-white/60 hover:text-white transition-all shadow-xl active:scale-95"
                                        onClick={() => openEditModal(rankId)}
                                    >
                                        <IconSettings className="size-5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Edit Rank Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-md bg-zinc-950 border-white/10 text-white rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] p-0 overflow-hidden outline-none">
                    <DialogHeader className="p-8 pb-4">
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <IconSettings className="size-6 text-primary" />
                            </div>
                            Configurar Rango
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-2">
                            ID: {editingIndex} • Personaliza la visibilidad y estética
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-8 space-y-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        {/* Name Input */}
                        <div className="space-y-3">
                            <Label className="text-[10px] uppercase font-black text-white/30 ml-1 tracking-[0.22em]">Nombre del Rango</Label>
                            <Input
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                className="bg-white/5 border-white/10 h-14 text-sm font-black uppercase tracking-wider rounded-2xl px-6 focus:ring-primary/20 transition-all"
                                placeholder="Ej: Elite Raider"
                            />
                        </div>

                        {/* Color Selection */}
                        <div className="space-y-4 w-full pb-24">
                            <Label className="text-[10px] uppercase font-black text-white/30 ml-1 tracking-[0.22em]">Color de Identificación</Label>
                            <div className="flex items-center gap-4 bg-white/[0.03] p-4 rounded-2xl border border-white/5 h-20">
                                <div className="relative size-12 shrink-0 group">
                                    <input
                                        type="color"
                                        value={tempColor}
                                        onChange={(e) => setTempColor(e.target.value)}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                    />
                                    <div
                                        className="size-full rounded-xl border-2 border-white/20 shadow-xl transition-transform group-hover:scale-110 flex items-center justify-center overflow-hidden"
                                        style={{ backgroundColor: tempColor }}
                                    >
                                        <IconPalette className="size-6 text-black/20" />
                                    </div>
                                </div>
                                <div className="flex-1 flex flex-col gap-1">
                                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Código Hex</span>
                                    <Input
                                        value={tempColor.replace('#', '')}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
                                            setTempColor(`#${val}`);
                                        }}
                                        className="h-8 p-0 bg-transparent border-none text-base font-mono font-bold text-white focus-visible:ring-0 uppercase tracking-widest"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Visibility Toggle */}
                        <div className="bg-white/[0.03] p-6 rounded-3xl border border-white/5 flex items-center justify-between group transition-colors hover:bg-white/[0.05]">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <Label className="text-[11px] font-black text-white uppercase tracking-wider cursor-pointer">Visibilidad Pública</Label>
                                    {tempVisible ? (
                                        <IconEye className="size-4 text-emerald-500" />
                                    ) : (
                                        <IconEyeOff className="size-4 text-rose-500" />
                                    )}
                                </div>
                                <span className="text-[9px] text-white/30 font-medium uppercase tracking-tight">Muestra u oculta este rango en el roster público</span>
                            </div>
                            <Switch
                                checked={tempVisible}
                                onCheckedChange={setTempVisible}
                                className="data-[state=checked]:bg-emerald-500 scale-110"
                            />
                        </div>
                    </div>

                    <DialogFooter className="p-8 pt-0 flex gap-3 sm:justify-between items-center sm:flex-row flex-col-reverse">
                        <Button
                            variant="ghost"
                            className="w-full sm:w-auto px-10 text-white/40 hover:text-white hover:bg-white/5 font-black uppercase tracking-[0.2em] text-[10px] h-14 rounded-2xl transition-all"
                            onClick={() => setIsModalOpen(false)}
                        >
                            DESCARTAR
                        </Button>
                        <Button
                            className="w-full sm:flex-1 bg-white hover:bg-zinc-200 text-zinc-950 font-black uppercase tracking-[0.2em] text-[10px] h-14 rounded-2xl shadow-[0_10px_40px_rgba(255,255,255,0.1)] transition-all active:scale-[0.98]"
                            onClick={handleSaveRankSettings}
                            disabled={isSaving}
                        >
                            {isSaving ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
