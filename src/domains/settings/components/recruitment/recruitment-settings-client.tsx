"use client"

import { Suspense } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { IconUsers, IconForms, IconInbox } from "@/shared/ui/tabler-icons"
import { SpotsManager } from "@/domains/settings/components/recruitment/spots-manager"
import { FormBuilder } from "@/domains/settings/components/recruitment/form-builder"
import { RecruitmentInbox } from "@/domains/settings/components/recruitment/recruitment-inbox"
import { useSearchParams } from "next/navigation"

function RecruitmentSettingsClientContent({ initialSpots, initialQuestions, constants, applications, currentRoleLevel }: any) {
    const searchParams = useSearchParams()
    const getSearchParam = searchParams.get.bind(searchParams)

    const defaultTab = getSearchParam("tab") || "spots"

    return (
        <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="bg-muted/50 p-1 w-full grid grid-cols-3 gap-1 rounded-2xl md:flex md:justify-start md:overflow-x-auto md:no-scrollbar md:scrollbar-hide md:h-auto md:min-h-12 md:py-1 md:flex-nowrap md:touch-pan-x">
                <TabsTrigger value="spots" className="gap-2 min-w-0 px-2 md:px-3 md:shrink-0">
                    <IconUsers className="size-4" />
                    <span className="hidden sm:inline">Vacantes de Clase</span>
                </TabsTrigger>
                <TabsTrigger value="form" className="gap-2 min-w-0 px-2 md:px-3 md:shrink-0">
                    <IconForms className="size-4" />
                    <span className="hidden sm:inline">Constructor de Formulario</span>
                </TabsTrigger>
                <TabsTrigger value="inbox" className="gap-2 min-w-0 px-2 md:px-3 md:shrink-0">
                    <IconInbox className="size-4" />
                    <span className="hidden sm:inline">Bandeja de Entrada</span>
                </TabsTrigger>
            </TabsList>

            <TabsContent value="spots" className="mt-6">
                <SpotsManager initialSpots={initialSpots} constants={constants} />
            </TabsContent>

            <TabsContent value="form" className="mt-6">
                <FormBuilder initialQuestions={initialQuestions} />
            </TabsContent>

            <TabsContent value="inbox" className="mt-6">
                <RecruitmentInbox applications={applications} constants={constants} currentRoleLevel={currentRoleLevel} />
            </TabsContent>
        </Tabs>
    )
}

export function RecruitmentSettingsClient(props: any) {
    return <Suspense fallback={null}><RecruitmentSettingsClientContent {...props} /></Suspense>
}
