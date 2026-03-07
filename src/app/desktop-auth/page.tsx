'use client';
import { useEffect, useState, useCallback } from 'react';

export default function DesktopAuthBridge() {
    const [status, setStatus] = useState('Verificando autenticación...');
    const [desktopUrl, setDesktopUrl] = useState<string | null>(null);
    const [countdown, setCountdown] = useState<number | null>(null);

    const handleRedirect = useCallback((url: string) => {
        setStatus('Intentando abrir Artic Tempest...');
        window.location.href = url;

        // Fallback: try click method
        setTimeout(() => {
            const link = document.createElement('a');
            link.href = url;
            link.click();
        }, 500);
    }, []);

    useEffect(() => {
        if (countdown === 0) {
            window.close();
            // Fallback for browsers that block window.close
            setStatus('Ya puedes cerrar esta pestaña.');
        }
        if (countdown === null || countdown === 0) return;

        const timer = setTimeout(() => {
            setCountdown(countdown - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [countdown]);

    useEffect(() => {
        const hash = window.location.hash;

        if (hash && hash.includes('access_token')) {
            const url = `artictempest://login-callback${hash}`;
            setDesktopUrl(url);
            setStatus('¡Token recibido! Redirigiendo a la aplicación...');
            setCountdown(5);

            // Automatic attempt
            handleRedirect(url);
        } else {
            setStatus('No se ha encontrado el token. Vuelve a la app e inténtalo de nuevo.');
        }
    }, [handleRedirect]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0b] text-white p-6 font-sans">
            <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-3xl p-10 text-center backdrop-blur-xl shadow-2xl relative overflow-hidden">
                {/* Decorative background glow */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl"></div>

                <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-primary/20">
                    <svg className="w-10 h-10 text-primary animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3m0 18a10.003 10.003 0 01-8.628-5.18l-.054-.09m10.852-5.462A10.124 10.124 0 0112 11m0 0c.492 0 .973.04 1.44.115m6.23 1.442A10.124 10.124 0 0118 11.5c0-1.104-.31-2.136-.848-3.012M12 11c.338 0 .67.017 1 .05m4.412 8.535l-.054.09A10.003 10.003 0 0112 21" />
                    </svg>
                </div>

                <h1 className="text-3xl font-black italic mb-2 tracking-tight">ARTIC TEMPEST</h1>
                <p className="text-white/60 text-sm font-medium mb-8 uppercase tracking-widest">Bridging Connection</p>

                <div className="space-y-6 text-center">
                    <p className="text-lg font-semibold text-white/90">
                        {status}
                    </p>

                    {desktopUrl && (
                        <div className="space-y-4 pt-4">
                            <button
                                onClick={() => handleRedirect(desktopUrl)}
                                className="w-full py-4 px-6 bg-primary text-black font-extrabold rounded-xl hover:bg-primary/90 transition-all transform active:scale-95 shadow-lg shadow-primary/20 flex items-center justify-center gap-3"
                            >
                                <span>ABRIR APLICACIÓN</span>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </button>

                            <div className="pt-8">
                                {countdown !== null ? (
                                    <div className="space-y-4">
                                        <p className="text-white/40 text-[10px] uppercase font-black tracking-widest animate-pulse">
                                            La ventana se cerrará en {countdown} segundos...
                                        </p>
                                        <button
                                            onClick={() => window.close()}
                                            className="text-[9px] text-white/20 hover:text-white/50 uppercase font-bold tracking-[0.2em] transition-colors"
                                        >
                                            Cerrar ahora
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-white/40 text-[10px] leading-relaxed px-4">
                                        Si la aplicación no se abre, asegúrate de tenerla instalada.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {!desktopUrl && (
                        <div className="flex justify-center gap-2 pt-4">
                            <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-2 h-2 bg-primary rounded-full animate-bounce"></span>
                        </div>
                    )}
                </div>
            </div>

            <p className="mt-8 text-white/10 text-[10px] tracking-[0.4em] font-black uppercase">Artic Tempest Hub</p>
        </div>
    );
}
