"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { IconSearch } from "@tabler/icons-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { RosterTable } from "@/components/common/roster-table"

export function RosterClient({ members, roleLevel }: { members: any[], roleLevel?: string }) {
    const [search, setSearch] = useState("")
    const [classFilter, setClassFilter] = useState("all")
    const [rankFilter, setRankFilter] = useState("all")

    // Exact same WOW_CLASSES mapping from roster-table to populate the select
    const WOW_CLASSES: Record<number, string> = {
        1: "Guerrero", 2: "Paladín", 3: "Cazador", 4: "Pícaro", 5: "Sacerdote",
        6: "DK", 7: "Chamán", 8: "Mago", 9: "Brujo", 10: "Monje",
        11: "Druida", 12: "DH", 13: "Evocador",
    }

    const RANK_NAMES: Record<number, string> = {
        0: "GM", 1: "Officer", 2: "Officer Alt", 3: "Raider", 4: "Trial",
        5: "Social", 6: "Alt", 7: "Initiate", 8: "Recruit", 9: "Member",
    }

    const filteredMembers = useMemo(() => {
        return members.filter((m) => {
            // Name filter
            if (search && !m.character_name.toLowerCase().includes(search.toLowerCase())) return false

            // Class filter
            if (classFilter !== "all" && m.class_id?.toString() !== classFilter) return false

            // Rank filter
            if (rankFilter !== "all" && m.rank?.toString() !== rankFilter) return false

            return true
        })
    }, [members, search, classFilter, rankFilter])

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center px-4 lg:px-6">
                <div className="relative flex-1">
                    <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex gap-2">
                    <Select value={classFilter} onValueChange={setClassFilter}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Clase" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las clases</SelectItem>
                            {Object.entries(WOW_CLASSES).map(([id, name]) => (
                                <SelectItem key={id} value={id}>{name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={rankFilter} onValueChange={setRankFilter}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Rango" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los rangos</SelectItem>
                            {Object.entries(RANK_NAMES).map(([id, name]) => (
                                <SelectItem key={id} value={id}>{name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="px-4 lg:px-6 text-sm text-muted-foreground">
                Mostrando {filteredMembers.length} de {members.length} personajes.
            </div>

            <RosterTable members={filteredMembers} roleLevel={roleLevel} />
        </div>
    )
}
