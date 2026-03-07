import { getServerSession } from "next-auth"
import { authOptions } from "@/infrastructure/auth/auth-options"
import { ensureAdmin } from "@/infrastructure/auth/permissions"
import { SettingsMenuClient } from "@/components/settings/settings-menu"
import { Forbidden } from "@/components/common/forbidden"

export default async function SettingsMenuPage() {
    const session = await getServerSession(authOptions)

    try {
        await ensureAdmin()
    } catch (e) {
        return <Forbidden />
    }

    return (
        <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6 lg:px-8">
            <SettingsMenuClient />
        </div>
    )
}
