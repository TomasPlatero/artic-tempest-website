"use client"

import React from "react"
import { IconHeart, IconBrandPaypal, IconCopy, IconCheck, IconPlus, IconExternalLink, IconHistory, IconTarget } from "@tabler/icons-react"
import { Button } from "@/shared/ui/button"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Progress } from "@/shared/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"

interface Donation {
    character_name: string
    amount: number
    description: string | null
    created_at: string
}

interface DonationGoal {
    id: string
    name: string
    target_amount: number
    current_amount: number
    is_active: boolean
    created_at: string
}

interface DonationSectionProps {
    roleLevel: string
    recentDonations: Donation[]
    donationGoal?: DonationGoal | null
    donationGoals?: DonationGoal[]
    myCharacters?: any[]
    sessionUser?: any
    guildSettings?: {
        bizum_number: string | null
        paypal_link: string | null
    }
}

export function DonationSection({ roleLevel, recentDonations, donationGoal, donationGoals = [], myCharacters = [], guildSettings }: DonationSectionProps) {
    const { data: session } = useSession()
    const router = useRouter()
    const isOfficer = roleLevel === "gm" || roleLevel === "officer"
    const userName = session?.user?.username || "Usuario"
    
    const [copied, setCopied] = React.useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [isOpen, setIsOpen] = React.useState(false)
    const [step, setStep] = React.useState<'method' | 'pay' | 'report' | 'success'>(isOfficer ? 'report' : 'method')
    const [selectedMethod, setSelectedMethod] = React.useState<'bizum' | 'paypal' | null>(null)

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        setCopied(label)
        toast.success(`${label} copiado al portapapeles`)
        setTimeout(() => setCopied(null), 2000)
    }

    const handleAddLog = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        
        const formData = new FormData(e.currentTarget)
        const character_name = formData.get("character_name")
        const amount = formData.get("amount")
        const description = formData.get("description")
        const notes = formData.get("notes")

        try {
            const res = await fetch("/api/donations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ character_name, amount, description, notes })
            })

            if (res.ok) {
                setStep('success')
                setTimeout(() => {
                    setIsOpen(false)
                    router.refresh()
                    setStep(isOfficer ? 'report' : 'method')
                }, 3000)
            } else {
                toast.error("Error al registrar la donación")
            }
        } catch (error) {
            console.error(error)
            toast.error("Error de conexión")
        } finally {
            setIsSubmitting(false)
        }
    }

    const resetWizard = (open: boolean) => {
        setIsOpen(open)
        if (!open) {
            setTimeout(() => {
                setStep(isOfficer ? 'report' : 'method')
                setSelectedMethod(null)
            }, 300)
        }
    }


    return (
        <div className="bg-card/40 backdrop-blur-md text-card-foreground border-border/40 border rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 shadow-xl hover:border-primary/40 transition-all duration-300 relative overflow-hidden group/card h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
            
            <div className="relative z-10 flex items-center justify-between w-full mb-2">
                <div className="flex items-center gap-3 font-black italic uppercase tracking-widest text-lg text-muted-foreground/80">
                    <IconHeart className="size-6 text-primary animate-pulse" />
                    Colaboraciones
                </div>
                
                <Dialog open={isOpen} onOpenChange={resetWizard}>
                    <DialogContent className="bg-card/95 backdrop-blur-xl border-white/10 max-w-md overflow-hidden">
                        {step === 'method' && (
                            <div className="space-y-6 py-4 animate-in fade-in slide-in-from-bottom-2">
                                <div className="text-center space-y-2">
                                    <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">¿Cómo quieres ayudar?</DialogTitle>
                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Elige tu método de apoyo</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Button 
                                        variant="glass" 
                                        className="h-32 flex flex-col gap-3 group/btn border-white/5 active:scale-95 transition-all"
                                        onClick={() => { setSelectedMethod('bizum'); setStep('pay'); }}
                                    >
                                        <div className="size-12 rounded-2xl bg-[#00AAAD]/10 flex items-center justify-center border border-[#00AAAD]/20 group-hover/btn:border-[#00AAAD]/50 transition-colors">
                                            <span className="font-black text-[#00AAAD] text-xs">Bizum</span>
                                        </div>
                                        <span className="font-black uppercase italic tracking-widest text-[10px]">Bizum</span>
                                    </Button>
                                    <Button 
                                        variant="glass" 
                                        className="h-32 flex flex-col gap-3 group/btn border-white/5 active:scale-95 transition-all"
                                        onClick={() => { setSelectedMethod('paypal'); setStep('pay'); }}
                                    >
                                        <div className="size-12 rounded-2xl bg-[#003087]/10 flex items-center justify-center border border-[#003087]/20 group-hover/btn:border-[#003087]/50 transition-colors">
                                            <IconBrandPaypal className="size-6 text-[#003087]" />
                                        </div>
                                        <span className="font-black uppercase italic tracking-widest text-[10px]">PayPal</span>
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 'pay' && (
                            <div className="space-y-6 py-4 animate-in fade-in slide-in-from-right-4">
                                <div className="text-center space-y-2">
                                    <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
                                        {selectedMethod === 'bizum' ? "Envía tu Bizum" : "Donación vía PayPal"}
                                    </DialogTitle>
                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Paso 2: Realizar el envío</p>
                                </div>
                                
                                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 text-center space-y-4">
                                    {selectedMethod === 'bizum' ? (
                                        <>
                                            <p className="text-3xl font-black italic tracking-tighter text-white">{guildSettings?.bizum_number || "608 10 93 96"}</p>
                                            <p className="text-[10px] font-bold text-[#00AAAD] uppercase tracking-widest">A nombre de Oficial</p>
                                            <Button 
                                                variant="glow" 
                                                className="w-full gap-2 font-black uppercase tracking-widest italic"
                                                onClick={() => copyToClipboard(guildSettings?.bizum_number || "608109396", "Bizum")}
                                            >
                                                {copied === "Bizum" ? <IconCheck className="size-4" /> : <IconCopy className="size-4" />}
                                                {copied === "Bizum" ? "Copiado" : "Copiar Número"}
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-lg font-bold text-white uppercase tracking-widest">Abrir PayPal.me</p>
                                            <p className="text-[10px] font-bold text-[#003087] uppercase tracking-widest">Seguro y sin comisiones</p>
                                            <Button 
                                                variant="glow" 
                                                className="w-full gap-2 font-black uppercase tracking-widest italic"
                                                onClick={() => window.open(guildSettings?.paypal_link || 'https://paypal.me/tapla', '_blank')}
                                            >
                                                <IconExternalLink className="size-4" />
                                                Ir a PayPal.me
                                            </Button>
                                        </>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-widest px-4">
                                        Una vez realizado el envío, avísanos para que podamos validarlo y sumarlo a la barra.
                                    </p>
                                    <div className="flex gap-3">
                                        <Button variant="ghost" className="flex-1 border border-white/5 uppercase font-black italic text-[10px] h-12" onClick={() => setStep('method')}>
                                            Cambiar método
                                        </Button>
                                        <Button variant="outline" className="flex-[2] border-white/10 uppercase font-black italic text-xs h-12" onClick={() => setStep('report')}>
                                            Ya lo he enviado
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(step === 'report') && (
                            <div className="animate-in fade-in slide-in-from-right-4">
                                <div className="flex items-center justify-between mb-4">
                                    {!isOfficer && (
                                        <Button variant="ghost" size="icon" className="size-8 rounded-lg" onClick={() => setStep('pay')}>
                                            <IconHeart className="size-4 rotate-180 opacity-40" />
                                        </Button>
                                    )}
                                    <DialogTitle className="font-black uppercase italic italic tracking-tighter text-xl text-center flex-1">
                                        Avisar de Donación
                                    </DialogTitle>
                                    <div className="size-8" /> {/* Spacer */}
                                </div>
                                {!isOfficer && (
                                    <div className="bg-primary/10 border border-primary/20 p-3 rounded-xl text-[10px] font-bold uppercase tracking-tight text-primary/90 my-4 italic text-center">
                                        Tu reporte quedará <span className="underline">pendiente</span> para revisión.
                                    </div>
                                )}
                                <form onSubmit={handleAddLog} className="space-y-4 pt-2">
                                    <div className="space-y-1 mb-4">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">Donante</Label>
                                        <div className="text-xl font-black italic uppercase text-white drop-shadow-sm px-1">
                                            {userName}
                                        </div>
                                        <input type="hidden" name="character_name" value={userName} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5 text-left">
                                            <Label htmlFor="amount" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">Cantidad (€)</Label>
                                            <Input id="amount" name="amount" type="number" step="0.01" placeholder="10.00" required className="bg-white/5 border-white/10 !h-14 font-black italic text-xl px-4" />
                                        </div>
                                        <div className="space-y-1.5 text-left">
                                            <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">Meta Destinada</Label>
                                            <Select name="description" defaultValue={donationGoal?.name || "Donación General"}>
                                                <SelectTrigger className="bg-white/5 border-white/10 !h-14 font-black uppercase text-xs w-full text-white px-4">
                                                    <SelectValue placeholder="Selecciona una meta" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-card/95 backdrop-blur-xl border-white/10 z-[100]">
                                                    <SelectItem value="Donación General" className="font-bold uppercase text-[10px]">
                                                        Donación General
                                                    </SelectItem>
                                                    {donationGoals && donationGoals.length > 0 && donationGoals.map(goal => (
                                                        <SelectItem key={goal.id} value={goal.name} className="font-bold uppercase text-[10px]">
                                                            {goal.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="notes" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">Nota u observaciones (Opcional)</Label>
                                        <Input 
                                            id="notes" 
                                            name="notes" 
                                            placeholder="Ej: Para el bot de Discord..." 
                                            className="bg-white/5 border-white/10 h-14 font-medium italic text-sm" 
                                        />
                                    </div>
                                    <DialogFooter className="pt-4">
                                        <Button type="submit" variant="glow" disabled={isSubmitting} className="w-full font-black uppercase tracking-widest italic h-14 text-lg">
                                            {isSubmitting ? "Enviando..." : (isOfficer ? "Confirmar Registro" : "¡Listo, Hecho!")}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </div>
                        )}

                        {step === 'success' && (
                            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95">
                                <div className="size-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                    <IconCheck className="size-10 text-emerald-500" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">¡Gracias por tu apoyo!</h3>
                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Hemos recibido tu reporte correctamente</p>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>

            {/* Goal Progress Section */}
            {donationGoals.length > 0 && (
                <div className="w-full space-y-4 mb-2 relative z-10">
                    {donationGoals.map(goal => {
                        const progress = Math.min(100, (goal.current_amount / goal.target_amount) * 100);
                        return (
                            <div key={goal.id} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <IconTarget className="size-4 text-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/90 italic">{goal.name}</span>
                                    </div>
                                    <span className="text-xs font-black italic text-primary">{Math.round(progress)}%</span>
                                </div>
                                <Progress value={progress} className="h-2 bg-white/5" />
                                <div className="flex justify-between mt-2 text-[10px] font-bold uppercase tracking-tighter">
                                    <span className="text-emerald-500/80">{goal.current_amount}€ Recaudados</span>
                                    <span className="text-muted-foreground/40">Meta: {goal.target_amount}€</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full relative z-10">
                {/* Bizum Option */}
                <div className="flex items-center justify-between bg-muted/20 backdrop-blur-sm p-3 rounded-xl border border-white/5 text-sm transition-all hover:bg-muted/30 group/item">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-[#00AAAD]/10 flex items-center justify-center border border-[#00AAAD]/20 shadow-inner group-hover/item:border-[#00AAAD]/40 transition-colors shrink-0">
                            <span className="font-black text-[#00AAAD] text-[10px]">Bizum</span>
                        </div>
                        <div className="flex flex-col items-start translate-y-[1px] min-w-0">
                            <span className="font-black uppercase italic tracking-tighter text-white truncate w-full">Bizum Guild</span>
                            <span className="text-[10px] font-bold text-[#00AAAD] uppercase tracking-widest">{guildSettings?.bizum_number || "608 10 93 96"}</span>
                        </div>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="size-8 rounded-lg hover:bg-white/5 shrink-0"
                        onClick={() => copyToClipboard("+34608109396", "Teléfono")}
                    >
                        {copied === "Teléfono" ? <IconCheck className="size-4 text-emerald-500" /> : <IconCopy className="size-4 text-muted-foreground" />}
                    </Button>
                </div>

                {/* PayPal Option */}
                <div className="flex items-center justify-between bg-muted/20 backdrop-blur-sm p-3 rounded-xl border border-white/5 text-sm transition-all hover:bg-muted/30 group/item">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-[#003087]/10 flex items-center justify-center border border-[#003087]/20 shadow-inner group-hover/item:border-[#003087]/40 transition-colors shrink-0">
                            <IconBrandPaypal className="size-5 text-[#003087]" />
                        </div>
                        <div className="flex flex-col items-start translate-y-[1px] min-w-0">
                            <span className="font-black uppercase italic tracking-tighter text-white truncate w-full">PayPal</span>
                            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest text-[#003087]">Donación rápida</span>
                        </div>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="size-8 rounded-lg hover:bg-white/5 shrink-0"
                        onClick={() => window.open('https://paypal.me/tapla', '_blank')}
                    >
                        <IconExternalLink className="size-4 text-muted-foreground" />
                    </Button>
                </div>
            </div>

            <Button 
                onClick={() => { setIsOpen(true); setStep('report'); }}
                variant="glow"
                className="w-full text-xs font-black uppercase italic tracking-widest h-12 shadow-lg shadow-primary/10 relative z-10 animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
                Reportar donación hecha
            </Button>

            {/* History List */}
            {recentDonations.length > 0 && (
                <div className="w-full mt-2 relative z-10">
                    <div className="flex items-center gap-2 mb-3 px-1">
                        <IconHistory className="size-3.5 text-muted-foreground/60" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Últimas aportaciones</span>
                    </div>
                    <div className="space-y-2">
                        {recentDonations.map((donation, i) => (
                            <div key={i} className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-2 px-3 rounded-lg text-xs">
                                <div className="flex flex-col items-start">
                                    <span className="font-black uppercase italic tracking-tighter text-white/90">{donation.character_name}</span>
                                    <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">{donation.description || 'Aportación general'}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="font-black text-emerald-500/80 italic">+{donation.amount}€</span>
                                    <span className="text-[8px] font-bold text-muted-foreground/30 uppercase">
                                        {new Date(donation.created_at).toLocaleDateString("es-ES", { day: 'numeric', month: 'short' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] mt-2 italic px-4 relative z-10">
                Todo lo recaudado va destinado íntegramente a gastos de la hermandad.
            </p>
        </div>
    )
}
