"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IconUsers, IconForms, IconInbox } from "@tabler/icons-react"
import { SpotsManager } from "@/components/settings/recruitment/spots-manager"
import { FormBuilder } from "@/components/settings/recruitment/form-builder"
import { RecruitmentInbox } from "@/components/settings/recruitment/recruitment-inbox"
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"

export function RecruitmentSettingsClient({ initialSpots, initialQuestions, constants, applications }: any) {
    const [mounted, setMounted] = useState(false)
    const searchParams = useSearchParams()

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    const defaultTab = searchParams.get("tab") || "spots"

    return (
        <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="bg-muted/50 p-1 w-full flex justify-start overflow-x-auto no-scrollbar scrollbar-hide h-auto min-h-12 py-1.5 md:h-10 md:py-1 flex-nowrap touch-pan-x">
                <TabsTrigger value="spots" className="gap-2 shrink-0">
                    <IconUsers className="size-4" />
                    Vacantes de Clase
                </TabsTrigger>
                <TabsTrigger value="form" className="gap-2 shrink-0">
                    <IconForms className="size-4" />
                    Constructor de Formulario
                </TabsTrigger>
                <TabsTrigger value="inbox" className="gap-2 shrink-0">
                    <IconInbox className="size-4" />
                    Bandeja de Entrada
                </TabsTrigger>
            </TabsList>

            <TabsContent value="spots" className="mt-6">
                <SpotsManager initialSpots={initialSpots} constants={constants} />
            </TabsContent>

            <TabsContent value="form" className="mt-6">
                <FormBuilder initialQuestions={initialQuestions} />
            </TabsContent>

            <TabsContent value="inbox" className="mt-6">
                <RecruitmentInbox applications={applications} constants={constants} />
            </TabsContent>
        </Tabs>
    )
}
