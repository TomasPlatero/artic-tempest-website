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
        <div className="flex flex-col gap-6 p-4 md:p-6 pb-20 max-w-6xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/settings">
                    <Button variant="outline" size="icon" className="h-8 w-8 hover:bg-muted">
                        <IconArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Roles y Accesos</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Configura la matriz de permisos y el mapeo de rangos de Discord.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="apps" className="mt-2 w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="apps">Permisos de Apps</TabsTrigger>
                    <TabsTrigger value="discord">Mapeo de Rangos</TabsTrigger>
                </TabsList>

                <TabsContent value="apps" className="pt-4">
                    <Card className="bg-card/40 border-border/40 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>Matriz de Permisos</CardTitle>
                            <CardDescription>
                                Los roles de Miembro e Invitado tienen restricciones por defecto.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-xl overflow-hidden text-sm bg-black/20">
                                <div className="grid grid-cols-6 bg-white/5 border-b border-white/5 p-3 font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">
                                    <div className="col-span-1">Aplicación</div>
                                    <div className="col-span-1 text-center text-amber-500">GM</div>
                                    <div className="col-span-1 text-center text-blue-500">Oficial</div>
                                    <div className="col-span-1 text-center text-emerald-500">Raider</div>
                                    <div className="col-span-1 text-center text-blue-400">Miembro</div>
                                    <div className="col-span-1 text-center text-zinc-500">Invitado</div>
                                </div>

                                {[
                                    { id: 'roster', name: 'Roster' },
                                    { id: 'stats', name: 'Estadísticas' },
                                    { id: 'calendar', name: 'Calendario' },
                                    { id: 'planificador-cds', name: 'Planificador CD\'s' },
                                    { id: 'bis', name: 'BiS / Wishlist' },
                                ].map((app) => (
                                    <div key={app.id} className="grid grid-cols-6 items-center p-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                                        <div className="col-span-1 font-bold">{app.name}</div>
                                        {(['gm', 'officer', 'raider', 'member', 'invitado'] as const).map((role) => (
                                            <div key={role} className="col-span-1 flex justify-center gap-1.5">
                                                <div className="flex flex-col items-center">
                                                    <Switch
                                                        size="sm"
                                                        checked={hasPermission(role, app.id, 'can_view')}
                                                        onCheckedChange={(v) => handlePermissionToggle(role, app.id, 'can_view', v)}
                                                        disabled={role === 'gm'}
                                                    />
                                                    <span className="text-[8px] text-zinc-600 mt-1 uppercase font-bold">Ver</span>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <Switch
                                                        size="sm"
                                                        checked={hasPermission(role, app.id, 'can_edit')}
                                                        onCheckedChange={(v) => handlePermissionToggle(role, app.id, 'can_edit', v)}
                                                        disabled={role === 'gm'}
                                                    />
                                                    <span className="text-[8px] text-zinc-600 mt-1 uppercase font-bold">Edit</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="discord" className="pt-4 space-y-4">
                    <Card className="bg-card/40 border-border/40 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>Configurar Mapeo</CardTitle>
                            <CardDescription>
                                Asocia IDs de roles de Discord con roles internos de la App.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col sm:flex-row gap-4 items-end bg-white/5 p-4 rounded-xl border border-white/5">
                                <div className="space-y-2 flex-1 w-full relative">
                                    <Label className="text-[10px] uppercase font-bold text-zinc-500 ml-1">Discord Role ID</Label>
                                    <Input
                                        placeholder="112233..."
                                        className="bg-black/40 border-white/10 h-10 font-mono text-sm rounded-lg"
                                        value={newRoleId}
                                        onChange={e => setNewRoleId(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2 flex-1 w-full relative">
                                    <Label className="text-[10px] uppercase font-bold text-zinc-500 ml-1">Nombre</Label>
                                    <Input
                                        placeholder="Oficiales"
                                        className="bg-black/40 border-white/10 h-10 text-sm rounded-lg"
                                        value={newRoleName}
                                        onChange={e => setNewRoleName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2 sm:w-[180px] w-full relative">
                                    <Label className="text-[10px] uppercase font-bold text-zinc-500 ml-1">Rango App</Label>
                                    <Select value={newRoleLevel} onValueChange={(v: RoleLevel) => setNewRoleLevel(v)}>
                                        <SelectTrigger className="bg-black/40 border-white/10 h-10 text-sm rounded-lg">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                            <SelectItem value="gm">Guild Master</SelectItem>
                                            <SelectItem value="officer">Oficial</SelectItem>
                                            <SelectItem value="raider">Raider</SelectItem>
                                            <SelectItem value="member">Miembro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    className="bg-blue-600 hover:bg-blue-500 h-10 rounded-lg"
                                    disabled={!newRoleId || !newRoleName || creatingRole}
                                    onClick={handleSaveDiscordMapping}
                                >
                                    {editingRoleId ? "Guardar" : "+ Añadir"}
                                </Button>
                            </div>

                            <div className="border border-white/5 rounded-xl overflow-hidden bg-black/20">
                                <div className="grid grid-cols-12 bg-white/5 p-3 font-semibold text-zinc-500 text-[10px] uppercase tracking-wider">
                                    <div className="col-span-5">Rol Discord</div>
                                    <div className="col-span-4">Rango Asignado</div>
                                    <div className="col-span-3"></div>
                                </div>

                                {discordRoles.length === 0 ? (
                                    <div className="p-8 text-center text-zinc-600 text-xs italic">
                                        No hay mapeos activos.
                                    </div>
                                ) : (
                                    discordRoles.map((role) => (
                                        <div key={role.role_id} className="grid grid-cols-12 items-center p-3 border-t border-white/5 hover:bg-white/[0.02]">
                                            <div className="col-span-5 flex flex-col">
                                                <span className="font-bold text-white text-sm">{role.name}</span>
                                                <span className="text-[9px] font-mono text-zinc-600">{role.role_id}</span>
                                            </div>
                                            <div className="col-span-4">
                                                <Badge variant="outline" className={`${getRoleDisplay(role.level).badge} text-[9px] font-black uppercase tracking-widest`}>
                                                    {getRoleDisplay(role.level).label}
                                                </Badge>
                                            </div>
                                            <div className="col-span-3 flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="size-8 hover:bg-white/5" onClick={() => startEditDiscordMapping(role)}>
                                                    <IconEdit className="size-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="size-8 hover:bg-rose-500/10 text-rose-500" onClick={() => handleDeleteDiscordMapping(role.role_id)}>
                                                    <IconTrash className="size-4" />
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
