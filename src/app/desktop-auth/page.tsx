'use client';
import { useEffect, useState } from 'react';

export default function DesktopAuthBridge() {
    const [status, setStatus] = useState('Redirigiendo...');

    useEffect(() => {
        // Get the fragment (hash) from the URL which contains the access_token
        const hash = window.location.hash;

        if (hash && hash.includes('access_token')) {
            // Re-construct the deep link for the desktop app
            const desktopUrl = `artictempest://login-callback${hash}`;

            console.log('Redirecting to desktop app:', desktopUrl);

            // Attempt redirect
            window.location.href = desktopUrl;

            setStatus('¡Listo! Puedes cerrar esta ventana y volver a la aplicación.');

            // Auto-close after a delay
            setTimeout(() => {
                window.close();
            }, 3000);
        } else {
            setStatus('No se ha encontrado el token de autenticación. Por favor, intenta loguearte de nuevo desde la app.');
        }
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0b] text-white p-6">
            <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-3xl p-8 text-center backdrop-blur-xl shadow-2xl">
                <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-primary animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3m0 18a10.003 10.003 0 01-8.628-5.18l-.054-.09m10.852-5.462A10.124 10.124 0 0112 11m0 0c.492 0 .973.04 1.44.115m6.23 1.442A10.124 10.124 0 0118 11.5c0-1.104-.31-2.136-.848-3.012M12 11c.338 0 .67.017 1 .05m4.412 8.535l-.054.09A10.003 10.003 0 0112 21" />
                    </svg>
                </div>

                <h1 className="text-2xl font-black italic mb-4 tracking-tight">ARTIC TEMPEST</h1>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                    {status}
                </p>

                <div className="flex justify-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
                </div>
            </div>
        </div>
    );
}
