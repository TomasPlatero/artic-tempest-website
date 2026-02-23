"use client";

import { useState } from "react";
import { sileo } from "sileo";
import { IconArrowLeft, IconShield, IconUser, IconSword, IconTrash, IconEdit } from "@tabler/icons-react";
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
    level: "gm" | "officer" | "raider";
};

type ProfileView = {
    user_id: string;
    discord_username: string | null;
    discord_avatar: string | null;
    role_level: "gm" | "officer" | "raider";
};

type SettingsRolesClientProps = {
    initialProfiles: ProfileView[];
    initialDiscordRoles: DiscordRoleConfig[];
};

const getRoleDisplay = (role: "gm" | "officer" | "raider") => {
    switch (role) {
        case "gm":
            return {
                label: "Guild Master",
                badge: "bg-amber-500/10 text-amber-500 border-amber-500/20",
                icon: <IconShield className="w-4 h-4 mr-2" />
            };
        case "officer":
            return {
                label: "Oficial",
                badge: "bg-blue-500/10 text-blue-500 border-blue-500/20",
                icon: <IconUser className="w-4 h-4 mr-2" />
            };
        case "raider":
            return {
                label: "Raider",
                badge: "bg-green-500/10 text-green-500 border-green-500/20",
                icon: <IconSword className="w-4 h-4 mr-2" />
            };
    }
};

const ROLE_RANKS = {
    gm: 3,
    officer: 2,
    raider: 1
}

