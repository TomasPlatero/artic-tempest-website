"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MapPinOff } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background relative overflow-hidden">
            {/* Elementos decorativos de fondo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-50 pointer-events-none" />
            <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-blue-500/20 rounded-full blur-[100px] opacity-30 pointer-events-none" />

            <div className="z-10 flex flex-col items-center text-center px-4 animate-in zoom-in-95 duration-700 fade-in relative">
                <div className="mb-8 relative">
                    <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                    <div className="relative bg-zinc-950/50 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl">
                        <MapPinOff className="w-20 h-20 text-primary animate-pulse" />
                    </div>
                </div>

                <h1 className="text-8xl md:text-9xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40 mb-4 drop-shadow-sm">
                    404
                </h1>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Página no encontrada</h2>
                <p className="text-muted-foreground max-w-[500px] mb-10 text-lg">
                    Parece que te has perdido en el vacío. La página que estás buscando ya no existe o ha sido movida a otro reino.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/">
                        <Button size="lg" className="rounded-xl font-bold bg-white text-black hover:bg-neutral-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                            Volver al inicio
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
