"use client"

import { useState } from "react"
import Image from "next/image"
import { IconSettings, IconTrash, IconCheck, IconX, IconPencil } from "@tabler/icons-react"
import { toast } from "sonner"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export type GuildMember = {
    id: string
    character_name: string
    realm_slug: string
    realm_name: string | null
    class_id: number | null
    race_id: number | null
    level: number
    rank: number
    synced_at: string
    note?: string | null
}

const WOW_CLASSES: Record<number, string> = {
    1: "Warrior",
    2: "Paladin",
    3: "Hunter",
    4: "Rogue",
    5: "Priest",
    6: "DK",
    7: "Shaman",
    8: "Mage",
    9: "Warlock",
    10: "Monk",
    11: "Druid",
    12: "DH",
    13: "Evoker",
}

const WOW_CLASS_COLORS: Record<number, string> = {
    1: "text-[#C69B6D]",   // Warrior
    2: "text-[#F48CBA]",   // Paladin
    3: "text-[#AAD372]",   // Hunter
    4: "text-[#FFF468]",   // Rogue
    5: "text-white",       // Priest
    6: "text-[#C41E3A]",   // DK
    7: "text-[#0070DD]",   // Shaman
    8: "text-[#3FC7EB]",   // Mage
    9: "text-[#8788EE]",   // Warlock
    10: "text-[#00FF98]",  // Monk
    11: "text-[#FF7C0A]",  // Druid
    12: "text-[#A330C9]",  // DH
    13: "text-[#33937F]",  // Evoker
}

const RANK_NAMES: Record<number, string> = {
    0: "GM",
    1: "Officer",
    2: "Officer Alt",
    3: "Raider",
    4: "Trial",
    5: "Social",
    6: "Alt",
    7: "Initiate",
    8: "Recruit",
    9: "Member",
}

// Dummy mapping to guess role based on class for visual purposes
const CLASS_ROLE_MAPPING: Record<number, string> = {
    1: "Tank", 2: "Heal", 3: "Ranged", 4: "Melee", 5: "Heal",
    6: "Tank", 7: "Heal", 8: "Ranged", 9: "Ranged", 10: "Melee",
    11: "Heal", 12: "Melee", 13: "Heal",
}

