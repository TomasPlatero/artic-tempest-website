"use client"

import { useState } from "react"
import { IconChevronLeft, IconChevronRight, IconCalendarEvent, IconTrash, IconClock, IconPlus } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { GuildEvent } from "./calendar-client"
import { cn } from "@/infrastructure/tailwind/tailwind-utils"

export type EventSignup = {
    member_id: string
    character_name: string
    class_id: number
    role_preference: string
    status: string // present, absent, tentative, late
    selection_status: string // queued, selected
    comment: string | null
}

export function EventDetailClient({
    event,
    signups,
    roleLevel,
}: {
    event: GuildEvent
    signups: EventSignup[]
    roleLevel: string
}) {
    const router = useRouter()
    const isOfficerOrGm = roleLevel === "gm" || roleLevel === "officer"

    const [presence, setPresence] = useState("present")
    const [comment, setComment] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    const handleSavePresence = async () => {
        setIsSaving(true)
        try {
            const res = await fetch("/api/guild/events/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event_id: event.id,
                    status: presence,
                    comment: comment,
                    role_preference: "dps"
                })
            })

            if (!res.ok) throw new Error("Failed to save")
            router.refresh()
        } catch (error) {
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }

    const start = new Date(event.event_date)
    const end = new Date(event.end_date)
    const timeStringStart = start.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
    const timeStringEnd = end.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })

    const dateString = start.toLocaleDateString("en-US", { month: "long", day: "numeric" })

    return (
        <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full">
            {/* Top Header */}
            <div className="flex items-center gap-2 text-muted-foreground text-sm cursor-pointer hover:text-foreground w-fit" onClick={() => router.push('/dashboard/calendario')}>
                <IconChevronLeft className="size-4" />
                Raids - Team raiders
            </div>

            <div className="flex items-center gap-2 text-2xl font-bold">
                <IconCalendarEvent className="size-6" />
                {dateString} - {event.destination || event.title}
            </div>

            <div className="flex justify-between items-center text-sm font-medium text-emerald-500 hover:text-emerald-400 cursor-pointer w-fit">
                <IconChevronLeft className="size-4 inline mr-1" />
                Previous
                <span className="mx-8 text-muted-foreground hover:text-foreground">Back to Calendar</span>
                Next
                <IconChevronRight className="size-4 inline ml-1" />
            </div>

            {/* Main Grid: Left/Center (Planning) + Right (Checklist) */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 items-start">

                <div className="flex flex-col gap-6">
                    {/* Top Controls Box */}
                    <div className="bg-[#1e1e24] border border-border/20 rounded-lg p-4 shadow-sm flex flex-col gap-4">

                        {/* Event Settings Row */}
                        <div className="flex flex-wrap gap-4 items-end text-sm">
                            <div className="flex gap-2">
                                <div className="space-y-1">
                                    <label className="text-muted-foreground text-xs">Start</label>
                                    <div className="flex items-center bg-muted/20 border border-border/30 rounded px-3 py-1.5 gap-2">
                                        {timeStringStart} <IconClock className="size-4 text-muted-foreground" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-muted-foreground text-xs">End</label>
                                    <div className="flex items-center bg-muted/20 border border-border/30 rounded px-3 py-1.5 gap-2">
                                        {timeStringEnd} <IconClock className="size-4 text-muted-foreground" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1 flex-1 min-w-[200px]">
                                <label className="text-muted-foreground text-xs">Destination</label>
                                <Input value={event.destination || event.title} className="h-9 bg-muted/20 border-border/30" readOnly />
                            </div>

                            <div className="space-y-1 w-[140px]">
                                <label className="text-muted-foreground text-xs">Difficulty</label>
                                <Select value={event.difficulty?.toLowerCase() || "mythic"}>
                                    <SelectTrigger className="h-9 bg-muted/20 border-border/30">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="mythic">Mythic</SelectItem>
                                        <SelectItem value="heroic">Heroic</SelectItem>
                                        <SelectItem value="normal">Normal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1 w-[140px]">
                                <label className="text-muted-foreground text-xs">Status</label>
                                <Select value={event.status || "planned"}>
                                    <SelectTrigger className="h-9 bg-muted/20 border-border/30">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="planned">Planned</SelectItem>
                                        <SelectItem value="finished">Finished</SelectItem>
                                        <SelectItem value="canceled">Canceled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1 flex items-center gap-2 mb-1.5">
                                <input type="checkbox" className="size-4 rounded border-gray-300" />
                                <label className="text-muted-foreground text-xs">Optional</label>
                            </div>

                            <Button variant="ghost" size="icon" className="mb-0.5 text-muted-foreground hover:text-destructive">
                                <IconTrash className="size-4" />
                            </Button>
                        </div>

                        {/* Separator */}
                        <div className="h-px bg-border/30 w-full" />

                        {/* Personal Presence Row */}
                        <div className="flex flex-wrap gap-4 items-end text-sm">
                            <div className="space-y-1 w-[160px]">
                                <label className="text-muted-foreground text-xs">Presence</label>
                                <Select value={presence} onValueChange={setPresence}>
                                    <SelectTrigger className="h-9 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="present">Present</SelectItem>
                                        <SelectItem value="absent">Absent</SelectItem>
                                        <SelectItem value="tentative">Tentative</SelectItem>
                                        <SelectItem value="late">Late</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1 w-[300px]">
                                <label className="text-muted-foreground text-xs">Comment</label>
                                <Input
                                    placeholder="Comment"
                                    className="h-9 bg-muted/20 border-border/30"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                />
                            </div>

                            <Button
                                variant="secondary"
                                className="h-9 bg-muted/50 hover:bg-muted mb-0.5"
                                onClick={handleSavePresence}
                                disabled={isSaving}
                            >
                                {isSaving ? "Saving..." : "Save"}
                            </Button>
                        </div>
                    </div>

                    {/* Planning Header */}
                    <div className="flex items-center justify-between border-b-2 border-emerald-500 pb-2">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            All encounters
                            <span className="text-sm text-muted-foreground font-normal ml-2">
                                {signups.filter(s => s.selection_status === "selected").length} / 20
                            </span>
                        </h2>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="h-8 bg-[#1e1e24] border-border/30">Import</Button>
                            <Button variant="outline" size="sm" className="h-8 bg-[#1e1e24] border-border/30">View planning info</Button>
                        </div>
                    </div>

                    {/* Role Columns Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <RoleColumn title="Tank" icon="🛡️" signups={signups.filter(s => s.role_preference === "tank")} />
                        <RoleColumn title="Heal" icon="➕" signups={signups.filter(s => s.role_preference === "heal")} />
                        <RoleColumn title="Melee" icon="⚔️" signups={signups.filter(s => s.role_preference === "melee")} />
                        <RoleColumn title="Ranged" icon="🏹" signups={signups.filter(s => s.role_preference === "ranged")} />
                    </div>

                    {/* Note section */}
                    <div className="bg-[#1e1e24] border border-border/20 rounded-lg p-4 shadow-sm flex justify-between items-center mt-4">
                        <span className="font-semibold text-sm">Strategy / Notes</span>
                        <IconChevronRight className="size-4 text-muted-foreground" />
                    </div>
                </div>

                {/* Right Sidebar: Checklist */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-lg font-bold">Checklist</h2>

                    <div className="bg-[#1e1e24] border border-border/20 rounded-lg p-4 shadow-sm flex flex-col gap-2 text-sm">
                        <h3 className="font-semibold border-b border-border/30 pb-2 mb-2">Classes</h3>
                        <ChecklistItem count={0} label="Priest" color="text-white" />
                        <ChecklistItem count={0} label="Mage" color="text-[#3FC7EB]" />
                        <ChecklistItem count={0} label="Warlock" color="text-[#8788EE]" />
                        <ChecklistItem count={0} label="Druid" color="text-[#FF7C0A]" />
                        <ChecklistItem count={0} label="Rogue" color="text-[#FFF468]" />
                        <ChecklistItem count={0} label="Monk" color="text-[#00FF98]" />
                        <ChecklistItem count={0} label="Demon Hunter" color="text-[#A330C9]" />
                        <ChecklistItem count={0} label="Hunter" color="text-[#AAD372]" />
                        <ChecklistItem count={0} label="Shaman" color="text-[#0070DD]" />
                        <ChecklistItem count={0} label="Evoker" color="text-[#33937F]" />
                        <ChecklistItem count={0} label="Death Knight" color="text-[#C41E3A]" />
                        <ChecklistItem count={0} label="Paladin" color="text-[#F48CBA]" />
                        <ChecklistItem count={0} label="Warrior" color="text-[#C69B6D]" />
                    </div>

                    <div className="bg-[#1e1e24] border border-border/20 rounded-lg p-4 shadow-sm flex flex-col gap-2 text-sm">
                        <h3 className="font-semibold border-b border-border/30 pb-2 mb-2">Buffs / Debuffs</h3>
                        <ChecklistItem count={0} label="5% Intellect" />
                        <ChecklistItem count={0} label="5% Attack Power" />
                        <ChecklistItem count={0} label="5% Stamina" />
                        <ChecklistItem count={0} label="5% Physical Damage" />
                        <ChecklistItem count={0} label="5% Magic Damage" />
                        <ChecklistItem count={0} label="Devotion Aura" />
                        <ChecklistItem count={0} label="3% Versatility" />
                        <ChecklistItem count={0} label="3.6% Damage Reduction" />
                        <ChecklistItem count={0} label="Hunter's Mark" />
                    </div>

                    <div className="bg-[#1e1e24] border border-border/20 rounded-lg p-4 shadow-sm flex flex-col gap-2 text-sm">
                        <h3 className="font-semibold border-b border-border/30 pb-2 mb-2">Utility</h3>
                        <ChecklistItem count={0} label="Bloodlust" />
                        <ChecklistItem count={0} label="Combat Resurrection" />
                        <ChecklistItem count={0} label="Movement Speed" />
                        <ChecklistItem count={0} label="Gateway" />
                        <ChecklistItem count={0} label="Anti Magic Zone" />
                        <ChecklistItem count={0} label="Darkness" />
                    </div>
                </div>

            </div>
        </div>
    )
}

function RoleColumn({ title, icon, signups }: { title: string, icon: string, signups: EventSignup[] }) {
    const selected = signups.filter(s => s.selection_status === "selected")
    const queued = signups.filter(s => s.selection_status === "queued")

    return (
        <div className="bg-[#1e1e24] border border-border/20 rounded-lg shadow-sm flex flex-col overflow-hidden">
            <div className="flex flex-col items-center justify-center p-3 border-b border-border/20 bg-muted/5">
                <div className="flex items-center gap-2 font-bold text-sm">
                    <span>{icon}</span> {title}
                    <span className="text-muted-foreground font-normal">{selected.length}</span>
                </div>
            </div>

            <div className="p-2 flex flex-col gap-1 text-xs px-3">
                {/* Selected Block */}
                <div className="flex justify-between items-center text-muted-foreground mb-1 mt-1">
                    <span>Selected</span>
                    <IconPlus className="size-3" />
                </div>
                {selected.length === 0 && <div className="h-6" />}
                {selected.map(s => <SignupRow key={s.member_id} signup={s} />)}

                {/* Queued Block */}
                <div className="flex justify-between items-center text-muted-foreground mt-3 mb-1 pt-3 border-t border-border/10">
                    <span>Queued</span>
                </div>
                {queued.length === 0 && <div className="h-6" />}
                {queued.map(s => <SignupRow key={s.member_id} signup={s} />)}
            </div>
        </div>
    )
}

function SignupRow({ signup }: { signup: EventSignup }) {
    // Mock class colors for text
    const WOW_CLASS_COLORS: Record<number, string> = {
        1: "text-[#C69B6D]", 2: "text-[#F48CBA]", 3: "text-[#AAD372]", 4: "text-[#FFF468]",
        5: "text-white", 6: "text-[#C41E3A]", 7: "text-[#0070DD]", 8: "text-[#3FC7EB]",
        9: "text-[#8788EE]", 10: "text-[#00FF98]", 11: "text-[#FF7C0A]", 12: "text-[#A330C9]", 13: "text-[#33937F]",
    }
    const color = WOW_CLASS_COLORS[signup.class_id] || "text-foreground"

    return (
        <div className="flex items-center justify-between py-1 px-1 hover:bg-muted/10 rounded cursor-pointer">
            <div className="flex items-center gap-2">
                <div className="size-4 rounded-full bg-muted border border-border/50" />
                <span className={cn("font-medium", color)}>{signup.character_name}</span>
            </div>
            <div className="text-emerald-500">✓</div>
        </div>
    )
}

function ChecklistItem({ count, label, color = "text-muted-foreground" }: { count: number, label: string, color?: string }) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-amber-500/80 font-mono text-xs w-4 text-right">{count}x</span>
            <span className={color}>{label}</span>
        </div>
    )
}
