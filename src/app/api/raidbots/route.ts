import { NextResponse } from "next/server"

export async function GET(req: Request) {
    try {
        const url = new URL(req.url)
        const rbUrl = url.searchParams.get("url")
        if (!rbUrl) return new NextResponse("Falta la URL", { status: 400 })

        // Extract ID from URL
        // https://www.raidbots.com/simbot/report/5mynUoYhvWnVZXke5KKPjC
        const match = rbUrl.match(/report\/([a-zA-Z0-9]+)/)
        if (!match) return new NextResponse("URL de Raidbots no válida", { status: 400 })

        const reportId = match[1]
        const dataUrl = `https://www.raidbots.com/simbot/report/${reportId}/data.json`

        const res = await fetch(dataUrl, {
            headers: {
                "User-Agent": "GuildBoard-Bot/1.0",
            }
        })

        if (!res.ok) {
            return new NextResponse("No se pudo obtener datos de Raidbots", { status: res.status })
        }

        const data = await res.json()
        if (!data.sim || !data.sim.profilesets) {
            return new NextResponse("El reporte no contiene set de perfiles (Top Gear)", { status: 400 })
        }

        const profilesetsData = data.sim.profilesets
        if (!profilesetsData || !profilesetsData.results) {
            return new NextResponse("El reporte no contiene resultados válidos", { status: 400 })
        }

        const results = profilesetsData.results

        // Find baseline: either a result named "Baseline" or the overall sim dps
        const baselineEntry = results.find((p: any) =>
            p.name === "Baseline" ||
            p.name?.toLowerCase().includes("baseline") ||
            p.name === data.sim.players?.[0]?.name
        )
        const baselineDps = baselineEntry?.mean || data.sim.statistics?.raid_dps?.mean || data.sim.dps?.mean || 0

        // In Droptimizer, we want to calculate the SUM of the best upgrades for each slot
        // to show the total potential gain of the BiS list.
        const bestGainBySlot = new Map<string, number>()
        const upgrades = results.filter((p: any) => p.name !== "Baseline" && !p.name?.toLowerCase().includes("baseline") && (p.mean || 0) > baselineDps)

        // In Droptimizer/TopGear, we want ALL unique items that are better than baseline
        const itemsById = new Map<number, any>()

        upgrades.forEach((up: any) => {
            const dpsGain = up.mean - baselineDps
            const percentGain = baselineDps > 0 ? (dpsGain / baselineDps) * 100 : 0

            // Try to extract ID and Slot
            const parts = up.name.split("/")
            let id = parseInt(parts[3])
            let ilvl = parseInt(parts[4]) || 0
            let slot = parts[6] || up.items?.[0]?.slot || "Unknown"

            if (isNaN(id)) {
                const idMatch = up.name.match(/\/([0-9]{5,6})\//)
                if (idMatch) id = parseInt(idMatch[1])
            }
            if (isNaN(id) && up.items?.length > 0) {
                id = up.items[0].id
                ilvl = up.items[0].itemLevel || 0
                slot = up.items[0].slot || slot
            }

            if (isNaN(id)) return

            // 1. Keep the absolute best item result for the list
            if (!itemsById.has(id) || dpsGain > itemsById.get(id).dpsGain) {
                itemsById.set(id, {
                    id,
                    ilvl,
                    name: up.items?.[0]?.name || "Item del reporte",
                    slot,
                    dpsGain: Math.round(dpsGain),
                    percentGain: percentGain.toFixed(2),
                    fullDps: up.mean
                })
            }

            // 2. Track best gain per slot for the total summary
            // Normalize slots (trinket1/trinket2 -> trinket)
            const normalizedSlot = slot.replace(/[0-9]/g, '').toLowerCase()
            if (!bestGainBySlot.has(normalizedSlot) || dpsGain > (bestGainBySlot.get(normalizedSlot) || 0)) {
                bestGainBySlot.set(normalizedSlot, dpsGain)
            }
        })

        const items = Array.from(itemsById.values())

        // Calculate Total Potential Gain (Sum of best in each slot)
        let totalDpsGain = 0
        bestGainBySlot.forEach(gain => totalDpsGain += gain)

        // If it's Top Gear, we prefer the actual simulated total instead of summing
        if (data.sim?.options?.type === "topgear") {
            const bestResult = results.sort((a: any, b: any) => (b.mean || 0) - (a.mean || 0))[0]
            totalDpsGain = (bestResult?.mean || baselineDps) - baselineDps
        }

        const totalPercentGain = (baselineDps > 0) ? (totalDpsGain / baselineDps) * 100 : 0

        return NextResponse.json({
            reportId,
            totalDps: (baselineDps + totalDpsGain),
            dpsGain: Math.round(totalDpsGain),
            percentGain: totalPercentGain.toFixed(2),
            items
        })
    } catch (e: any) {
        console.error("Raidbots API error:", e.message)
        return new NextResponse("Error interno", { status: 500 })
    }
}
