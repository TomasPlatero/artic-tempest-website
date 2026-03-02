import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/infrastructure/auth/auth-options"
import { StreamersSettings } from "@/components/settings/settings-streamers"

export const metadata = {
    title: "Ajustes de Streamers",
}

export default async function StreamersPage() {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect("/login")
    }

    if (session.user.roleLevel !== "gm" && session.user.roleLevel !== "officer") {
        redirect("/dashboard/settings")
    }

    return <StreamersSettings />
}
