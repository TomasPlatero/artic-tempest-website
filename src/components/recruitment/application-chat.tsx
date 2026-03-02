"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { supabase } from "@/infrastructure/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { IconSend, IconLoader2, IconUser, IconMessageCircle, IconShield } from "@tabler/icons-react"
import Image from "next/image"
import { toast } from "sonner"

type Props = {
    applicationId: string
    otherPartyName?: string
}

export function ApplicationChat({ applicationId, otherPartyName }: Props) {
    const { data: session } = useSession()
    const [messages, setMessages] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [newMessage, setNewMessage] = useState("")
    const [sending, setSending] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!applicationId) return

        let interval: NodeJS.Timeout

        async function fetchMessages() {
            try {
                const res = await fetch(`/api/recruitment/chat?applicationId=${applicationId}`)
                if (res.ok) {
                    const data = await res.json()
                    setMessages((prev) => {
                        // Optimización simple para no renderizar si no hay cambios en longitud
                        if (prev.length !== data.length) return data
                        return prev
                    })
                } else {
                    console.error("Error fetching messages")
                }
            } catch (error) {
                console.error("Network error fetching messages:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchMessages()

        // Polling cada 5 segundos ya que RLS bloquea subscripciones Realtime para clientes con JWT de NextAuth
        interval = setInterval(fetchMessages, 5000)

        return () => {
            clearInterval(interval)
        }
    }, [applicationId])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || !session?.user?.id || sending) return

        setSending(true)
        const content = newMessage.trim()
        setNewMessage("")

        try {
            const res = await fetch("/api/recruitment/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    applicationId: applicationId,
                    content: content
                })
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Error al enviar mensaje")
            }
        } catch (err: any) {
            console.error("Error sending message:", err)
            toast.error("Error al enviar mensaje", { description: err.message })
            setNewMessage(content)
        } finally {
            setSending(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center flex-1 min-h-[400px] gap-4">
                <IconLoader2 className="size-8 animate-spin text-blue-500" />
                <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Cargando chat...</p>
            </div>
        )
    }

    return (
        <Card className="bg-zinc-950/60 border-white/10 backdrop-blur-xl flex flex-col h-full overflow-hidden shadow-2xl">
            <CardHeader className="py-4 border-b border-white/5 bg-white/[0.02]">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-blue-400 flex items-center gap-3">
                    <IconMessageCircle className="size-4" />
                    Chat de Solicitud {otherPartyName && `con ${otherPartyName}`}
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10"
                >
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-10">
                            <div className="size-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                                <IconMessageCircle className="size-8 text-blue-500/50" />
                            </div>
                            <h3 className="text-white font-bold mb-1 uppercase tracking-tight">Sin mensajes aún</h3>
                            <p className="text-zinc-500 text-xs italic">Inicia la conversación para coordinar la entrevista o aclarar dudas.</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.author_id === session?.user?.id
                            const isStaff = ['gm', 'officer'].includes(msg.author?.role_level)

                            return (
                                <div
                                    key={msg.id}
                                    className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                                >
                                    <div className="shrink-0 pt-1">
                                        {msg.author?.discord_avatar ? (
                                            <div className="relative size-9 rounded-xl overflow-hidden border border-white/10 bg-white/5">
                                                <Image
                                                    src={msg.author.discord_avatar}
                                                    alt="Avatar"
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="size-9 rounded-xl bg-zinc-800 flex items-center justify-center">
                                                <IconUser className="size-5 text-zinc-500" />
                                            </div>
                                        )}
                                    </div>

                                    <div className={`max-w-[80%] space-y-1 ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                        <div className={`flex items-center gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">
                                                {msg.author?.discord_username}
                                            </span>
                                            {isStaff && (
                                                <Badge variant="outline" className="text-[8px] h-3.5 px-1 py-0 font-black border-blue-500/30 text-blue-400 bg-blue-500/5 uppercase">
                                                    OFICIAL
                                                </Badge>
                                            )}
                                        </div>
                                        <div className={`p-3.5 rounded-2xl text-[13px] leading-relaxed relative ${isMe
                                            ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-500/10'
                                            : 'bg-zinc-900 border border-white/5 text-zinc-200 rounded-tl-none'
                                            }`}>
                                            {msg.content}
                                        </div>
                                        <p className={`text-[9px] text-zinc-600 font-bold ${isMe ? 'text-right' : 'text-left'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                {/* Input Area */}
                <form
                    onSubmit={handleSendMessage}
                    className="p-4 border-t border-white/5 bg-white/[0.01]"
                >
                    <div className="flex gap-2">
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Escribe un mensaje..."
                            className="bg-black/40 border-white/10 h-11 rounded-xl text-sm focus:border-blue-500/50"
                            autoComplete="off"
                        />
                        <Button
                            type="submit"
                            disabled={sending || !newMessage.trim()}
                            className="h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 shrink-0"
                        >
                            {sending ? <IconLoader2 className="size-5 animate-spin" /> : <IconSend className="size-4" />}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
