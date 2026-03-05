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
        const baselineEntry = results.find((p: any) => p.name === "Baseline")
        const baselineDps = baselineEntry?.mean || data.sim.statistics?.raid_dps?.mean || data.sim.dps?.mean || 0

        // Find best for overall report stats (top bar)
        const sorted = [...results].sort((a: any, b: any) => (b.mean || 0) - (a.mean || 0))
        const best = sorted[0]
        const bestDps = best?.mean || baselineDps
        const totalDpsGain = bestDps - baselineDps
        const totalPercentGain = (baselineDps > 0) ? (totalDpsGain / baselineDps) * 100 : 0

        // In Droptimizer/TopGear, we want ALL results that are better than baseline
        const upgrades = results.filter((p: any) => p.name !== "Baseline" && (p.mean || 0) > baselineDps)

        // Group by slot and keep only the max DPS gain per slot
        const bestItemsBySlot = new Map<string, any>()

        upgrades.forEach((up: any) => {
            const dpsGain = up.mean - baselineDps
            const percentGain = (dpsGain / baselineDps) * 100

            // Top Gear name format: instanceId/encounterId/difficulty/itemId/itemLevel/bonusId/slot/...
            // E.g.: 1307/2738/raid-heroic/249380/269/0/waist///
            // It can be a combo of slots in some Top Gears, but we'll assume the primary changed item is what they care about
            const parts = up.name.split("/")
            const id = parseInt(parts[3])
            const slot = parts[6] || up.items?.[0]?.slot || "Unknown"

            if (isNaN(id)) return // Skip invalid entries

            // If we haven't seen this slot yet, or this upgrade is better than the previous best for this slot
            if (!bestItemsBySlot.has(slot) || dpsGain > bestItemsBySlot.get(slot).dpsGain) {
                bestItemsBySlot.set(slot, {
                    id,
                    name: up.items?.[0]?.name || "Item del reporte",
                    slot: up.items?.[0]?.slot || slot,
                    dpsGain: Math.round(dpsGain),
                    percentGain: percentGain.toFixed(2),
                    fullDps: up.mean
                })
            }
        })

        const items = Array.from(bestItemsBySlot.values())

        return NextResponse.json({
            reportId,
            bestName: best?.name,
            totalDps: bestDps,
            dpsGain: Math.round(totalDpsGain),
            percentGain: totalPercentGain.toFixed(2),
            items
        })
    } catch (e: any) {
        console.error("Raidbots API error:", e.message)
        return new NextResponse("Error interno", { status: 500 })
    }
}
