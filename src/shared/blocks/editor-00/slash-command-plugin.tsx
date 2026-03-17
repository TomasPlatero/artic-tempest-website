"use client"

import * as React from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
    LexicalTypeaheadMenuPlugin,
    MenuOption,
    useBasicTypeaheadTriggerMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin"
import { $createHeadingNode } from "@lexical/rich-text"
import { $setBlocksType } from "@lexical/selection"
import { $getSelection, $isRangeSelection, TextNode, $createParagraphNode, $insertNodes, $createTextNode } from "lexical"
import { $createQuoteNode } from "@lexical/rich-text"
import { $createCodeNode } from "@lexical/code"
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode"
import { INSERT_TABLE_COMMAND } from "@lexical/table"
import {
    IconH1,
    IconH2,
    IconList,
    IconListNumbers,
    IconQuote,
    IconCode,
    IconMinus,
    IconTable,
    IconPhoto,
    IconMoodSmile
} from "@tabler/icons-react"
import { INSERT_IMAGE_COMMAND } from "./ImagePlugin"
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from "@lexical/list"

class SlashMenuItemOption extends MenuOption {
    title: string
    icon: React.ReactNode
    keywords: Array<string>
    keyboardShortcut?: string
    onSelect: (queryString: string) => void

    constructor(
        title: string,
        options: {
            icon: React.ReactNode
            keywords: Array<string>
            keyboardShortcut?: string
            onSelect: (queryString: string) => void
        }
    ) {
        super(title)
        this.title = title
        this.icon = options.icon
        this.keywords = options.keywords
        this.keyboardShortcut = options.keyboardShortcut
        this.onSelect = options.onSelect
    }
}

export function SlashCommandPlugin() {
    const [editor] = useLexicalComposerContext()
    const [queryString, setQueryString] = React.useState<string | null>(null)

    const checkForSlash = useBasicTypeaheadTriggerMatch("/", {
        minLength: 0,
    })

    const options = React.useMemo(() => {
        return [
            new SlashMenuItemOption("Título 1", {
                icon: <IconH1 className="size-4" />,
                keywords: ["h1", "titulo", "heading"],
                onSelect: () => {
                    editor.update(() => {
                        const selection = $getSelection()
                        if ($isRangeSelection(selection)) {
                            $setBlocksType(selection, () => $createHeadingNode("h1"))
                        }
                    })
                },
            }),
            new SlashMenuItemOption("Título 2", {
                icon: <IconH2 className="size-4" />,
                keywords: ["h2", "titulo", "heading"],
                onSelect: () => {
                    editor.update(() => {
                        const selection = $getSelection()
                        if ($isRangeSelection(selection)) {
                            $setBlocksType(selection, () => $createHeadingNode("h2"))
                        }
                    })
                },
            }),
            new SlashMenuItemOption("Lista de viñetas", {
                icon: <IconList className="size-4" />,
                keywords: ["list", "bullet", "lista"],
                onSelect: () => {
                    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
                },
            }),
            new SlashMenuItemOption("Lista numerada", {
                icon: <IconListNumbers className="size-4" />,
                keywords: ["list", "number", "lista"],
                onSelect: () => {
                    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
                },
            }),
            new SlashMenuItemOption("Cita", {
                icon: <IconQuote className="size-4" />,
                keywords: ["quote", "cita"],
                onSelect: () => {
                    editor.update(() => {
                        const selection = $getSelection()
                        if ($isRangeSelection(selection)) {
                            $setBlocksType(selection, () => $createQuoteNode())
                        }
                    })
                },
            }),
            new SlashMenuItemOption("Bloque de código", {
                icon: <IconCode className="size-4" />,
                keywords: ["code", "codigo", "block"],
                onSelect: () => {
                    editor.update(() => {
                        const selection = $getSelection()
                        if ($isRangeSelection(selection)) {
                            $setBlocksType(selection, () => $createCodeNode())
                        }
                    })
                },
            }),
            new SlashMenuItemOption("Línea horizontal", {
                icon: <IconMinus className="size-4" />,
                keywords: ["rule", "linea", "horizontal", "hr"],
                onSelect: () => {
                    editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)
                },
            }),
            new SlashMenuItemOption("Imagen", {
                icon: <IconPhoto className="size-4" />,
                keywords: ["image", "imagen", "photo", "img"],
                onSelect: () => {
                    const src = window.prompt("URL de la imagen:")
                    if (src) editor.dispatchCommand(INSERT_IMAGE_COMMAND, { src, altText: "Imagen" })
                },
            }),
            new SlashMenuItemOption("Tabla", {
                icon: <IconTable className="size-4" />,
                keywords: ["table", "tabla", "grid"],
                onSelect: () => {
                    editor.dispatchCommand(INSERT_TABLE_COMMAND, { columns: '3', rows: '3' })
                },
            }),
            new SlashMenuItemOption("Emoji", {
                icon: <IconMoodSmile className="size-4" />,
                keywords: ["emoji", "smile", "cara", "mood"],
                onSelect: () => {
                    editor.update(() => {
                        $insertNodes([$createTextNode("😀")])
                    })
                },
            }),
        ]
    }, [editor])

    return (
        <LexicalTypeaheadMenuPlugin<SlashMenuItemOption>
            onQueryChange={setQueryString}
            onSelectOption={(option, textNodeToReplace, closeMenu) => {
                editor.update(() => {
                    if (textNodeToReplace) {
                        textNodeToReplace.remove();
                    }
                    option.onSelect(queryString || "")
                    closeMenu()
                })
            }}
            triggerFn={checkForSlash}
            options={options}
            menuRenderFn={(
                anchorElementRef,
                { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }
            ) => {
                if (!anchorElementRef.current || options.length === 0) return null

                return (
                    <div className="z-[100] mt-8 min-w-[200px] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
                        {options.map((option, index) => (
                            <button
                                key={option.key}
                                className={`relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground ${selectedIndex === index ? "bg-accent text-accent-foreground" : ""
                                    }`}
                                onClick={() => selectOptionAndCleanUp(option)}
                                onMouseEnter={() => setHighlightedIndex(index)}
                            >
                                <div className="mr-2 flex h-4 w-4 items-center justify-center">
                                    {option.icon}
                                </div>
                                <span>{option.title}</span>
                            </button>
                        ))}
                    </div>
                )
            }}
        />
    )
}
