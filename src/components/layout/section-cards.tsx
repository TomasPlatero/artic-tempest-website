import { IconUsers, IconSword, IconShield, IconMap } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type GuildStats = {
  totalMembers: number
  guildName: string
  realm: string
  region: string
  roleBreakdown: { gm: number; officer: number; raider: number }
}

export function SectionCards({ stats }: { stats: GuildStats }) {
  const { totalMembers, guildName, realm, region, roleBreakdown } = stats

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Miembros</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalMembers}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconUsers className="size-3" />
              Roster
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total de jugadores registrados
          </div>
          <div className="text-muted-foreground">
            Vinculados a través de Discord
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Oficiales</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {roleBreakdown.officer + roleBreakdown.gm}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconShield className="size-3" />
              Staff
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {roleBreakdown.gm} GM · {roleBreakdown.officer} Officers
          </div>
          <div className="text-muted-foreground">
            Gestión de la hermandad
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Raiders</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {roleBreakdown.raider}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconSword className="size-3" />
              Raid
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Miembros de raid activos
          </div>
          <div className="text-muted-foreground">
            Sincronizado con roles de Discord
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Hermandad</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {guildName}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconMap className="size-3" />
              {region.toUpperCase()}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {realm}
          </div>
          <div className="text-muted-foreground">
            Región {region.toUpperCase()}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
