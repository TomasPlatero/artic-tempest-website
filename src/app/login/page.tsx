import { Metadata } from "next"
import { LoginPageClient } from "@/domains/auth/components/login-page-client"

export const metadata: Metadata = {
    title: "Iniciar Sesión | Artic Tempest",
    description: "Accede al dashboard de la hermandad mediante Discord para gestionar tus personajes y ver el progreso.",
}

export default function LoginPage() {
    return <LoginPageClient />
}
