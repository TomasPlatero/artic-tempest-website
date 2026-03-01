"use client";

import { useState } from "react";
import { toast } from "sonner";
import { IconArrowLeft, IconShield, IconUser, IconSword, IconTrash, IconEdit } from "@tabler/icons-react";
import { RoleLevel } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

export type DiscordRoleConfig = {
    role_id: string;
    name: string;
    level: RoleLevel;
};

type AppPermission = {
    role_level: RoleLevel;
    app_id: string;
    can_view: boolean;
    can_edit: boolean;
};

type SettingsRolesClientProps = {
    initialDiscordRoles: DiscordRoleConfig[];
    initialPermissions: AppPermission[];
};

const getRoleDisplay = (role: RoleLevel) => {
    const configs: Record<RoleLevel, any> = {
        gm: { label: "Maestro de Hermandad", badge: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: <IconShield className="w-4 h-4 mr-2" /> },
        officer: { label: "Oficial", badge: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: <IconUser className="w-4 h-4 mr-2" /> },
        raider: { label: "Raider", badge: "bg-green-500/10 text-green-500 border-green-500/20", icon: <IconSword className="w-4 h-4 mr-2" /> },
        member: { label: "Miembro", badge: "bg-gray-500/10 text-gray-400 border-gray-500/20", icon: <IconUser className="w-4 h-4 mr-2" /> },
        invitado: { label: "Invitado", badge: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20", icon: <IconUser className="w-4 h-4 mr-2" /> },
    };
    return configs[role] || configs.invitado;
};

export function SettingsRolesClient({ initialDiscordRoles, initialPermissions }: SettingsRolesClientProps) {
    const [discordRoles, setDiscordRoles] = useState<DiscordRoleConfig[]>(initialDiscordRoles);
    const [permissions, setPermissions] = useState<AppPermission[]>(initialPermissions);
    const [creatingRole, setCreatingRole] = useState(false);
    const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

    const [newRoleId, setNewRoleId] = useState("");
    const [newRoleName, setNewRoleName] = useState("");
    const [newRoleLevel, setNewRoleLevel] = useState<RoleLevel>("member");

    const startEditDiscordMapping = (role: DiscordRoleConfig) => {
        setEditingRoleId(role.role_id);
        setNewRoleId(role.role_id);
        setNewRoleName(role.name);
        setNewRoleLevel(role.level);
    };

    const cancelEditDiscordMapping = () => {
        setEditingRoleId(null);
        setNewRoleId("");
        setNewRoleName("");
        setNewRoleLevel("member");
    };

    const handleSaveDiscordMapping = async () => {
        if (!newRoleId || !newRoleName) return;
        setCreatingRole(true);

        try {
            if (editingRoleId) {
                const res = await fetch("/api/guild/roles/discord", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ oldRoleId: editingRoleId, roleId: newRoleId, name: newRoleName, level: newRoleLevel }),
                });
                if (!res.ok) throw new Error("API Exception");
                setDiscordRoles(prev => prev.map(r => r.role_id === editingRoleId ? { role_id: newRoleId, name: newRoleName, level: newRoleLevel } : r));
                toast.success("Mapeo actualizado");
            } else {
                const res = await fetch("/api/guild/roles/discord", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ roleId: newRoleId, name: newRoleName, level: newRoleLevel }),
                });
                if (!res.ok) throw new Error("API Exception");
                setDiscordRoles(prev => [...prev, { role_id: newRoleId, name: newRoleName, level: newRoleLevel }]);
                toast.success("Mapeo creado");
            }
            cancelEditDiscordMapping();
        } catch {
            toast.error("Error al guardar mapeo");
        } finally {
            setCreatingRole(false);
        }
    };

    const handleDeleteDiscordMapping = async (roleId: string) => {
        try {
            const res = await fetch(`/api/guild/roles/discord?roleId=${roleId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("API Exception");
            setDiscordRoles(prev => prev.filter(r => r.role_id !== roleId));
            toast.success("Mapeo eliminado");
        } catch {
            toast.error("Error al eliminar mapeo");
        }
    };

    const handlePermissionToggle = async (role: RoleLevel, appId: string, field: "can_view" | "can_edit", value: boolean) => {
        const orig = [...permissions];
        const next = [...permissions];
        const idx = next.findIndex(p => p.role_level === role && p.app_id === appId);

        if (idx >= 0) {
            next[idx] = { ...next[idx], [field]: value };
        } else {
            next.push({ role_level: role, app_id: appId, can_view: field === "can_view" ? value : true, can_edit: field === "can_edit" ? value : false });
        }

        setPermissions(next);
        try {
            const res = await fetch("/api/guild/permissions", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role_level: role, app_id: appId, [field]: value }),
            });
            if (!res.ok) throw new Error("API error");
        } catch {
            toast.error("Error al guardar permiso");
            setPermissions(orig);
        }
    };

    const hasPermission = (role: string, appId: string, field: "can_view" | "can_edit"): boolean => {
        const p = permissions.find(p => p.role_level === role && p.app_id === appId);
        if (!p) {
            if (role === 'gm') return true;
            if (role === 'officer') return true;
            if (field === 'can_edit') return false;
            if (role === 'invitado') return false;
            return role === 'raider' || role === 'member';
        }
        return p[field];
    };

    return (
        <div className="flex flex-col gap-8 p-6 md:p-10 pb-32 w-full max-w-full">
            <div className="flex items-center gap-6">
                <Link href="/dashboard/settings">
                    <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/5 border-white/10 shadow-xl transition-all">
                        <IconArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-white uppercase">Roles y Accesos</h1>
                    <p className="text-sm text-white/40 font-medium mt-1 tracking-wide">
                        Configura la matriz de permisos y el mapeo de rangos de Discord.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="apps" className="mt-4 w-full">
                <TabsList className="bg-white/5 p-1 rounded-2xl border border-white/5 inline-flex h-12">
                    <TabsTrigger value="apps" className="px-8 rounded-xl font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white shadow-lg transition-all">Permisos de Apps</TabsTrigger>
                    <TabsTrigger value="discord" className="px-8 rounded-xl font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white shadow-lg transition-all">Mapeo de Rangos</TabsTrigger>
                </TabsList>

                <TabsContent value="apps" className="pt-8 w-full">
                    <Card className="bg-zinc-950/40 border-white/[0.08] backdrop-blur-3xl rounded-[2rem] shadow-2xl ring-1 ring-white/5 overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-xl font-black uppercase tracking-widest text-primary">Matriz de Permisos</CardTitle>
                            <CardDescription className="text-sm font-medium text-white/40">
                                Los roles de Miembro e Invitado tienen restricciones por defecto.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="rounded-3xl border border-white/5 overflow-hidden bg-black/40 shadow-inner">
                                <div className="grid grid-cols-6 bg-white/[0.03] border-b border-white/[0.05] p-5 font-black text-white/30 text-[10px] uppercase tracking-[0.3em]">
                                    <div className="col-span-1">Aplicación</div>
                                    <div className="col-span-1 text-center text-amber-500/80">Guild Master</div>
                                    <div className="col-span-1 text-center text-blue-500/80">Oficial</div>
                                    <div className="col-span-1 text-center text-emerald-500/80">Raider</div>
                                    <div className="col-span-1 text-center text-blue-400/80">Miembro</div>
                                    <div className="col-span-1 text-center text-zinc-500/80">Invitado</div>
                                </div>

                                {[
                                    { id: 'roster', name: 'Roster' },
                                    { id: 'stats', name: 'Estadísticas' },
                                    { id: 'calendar', name: 'Calendario' },
                                    { id: 'planificador-cds', name: 'Planificador CD\'s' },
                                    { id: 'bis', name: 'BiS / Wishlist' },
                                ].map((app) => (
                                    <div key={app.id} className="grid grid-cols-6 items-center p-5 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors group">
                                        <div className="col-span-1 font-black text-white text-base group-hover:text-primary transition-colors">{app.name}</div>
                                        {(['gm', 'officer', 'raider', 'member', 'invitado'] as const).map((role) => (
                                            <div key={role} className="col-span-1 flex justify-center gap-3">
                                                <div className="flex flex-col items-center gap-2 group/switch">
                                                    <Switch
                                                        size="sm"
                                                        checked={hasPermission(role, app.id, 'can_view')}
                                                        onCheckedChange={(v) => handlePermissionToggle(role, app.id, 'can_view', v)}
                                                        disabled={role === 'gm'}
                                                        className="data-[state=checked]:bg-primary/80"
                                                    />
                                                    <span className="text-[9px] text-zinc-600 group-hover/switch:text-zinc-400 mt-1 uppercase font-black tracking-widest transition-colors">Ver</span>
                                                </div>
                                                <div className="flex flex-col items-center gap-2 group/switch">
                                                    <Switch
                                                        size="sm"
                                                        checked={hasPermission(role, app.id, 'can_edit')}
                                                        onCheckedChange={(v) => handlePermissionToggle(role, app.id, 'can_edit', v)}
                                                        disabled={role === 'gm'}
                                                        className="data-[state=checked]:bg-primary/80"
                                                    />
                                                    <span className="text-[9px] text-zinc-600 group-hover/switch:text-zinc-400 mt-1 uppercase font-black tracking-widest transition-colors">Edit</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="discord" className="pt-8 space-y-8">
                    <Card className="bg-zinc-950/40 border-white/[0.08] backdrop-blur-3xl rounded-[2rem] shadow-2xl ring-1 ring-white/5 overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-xl font-black uppercase tracking-widest text-primary">Configurar Mapeo</CardTitle>
                            <CardDescription className="text-sm font-medium text-white/40">
                                Asocia IDs de roles de Discord con roles internos de la App.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-10">
                            <div className="flex flex-col lg:flex-row gap-6 items-end bg-white/[0.03] p-8 rounded-[2rem] border border-white/[0.05] shadow-inner">
                                <div className="space-y-3 flex-1 w-full relative">
                                    <Label className="text-[10px] uppercase font-black text-white/30 ml-2 tracking-[0.2em]">Discord Role ID</Label>
                                    <Input
                                        placeholder="112233445566778899"
                                        className="bg-black/60 border-white/10 h-14 font-mono text-base rounded-2xl px-6 focus:ring-primary/20 transition-all"
                                        value={newRoleId}
                                        onChange={e => setNewRoleId(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-3 flex-[1.5] w-full relative">
                                    <Label className="text-[10px] uppercase font-black text-white/30 ml-2 tracking-[0.2em]">Nombre del Rango</Label>
                                    <Input
                                        placeholder="Oficiales de Hermandad"
                                        className="bg-black/60 border-white/10 h-14 text-base font-bold rounded-2xl px-6 focus:ring-primary/20 transition-all"
                                        value={newRoleName}
                                        onChange={e => setNewRoleName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-3 lg:w-[220px] w-full relative">
                                    <Label className="text-[10px] uppercase font-black text-white/30 ml-2 tracking-[0.2em]">Nivel App</Label>
                                    <Select value={newRoleLevel} onValueChange={(v: RoleLevel) => setNewRoleLevel(v)}>
                                        <SelectTrigger className="bg-black/60 border-white/10 h-14 text-sm font-black uppercase tracking-widest rounded-2xl px-6">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-950/90 backdrop-blur-2xl border-white/10 text-white rounded-2xl p-2 shadow-2xl">
                                            <SelectItem value="gm" className="rounded-xl font-black uppercase text-[10px] tracking-widest py-3">Guild Master</SelectItem>
                                            <SelectItem value="officer" className="rounded-xl font-black uppercase text-[10px] tracking-widest py-3">Oficial</SelectItem>
                                            <SelectItem value="raider" className="rounded-xl font-black uppercase text-[10px] tracking-widest py-3">Raider</SelectItem>
                                            <SelectItem value="member" className="rounded-xl font-black uppercase text-[10px] tracking-widest py-3">Miembro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    className="bg-primary hover:bg-primary/80 h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-[0_0_20px_rgba(var(--primary),0.3)] active:scale-95 transition-all w-full lg:w-auto"
                                    disabled={!newRoleId || !newRoleName || creatingRole}
                                    onClick={handleSaveDiscordMapping}
                                >
                                    {editingRoleId ? "Guardar Cambios" : "+ Añadir Mapeo"}
                                </Button>
                            </div>

                            <div className="rounded-[2rem] overflow-hidden bg-black/40 border border-white/5 shadow-inner">
                                <div className="grid grid-cols-12 bg-white/[0.03] p-6 font-black text-white/30 text-[10px] uppercase tracking-[0.3em] border-b border-white/[0.05]">
                                    <div className="col-span-12 lg:col-span-5">Rol Discord</div>
                                    <div className="col-span-12 lg:col-span-4">Rango Asignado</div>
                                    <div className="col-span-12 lg:col-span-3"></div>
                                </div>

                                {discordRoles.length === 0 ? (
                                    <div className="p-20 text-center flex flex-col items-center gap-4">
                                        <IconShield className="size-12 text-white/5" />
                                        <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">No hay mapeos activos configurados</span>
                                    </div>
                                ) : (
                                    discordRoles.map((role) => (
                                        <div key={role.role_id} className="grid grid-cols-12 items-center p-6 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors group">
                                            <div className="col-span-12 lg:col-span-5 flex flex-col gap-1">
                                                <span className="font-black text-white text-base group-hover:text-primary transition-colors">{role.name}</span>
                                                <span className="text-[10px] font-mono font-bold text-zinc-600 group-hover:text-zinc-500 transition-colors uppercase tracking-widest">{role.role_id}</span>
                                            </div>
                                            <div className="col-span-12 lg:col-span-4 py-4 lg:py-0">
                                                <Badge variant="outline" className={`${getRoleDisplay(role.level).badge} px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg border-2`}>
                                                    {getRoleDisplay(role.level).label}
                                                </Badge>
                                            </div>
                                            <div className="col-span-12 lg:col-span-3 flex justify-end gap-3 translate-x-4 lg:opacity-0 lg:group-hover:opacity-100 lg:group-hover:translate-x-0 transition-all duration-300">
                                                <Button variant="outline" size="icon" className="size-11 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 shadow-xl transition-all" onClick={() => startEditDiscordMapping(role)}>
                                                    <IconEdit className="size-5" />
                                                </Button>
                                                <Button variant="outline" size="icon" className="size-11 rounded-xl border-rose-500/20 bg-rose-500/5 text-rose-500 hover:bg-rose-500/10 shadow-xl transition-all" onClick={() => handleDeleteDiscordMapping(role.role_id)}>
                                                    <IconTrash className="size-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
