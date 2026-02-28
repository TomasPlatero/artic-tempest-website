import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Notificaciones - Artic Tempest",
    description: "Mensajes del sistema y actualizaciones oficiales de la hermandad Artic Tempest.",
    robots: {
        index: false,
        follow: false
    }
}

export default function NotificationsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
