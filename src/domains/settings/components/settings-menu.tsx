"use client"

import React from "react"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import {
    IconPlus,
    IconTrash,
    IconEdit,
    IconDeviceFloppy,
    IconX,
    IconChevronDown,
    IconChevronRight,
    IconGripVertical,
    IconFolderPlus,
    IconLinkPlus,
    IconChevronDown as IconChevronDownTabler,
    IconArrowLeft
} from "@tabler/icons-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/shared/ui/select"
import { getIconByName } from "@/shared/lib/icon-utils"
import { Badge } from "@/shared/ui/badge"
import { cn } from "@/shared/tailwind/tailwind-utils"
import { IconPicker } from "@/shared/components/icon-picker"
import { Checkbox } from "@/shared/ui/checkbox"
import { RoleLevel } from "@/shared/auth/permissions"

export function SettingsMenuClient() {
    const router = useRouter()
    const [mounted, setMounted] = React.useState(false)
    const [items, setItems] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)
    const [editingId, setEditingId] = React.useState<string | null>(null)
    const [editForm, setEditForm] = React.useState<any>({})

    React.useEffect(() => {
        setMounted(true)
    }, [])

    const fetchItems = React.useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/admin/navigation")
            const data = await res.json()
            setItems(data)
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchItems()
    }, [fetchItems])

    const handleEdit = (item: any) => {
        setEditingId(item.id)
        setEditForm({
            name: item.name,
            url: item.url || "",
            icon_name: item.icon_name || "",
            order_index: item.order_index,
            app_id: item.app_id || "",
            roles: item.navigation_item_roles?.map((r: any) => r.role_level) || []
        })
    }

    const handleSave = async (id: string) => {
        await fetch("/api/admin/navigation", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, ...editForm })
        })
        setEditingId(null)
        await fetchItems()
        router.refresh()
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Seguro que quieres borrar este ítem?")) return
        await fetch(`/api/admin/navigation?id=${id}`, { method: "DELETE" })
        await fetchItems()
        router.refresh()
    }

    const handleCreate = async (type: 'category' | 'link') => {
        await fetch("/api/admin/navigation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: type === 'category' ? "Nueva Categoría" : "Nuevo Item",
                url: type === 'category' ? null : "/dashboard/cambiame",
                icon_name: type === 'category' ? "IconFolderPlus" : "IconLinkPlus",
                order_index: (items.length + 1) * 10,
                is_active: true
            })
        })
        await fetchItems()
        router.refresh()
    }

    // Hierarchy building helper
    const tree = React.useMemo(() => {
        const build = (parentId: string | null = null): any[] => {
            return items
                .filter(i => i.parent_id === parentId)
                .map(i => ({ ...i, children: build(i.id) }))
        }
        return build(null)
    }, [items])

    const renderRow = (item: any, depth = 0, parentRoles: string[] | null = null) => {
        const isEditing = editingId === item.id
        const Icon = getIconByName(item.icon_name)

        // Effective roles for this item (own or inherited)
        const ownRoles = item.navigation_item_roles?.map((r: any) => r.role_level) || []
        const hasOwnRoles = ownRoles.length > 0
        const effectiveRoles = hasOwnRoles ? ownRoles : parentRoles

        return (
            <React.Fragment key={item.id}>
                <div className={cn(
                    "flex flex-col sm:flex-row sm:items-center gap-3 p-3 border-b border-border/40 hover:bg-white/5 transition-colors group relative",
                    depth > 0 && "pl-8 sm:pl-10"
                )}>
                    {/* Main Info */}
                    <div className="flex items-center gap-2 min-w-0 sm:min-w-[200px] flex-1">
                        <div className="p-1.5 bg-white/5 rounded-lg border border-white/5 group-hover:border-primary/20 transition-colors">
                            <Icon className="size-4 text-primary" />
                        </div>
                        <span className="font-bold text-sm tracking-tight truncate">{item.name}</span>
                        {!item.url && <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-primary/5 text-primary border-primary/20 uppercase font-black">Cat</Badge>}
                    </div>

                    {/* URL/Path */}
                    <div className="flex-1 text-xs text-muted-foreground truncate opacity-60 sm:opacity-100 pl-9 sm:pl-0">
                        {item.url || <span className="italic text-[10px] uppercase tracking-wider opacity-40">Sin ruta</span>}
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 pl-9 sm:pl-0">
                        <div className="flex items-center gap-1">
                            {effectiveRoles && effectiveRoles.length > 0 ? (
                                <div className={cn("flex -space-x-1", !hasOwnRoles && "opacity-40 grayscale-[0.5]")} title={!hasOwnRoles ? "Heredado de la categoría" : "Permisos específicos"}>
                                    {effectiveRoles.map((role: string) => (
                                        <div key={role} className="size-4 rounded-full border border-zinc-950 bg-primary flex items-center justify-center text-[8px] font-black text-zinc-950 uppercase">
                                            {role.substring(0, 1)}
                                        </div>
                                    ))}
                                    {!hasOwnRoles && (
                                        <div className="size-4 flex items-center justify-center ml-1">
                                            <IconChevronRight className="size-2 text-primary" />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-[9px] font-black tracking-tighter text-muted-foreground/40 uppercase">Public</div>
                            )}
                            <div className="h-3 w-px bg-white/5 mx-1 hidden sm:block" />
                            <span className="text-[10px] font-mono opacity-40">#{item.order_index}</span>
                        </div>

                        <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" className="size-8 hover:bg-primary hover:text-zinc-950 rounded-lg transition-all" onClick={() => handleEdit(item)}>
                                <IconEdit className="size-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="size-8 text-destructive hover:bg-destructive hover:text-white rounded-lg transition-all" onClick={() => handleDelete(item.id)}>
                                <IconTrash className="size-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {isEditing && (
                    <div className="p-4 sm:p-6 bg-muted/40 border-b border-border shadow-inner animate-in slide-in-from-top duration-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-primary/60">Nombre</label>
                                <Input className="bg-zinc-950 border-white/5 h-11" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-primary/60">URL / Ruta</label>
                                <Input className="bg-zinc-950 border-white/5 h-11" value={editForm.url || ""} onChange={e => setEditForm({ ...editForm, url: e.target.value || null })} placeholder="/ej: /roster" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-primary/60">
                                    Visualización {!editForm.url && <span className="text-[10px] opacity-40 lowercase font-medium">(opcional para categorías)</span>}
                                </label>
                                <IconPicker
                                    value={editForm.icon_name}
                                    onSelect={(name: string) => setEditForm({ ...editForm, icon_name: name })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-primary/60">Orden Prioridad</label>
                                <Input className="bg-zinc-950 border-white/5 h-11" type="number" value={editForm.order_index} onChange={e => setEditForm({ ...editForm, order_index: parseInt(e.target.value) })} />
                            </div>
                            <div className="space-y-2 col-span-1 sm:col-span-2">
                                <label className="text-xs font-black uppercase tracking-widest text-primary/60">Padre (Superior)</label>
                                <Select
                                    value={editForm.parent_id || "null"}
                                    onValueChange={v => setEditForm({ ...editForm, parent_id: v === "null" ? null : v })}
                                >
                                    <SelectTrigger className="bg-zinc-950 border-white/5 h-11 text-sm rounded-lg">
                                        <SelectValue placeholder="Ninguno (Raíz)" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                        <SelectItem value="null" className="text-xs py-2 uppercase font-bold">Ninguno (Raíz)</SelectItem>
                                        {items.filter(i => !i.url && i.id !== item.id).map(i => (
                                            <SelectItem key={i.id} value={i.id} className="text-xs py-2 font-medium">
                                                {i.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 col-span-1 sm:col-span-2">
                                <label className="text-xs font-black uppercase tracking-widest text-primary/60">Identificador de App (Opcional)</label>
                                <Input className="bg-zinc-950 border-white/5 h-11 transition-all focus:ring-1 focus:ring-primary/20" value={editForm.app_id || ""} onChange={e => setEditForm({ ...editForm, app_id: e.target.value })} placeholder="ej: roster, calendar..." />
                            </div>

                            <div className="space-y-3 col-span-1 sm:col-span-2 mt-2">
                                <label className="text-xs font-black uppercase tracking-widest text-primary/60">Permisos de Visualización</label>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 bg-zinc-950/50 border border-white/5 rounded-xl">
                                    {(['gm', 'officer', 'raider', 'member', 'invitado'] as RoleLevel[]).map(role => (
                                        <div key={role} className="flex items-center gap-2 group cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-colors" onClick={() => {
                                            const current = editForm.roles || []
                                            const exists = current.includes(role)
                                            const newRoles = exists
                                                ? current.filter((r: string) => r !== role)
                                                : [...current, role]
                                            setEditForm({ ...editForm, roles: newRoles })
                                        }}>
                                            <Checkbox
                                                id={`role-${role}`}
                                                checked={editForm.roles?.includes(role)}
                                                onCheckedChange={() => { }}
                                                className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-zinc-950 rounded"
                                            />
                                            <label className="text-[10px] font-black uppercase tracking-tighter text-white/50 group-hover:text-white transition-colors cursor-pointer select-none">
                                                {role === 'gm' ? 'GM' : role === 'officer' ? 'Oficial' : role}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-muted-foreground/60 italic px-1">
                                    {parentRoles && parentRoles.length > 0
                                        ? `Heredando de categoría: ${parentRoles.join(', ').toUpperCase()}`
                                        : "Si no se selecciona ninguno, el ítem será visible para todos."}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-6">
                            <Button variant="ghost" className="h-11 px-6 font-bold uppercase text-xs tracking-widest" onClick={() => setEditingId(null)}>Cancelar</Button>
                            <Button onClick={() => handleSave(item.id)} className="gap-2 h-11 px-8 font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20">
                                <IconDeviceFloppy className="size-4" /> Guardar Cambios
                            </Button>
                        </div>
                    </div>
                )}

                {item.children?.map((child: any) => renderRow(child, depth + 1, effectiveRoles))}
            </React.Fragment>
        )
    }

    if (!mounted) return null

    return (
        <div className="flex flex-col gap-8 w-full max-w-full animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/configuracion">
                        <Button variant="outline" size="icon" className="size-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 transition-all shadow-xl">
                            <IconArrowLeft className="size-6" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Personalización del Menú</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Gestiona la estructura jerárquica y el acceso de los enlaces laterales.
                        </p>
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button className="w-full sm:w-auto gap-2 px-8 h-12 font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/10">
                            <IconPlus className="size-4" /> Añadir <IconChevronDownTabler className="size-3 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-zinc-950 border-white/10 min-w-[200px] rounded-xl shadow-2xl">
                        <DropdownMenuItem
                            onClick={() => handleCreate('category')}
                            className="gap-3 py-4 font-black uppercase text-[10px] tracking-widest cursor-pointer focus:bg-primary focus:text-zinc-950"
                        >
                            <IconFolderPlus className="size-4 text-primary group-focus:text-inherit" /> Nueva Categoría
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleCreate('link')}
                            className="gap-3 py-4 font-black uppercase text-[10px] tracking-widest cursor-pointer focus:bg-primary focus:text-zinc-950"
                        >
                            <IconLinkPlus className="size-4 text-emerald-500 group-focus:text-inherit" /> Nuevo Enlace
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <Card className="border-border/40 bg-zinc-900/40 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                    <div className="flex flex-col">
                        <div className="hidden sm:flex items-center gap-3 p-3 bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 border-y border-white/5">
                            <div className="min-w-[200px] flex-1">Nombre / Icono</div>
                            <div className="flex-1">URL / Ruta</div>
                            <div className="w-[180px] text-right">Acciones</div>
                        </div>
                        {loading ? (
                            <div className="p-12 text-center text-muted-foreground">
                                <div className="animate-spin size-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Cargando menú dinámico...</span>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {tree.map(i => renderRow(i))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div >
    )
}
