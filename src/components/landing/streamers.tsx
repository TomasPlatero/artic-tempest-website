"use client"

import { useState, useEffect } from "react"
import { IconBrandTwitch } from "@tabler/icons-react"

export function LandingStreamers({ limit }: { limit?: number }) {
    const [streamers, setStreamers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch("/api/streamers")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setStreamers(limit ? data.slice(0, limit) : data)
                }
            })
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [limit])

    if (loading) return null
    if (streamers.length === 0) return null

    return (
        <section id="streamers" className="py-24 px-6 max-w-7xl mx-auto text-center">
            <h2 className="text-4xl font-black text-white mb-4 uppercase tracking-tight flex items-center justify-center gap-3">
                <IconBrandTwitch className="size-10 text-purple-500" />
                Nuestros Streamers
            </h2>
            <p className="text-white/60 mb-12 max-w-2xl mx-auto">
                Sigue en directo nuestro progreso, raids y contenido diario a través de los canales oficiales de nuestros miembros.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {streamers.map((s) => (
                    <div key={s.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-purple-500/50 transition-all group overflow-hidden">
                        <div className="aspect-video w-full rounded-xl overflow-hidden bg-black/50 mb-4 relative">
                            {/* Generic Twitch Embed iframe for each streamer */}
                            <iframe
                                src={`https://player.twitch.tv/?channel=${s.twitch_username}&parent=localhost&parent=127.0.0.1&parent=artictempest.es&parent=www.artictempest.es&muted=true`}
                                className="w-full h-full border-none"
                                allowFullScreen
                            />
                        </div>
                        <a
                            href={`https://twitch.tv/${s.twitch_username}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-purple-600/20 text-purple-400 font-bold hover:bg-purple-600 hover:text-white transition-colors relative overflow-hidden"
                        >
                            {s.is_live && (
                                <span className="absolute left-4 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                            )}
                            <IconBrandTwitch className="size-5" />
                            Ver a {s.twitch_username}
                        </a>
                    </div>
                ))}
            </div>

            {limit && streamers.length >= limit && (
                <div className="mt-12">
                    <a href="/streamers" className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/10 hover:border-white/20">
                        Ver todos los streamers
                    </a>
                </div>
            )}
        </section>
    )
}