export function RosterTable({ members, roleLevel }: { members: GuildMember[], roleLevel?: string }) {
    const canViewNote = roleLevel === "gm" || roleLevel === "officer"

    return (
        <div className="px-4 lg:px-6">
            <div className="overflow-hidden rounded-lg bg-[#2b2b36] border border-border/20 shadow-sm">
                <Table>
                    <TableHeader className="bg-[#1e1e24] border-b border-border/20">
                        <TableRow className="hover:bg-transparent border-0">
                            <TableHead className="w-[200px] text-muted-foreground font-semibold py-3 pl-4">Name</TableHead>
                            <TableHead className="w-[150px] text-muted-foreground font-semibold">Realm</TableHead>
                            <TableHead className="w-[150px] text-muted-foreground font-semibold">Role</TableHead>
                            <TableHead className="w-[150px] text-muted-foreground font-semibold">Rank</TableHead>
                            {canViewNote && (
                                <TableHead className="text-muted-foreground font-semibold w-full">Note</TableHead>
                            )}
                            <TableHead className="w-[180px] text-muted-foreground font-semibold text-right pr-4">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {members.length > 0 ? (
                            members.map((m) => {
                                const classColor = WOW_CLASS_COLORS[m.class_id ?? 0] ?? "text-white"
                                const classNameStr = WOW_CLASSES[m.class_id ?? 0] ?? "Unknown"
                                const guessedRole = CLASS_ROLE_MAPPING[m.class_id ?? 0] ?? "Ranged"

                                return (
                                    <TableRow key={m.id} className="border-b border-border/10 hover:bg-[#333340] transition-colors group">

                                        {/* Name with icon placeholder */}
                                        <TableCell className="font-medium pl-4 py-2">
                                            <div className="flex items-center gap-3">
                                                {m.class_id ? (
                                                    <Image
                                                        src={`/assets/images/classes/${m.class_id}.jpg`}
                                                        alt={classNameStr}
                                                        width={24}
                                                        height={24}
                                                        className="rounded-full shadow-inner border border-border/30 shrink-0 object-cover"
                                                    />
                                                ) : (
                                                    <div className="size-6 rounded-full bg-[#1e1e24] flex items-center justify-center text-[10px] border border-border/30 shadow-inner overflow-hidden shrink-0">
                                                        <div className={`w-full h-full bg-current opacity-20 text-white`}></div>
                                                    </div>
                                                )}
                                                <span className={`${classColor} font-semibold drop-shadow-sm`}>
                                                    {m.character_name}
                                                </span>
                                            </div>
                                        </TableCell>

                                        {/* Realm */}
                                        <TableCell className="text-muted-foreground text-sm">
                                            {m.realm_name ?? m.realm_slug}
                                        </TableCell>

                                        {/* Role Select */}
                                        <TableCell>
                                            <Select defaultValue={guessedRole.toLowerCase()}>
                                                <SelectTrigger className="h-8 bg-[#1e1e24]/50 border-border/30 hover:bg-[#1e1e24] focus:ring-0 text-xs text-muted-foreground transition-colors w-[110px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="tank">Tank</SelectItem>
                                                    <SelectItem value="heal">Heal</SelectItem>
                                                    <SelectItem value="melee">Melee</SelectItem>
                                                    <SelectItem value="ranged">Ranged</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>

                                        {/* Rank Select */}
                                        <TableCell>
                                            <Select defaultValue={m.rank.toString()}>
                                                <SelectTrigger className="h-8 bg-[#1e1e24]/50 border-border/30 hover:bg-[#1e1e24] focus:ring-0 text-xs text-muted-foreground transition-colors w-[130px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(RANK_NAMES).map(([id, name]) => (
                                                        <SelectItem key={id} value={id}>{name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>

                                        {/* Note Input */}
                                        {canViewNote && (
                                            <TableCell>
                                                <NoteCell memberId={m.id} initialNote={m.note} />
                                            </TableCell>
                                        )}

                                        {/* Status & Actions */}
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-white hover:bg-muted">
                                                            <IconSettings className="size-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-[#1e1e24] border-border/20">
                                                        <DropdownMenuItem
                                                            className="text-red-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                                                            onClick={async () => {
                                                                if (confirm(`¿Estás seguro de que quieres borrar a ${m.character_name}?`)) {
                                                                    try {
                                                                        const res = await fetch(`/api/guild/members/${m.id}`, { method: 'DELETE' })
                                                                        if (res.ok) {
                                                                            window.location.reload()
                                                                        }
                                                                    } catch (e) {
                                                                        console.error(e)
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            <IconTrash className="size-4 mr-2" />
                                                            Borrar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>

                                    </TableRow>
                                )
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No hay personajes en el roster.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

function NoteCell({ memberId, initialNote }: { memberId: string; initialNote?: string | null }) {
    const [isEditing, setIsEditing] = useState(false)
    const [note, setNote] = useState(initialNote ?? "")
    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const res = await fetch(`/api/guild/members/${memberId}/note`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ note })
            })
            if (!res.ok) throw new Error("Failed to save")

            if (!note || note.trim() === "") {
                toast.success("Nota borrada")
            } else {
                toast.success("Nota editada")
            }

            setIsEditing(false)
        } catch (e) {
            toast.error("Error al guardar la nota")
        } finally {
            setIsSaving(false)
        }
    }

    if (isEditing) {
        return (
            <div className="flex items-center gap-1 w-full min-w-[200px]">
                <Input
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className="h-8 bg-[#1e1e24]/50 border-border/30 text-xs w-full focus-visible:ring-1 focus-visible:ring-emerald-500"
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave()
                        if (e.key === 'Escape') {
                            setIsEditing(false)
                            setNote(initialNote ?? "")
                        }
                    }}
                />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-500 hover:bg-emerald-500/10 shrink-0" onClick={handleSave} disabled={isSaving}>
                    <IconCheck className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-500/10 shrink-0" onClick={() => { setIsEditing(false); setNote(initialNote ?? "") }} disabled={isSaving}>
                    <IconX className="size-4" />
                </Button>
            </div>
        )
    }

    return (
        <div className="group/note flex items-center justify-between w-full min-w-[200px] gap-2">
            <div className="text-xs text-muted-foreground truncate" title={note}>
                {note || <span className="opacity-50 italic">Add a note...</span>}
            </div>
            <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover/note:opacity-100 transition-opacity shrink-0"
                onClick={() => setIsEditing(true)}
            >
                <IconPencil className="size-3 text-muted-foreground" />
            </Button>
        </div>
    )
}