export function SettingsRolesClient({ initialProfiles, initialDiscordRoles }: SettingsRolesClientProps) {
    const [profiles, setProfiles] = useState<ProfileView[]>(initialProfiles);
    const [discordRoles, setDiscordRoles] = useState<DiscordRoleConfig[]>(initialDiscordRoles);

    const [search, setSearch] = useState("");
    const [updating, setUpdating] = useState<string | null>(null);

    // Formulario Nuevo/Edición Mapeo
    const [newRoleId, setNewRoleId] = useState("");
    const [newRoleName, setNewRoleName] = useState("");
    const [newRoleLevel, setNewRoleLevel] = useState<"gm" | "officer" | "raider">("raider");
    const [creatingRole, setCreatingRole] = useState(false);
    const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

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
        setNewRoleLevel("raider");
    };

    const handleRoleChange = async (userId: string, newRole: "gm" | "officer" | "raider") => {
        setUpdating(userId);

        try {
            const res = await fetch("/api/guild/users/role", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetUserId: userId, newRoleLevel: newRole }),
            });

            const data = await res.json();

            if (!res.ok) {
                sileo.error({
                    title: "Error al actualizar",
                    description: data.error ?? "No se ha podido cambiar el rol del usuario.",
                });
                return;
            }

            // Actualizar estado local
            setProfiles((prev) =>
                prev.map((p) => (p.user_id === userId ? { ...p, role_level: newRole } : p))
            );

            sileo.success({
                title: "Permisos actualizados",
                description: `El usuario ahora tiene acceso nivel ${newRole.toUpperCase()}.`,
            });

        } catch (err) {
            sileo.error({
                title: "Error interno",
                description: "Ha ocurrido un error al contactar al servidor.",
            });
        } finally {
            setUpdating(null);
        }
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
                sileo.success({ title: "Mapeo actualizado", description: "El rol de Discord ha sido modificado exitosamente." });
            } else {
                const res = await fetch("/api/guild/roles/discord", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ roleId: newRoleId, name: newRoleName, level: newRoleLevel }),
                });

                if (!res.ok) throw new Error("API Exception");

                setDiscordRoles(prev => [...prev, { role_id: newRoleId, name: newRoleName, level: newRoleLevel }]);
                sileo.success({ title: "Mapeo creado", description: "El rol de Discord se vinculará en futuros inicios de sesión." });
            }
            cancelEditDiscordMapping();
        } catch {
            sileo.error({ title: "Error", description: "No se pudo guardar la configuración de automatización." });
        } finally {
            setCreatingRole(false);
        }
    };

    const handleDeleteDiscordMapping = async (roleId: string) => {
        try {
            const res = await fetch(`/api/guild/roles/discord?roleId=${roleId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("API Exception");

            setDiscordRoles(prev => prev.filter(r => r.role_id !== roleId));
            sileo.success({ title: "Mapeo eliminado", description: "La automatización ha sido suprimida permanentemente." });
        } catch {
            sileo.error({ title: "Error", description: "Fallo al eliminar el rol de Discord." });
        }
    };

    const filteredProfiles = profiles
        .filter((p) => p.discord_username?.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => ROLE_RANKS[b.role_level] - ROLE_RANKS[a.role_level]);

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/settings">
                    <Button variant="outline" size="icon" className="h-8 w-8 hover:bg-muted">
                        <IconArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Gestión de Accesos</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Asigna manualmente el nivel de permisos a los usuarios registrados en GuildBoard.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="manual" className="mt-2 w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="manual">Asignación Manual</TabsTrigger>
                    <TabsTrigger value="discord">Automatización Discord</TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="pt-4">
                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
                            <div>
                                <CardTitle>Usuarios Registrados</CardTitle>
                                <CardDescription className="max-w-lg mt-1">
                                    Aquí aparecen todos los miembros que han iniciado sesión con la aplicación de Discord al menos una vez en tu servidor.
                                    Por defecto, su rol interno es <strong className="text-green-500/80">Raider (solo lectura)</strong>.
                                </CardDescription>
                            </div>
                            <Input
                                placeholder="Buscar usuario..."
                                className="max-w-[250px] bg-background"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </CardHeader>
                        <CardContent>
                            <div className="divide-y divide-border/40 border rounded-lg overflow-hidden">
                                {filteredProfiles.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground text-sm">
                                        No se han encontrado usuarios con ese nombre.
                                    </div>
                                ) : (
                                    filteredProfiles.map((p) => {
                                        const isUpdating = updating === p.user_id;
                                        return (
                                            <div key={p.user_id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 hover:bg-muted/10 transition-colors">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <Avatar className="size-10 border border-border/50 bg-[#1e1e24] shadow-sm">
                                                        <AvatarImage src={p.discord_avatar ?? ""} alt={p.discord_username ?? "User"} />
                                                        <AvatarFallback className="text-xs uppercase bg-transparent text-muted-foreground">
                                                            {p.discord_username?.substring(0, 2) ?? "??"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="font-medium text-sm truncate max-w-[200px]">{p.discord_username ?? "Desconocido"}</span>
                                                        <span className="text-xs text-muted-foreground truncate font-mono mt-0.5">{p.user_id.split('-')[0]}...</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 justify-between sm:justify-end shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                                                    <Badge variant="outline" className={`${getRoleDisplay(p.role_level).badge} hidden sm:flex truncate`}>
                                                        {getRoleDisplay(p.role_level).label}
                                                    </Badge>
                                                    <Select
                                                        disabled={isUpdating}
                                                        defaultValue={p.role_level}
                                                        onValueChange={(val: any) => handleRoleChange(p.user_id, val)}
                                                    >
                                                        <SelectTrigger className={`w-[160px] h-9 text-xs transition-colors ${isUpdating ? 'animate-pulse opacity-50' : ''}`}>
                                                            <SelectValue placeholder="Rol" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-popover text-popover-foreground">
                                                            <SelectItem value="gm">
                                                                <div className="flex items-center text-amber-500 font-medium whitespace-nowrap">
                                                                    <IconShield className="w-4 h-4 mr-2" /> Guild Master (Admin)
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="officer">
                                                                <div className="flex items-center text-blue-500 whitespace-nowrap">
                                                                    <IconUser className="w-4 h-4 mr-2" /> Oficial (Editor)
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="raider">
                                                                <div className="flex items-center text-green-500 whitespace-nowrap">
                                                                    <IconSword className="w-4 h-4 mr-2" /> Raider (Básico)
                                                                </div>
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="discord" className="pt-4 space-y-4">
                    <Card className={editingRoleId ? "border-primary/50 shadow-md transition-all" : "transition-all"}>
                        <CardHeader>
                            <CardTitle>{editingRoleId ? "Editar Regla de Mapeo" : "Añadir Regla de Mapeo"}</CardTitle>
                            <CardDescription>
                                Copia el ID del rol desde los ajustes de tu servidor de Discord.
                                Cuando un jugador inicie sesión y tenga este rol, se le ascenderá automáticamente si este nivel es más alto que su rango actual.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col sm:flex-row gap-4 items-end">
                                <div className="space-y-2 flex-1 w-full relative">
                                    <Label className="text-xs font-semibold text-muted-foreground ml-1">Discord Role ID</Label>
                                    <Input
                                        placeholder="ej. 112233445566778899"
                                        className="bg-background h-10 font-mono text-sm"
                                        value={newRoleId}
                                        onChange={e => setNewRoleId(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2 flex-1 w-full relative">
                                    <Label className="text-xs font-semibold text-muted-foreground ml-1">Nombre (Informativo)</Label>
                                    <Input
                                        placeholder="ej. Oficiales"
                                        className="bg-background h-10 text-sm"
                                        value={newRoleName}
                                        onChange={e => setNewRoleName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2 sm:w-[220px] w-full relative">
                                    <Label className="text-xs font-semibold text-muted-foreground ml-1">Permiso en la App</Label>
                                    <Select value={newRoleLevel} onValueChange={(v: "gm" | "officer" | "raider") => setNewRoleLevel(v)}>
                                        <SelectTrigger className="bg-background h-10 text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="gm">Guild Master (Máximo)</SelectItem>
                                            <SelectItem value="officer">Officer (Ver Roster)</SelectItem>
                                            <SelectItem value="raider">Raider (Estándar)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                    {editingRoleId && (
                                        <Button
                                            variant="outline"
                                            className="h-10 px-3 w-full sm:w-auto"
                                            onClick={cancelEditDiscordMapping}
                                            disabled={creatingRole}
                                        >
                                            Cancelar
                                        </Button>
                                    )}
                                    <Button
                                        className="w-full sm:w-auto h-10"
                                        disabled={!newRoleId || !newRoleName || creatingRole}
                                        onClick={handleSaveDiscordMapping}
                                    >
                                        {editingRoleId ? "Guardar Cambios" : "+ Añadir Mapeo"}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="py-4">
                            <CardTitle className="text-base font-semibold text-muted-foreground">Reglas Activas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-md divide-y divide-border overflow-hidden text-sm">
                                <div className="grid grid-cols-12 bg-muted/40 p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                                    <div className="col-span-4">Nombre del Rol</div>
                                    <div className="col-span-4 hidden sm:block">Discord ID</div>
                                    <div className="col-span-3">Permiso App</div>
                                    <div className="col-span-1"></div>
                                </div>

                                {discordRoles.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                                        <IconShield className="size-8 text-muted-foreground/30" stroke={1.5} />
                                        No hay reglas configuradas. La asignación depende solo del gestor manual.
                                    </div>
                                ) : (
                                    discordRoles.map((role) => (
                                        <div key={role.role_id} className={`grid grid-cols-12 items-center p-3 transition-colors ${editingRoleId === role.role_id ? 'bg-primary/5' : 'hover:bg-muted/10'}`}>
                                            <div className="col-span-12 sm:col-span-4 font-medium">{role.name}</div>
                                            <div className="hidden sm:flex sm:col-span-4 text-xs font-mono text-muted-foreground items-center">
                                                {role.role_id}
                                            </div>
                                            <div className="col-span-10 sm:col-span-3 flex items-center mt-2 sm:mt-0">
                                                <Badge variant="outline" className={`${getRoleDisplay(role.level).badge} truncate`}>
                                                    {getRoleDisplay(role.level).label}
                                                </Badge>
                                            </div>
                                            <div className="col-span-2 sm:col-span-1 flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                                    onClick={() => startEditDiscordMapping(role)}
                                                >
                                                    <IconEdit className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() => handleDeleteDiscordMapping(role.role_id)}
                                                >
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
