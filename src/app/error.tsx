"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { ServerCrash, RefreshCcw } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service if needed
        console.error("Application runtime error:", error);
    }, [error]);

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background relative overflow-hidden">
            {/* Elementos decorativos de fondo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-[120px] opacity-50 pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-orange-500/10 rounded-full blur-[100px] opacity-30 pointer-events-none" />

            <div className="z-10 flex flex-col items-center text-center px-4 animate-in slide-in-from-bottom-8 duration-700 fade-in">
                <div className="mb-8 relative">
                    <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full" />
                    <div className="relative bg-zinc-950/50 backdrop-blur-xl border border-red-500/20 p-6 rounded-3xl shadow-2xl">
                        <ServerCrash className="w-20 h-20 text-red-500" />
                    </div>
                </div>

                <h1 className="text-7xl md:text-8xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-red-400 to-red-900 mb-4 drop-shadow-sm">
                    500
                </h1>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Error Crítico</h2>
                <p className="text-muted-foreground max-w-[500px] mb-10 text-lg">
                    Parece que hemos encontrado un murloc en los engranajes del servidor. Nuestro equipo gnómico ya está trabajando en ello.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                        size="lg"
                        onClick={() => reset()}
                        className="rounded-xl font-bold bg-white text-black hover:bg-neutral-200 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    >
                        <RefreshCcw className="w-5 h-5" />
                        Vuelve a intentarlo
                    </Button>
                    <Link href="/">
                        <Button size="lg" variant="outline" className="rounded-xl font-bold bg-white/5 border-white/10 hover:bg-white/10 backdrop-blur-md transition-all">
                            Volver al inicio
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
