import React from "react"
import { Button } from "@/components/ui/button"
import { IconShieldOff, IconArrowLeft } from "@tabler/icons-react"
import Link from "next/link"

export function Forbidden() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
            <div className="size-24 rounded-3xl bg-rose-500/10 flex items-center justify-center mb-6 ring-1 ring-rose-500/20">
                <IconShieldOff className="size-12 text-rose-500" />
            </div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white mb-2">
                Acceso restringido
            </h1>
            <p className="text-white/40 max-w-md font-medium text-lg leading-relaxed mb-10">
                Tu rol no tiene los permisos necesarios para ver o editar esta sección de administración.
            </p>
            <Link href="/dashboard">
                <Button className="h-14 px-8 rounded-2xl bg-white text-zinc-950 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-zinc-200 transition-all shadow-[0_10px_40px_rgba(255,255,255,0.1)] active:scale-95 gap-3">
                    <IconArrowLeft className="size-4" /> Volver al Inicio
                </Button>
            </Link>
        </div>
    )
}
