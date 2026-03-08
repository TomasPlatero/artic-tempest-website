"use client"

import React from "react"
import { createClient } from "@/infrastructure/supabase/client"
import {
    IconPlus,
    IconTrash,
    IconEdit,
    IconArrowLeft,
    IconDeviceFloppy,
    IconX
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import Link from "next/link"

interface Category {
    id: string
    name: string
    slug: string
    description: string | null
}

interface SettingsCategoriesProps {
    initialCategories: Category[]
}

export function SettingsCategories({ initialCategories }: SettingsCategoriesProps) {
    const [categories, setCategories] = React.useState<Category[]>(initialCategories)
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [editingCategory, setEditingCategory] = React.useState<Partial<Category> | null>(null)
    const [loading, setLoading] = React.useState(false)

    const supabase = createClient()

    const handleOpenDialog = (category?: Category) => {
        if (category) {
            setEditingCategory(category)
        } else {
            setEditingCategory({ name: "", slug: "", description: "" })
        }
        setIsDialogOpen(true)
    }

    const handleCloseDialog = () => {
        setIsDialogOpen(false)
        setEditingCategory(null)
    }

    const handleSave = async () => {
        if (!editingCategory?.name || !editingCategory?.slug) {
            toast.error("El nombre y el slug son obligatorios")
            return
        }

        setLoading(true)
        try {
            const method = editingCategory.id ? 'PATCH' : 'POST'

            const response = await fetch('/api/guild/news/categories', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingCategory)
            })

            const result = await response.json()
            if (!response.ok) throw new Error(result.error || "Error saving category")

            if (editingCategory.id) {
                setCategories(prev => prev.map(c => c.id === editingCategory.id ? result : c))
                toast.success("Categoría actualizada correctamente")
            } else {
                setCategories(prev => [...prev, result])
                toast.success("Categoría creada correctamente")
            }
            handleCloseDialog()
        } catch (error: any) {
            console.error(error)
            toast.error("Error al guardar la categoría: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de que deseas eliminar esta categoría? Las noticias asociadas podrían verse afectadas.")) {
            return
        }

        try {
            const response = await fetch(`/api/guild/news/categories?id=${id}`, {
                method: 'DELETE'
            })

            const result = await response.json()
            if (!response.ok) throw new Error(result.error || "Error deleting category")

            setCategories(prev => prev.filter(c => c.id !== id))
            toast.success("Categoría eliminada correctamente")
        } catch (error: any) {
            console.error(error)
            toast.error("Error al eliminar la categoría: " + error.message)
        }
    }

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 lg:px-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/settings/news-settings">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <IconArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black italic tracking-tighter uppercase">Gestión de Categorías</h1>
                        <p className="text-sm text-muted-foreground">Administra las etiquetas disponibles para organizar las noticias.</p>
                    </div>
                </div>
                <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-500 font-bold italic uppercase tracking-tighter">
                    <IconPlus className="w-4 h-4 mr-2" />
                    Nueva Categoría
                </Button>
            </div>

            <div className="rounded-3xl border border-white/5 bg-white/[0.02] overflow-hidden backdrop-blur-sm">
                <Table>
                    <TableHeader className="bg-white/[0.03]">
                        <TableRow className="border-white/5 hover:bg-transparent">
                            <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 px-6">Nombre</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 px-6">Slug</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 px-6 hidden md:table-cell">Descripción</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 px-6 text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories.map((category) => (
                            <TableRow key={category.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                                <TableCell className="font-bold px-6 py-4">
                                    <span className="bg-white/5 px-3 py-1 rounded-full text-[11px] uppercase tracking-wider border border-white/5">
                                        {category.name}
                                    </span>
                                </TableCell>
                                <TableCell className="px-6 py-4">
                                    <code className="text-[10px] text-zinc-500 bg-white/5 px-2 py-0.5 rounded">
                                        {category.slug}
                                    </code>
                                </TableCell>
                                <TableCell className="text-zinc-400 text-xs px-6 py-4 hidden md:table-cell max-w-xs truncate">
                                    {category.description || "-"}
                                </TableCell>
                                <TableCell className="text-right px-6 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleOpenDialog(category)}
                                            className="size-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-500"
                                        >
                                            <IconEdit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(category.id)}
                                            className="size-8 rounded-lg hover:bg-red-500/10 hover:text-red-500"
                                        >
                                            <IconTrash className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md bg-zinc-950 border-white/10 p-8 rounded-[32px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase">
                            {editingCategory?.id ? "Editar Categoría" : "Nueva Categoría"}
                        </DialogTitle>
                        <DialogDescription>
                            Completa los campos para definir una nueva categoría de noticias.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Nombre</label>
                            <Input
                                value={editingCategory?.name || ""}
                                onChange={(e) => setEditingCategory(prev => ({ ...prev!, name: e.target.value }))}
                                placeholder="Ej: Raid"
                                className="bg-white/5 border-white/10 rounded-xl focus:ring-blue-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Slug</label>
                            <Input
                                value={editingCategory?.slug || ""}
                                onChange={(e) => setEditingCategory(prev => ({ ...prev!, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                                placeholder="ej-raid"
                                className="bg-white/5 border-white/10 rounded-xl focus:ring-blue-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Descripción</label>
                            <Textarea
                                value={editingCategory?.description || ""}
                                onChange={(e) => setEditingCategory(prev => ({ ...prev!, description: e.target.value }))}
                                placeholder="Noticias sobre..."
                                className="bg-white/5 border-white/10 rounded-xl focus:ring-blue-500 min-h-[100px]"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-3">
                        <Button variant="ghost" onClick={handleCloseDialog} className="rounded-xl font-bold uppercase tracking-tighter text-xs">
                            <IconX className="w-4 h-4 mr-2" />
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-500 rounded-xl px-8 font-black italic uppercase tracking-tighter shadow-xl shadow-blue-600/20"
                        >
                            {loading ? "Guardando..." : (
                                <>
                                    <IconDeviceFloppy className="w-4 h-4 mr-2" />
                                    Guardar Categoría
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
