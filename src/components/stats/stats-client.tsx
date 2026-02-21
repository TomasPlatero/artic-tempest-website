"use client"

import { useMemo } from "react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

export function StatsClient({ members }: { members: any[] }) {
    const WOW_CLASSES: Record<number, string> = {
        1: "Guerrero", 2: "Paladín", 3: "Cazador", 4: "Pícaro", 5: "Sacerdote",
        6: "DK", 7: "Chamán", 8: "Mago", 9: "Brujo", 10: "Monje",
        11: "Druida", 12: "DH", 13: "Evocador",
    }

    const WOW_CLASS_COLORS: Record<number, string> = {
        1: "#C69B6D",  // Warrior
        2: "#F48CBA",  // Paladin
        3: "#AAD372",  // Hunter
        4: "#FFF468",  // Rogue
        5: "#FFFFFF",  // Priest
        6: "#C41E3A",  // DK
        7: "#0070DD",  // Shaman
        8: "#3FC7EB",  // Mage
        9: "#8788EE",  // Warlock
        10: "#00FF98", // Monk
        11: "#FF7C0A", // Druid
        12: "#A330C9", // DH
        13: "#33937F", // Evoker
    }

    const classData = useMemo(() => {
        const counts: Record<number, number> = {}
        members.forEach((m) => {
            const cid = m.class_id ?? 0
            counts[cid] = (counts[cid] || 0) + 1
        })

        return Object.entries(counts)
            .filter(([id]) => id !== "0") // ignore unknowns
            .map(([id, count]) => ({
                name: WOW_CLASSES[parseInt(id)],
                value: count,
                color: WOW_CLASS_COLORS[parseInt(id)],
            }))
            .sort((a, b) => b.value - a.value)
    }, [members])

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between px-4 lg:px-6">
                <div>
                    <h1 className="text-2xl font-bold">Estadísticas</h1>
                    <p className="text-sm text-muted-foreground">
                        Distribución de personajes y actividad del roster.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 px-4 lg:px-6">
                <Card className="col-span-full md:col-span-1 lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Composición de Clases</CardTitle>
                        <CardDescription>
                            Distribución total de personajes por clase en el roster actual
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {classData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={classData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={2}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {classData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                                        itemStyle={{ color: 'var(--foreground)' }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                No hay datos suficientes
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-full md:col-span-1 lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Actividad</CardTitle>
                        <CardDescription>Mas métricas próximamente (ítem level, asistencia...)</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center border-dashed border-2 m-4 rounded-xl text-muted-foreground opacity-50 bg-muted/20">
                        En construcción
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
