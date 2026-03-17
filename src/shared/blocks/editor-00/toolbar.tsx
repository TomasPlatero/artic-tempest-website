"use client"

import * as React from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND, UNDO_COMMAND, REDO_COMMAND, $createTextNode, $insertNodes } from "lexical"
import { $setBlocksType } from "@lexical/selection"
import { $createHeadingNode, $createQuoteNode, HeadingTagType } from "@lexical/rich-text"
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND } from "@lexical/list"
import { TOGGLE_LINK_COMMAND } from "@lexical/link"
import {
    IconBold,
    IconItalic,
    IconUnderline,
    IconStrikethrough,
    IconH1,
    IconH2,
    IconList,
    IconListNumbers,
    IconQuote,
    IconCode,
    IconLink,
    IconArrowBackUp,
    IconArrowForwardUp,
    IconMinus,
    IconPhoto,
    IconMoodSmile
} from "@tabler/icons-react"
import { INSERT_IMAGE_COMMAND } from "./ImagePlugin"
import { Button } from "@/shared/ui/button"
import { Separator } from "@/shared/ui/separator"
import { Toggle } from "@/shared/ui/toggle"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip"
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode"
import { EmojiPicker } from "../../components/emoji-picker"

export function Toolbar() {
    const [editor] = useLexicalComposerContext()
    const [isBold, setIsBold] = React.useState(false)
    const [isItalic, setIsItalic] = React.useState(false)
    const [isUnderline, setIsUnderline] = React.useState(false)
    const [isStrikethrough, setIsStrikethrough] = React.useState(false)

    const updateToolbar = React.useCallback(() => {
        editor.getEditorState().read(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
                setIsBold(selection.hasFormat("bold"))
                setIsItalic(selection.hasFormat("italic"))
                setIsUnderline(selection.hasFormat("underline"))
                setIsStrikethrough(selection.hasFormat("strikethrough"))
            }
        })
    }, [editor])

    React.useEffect(() => {
        return editor.registerUpdateListener(({ editorState }) => {
            editorState.read(() => {
                updateToolbar()
            })
        })
    }, [editor, updateToolbar])

    const formatHeading = (tag: HeadingTagType) => {
        editor.update(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
                $setBlocksType(selection, () => $createHeadingNode(tag))
            }
        })
    }

    const formatBulletList = () => {
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
    }

    const formatNumberedList = () => {
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
    }

    const formatQuote = () => {
        editor.update(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
                $setBlocksType(selection, () => $createQuoteNode())
            }
        })
    }

    const insertLink = () => {
        const url = window.prompt("Introduce la URL:")
        if (url) {
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, url)
        }
    }

    const insertHorizontalRule = () => {
        editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
    }

    return (
        <div className="flex flex-wrap items-center gap-1 p-1 border-b bg-muted/20 backdrop-blur-sm sticky top-0 z-10 mr-1">
            <div className="flex items-center gap-0.5">
                <ToolbarButton
                    onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
                    icon={IconArrowBackUp}
                    tooltip="Deshacer"
                />
                <ToolbarButton
                    onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
                    icon={IconArrowForwardUp}
                    tooltip="Rehacer"
                />
            </div>

            <Separator orientation="vertical" className="mx-1 h-6" />

            <div className="flex items-center gap-0.5">
                <Toggle
                    size="sm"
                    pressed={isBold}
                    onPressedChange={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
                    aria-label="Bold"
                    className="size-8 p-0"
                >
                    <IconBold className="size-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={isItalic}
                    onPressedChange={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
                    aria-label="Italic"
                    className="size-8 p-0"
                >
                    <IconItalic className="size-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={isUnderline}
                    onPressedChange={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
                    aria-label="Underline"
                    className="size-8 p-0"
                >
                    <IconUnderline className="size-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={isStrikethrough}
                    onPressedChange={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")}
                    aria-label="Strikethrough"
                    className="size-8 p-0"
                >
                    <IconStrikethrough className="size-4" />
                </Toggle>
            </div>

            <Separator orientation="vertical" className="mx-1 h-6" />

            <div className="flex items-center gap-0.5">
                <ToolbarButton onClick={() => formatHeading("h1")} icon={IconH1} tooltip="Título 1" />
                <ToolbarButton onClick={() => formatHeading("h2")} icon={IconH2} tooltip="Título 2" />
            </div>

            <Separator orientation="vertical" className="mx-1 h-6" />

            <div className="flex items-center gap-0.5">
                <ToolbarButton onClick={formatBulletList} icon={IconList} tooltip="Lista de viñetas" />
                <ToolbarButton onClick={formatNumberedList} icon={IconListNumbers} tooltip="Lista numerada" />
                <ToolbarButton onClick={formatQuote} icon={IconQuote} tooltip="Cita" />
                <ToolbarButton
                    onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}
                    icon={IconCode}
                    tooltip="Bloque de código"
                />
            </div>

            <Separator orientation="vertical" className="mx-1 h-6" />

            <div className="flex items-center gap-0.5">
                <ToolbarButton onClick={insertLink} icon={IconLink} tooltip="Insertar enlace" />
                <ToolbarButton
                    onClick={() => {
                        const src = window.prompt("URL de la imagen:")
                        if (src) editor.dispatchCommand(INSERT_IMAGE_COMMAND, { src, altText: "Imagen" })
                    }}
                    icon={IconPhoto}
                    tooltip="Insertar imagen"
                />
                <ToolbarButton onClick={insertHorizontalRule} icon={IconMinus} tooltip="Línea horizontal" />
                <EmojiPicker onSelect={(emoji) => {
                    editor.update(() => {
                        $insertNodes([$createTextNode(emoji)])
                    })
                }}>
                    <Button variant="ghost" size="icon" className="size-8 p-0">
                        <IconMoodSmile className="size-4" />
                    </Button>
                </EmojiPicker>
            </div>
        </div>
    )
}

function ToolbarButton({ onClick, icon: Icon, tooltip }: { onClick: () => void; icon: any; tooltip: string }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onClick} className="size-8 p-0">
                    <Icon className="size-4" />
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>{tooltip}</p>
            </TooltipContent>
        </Tooltip>
    )
}
