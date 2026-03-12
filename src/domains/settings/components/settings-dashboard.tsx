"use client"

import React from "react"
import { IconGripVertical, IconEye, IconEyeOff, IconEdit, IconCheck, IconX, IconTrash, IconPlus } from "@tabler/icons-react"
import { Button } from "@/shared/ui/button"
import { toast } from "sonner"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"
import { Card } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/shared/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { RichTextEditor } from "@/shared/ui/rich-text-editor"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs"
import { IconCode as IconSourceCode, IconBrush, IconArrowLeft } from "@tabler/icons-react"
import Link from "next/link"

interface Widget {
    id: string
    type: string
    title: string
    content: any
    order_index: number
    is_active: boolean
    role_levels: string[]
    app_id: string | null
}

export function SettingsDashboardClient({ initialBlocks }: { initialBlocks: Widget[] }) {
    const [widgets, setWidgets] = React.useState<Widget[]>(initialBlocks)
    const [editingBlock, setEditingBlock] = React.useState<string | null>(null)
    const [editForm, setEditForm] = React.useState<any>(null)

    const toggleActive = async (widget: Widget) => {
        const newStatus = !widget.is_active
        try {
            const res = await fetch("/api/dashboard/blocks", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: widget.id, is_active: newStatus }),
            })
            if (!res.ok) throw new Error("Error al actualizar")

            setWidgets(prev => prev.map(w => w.id === widget.id ? { ...w, is_active: newStatus } : w))
            toast.success(newStatus ? "Widget activado" : "Widget desactivado")
        } catch (e) {
            toast.error("Error al actualizar el estado")
        }
    }

    const startEdit = (widget: Widget) => {
        setEditingBlock(widget.id)
        setEditForm({ ...widget })
    }

    const saveEdit = async () => {
        try {
            const res = await fetch("/api/dashboard/blocks", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm),
            })
            if (!res.ok) throw new Error("Error al guardar")

            setWidgets(prev => prev.map(w => w.id === editForm.id ? editForm : w))
            setEditingBlock(null)
            toast.success("Widget actualizado correctamente")
        } catch (e) {
            toast.error("Error al guardar los cambios")
        }
    }

    const addWidget = async (type: string) => {
        let defaultContent = {}
        let defaultTitle = "Nuevo Widget"

        if (type === 'custom') {
            defaultTitle = "Widget Informativo"
            defaultContent = {
                html: `<div class="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 backdrop-blur-md shadow-2xl space-y-3">
  <h3 class="text-xl font-bold text-white flex items-center gap-2">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    Título del Widget
  </h3>
  <p class="text-indigo-100/80 leading-relaxed">
    Contenido del widget personalizado. Puedes usar HTML y clases de Tailwind CSS.
  </p>
  <div class="flex gap-2 mt-4">
    <span class="px-3 py-1 bg-indigo-500/30 rounded-full text-xs font-medium text-indigo-200 border border-indigo-500/40">Template</span>
  </div>
</div>`
            }
        }

        try {
            const res = await fetch("/api/dashboard/blocks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, title: defaultTitle, content: defaultContent }),
            })
            if (!res.ok) throw new Error("Error al crear")
            const newWidget = await res.json()

            setWidgets(prev => [...prev, newWidget])
            toast.success("Widget creado correctamente")
            startEdit(newWidget)
        } catch (e) {
            toast.error("Error al crear el widget")
        }
    }

    const moveWidget = async (id: string, direction: 'up' | 'down') => {
        const index = widgets.findIndex(w => w.id === id)
        if (direction === 'up' && index === 0) return
        if (direction === 'down' && index === widgets.length - 1) return

        const newWidgets = [...widgets]
        const neighborIndex = direction === 'up' ? index - 1 : index + 1

        // Swap
        const [removed] = newWidgets.splice(index, 1)
        newWidgets.splice(neighborIndex, 0, removed)

        // Update indexes in state locally
        const updatedWithIndexes = newWidgets.map((w, i) => ({ ...w, order_index: i }))
        setWidgets(updatedWithIndexes)

        // Persist all indexes
        try {
            await Promise.all(updatedWithIndexes.map(w =>
                fetch("/api/dashboard/blocks", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: w.id, order_index: w.order_index }),
                })
            ))
            toast.success("Orden actualizado")
        } catch (e) {
            toast.error("Error al guardar el nuevo orden")
        }
    }

    const deleteWidget = async (id: string) => {
        if (!confirm("¿Estás seguro de que quieres eliminar este widget? Esta acción no se puede deshacer.")) return

        try {
            const res = await fetch(`/api/dashboard/blocks?id=${id}`, {
                method: "DELETE",
            })
            if (!res.ok) throw new Error("Error al eliminar")

            setWidgets(prev => prev.filter(w => w.id !== id))
            setEditingBlock(null)
            toast.success("Widget eliminado")
        } catch (e) {
            toast.error("Error al eliminar el widget")
        }
    }

    return (
        <div className="flex flex-col gap-8 w-full max-w-full animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/configuracion">
                    <Button variant="outline" size="icon" className="size-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 transition-all shadow-xl">
                        <IconArrowLeft className="size-6" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Widgets del Dashboard</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Gestiona los widgets que aparecen en la página de inicio del dashboard.
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex flex-col gap-4">
                    {widgets.map((widget, index) => (
                        <Card key={widget.id} className={`p-4 ${!widget.is_active ? 'opacity-50 grayscale' : ''} border-border/50 bg-card/50 backdrop-blur-sm`}>
                            {editingBlock === widget.id ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold flex items-center gap-2">
                                            Editando: {widget.title}
                                            <Badge variant="outline" className="text-[10px] uppercase">{widget.type}</Badge>
                                        </h3>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => deleteWidget(widget.id)}>
                                                <IconTrash className="size-4 mr-2" /> Borrar
                                            </Button>
                                            <div className="w-px h-8 bg-border/50 mx-1" />
                                            <Button size="sm" variant="ghost" onClick={() => setEditingBlock(null)}>
                                                <IconX className="size-4" />
                                            </Button>
                                            <Button size="sm" onClick={saveEdit}>
                                                <IconCheck className="size-4 mr-2" /> Guardar
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Título del Widget</Label>
                                            <Input
                                                value={editForm.title}
                                                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Visibilidad por Rango (vacío = todos)</Label>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {["gm", "officer", "raider", "member", "invitado"].map(role => {
                                                    const isActive = editForm.role_levels?.includes(role)
                                                    return (
                                                        <Badge
                                                            key={role}
                                                            variant={isActive ? "default" : "outline"}
                                                            className={`cursor-pointer uppercase text-[10px] ${isActive ? 'bg-primary border-primary' : 'opacity-60'}`}
                                                            onClick={() => {
                                                                const current = editForm.role_levels || []
                                                                const next = current.includes(role)
                                                                    ? current.filter((r: string) => r !== role)
                                                                    : [...current, role]
                                                                setEditForm({ ...editForm, role_levels: next })
                                                            }}
                                                        >
                                                            {role}
                                                        </Badge>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>ID de Aplicación (Matriz de Permisos)</Label>
                                            <Select
                                                value={editForm.app_id || "none"}
                                                onValueChange={(val) => setEditForm({ ...editForm, app_id: val === "none" ? null : val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Ninguna" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Ninguna (Solo rango)</SelectItem>
                                                    <SelectItem value="roster">Roster</SelectItem>
                                                    <SelectItem value="stats">Estadísticas</SelectItem>
                                                    <SelectItem value="calendar">Calendario</SelectItem>
                                                    <SelectItem value="bis">BiS (Personal)</SelectItem>
                                                    <SelectItem value="bis-admin">BiS (Gestión)</SelectItem>
                                                    <SelectItem value="planificador-cds">Planificador CDs</SelectItem>
                                                    <SelectItem value="recruitment">Reclutamiento</SelectItem>
                                                    <SelectItem value="settings">Ajustes Generales</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    {widget.type === 'banner' && (
                                        <>
                                            <div className="space-y-2">
                                                <Label>Título del Banner (soporta {'{guildName}'})</Label>
                                                <Input
                                                    value={editForm.content.title}
                                                    onChange={e => setEditForm({
                                                        ...editForm,
                                                        content: { ...editForm.content, title: e.target.value }
                                                    })}
                                                />
                                            </div>
                                            <div className="space-y-2 col-span-2">
                                                <Label>Descripción</Label>
                                                <Textarea
                                                    value={editForm.content.description}
                                                    onChange={e => setEditForm({
                                                        ...editForm,
                                                        content: { ...editForm.content, description: e.target.value }
                                                    })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>URL Imagen Fondo</Label>
                                                <Input
                                                    value={editForm.content.bg_image}
                                                    onChange={e => setEditForm({
                                                        ...editForm,
                                                        content: { ...editForm.content, bg_image: e.target.value }
                                                    })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Gradiente (CSS clases)</Label>
                                                <Input
                                                    value={editForm.content.gradient}
                                                    onChange={e => setEditForm({
                                                        ...editForm,
                                                        content: { ...editForm.content, gradient: e.target.value }
                                                    })}
                                                />
                                            </div>
                                        </>
                                    )}
                                    {widget.type === 'custom' && (
                                        <div className="space-y-2 col-span-2">
                                            <Label>Contenido del Widget</Label>
                                            <Tabs defaultValue="visual" className="w-full">
                                                <TabsList className="grid w-full grid-cols-2 mb-2">
                                                    <TabsTrigger value="visual" className="gap-2">
                                                        <IconBrush className="size-3" /> Visual
                                                    </TabsTrigger>
                                                    <TabsTrigger value="source" className="gap-2">
                                                        <IconSourceCode className="size-3" /> Código HTML
                                                    </TabsTrigger>
                                                </TabsList>
                                                <TabsContent value="visual" className="mt-0">
                                                    <RichTextEditor
                                                        value={editForm.content.html || ''}
                                                        onChange={(html) => {
                                                            setEditForm({
                                                                ...editForm,
                                                                content: { ...editForm.content, html: html }
                                                            })
                                                        }}
                                                    />
                                                </TabsContent>
                                                <TabsContent value="source" className="mt-0">
                                                    <Textarea
                                                        className="font-mono text-xs min-h-[300px] bg-zinc-950/50"
                                                        placeholder="<div class='p-4 bg-blue-500 rounded-xl'>Hola Mundo</div>"
                                                        value={editForm.content.html || ''}
                                                        onChange={e => setEditForm({
                                                            ...editForm,
                                                            content: { ...editForm.content, html: e.target.value }
                                                        })}
                                                    />
                                                </TabsContent>
                                            </Tabs>
                                            <p className="text-[10px] text-muted-foreground italic mt-2">
                                                Puees alternar entre el editor visual y el código fuente. El HTML se insertará tal cual.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col gap-1">
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveWidget(widget.id, 'up')}>
                                            <IconGripVertical className="size-4 rotate-0 opacity-30" />
                                        </Button>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">{widget.title}</span>
                                            <Badge variant="secondary" className="text-[10px] uppercase">{widget.type}</Badge>
                                            {!widget.is_active && <Badge variant="destructive" className="text-[10px]">Oculto</Badge>}
                                            {widget.app_id && <Badge variant="outline" className="text-[9px] uppercase border-primary/30 text-primary/80 italic">App: {widget.app_id}</Badge>}
                                            {widget.role_levels && widget.role_levels.length > 0 && (
                                                <div className="flex gap-1">
                                                    {widget.role_levels.map(r => (
                                                        <span key={r} className="text-[9px] uppercase font-bold text-primary/70">{r}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate max-w-md">
                                            {widget.type === 'banner' ? widget.content.description :
                                                widget.type === 'custom' ? 'HTML Personalizado' : 'Módulo del sistema'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button size="icon" variant="ghost" onClick={() => toggleActive(widget)}>
                                            {widget.is_active ? <IconEye className="size-4" /> : <IconEyeOff className="size-4" />}
                                        </Button>
                                        <Button size="icon" variant="ghost" onClick={() => startEdit(widget)}>
                                            <IconEdit className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full border-dashed">
                            <IconPlus className="size-4 mr-2" /> Añadir widget
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Añadir Nuevo Widget</DialogTitle>
                            <DialogDescription>
                                Elige el tipo de widget que quieres añadir a la portada.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-1 gap-4 py-4">
                            <Button
                                variant="outline"
                                className="flex items-center justify-start gap-3 h-16"
                                onClick={() => addWidget('custom')}
                            >
                                <div className="size-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                    <IconPlus className="size-5 text-indigo-400" />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-sm">HTML Personalizado (Template)</div>
                                    <div className="text-xs text-muted-foreground whitespace-normal">Crea un widget informativo con diseño premium usando HTML.</div>
                                </div>
                            </Button>
                            <Button
                                variant="outline"
                                className="flex items-center justify-start gap-3 h-16"
                                onClick={() => addWidget('banner')}
                            >
                                <div className="size-10 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                    <IconPlus className="size-5 text-orange-400" />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-sm">Banner Principal</div>
                                    <div className="text-xs text-muted-foreground whitespace-normal">Imagen de fondo, título y descripción dinámica.</div>
                                </div>
                            </Button>
                            {/* More types can be added here once they are modularized */}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div >
    )
}
