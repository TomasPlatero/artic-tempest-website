"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IconUsers, IconForms } from "@tabler/icons-react"
import { SpotsManager } from "./spots-manager"
import { FormBuilder } from "./form-builder"

export function RecruitmentSettingsClient({ initialSpots, initialQuestions, constants }: any) {
    return (
        <Tabs defaultValue="spots" className="w-full">
            <TabsList className="bg-muted/50 p-1">
                <TabsTrigger value="spots" className="gap-2">
                    <IconUsers className="size-4" />
                    Vacantes de Clase
                </TabsTrigger>
                <TabsTrigger value="form" className="gap-2">
                    <IconForms className="size-4" />
                    Constructor de Formulario
                </TabsTrigger>
            </TabsList>

            <TabsContent value="spots" className="mt-6">
                <SpotsManager initialSpots={initialSpots} constants={constants} />
            </TabsContent>

            <TabsContent value="form" className="mt-6">
                <FormBuilder initialQuestions={initialQuestions} />
            </TabsContent>
        </Tabs>
    )
}
