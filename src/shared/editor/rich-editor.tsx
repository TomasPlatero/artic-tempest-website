"use client"

import * as React from "react"
import { Editor } from "@/shared/blocks/editor-00/editor"
import { SerializedEditorState } from "lexical"

interface RichEditorProps {
    initialValue?: SerializedEditorState
    onChange?: (state: SerializedEditorState) => void
}

export function RichEditor({ initialValue, onChange }: RichEditorProps) {
    return (
        <div className="w-full">
            <Editor
                editorSerializedState={initialValue}
                onSerializedChange={onChange}
            />
        </div>
    )
}
