"use client"

import * as React from "react"
import { RichEditor } from "@/shared/editor/rich-editor"
import { SerializedEditorState } from "lexical"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"

export default function EditorDemoPage() {
    const [editorState, setEditorState] = React.useState<SerializedEditorState | null>(null)

    return (
        <div className="container mx-auto py-10 max-w-5xl space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Shadcn Editor Demo</h1>
                <p className="text-muted-foreground">
                    Un editor de texto enriquecido profesional construido con Lexical y Shadcn/UI.
                </p>
            </div>

            <div className="grid gap-8">
                <Card className="border-border/50 shadow-lg">
                    <CardHeader>
                        <CardTitle>Editor</CardTitle>
                        <CardDescription>
                            Prueba el formato, las listas, las tablas y los atajos de markdown.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RichEditor
                            onChange={(state) => {
                                setEditorState(state)
                            }}
                        />
                    </CardContent>
                </Card>

                <Card className="border-border/50 shadow-lg bg-muted/30">
                    <CardHeader>
                        <CardTitle>Estado Serializado (JSON)</CardTitle>
                        <CardDescription>
                            Salida del estado del editor para persistencia en base de datos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <pre className="p-4 rounded-lg bg-black/40 overflow-auto max-h-[400px] text-xs font-mono text-zinc-300">
                            {editorState ? JSON.stringify(editorState, null, 2) : "// Empieza a escribir para ver el estado..."}
                        </pre>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
