import { IconRefresh, IconTrash } from "@/shared/ui/tabler-icons"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"

interface SettingsBnetDangerZoneProps {
  memberCount: number
  wiping: boolean
  onWipeRoster: () => void
}

export function SettingsBnetDangerZone({ memberCount, wiping, onWipeRoster }: SettingsBnetDangerZoneProps) {
  return (
    <Card className="border-red-500/20 bg-red-500/5 not-italic">
      <CardHeader>
        <CardTitle className="text-red-500">Zona de Peligro</CardTitle>
        <CardDescription className="text-red-500/70">Acciones destructivas e irreversibles</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-red-500/20 bg-card">
          <div>
            <p className="font-medium text-sm">Vaciar Configuración de Roster</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl">
              Elimina todos los personajes importados. Se tendrá que sincronizar todo desde cero para repoblar la base de datos.
              Afectará a los eventos de raid en curso que referencian a estos personajes.
            </p>
          </div>
          <Button variant="destructive" onClick={onWipeRoster} disabled={wiping || memberCount === 0} className="w-full sm:w-auto shrink-0">
            {wiping ? <IconRefresh className="size-4 mr-2 animate-spin" /> : <IconTrash className="size-4 mr-2" />}
            Borrar todo el Roster
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
