"use client"

import { useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    IconSend,
    IconPhotoPlus,
    IconX,
    IconAlertCircle,
    IconCheck,
    IconUser,
    IconMail,
    IconBug,
    IconMessageCircle,
    IconBulb
} from "@tabler/icons-react"
import { supabase } from "@/infrastructure/supabase/client"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { cn } from "@/infrastructure/tailwind/tailwind-utils"

const CATEGORIES = [
    { id: "general", label: "General", icon: IconMessageCircle, color: "text-blue-400" },
    { id: "bug", label: "Bug / Error", icon: IconBug, color: "text-rose-400" },
    { id: "idea", label: "Sugerencia", icon: IconBulb, color: "text-amber-400" },
]

export function FeedbackClient() {
    const { data: session } = useSession()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [category, setCategory] = useState("general")
    const [acceptedRGPD, setAcceptedRGPD] = useState(false)
    const [images, setImages] = useState<{ file: File; url: string; uploading: boolean }[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        if (images.length + files.length > 4) {
            toast.error("Máximo 4 imágenes por feedback")
            return
        }

        const newImages = files.map(file => ({
            file,
            url: URL.createObjectURL(file),
            uploading: false
        }))

        setImages(prev => [...prev, ...newImages])
    }

    const removeImage = (index: number) => {
        setImages(prev => {
            const updated = [...prev]
            URL.revokeObjectURL(updated[index].url)
            updated.splice(index, 1)
            return updated
        })
    }

    const uploadImages = async (): Promise<string[]> => {
        const urls: string[] = []

        for (const attachment of images) {
            // Sanitize filename: remove spaces, accents and special chars
            const safeName = attachment.file.name
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "") // Remove accents
                .replace(/[^a-zA-Z0-9.]/g, "-") // Replace everything else with -
                .replace(/-+/g, "-") // Remove double hyphens

            const fileName = `${Date.now()}_${safeName}`
            const filePath = `user_feedback/${fileName}`

            const { data, error } = await supabase.storage
                .from('feedback_attachments')
                .upload(filePath, attachment.file)

            if (error) {
                console.error("Error uploading image:", error)
                continue
            }

            const { data: { publicUrl } } = supabase.storage
                .from('feedback_attachments')
                .getPublicUrl(filePath)

            urls.push(publicUrl)
        }

        return urls
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!acceptedRGPD) {
            toast.error("Debes aceptar la política de privacidad")
            return
        }

        setLoading(true)

        try {
            const formData = new FormData(e.currentTarget)
            const name = formData.get("name") as string
            const email = formData.get("email") as string
            const message = formData.get("message") as string

            if (!name || name.trim().length < 2) {
                toast.error("Por favor, introduce tu nombre")
                setLoading(false)
                return
            }

            if (!email || !email.includes("@")) {
                toast.error("Por favor, introduce un email válido")
                setLoading(false)
                return
            }

            if (!message || message.trim().length < 10) {
                toast.error("Por favor, cuéntanos algo más (mínimo 10 caracteres)")
                setLoading(false)
                return
            }

            // 1. Upload Images if any
            let imageUrls: string[] = []
            if (images.length > 0) {
                imageUrls = await uploadImages()
            }

            // 2. Send to API
            const response = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    email,
                    category,
                    message,
                    images: imageUrls
                })
            })

            if (!response.ok) throw new Error("Error al enviar el feedback")

            setSuccess(true)
            toast.success("Feedback enviado correctamente. ¡Gracias!")
        } catch (err) {
            console.error(err)
            toast.error("No se pudo enviar el feedback. Inténtalo de nuevo.")
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="size-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mb-6">
                    <IconCheck className="size-10 text-green-500" />
                </div>
                <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tight">¡Mensaje Recibido!</h2>
                <p className="text-white/60 max-w-sm mb-8">
                    Tu feedback ha sido enviado correctamente. Revisamos todos los mensajes para mejorar la plataforma. ¡Gracias por ayudarnos!
                </p>
                <Button variant="glow" onClick={() => (window.location.href = "/")}>
                    Volver al Inicio
                </Button>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombre */}
                <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs uppercase tracking-widest text-white/40 font-black">Tu Nombre</Label>
                    <div className="relative">
                        <IconUser className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/20" />
                        <Input
                            id="name"
                            name="name"
                            placeholder="Nombre / Discord Tag"
                            defaultValue={session?.user?.username || ""}
                            className="pl-10 h-12 bg-white/5 border-white/10 focus:border-blue-500/50 transition-all rounded-xl"
                            required
                        />
                    </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs uppercase tracking-widest text-white/40 font-black">Tu Email</Label>
                    <div className="relative">
                        <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/20" />
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="email@ejemplo.com"
                            className="pl-10 h-12 bg-white/5 border-white/10 focus:border-blue-500/50 transition-all rounded-xl"
                            required
                        />
                    </div>
                </div>
            </div>

            {/* Categoría */}
            <div className="space-y-3">
                <Label className="text-xs uppercase tracking-widest text-white/40 font-black">¿De qué trata tu feedback?</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => setCategory(cat.id)}
                            className={cn(
                                "flex items-center gap-3 p-4 rounded-xl border transition-all text-sm font-bold",
                                category === cat.id
                                    ? "bg-blue-500/10 border-blue-500/40 text-white"
                                    : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                            )}
                        >
                            <cat.icon className={cn("size-5", category === cat.id ? cat.color : "text-white/20")} />
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Mensaje */}
            <div className="space-y-2">
                <Label htmlFor="message" className="text-xs uppercase tracking-widest text-white/40 font-black">Tu Mensaje</Label>
                <Textarea
                    id="message"
                    name="message"
                    placeholder="Cuéntanos qué tienes en mente, informa de un error o propón una idea..."
                    className="min-h-[150px] bg-white/5 border-white/10 focus:border-blue-500/50 transition-all rounded-2xl p-4 text-base resize-none"
                    required
                />
            </div>

            {/* Imágenes */}
            <div className="space-y-3">
                <Label className="text-xs uppercase tracking-widest text-white/40 font-black">Adjuntar Imágenes (Max 4)</Label>
                <div className="flex flex-wrap gap-4">
                    {images.map((img, idx) => (
                        <div key={idx} className="relative group size-24 rounded-xl overflow-hidden border border-white/10 bg-white/5">
                            <Image
                                src={img.url}
                                alt="Adjunto"
                                fill
                                className="object-cover transition-transform group-hover:scale-110"
                            />
                            <button
                                type="button"
                                onClick={() => removeImage(idx)}
                                className="absolute top-1 right-1 size-6 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white hover:bg-rose-500 transition-colors z-10"
                            >
                                <IconX className="size-3" />
                            </button>
                        </div>
                    ))}

                    {images.length < 4 && (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="size-24 rounded-xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center gap-2 text-white/20 hover:border-blue-500/40 hover:bg-blue-500/5 hover:text-blue-400 transition-all"
                        >
                            <IconPhotoPlus className="size-6" />
                            <span className="text-[10px] font-black uppercase">Añadir</span>
                        </button>
                    )}
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                />
            </div>

            {/* RGPD */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors group relative overflow-hidden">
                <div className="shrink-0 pt-0.5">
                    <input
                        type="checkbox"
                        id="rgpd"
                        checked={acceptedRGPD}
                        onChange={(e) => setAcceptedRGPD(e.target.checked)}
                        className="size-4 rounded border-white/20 bg-zinc-950 text-blue-500 focus:ring-blue-500/50 cursor-pointer"
                        required
                    />
                </div>
                <Label htmlFor="rgpd" className="text-xs text-white/50 leading-relaxed cursor-pointer group-hover:text-white/70 transition-colors flex-1 select-none block">
                    He leído y acepto la <Link href="/privacidad" className="text-blue-400 hover:underline font-bold">política de privacidad</Link> y el consentimiento para el tratamiento de mis datos personales para gestionar este feedback.
                </Label>
            </div>

            <div className="pt-4">
                <Button
                    type="submit"
                    size="xl"
                    variant="glow"
                    disabled={loading || !acceptedRGPD}
                    className="w-full rounded-2xl flex items-center gap-3 font-black uppercase tracking-widest disabled:opacity-50 disabled:grayscale"
                >
                    {loading ? (
                        <>
                            <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Enviando...
                        </>
                    ) : (
                        <>
                            <IconSend className="size-5" />
                            Enviar Feedback
                        </>
                    )}
                </Button>
                <p className="text-[10px] text-white/20 mt-4 text-center font-medium uppercase tracking-widest italic">
                    <IconAlertCircle className="size-3 inline mr-1 -mt-0.5" />
                    Tus sugerencias nos ayudan a crecer. ¡Gracias!
                </p>
            </div>
        </form>
    )
}
