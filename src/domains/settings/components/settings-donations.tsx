"use client"

import React from "react"
import { IconHeart, IconTarget, IconHistory, IconPlus, IconTrash, IconCheck, IconX, IconEdit, IconDotsVertical, IconBrandPaypal, IconDeviceMobile } from "@tabler/icons-react"
import { Button } from "@/shared/ui/button"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Badge } from "@/shared/ui/badge"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/shared/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu"

interface Donation {
    id: string
    character_name: string
    amount: number
    description: string | null
    status: 'pending' | 'confirmed' | 'rejected'
    created_at: string
}

interface Goal {
    id: string
    name: string
    target_amount: number
    is_active: boolean
    created_at: string
}

interface SettingsDonationsClientProps {
    donations: Donation[]
    goals: Goal[]
    guildSettings: {
        bizum_number: string | null
        paypal_link: string | null
    }
}

export function SettingsDonationsClient({ donations, goals, guildSettings }: SettingsDonationsClientProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [isGoalOpen, setIsGoalOpen] = React.useState(false)
    const [bizum, setBizum] = React.useState(guildSettings.bizum_number || "")
    const [paypal, setPaypal] = React.useState(guildSettings.paypal_link || "")

    const handleUpdateSettings = async () => {
        setIsSubmitting(true)
        try {
            const res = await fetch("/api/donations", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    type: 'settings', 
                    bizum_number: bizum, 
                    paypal_link: paypal 
                })
            })
            if (res.ok) {
                toast.success("Ajustes de pago actualizados")
                router.refresh()
            } else {
                toast.error("Error al actualizar ajustes")
            }
        } catch (error) {
            toast.error("Error de conexión")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id: string, type: 'donation' | 'goal') => {
        if (!confirm("¿Estás seguro de que quieres eliminar esto?")) return

        try {
            const res = await fetch(`/api/donations?id=${id}&type=${type}`, { method: "DELETE" })
            if (res.ok) {
                toast.success("Eliminado correctamente")
                router.refresh()
            } else {
                toast.error("Error al eliminar")
            }
        } catch (error) {
            toast.error("Error de conexión")
        }
    }

    const handleUpdateStatus = async (id: string, status: 'confirmed' | 'rejected') => {
        try {
            const res = await fetch("/api/donations", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, type: 'donation', status })
            })
            if (res.ok) {
                toast.success(status === 'confirmed' ? "Donación confirmada" : "Donación rechazada")
                router.refresh()
            } else {
                toast.error("Error al actualizar la donación")
            }
        } catch (error) {
            toast.error("Error de conexión")
        }
    }

    const toggleGoalStatus = async (goal: Goal) => {
        try {
            const res = await fetch("/api/donations", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: goal.id, type: 'goal', is_active: !goal.is_active })
            })
            if (res.ok) {
                toast.success(goal.is_active ? "Meta desactivada" : "Meta activada")
                router.refresh()
            }
        } catch (error) {
            toast.error("Error al actualizar")
        }
    }

    const handleAddGoal = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        const formData = new FormData(e.currentTarget)
        
        try {
            const res = await fetch("/api/donations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: 'goal',
                    name: formData.get("name"),
                    target_amount: formData.get("target_amount")
                })
            })
            if (res.ok) {
                toast.success("Meta creada")
                setIsGoalOpen(false)
                router.refresh()
            } else {
                toast.error("Error al crear la meta")
            }
        } catch (error) {
            toast.error("Error de conexión")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 w-full mt-4">
            {/* Payment Methods Config */}
            <Card className="bg-card/40 backdrop-blur-xl border-white/5 shadow-2xl">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <IconHeart className="size-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-black uppercase italic tracking-tighter">Métodos de Pago de la Hermandad</CardTitle>
                            <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Configura los datos que verán los miembros al donar</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <IconDeviceMobile className="size-3" /> Número de Bizum
                        </Label>
                        <Input 
                            value={bizum} 
                            onChange={(e) => setBizum(e.target.value)}
                            placeholder="600 000 000" 
                            className="bg-white/5 border-white/10 italic font-medium" 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <IconBrandPaypal className="size-3" /> Enlace de PayPal.me
                        </Label>
                        <Input 
                            value={paypal} 
                            onChange={(e) => setPaypal(e.target.value)}
                            placeholder="https://paypal.me/TuHermandad" 
                            className="bg-white/5 border-white/10 italic font-medium" 
                        />
                    </div>
                </CardContent>
                <CardFooter className="border-t border-white/5 bg-white/[0.01] pt-4">
                    <Button 
                        onClick={handleUpdateSettings} 
                        variant="glow" 
                        disabled={isSubmitting} 
                        className="ml-auto font-black uppercase italic tracking-widest"
                    >
                        {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                </CardFooter>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Pending Validations */}
                {donations.some(d => d.status === 'pending') && (
                    <Card className="lg:col-span-3 bg-primary/5 hover:bg-primary/10 border-primary/20 transition-all shadow-lg animate-in zoom-in-95 duration-500">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-black uppercase italic tracking-tighter text-primary">⚠️ Validaciones Pendientes</CardTitle>
                                <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Reportes de miembros esperando verificación</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {donations.filter(d => d.status === 'pending').map((donation) => (
                                    <div key={donation.id} className="flex items-center justify-between p-4 rounded-xl bg-card border border-white/10 shadow-sm transition-all hover:scale-[1.02]">
                                        <div className="space-y-1">
                                            <p className="font-black uppercase italic tracking-tighter text-white">{donation.character_name}</p>
                                            <p className="text-xl font-black italic text-emerald-500">{donation.amount}€</p>
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60 truncate max-w-[150px]">{donation.description || "Sin concepto"}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button 
                                                variant="outline" 
                                                className="size-10 border-emerald-500/50 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                                                onClick={() => handleUpdateStatus(donation.id, 'confirmed')}
                                            >
                                                <IconCheck className="size-5" />
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                className="size-10 border-destructive/50 text-destructive hover:bg-destructive hover:text-white"
                                                onClick={() => handleUpdateStatus(donation.id, 'rejected')}
                                            >
                                                <IconX className="size-5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Metas Management */}
                <Card className="lg:col-span-1 bg-card/40 backdrop-blur-xl border-white/5 shadow-2xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-lg font-black uppercase italic tracking-tighter">Metas Activas</CardTitle>
                            <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Objetivos de recaudación</CardDescription>
                        </div>
                        <Dialog open={isGoalOpen} onOpenChange={setIsGoalOpen}>
                            <DialogTrigger asChild>
                                <Button variant="glass" size="icon" className="size-8">
                                    <IconPlus className="size-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-card/95 backdrop-blur-2xl border-white/10 text-white">
                                <DialogHeader>
                                    <DialogTitle className="font-black uppercase italic tracking-tighter">Nueva Meta</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleAddGoal} className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre del Objetivo</Label>
                                        <Input name="name" placeholder="Ej: Raidbots Abril" required className="bg-white/5 border-white/10" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cantidad Objetivo (€)</Label>
                                        <Input name="target_amount" type="number" step="0.01" placeholder="20.00" required className="bg-white/5 border-white/10" />
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit" variant="glow" disabled={isSubmitting} className="w-full font-black uppercase italic tracking-widest">Crear Meta</Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        {goals.length === 0 && (
                            <p className="text-center text-xs text-muted-foreground/40 py-8 uppercase font-bold italic">No hay metas configuradas</p>
                        )}
                        {goals.map((goal) => (
                            <div key={goal.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 transition-all hover:bg-white/[0.04]">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-black uppercase italic tracking-tighter text-sm text-white">{goal.name}</span>
                                        {goal.is_active && <Badge variant="glow" className="text-[8px] h-4 scale-90">Activa</Badge>}
                                    </div>
                                    <p className="text-[10px] font-bold text-muted-foreground opacity-60 uppercase">{goal.target_amount}€ • {new Date(goal.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className={`size-8 rounded-lg ${goal.is_active ? 'text-emerald-500 bg-emerald-500/10' : 'text-muted-foreground/40 hover:text-white'}`}
                                        onClick={() => toggleGoalStatus(goal)}
                                    >
                                        {goal.is_active ? <IconCheck className="size-4" /> : <IconTarget className="size-4" />}
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="size-8 rounded-lg text-muted-foreground/40 hover:text-destructive"
                                        onClick={() => handleDelete(goal.id, 'goal')}
                                    >
                                        <IconTrash className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Logs Management */}
                <Card className="lg:col-span-2 bg-card/40 backdrop-blur-xl border-white/5 shadow-2xl">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-black uppercase italic tracking-tighter text-white">Registro Histórico</CardTitle>
                                <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Todas las aportaciones registradas</CardDescription>
                            </div>
                            <Badge variant="outline" className="bg-white/5 border-white/10 text-[10px] font-black">{donations.length} Registros</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 sm:p-6 sm:pt-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/5 hover:bg-transparent">
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Personaje</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Concepto</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Cantidad</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Fecha</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {donations.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground/30 uppercase font-black italic text-xs">No hay donaciones registradas</TableCell>
                                    </TableRow>
                                )}
                                {donations.filter(d => d.status !== 'pending').map((donation) => (
                                    <TableRow key={donation.id} className="border-white/5 group hover:bg-white/[0.02] transition-colors">
                                        <TableCell className="font-black uppercase italic text-xs text-white">
                                            <div className="flex items-center gap-2">
                                                {donation.character_name}
                                                {donation.status === 'rejected' && <Badge variant="outline" className="text-[8px] h-4 text-destructive border-destructive/30 uppercase font-black">Rechazada</Badge>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground/60 font-medium">{donation.description || "—"}</TableCell>
                                        <TableCell className="text-right font-black italic text-emerald-500 text-xs">{donation.amount}€</TableCell>
                                        <TableCell className="text-right text-[10px] text-muted-foreground/40 font-bold uppercase">{new Date(donation.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="px-2">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="size-8 text-muted-foreground/20 group-hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                                onClick={() => handleDelete(donation.id, 'donation')}
                                            >
                                                <IconTrash className="size-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
