import Link from "next/link"
import { Button } from "@/components/ui/button"
import { IconArrowLeft } from "@tabler/icons-react"
import { CooldownSettingsPanel } from "@/components/planificador-cds/cooldown-settings-panel"

export default function PlanificadorCdsSettingsPage() {
    return (
        <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6 lg:px-8">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/settings/apps">
                    <Button variant="outline" size="icon" className="size-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 transition-all shadow-xl">
                        <IconArrowLeft className="size-6" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Planificador de CD&apos;s</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Gestiona las habilidades y cooldowns disponibles en el planificador de raid
                    </p>
                </div>
            </div>
            <CooldownSettingsPanel />
        </div>
    )
}
