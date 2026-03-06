"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    IconTrash,
    IconEdit,
    IconShield,
    IconUsers,
    IconRotate,
    IconChevronRight,
    IconLayoutGrid,
    IconDeviceMobile,
    IconArrowLeft,
    IconUser,
    IconSword,
    IconBrandDiscord
} from "@tabler/icons-react";
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
    const [mobileActiveRole, setMobileActiveRole] = useState<RoleLevel>("officer");
    const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);

    const [newRoleId, setNewRoleId] = useState("");
    const [newRoleName, setNewRoleName] = useState("");
    const [newRoleLevel, setNewRoleLevel] = useState<RoleLevel>("member");
    const [discordServerRoles, setDiscordServerRoles] = useState<{ id: string, name: string }[]>([]);
    const [isLoadingRoles, setIsLoadingRoles] = useState(false);

    useEffect(() => {
        async function fetchRoles() {
            setIsLoadingRoles(true);
            try {
                const res = await fetch("/api/discord/roles");
                if (res.ok) {
                    const data = await res.json();
                    // Sort by position descending (Discord's hierarchy)
                    // and filter out @everyone if you wanted, but usually good to keep for some cases
                    // Let's at least sort them
                    const sorted = [...data].sort((a, b) => b.position - a.position);
                    setDiscordServerRoles(sorted);
                } else {
                    console.error("Failed to fetch Discord roles");
                }
            } catch (err) {
                console.error("Error fetching Discord roles:", err);
            } finally {
                setIsLoadingRoles(false);
            }
        }
        fetchRoles();
    }, []);

    const startEditDiscordMapping = (role: DiscordRoleConfig) => {
        setEditingRoleId(role.role_id);
        setNewRoleId(role.role_id);
        setNewRoleName(role.name);
        setNewRoleLevel(role.level);
        setIsMappingModalOpen(true);
    };

    const cancelEditDiscordMapping = () => {
        setEditingRoleId(null);
        setNewRoleId("");
        setNewRoleName("");
        setNewRoleLevel("raider");
        setIsMappingModalOpen(false); // Added to close modal on cancel
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
            setIsMappingModalOpen(false); // Close modal after save
            // fetchDiscordRoles(); // This function is not defined in the provided context, keeping commented as per instruction
        } catch (error: any) {
            toast.error("Error al guardar mapeo: " + error.message);
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
        <div className="flex flex-col gap-8 p-4 md:p-6 lg:px-8 w-full max-w-full animate-in fade-in duration-500">
            <div className="flex items-center gap-6">
                <Link href="/dashboard/settings">
                    <Button variant="outline" size="icon" className="size-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 transition-all shadow-xl">
                        <IconArrowLeft className="size-6" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic flex items-center gap-3">
                        Roles y Accesos
                    </h1>
                    <p className="text-sm text-white/40 font-medium mt-1 tracking-wide uppercase">
                        Configura la matriz de permisos y el mapeo de rangos de Discord.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="apps" className="w-full">
                <div className="flex justify-start mb-8 overflow-x-auto no-scrollbar pb-2">
                    <TabsList className="h-14 rounded-2xl p-1.5 bg-muted/20 border border-border/20 shadow-2xl backdrop-blur-md inline-flex">
                        <TabsTrigger
                            value="apps"
                            className="rounded-xl font-black uppercase text-[10px] tracking-[0.2em] gap-2 data-[state=active]:bg-primary data-[state=active]:text-zinc-950 transition-all duration-300"
                        >
                            <IconLayoutGrid className="size-3.5" /> Permisos de Apps
                        </TabsTrigger>
                        <TabsTrigger
                            value="discord"
                            className="rounded-xl font-black uppercase text-[10px] tracking-[0.2em] gap-2 data-[state=active]:bg-primary data-[state=active]:text-zinc-950 transition-all duration-300"
                        >
                            <IconBrandDiscord className="size-3.5" /> Mapeo de Rangos
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="apps" className="pt-8 w-full">
                    <Card className="bg-zinc-950/40 border-white/[0.08] backdrop-blur-3xl rounded-[2rem] shadow-2xl ring-1 ring-white/5 overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-xl font-black uppercase tracking-widest text-primary">Matriz de Permisos</CardTitle>
                            <CardDescription className="text-sm font-medium text-white/40">
                                Los roles de Miembro e Invitado tienen restricciones por defecto.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 md:p-8">
                            <div className="md:hidden space-y-4">
                                <Tabs value={mobileActiveRole} onValueChange={(v) => setMobileActiveRole(v as RoleLevel)} className="w-full">
                                    <TabsList className="bg-white/5 p-1 w-full flex justify-start overflow-x-auto no-scrollbar scrollbar-hide h-auto py-2 border border-white/5 rounded-[1.5rem] mb-2">
                                        {(['gm', 'officer', 'raider', 'member', 'invitado'] as const).map((role) => (
                                            <TabsTrigger
                                                key={role}
                                                value={role}
                                                className="px-5 py-2.5 rounded-xl font-black uppercase text-[9px] tracking-[0.15em] data-[state=active]:bg-primary data-[state=active]:text-zinc-950 data-[state=active]:shadow-lg transition-all shrink-0"
                                            >
                                                {role}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                </Tabs>

                                <div className="space-y-2.5">
                                    {[
                                        { id: 'roster', name: 'Roster' },
                                        { id: 'stats', name: 'Estadísticas' },
                                        { id: 'calendar', name: 'Calendario' },
                                        { id: 'planificador-cds', name: 'Planificador CD\'s' },
                                        { id: 'bis', name: 'BiS / Wishlist' },
                                        { id: 'recruitment', name: 'Reclutamiento' },
                                        { id: 'settings', name: 'Administración' },
                                    ].map((app) => (
                                        <div key={app.id} className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 flex items-center justify-between group active:bg-white/[0.04] transition-all">
                                            <span className="font-black text-white text-sm tracking-tight group-hover:text-primary transition-colors">{app.name}</span>
                                            <div className="flex items-center gap-6">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Switch
                                                        size="sm"
                                                        checked={hasPermission(mobileActiveRole, app.id, 'can_view')}
                                                        onCheckedChange={(v) => handlePermissionToggle(mobileActiveRole, app.id, 'can_view', v)}
                                                        disabled={mobileActiveRole === 'gm'}
                                                        className="scale-95 data-[state=checked]:bg-primary/90"
                                                    />
                                                    <span className="text-[7px] text-zinc-600 uppercase font-black tracking-widest leading-none">Ver</span>
                                                </div>
                                                <div className="flex flex-col items-center gap-2">
                                                    <Switch
                                                        size="sm"
                                                        checked={hasPermission(mobileActiveRole, app.id, 'can_edit')}
                                                        onCheckedChange={(v) => handlePermissionToggle(mobileActiveRole, app.id, 'can_edit', v)}
                                                        disabled={mobileActiveRole === 'gm'}
                                                        className="scale-95 data-[state=checked]:bg-primary/90"
                                                    />
                                                    <span className="text-[7px] text-zinc-600 uppercase font-black tracking-widest leading-none">Edit</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Desktop Grid View */}
                            <div className="hidden md:block rounded-3xl border border-white/5 overflow-hidden bg-black/40 shadow-inner">
                                <div className="min-w-full">
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
                                        { id: 'recruitment', name: 'Reclutamiento' },
                                        { id: 'settings', name: 'Administración' },
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
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="discord" className="pt-8 space-y-8">
                    <Card className="bg-zinc-950/40 border-white/[0.08] backdrop-blur-3xl rounded-[2rem] shadow-2xl ring-1 ring-white/5 overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-xl font-black uppercase tracking-widest text-primary">Configurar Mapeo</CardTitle>
                                    <CardDescription className="text-sm font-medium text-white/40">
                                        Asocia IDs de roles de Discord con roles internos de la App.
                                    </CardDescription>
                                </div>
                                <Button
                                    onClick={() => {
                                        cancelEditDiscordMapping();
                                        setIsMappingModalOpen(true);
                                    }}
                                    className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl px-4 h-10 font-bold uppercase text-[10px] tracking-widest transition-all active:scale-95"
                                >
                                    + Añadir
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 md:p-8 pt-0">
                            <div className="rounded-[2rem] overflow-hidden bg-black/40 border border-white/5 shadow-inner">
                                <div className="hidden lg:grid grid-cols-12 bg-white/[0.03] p-6 font-black text-white/30 text-[10px] uppercase tracking-[0.3em] border-b border-white/[0.05]">
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
                                    [...discordRoles]
                                        .sort((a, b) => {
                                            const priority: Record<string, number> = { gm: 5, officer: 4, raider: 3, member: 2, invitado: 1 };
                                            return (priority[b.level] || 0) - (priority[a.level] || 0);
                                        })
                                        .map((role) => (
                                            <div key={role.role_id} className="flex flex-col lg:grid lg:grid-cols-12 p-5 lg:p-6 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.01] transition-colors group gap-3 lg:gap-0 items-start lg:items-center">
                                                {/* Info Section */}
                                                <div className="lg:col-span-5 flex flex-col gap-0.5">
                                                    <span className="font-black text-white text-base group-hover:text-primary transition-colors leading-tight">{role.name}</span>
                                                    <span className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.15em]">{role.role_id}</span>
                                                </div>

                                                {/* Badge Section */}
                                                <div className="lg:col-span-4 py-1 lg:py-0">
                                                    <Badge variant="outline" className={`${getRoleDisplay(role.level).badge} px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border-2 shadow-sm`}>
                                                        {getRoleDisplay(role.level).label}
                                                    </Badge>
                                                </div>

                                                {/* Actions Section */}
                                                <div className="lg:col-span-3 flex justify-end gap-2.5 w-full lg:w-auto lg:translate-x-4 lg:opacity-0 lg:group-hover:opacity-100 lg:group-hover:translate-x-0 transition-all duration-300">
                                                    <Button variant="outline" size="icon" className="size-10 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 shadow-xl transition-all" onClick={() => startEditDiscordMapping(role)}>
                                                        <IconEdit className="size-4.5" />
                                                    </Button>
                                                    <Button variant="outline" size="icon" className="size-10 rounded-xl border-rose-500/10 bg-rose-500/5 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20 shadow-xl transition-all" onClick={() => handleDeleteDiscordMapping(role.role_id)}>
                                                        <IconTrash className="size-4.5" />
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

            {/* Mapping Modal */}
            <Dialog open={isMappingModalOpen} onOpenChange={setIsMappingModalOpen}>
                <DialogContent className="max-w-md bg-zinc-950 border-white/10 text-white rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] p-0 overflow-hidden">
                    <DialogHeader className="p-8 pb-4">
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight text-white leading-none">
                            {editingRoleId ? "Editar Mapeo" : "Añadir Mapeo"}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-2">
                            Configura la relación entre Discord y la App
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-8 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black text-white/30 ml-1 tracking-[0.2em]">Seleccionar Rol de Discord</Label>
                            <Select
                                value={newRoleId}
                                onValueChange={(val) => {
                                    setNewRoleId(val);
                                    const selected = discordServerRoles.find(r => r.id === val);
                                    if (selected) setNewRoleName(selected.name);
                                }}
                            >
                                <SelectTrigger className="bg-white/5 border-white/10 h-12 text-sm font-bold rounded-xl px-4 shadow-inner">
                                    <SelectValue placeholder={isLoadingRoles ? "Cargando roles..." : "Elige un rol de tu server"} />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-white/10 text-white rounded-xl max-h-[300px]">
                                    {discordServerRoles.map(role => (
                                        <SelectItem key={role.id} value={role.id} className="text-[11px] font-bold py-3">
                                            {role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {!isLoadingRoles && discordServerRoles.length === 0 && (
                                <p className="text-[9px] text-amber-500 italic mt-1 px-1">
                                    No se pudieron cargar los roles. ¿Has configurado el Bot Token correctamente?
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black text-white/30 ml-1 tracking-[0.2em]">Nombre del Rango (Web)</Label>
                            <Input
                                placeholder="Ej: Oficiales de Hermandad"
                                className="bg-white/5 border-white/10 h-12 text-sm font-bold rounded-xl px-4 focus:ring-primary/20 transition-all"
                                value={newRoleName}
                                onChange={e => setNewRoleName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black text-white/30 ml-1 tracking-[0.2em]">Nivel de Acceso</Label>
                            <Select value={newRoleLevel} onValueChange={(v: RoleLevel) => setNewRoleLevel(v)}>
                                <SelectTrigger className="bg-white/5 border-white/10 h-12 text-[11px] font-black uppercase tracking-widest rounded-xl px-4 shadow-inner">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-white/10 text-white rounded-xl">
                                    <SelectItem value="gm" className="text-[10px] font-black uppercase tracking-widest py-3">Guild Master</SelectItem>
                                    <SelectItem value="officer" className="text-[10px] font-black uppercase tracking-widest py-3">Oficial</SelectItem>
                                    <SelectItem value="raider" className="text-[10px] font-black uppercase tracking-widest py-3">Raider</SelectItem>
                                    <SelectItem value="member" className="text-[10px] font-black uppercase tracking-widest py-3">Miembro</SelectItem>
                                    <SelectItem value="invitado" className="text-[10px] font-black uppercase tracking-widest py-3">Invitado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="p-8 pt-0 flex gap-3 sm:justify-between items-center sm:flex-row flex-col-reverse mt-2">
                        <Button
                            variant="ghost"
                            className="w-full sm:w-auto px-10 text-white/40 hover:text-white hover:bg-white/5 font-black uppercase tracking-[0.2em] text-[10px] h-14 rounded-2xl transition-all"
                            onClick={() => setIsMappingModalOpen(false)}
                        >
                            CANCELAR
                        </Button>
                        <Button
                            className="w-full sm:flex-1 bg-white hover:bg-zinc-200 text-zinc-950 font-black uppercase tracking-[0.2em] text-[10px] h-14 rounded-2xl shadow-[0_10px_40px_rgba(255,255,255,0.1)] transition-all active:scale-[0.98]"
                            onClick={handleSaveDiscordMapping}
                            disabled={!newRoleId || !newRoleName || creatingRole}
                        >
                            {creatingRole ? "GUARDANDO..." : (editingRoleId ? "GUARDAR CAMBIOS" : "CREAR MAPEO")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
