"use client"

import { useState } from "react"
import { sileo } from "sileo"
import { IconRefresh } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

export function SyncRosterButton({ roleLevel }: { roleLevel: string }) {
    const [syncing, setSyncing] = useState(false)

    // Only show for GM/Officer
    if (roleLevel !== "gm" && roleLevel !== "officer") return null

    const handleSync = async () => {
        setSyncing(true)
        try {
            const res = await fetch("/api/guild/sync", {
                method: "POST",
                credentials: "include",
            })
            const data = await res.json()

            if (!res.ok) {
                sileo.error({
                    title: "Error al sincronizar",
                    description: data.error ?? "Error desconocido",
                })
                return
            }

            sileo.success({
                title: "Roster sincronizado",
                description: `${data.imported} personajes importados de ${data.guild}`,
            })

            // Reload to show updated data
            window.location.reload()
        } catch {
            sileo.error({
                title: "Error de conexión",
                description: "No se pudo contactar con el servidor",
            })
        } finally {
            setSyncing(false)
        }
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
        >
            <IconRefresh className={syncing ? "animate-spin" : ""} />
            {syncing ? "Sincronizando..." : "Sincronizar Roster"}
        </Button>
    )
}
