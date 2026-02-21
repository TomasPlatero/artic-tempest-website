"use client"

import { IconLink, IconClock, IconUsers, IconRefresh, IconCalendarEvent, IconListSearch, IconExternalLink, IconSettings, IconPencil } from "@tabler/icons-react"
import { useRouter } from "next/navigation"

export function DashboardClient({ data }: { data: any }) {
    const router = useRouter()

    return (
        <div className="flex flex-col gap-6 w-full">

            {/* The 6 Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">

                {/* Spreadsheet */}
                <div className="bg-card text-card-foreground border rounded-xl p-5 flex flex-col items-center justify-center text-center gap-2 hover:bg-accent/50 transition-colors shadow-sm">
                    <div className="flex items-center gap-2 font-semibold text-lg">
                        <IconLink className="size-5 text-muted-foreground" />
                        Spreadsheet
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Everything is set up! Visit your sheet here:</p>
                    <a href="#" className="text-sm text-primary hover:underline break-all mt-1">
                        https://wowaudit.com/sheet/eu/{data.realm.toLowerCase()}/{data.guildName.replace(/ /g, '-').toLowerCase()}/raiders
                    </a>
                </div>

                {/* Patreon */}
                <div className="bg-card text-card-foreground border rounded-xl p-5 flex flex-col items-center justify-center text-center gap-2 shadow-sm">
                    <div className="flex items-center gap-2 font-semibold text-lg text-amber-500">
                        <IconExternalLink className="size-5" />
                        Patreon
                    </div>
                    <p className="text-sm mt-2 text-muted-foreground">
                        Your guild has <span className="text-amber-500 font-semibold text-foreground">Gold</span> level Patreon status. Thank you for your support!
                    </p>
                </div>

                {/* Roster */}
                <div className="bg-card text-card-foreground border rounded-xl p-5 flex flex-col items-center justify-center text-center gap-2 shadow-sm">
                    <div className="flex items-center gap-2 font-semibold text-lg">
                        <IconUsers className="size-5 text-muted-foreground" />
                        Roster
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 max-w-[80%]">
                        Your team currently consists of <span className="text-foreground font-semibold">{data.rosterCount}</span> characters. You can visit the <span className="text-primary hover:underline cursor-pointer" onClick={() => router.push('/dashboard/roster')}>roster page</span> to view the roster.
                    </p>
                    <div className="flex items-center gap-2 text-emerald-500 font-semibold mt-2 text-lg">
                        <div className="rounded-full border border-emerald-500 size-5 flex items-center justify-center text-xs">✓</div>
                        {data.rosterCount} / {data.rosterCount} <span className="text-muted-foreground text-sm font-normal ml-1">tracking normally</span>
                    </div>
                </div>

                {/* Refresh Status */}
                <div className="bg-card text-card-foreground border rounded-xl p-5 flex flex-col items-center justify-center text-center gap-2 shadow-sm">
                    <div className="flex items-center gap-2 font-semibold text-lg">
                        <IconRefresh className="size-5 text-muted-foreground" />
                        Refresh Status
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Your team's spreadsheet data last refreshed</p>
                    <div className="text-xl font-semibold my-1 text-foreground">
                        a minute ago
                    </div>
                    <p className="text-sm text-muted-foreground">
                        You can visit the <span className="text-primary cursor-pointer hover:underline">status page</span> to view more details about the refresh status and manually refresh your data.
                    </p>
                </div>

                {/* Upcoming Raid */}
                <div className="bg-card text-card-foreground border rounded-xl p-5 flex flex-col items-center justify-center text-center gap-2 shadow-sm">
                    <div className="flex items-center gap-2 font-semibold text-lg">
                        <IconCalendarEvent className="size-5 text-muted-foreground" />
                        Upcoming raid
                    </div>
                    {data.nextRaid ? (
                        <>
                            <p className="text-sm text-muted-foreground mt-1">
                                Your next <span className="text-primary cursor-pointer hover:underline" onClick={() => router.push('/dashboard/calendario')}>raid</span> to <span className="text-foreground font-semibold">{data.nextRaid.destination || data.nextRaid.title}</span> starts <span className="text-foreground font-semibold">in 2 days</span>.
                            </p>
                            <div className="flex items-center gap-2 text-emerald-500 font-semibold mt-2 text-lg">
                                <div className="rounded-full border border-emerald-500 size-5 flex items-center justify-center text-xs">✓</div>
                                32 / 32 <span className="text-muted-foreground text-sm font-normal ml-1">signed up</span>
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-muted-foreground mt-1">No upcoming raids scheduled.</p>
                    )}
                </div>

                {/* Recruitment */}
                <div className="bg-card text-card-foreground border rounded-xl p-5 flex flex-col items-center justify-center text-center gap-2 shadow-sm">
                    <div className="flex items-center gap-2 font-semibold text-lg">
                        <IconListSearch className="size-5 text-muted-foreground" />
                        Recruitment
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Your team currently has</p>
                    <div className="flex items-center gap-2 text-emerald-500 font-semibold mt-1 text-lg">
                        <div className="rounded-full border border-emerald-500 size-5 flex items-center justify-center text-xs">✓</div>
                        0
                    </div>
                    <p className="text-sm text-muted-foreground max-w-[90%] mt-1">
                        pending applications. You can visit the <span className="text-primary cursor-pointer hover:underline">application overview</span> to view more details about the pending applications.
                    </p>
                </div>

            </div>

        </div>
    )
}
