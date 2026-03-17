"use client"

import * as React from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
    LexicalTypeaheadMenuPlugin,
    MenuOption,
    useBasicTypeaheadTriggerMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin"
import { $createTextNode, $getSelection, $isRangeSelection } from "lexical"

const CLASS_COLORS: Record<number, string> = {
    1: "#C69B6D", 2: "#F48CBA", 3: "#AAD372", 4: "#FFF468", 5: "#FFFFFF",
    6: "#C41E3A", 7: "#0070DD", 8: "#3FC7EB", 9: "#8788EE", 10: "#00FF98",
    11: "#FF7C0A", 12: "#A330C9", 13: "#33937F",
}

class MentionOption extends MenuOption {
    id: string
    name: string
    classId: number
    role: string

    constructor(id: string, name: string, classId: number, role: string) {
        super(name)
        this.id = id
        this.name = name
        this.classId = classId
        this.role = role
    }
}

export function MentionPlugin() {
    const [editor] = useLexicalComposerContext()
    const [queryString, setQueryString] = React.useState<string | null>(null)
    const [results, setResults] = React.useState<Array<MentionOption>>([])

    const checkForMentionTrigger = useBasicTypeaheadTriggerMatch("@", {
        minLength: 0,
    })

    React.useEffect(() => {
        if (queryString) {
            fetch(`/api/guild/members/search?q=${queryString}`)
                .then(res => res.json())
                .then(data => {
                    const options = data.map((m: any) => 
                        new MentionOption(m.id, m.character_name, m.class_id, m.role)
                    )
                    setResults(options)
                })
        }
    }, [queryString])

    return (
        <LexicalTypeaheadMenuPlugin<MentionOption>
            onQueryChange={setQueryString}
            onSelectOption={(option, textNodeToReplace, closeMenu) => {
                editor.update(() => {
                    const mentionNode = $createTextNode(`@${option.name}`)
                    if (textNodeToReplace) {
                        textNodeToReplace.replace(mentionNode)
                    }
                    mentionNode.select()
                    closeMenu()
                })
            }}
            triggerFn={checkForMentionTrigger}
            options={results}
            menuRenderFn={(
                anchorElementRef,
                { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }
            ) => {
                if (!anchorElementRef.current || results.length === 0) return null

                return (
                    <div className="z-[100] mt-8 min-w-[200px] overflow-hidden rounded-xl border border-white/10 bg-zinc-950 p-1 shadow-2xl shadow-black/50 animate-in fade-in-0 zoom-in-95">
                        {results.map((option, index) => (
                            <button
                                key={option.id}
                                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all ${
                                    index === selectedIndex ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white/80"
                                }`}
                                onClick={() => selectOptionAndCleanUp(option)}
                                onMouseEnter={() => setHighlightedIndex(index)}
                            >
                                <div 
                                    className="size-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]" 
                                    style={{ backgroundColor: CLASS_COLORS[option.classId] || "#FFFFFF" }}
                                />
                                <span className="font-bold flex-1 uppercase tracking-tight text-xs">{option.name}</span>
                                <span className="text-[9px] font-black opacity-20 uppercase tracking-widest italic">{option.role || "Miembro"}</span>
                            </button>
                        ))}
                    </div>
                )
            }}
        />
    )
}
