import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"

type ProfileOption = {
    id: string
    label: string
}

interface WeeklyVaultFiltersProps {
    selectedWeek: string
    selectedProfile: string
    uniqueWeeks: string[]
    currentWeek: string
    availableProfiles: ProfileOption[]
    onWeekChange: (week: string) => void
    onProfileChange: (profile: string) => void
}

export function WeeklyVaultFilters({
    selectedWeek,
    selectedProfile,
    uniqueWeeks,
    currentWeek,
    availableProfiles,
    onWeekChange,
    onProfileChange,
}: WeeklyVaultFiltersProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 bg-card text-card-foreground p-4 rounded-xl border border-white/10 shadow-sm">
            <div className="flex flex-col gap-2">
                <h3 className="font-semibold text-base">Filtro por semana</h3>
                <p className="text-sm text-muted-foreground">Revisa la semana actual y las anteriores con capturas subidas.</p>
                <Select value={selectedWeek} onValueChange={onWeekChange}>
                    <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Semana actual" />
                    </SelectTrigger>
                    <SelectContent>
                        {uniqueWeeks.map((week) => (
                            <SelectItem key={week} value={week}>
                                {week === currentWeek
                                    ? "Semana actual"
                                    : `Semana del ${format(parseISO(week), "d 'de' MMMM, yyyy", { locale: es })}`}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-col gap-2">
                <h3 className="font-semibold text-base">Filtro por persona</h3>
                <p className="text-sm text-muted-foreground">Mira las capturas de cada cuenta vinculada.</p>
                <Select value={selectedProfile} onValueChange={onProfileChange}>
                    <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Todas las personas" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas las personas</SelectItem>
                        {availableProfiles.map((profile) => (
                            <SelectItem key={profile.id} value={profile.id}>
                                {profile.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}
