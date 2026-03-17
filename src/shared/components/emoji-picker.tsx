"use client"

import * as React from "react"
import { useDeferredValue } from "react"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/shared/ui/popover"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { ScrollArea } from "@/shared/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import {
    IconMoodSmile,
    IconSearch,
    IconClock,
    IconHandStop,
    IconDeviceGamepad2,
    IconLeaf,
    IconMeat,
    IconComponents
} from "@tabler/icons-react"

interface EmojiPickerProps {
    onSelect: (emoji: string) => void
    children?: React.ReactNode
}

const EMOJI_CATEGORIES = [
    {
        id: "recent",
        name: "Recientes",
        icon: <IconClock className="size-3.5" />,
        emojis: ["🔥", "✨", "✅", "🎮", "⚔️", "💎", "🚀", "❤️", "👍", "👑"]
    },
    {
        id: "faces",
        name: "Caras y Personas",
        icon: <IconMoodSmile className="size-3.5" />,
        emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😾"]
    },
    {
        id: "gestures",
        name: "Gestos y Cuerpo",
        icon: <IconHandStop className="size-3.5" />,
        emojis: ["👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦵", "🦶", "👂", "🦻", "👃", "🧠", "🦷", "🦴", "👀", "👁️", "👅", "👄", "💋", "🩸"]
    },
    {
        id: "gaming",
        name: "Gaming y Ocio",
        icon: <IconDeviceGamepad2 className="size-3.5" />,
        emojis: ["🎮", "🕹️", "💻", "⌨️", "🖱️", "🖥️", "🎧", "🎤", "🎬", "📺", "📱", "⚔️", "🛡️", "🏹", "🗡️", "🪓", "💣", "🧨", "🐲", "🐉", "🐺", "🦁", "🐯", "💎", "🥇", "🥈", "🥉", "🏆", "🎯", "🎲", "🎰", "🎳", "🎭", "🎨", "🧵", "🧶", "🎼", "🎵", "🎶", "🎹", "🎸", "🎺", "🎻", "🥁"]
    },
    {
        id: "nature",
        name: "Naturaleza",
        icon: <IconLeaf className="size-3.5" />,
        emojis: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐒", "🦍", "🦧", "🐕", "🐩", "🐺", "🦝", "🐈", "🐅", "🐆", "🐴", "🐎", "🦄", "🦓", "🦌", "🐂", "🐃", "🐄", "🐷", "🐗", "🐽", "🐏", "🐑", "🐐", "🐪", "🐫", "🦙", "🦒", "🐘", "🦏", "🦛", "🐿️", "🦫", "🦔", "🦇", "🦦", "🦨", "🦘", "🦡", "🐾", "🦃", "🎄", "🌱", "🌿", "☘️", "🍀", "🍃", "🍂", "🍁", "🍄", "🌾", "💐", "🌷", "🌹", "🥀", "🌺", "🌸", "🌼", "🌻", "🌞", "🌝", "🌛", "🌜", "🌚", "🌙", "🌎", "🌍", "🌏", "🪐", "💫", "⭐", "🌟", "✨", "⚡", "☄️", "💥", "🔥", "🌪️", "🌈", "☀️", "🌤️", "⛅", "🌥️", "☁️", "🌧️", "🌩️", "❄️", "☃️", "💨", "💧", "💦", "☔", "🌊"]
    },
    {
        id: "food",
        name: "Comida",
        icon: <IconMeat className="size-3.5" />,
        emojis: ["🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", "🌽", "🥕", "🧄", "🧅", "🥔", "🍠", "🥐", "🥯", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳", "🧈", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🌭", "🍔", "🍟", "🍕", "🥪", "🌮", "🌯", "🥗", "🥘", "🍝", "🍜", "🍲", "🍛", "🍣", "🍱", "🥟", "🦪", "🍤", "🍙", "🍚", "🍘", "🍥", "🥠", "🥮", "🍢", "🍡", "🍧", "🍨", "🍦", "🥧", "🧁", "🍰", "🎂", "🍮", "🍭", "🍬", "🍫", "🍿", "🍩", "🍪", "🌰", "🥜", "🍯", "🥛", "☕", "🍵", "🧃", "🥤", "🍶", "🍺", "🍻", "🥂", "🍷", "🥃", "🍸", "🍹", "🧉", "🍾", "🧊", "🥄", "🍴", "🍽️", "🥣", "🥡", "🥢", "🧂"]
    },
    {
        id: "symbols",
        name: "Símbolos",
        icon: <IconComponents className="size-3.5" />,
        emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐", "⛎", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓", "🆔", "⚛️", "🉑", "☢️", "☣️", "📴", "📳", "🈶", "🈚", "🈸", "🈺", "🈷️", "✴️", "🆚", "💮", "🉐", "㊙️", "㊗️", "🈴", "🈵", "🈲", "🅰️", "🅱️", "🆎", "🆑", "🅾️", "🆘", "❌", "⭕", "🛑", "⛔", "📛", "🚫", "💯", "💢", "♨️", "🚷", "🚯", "🚳", "🚱", "🔞", "📵", "🚭", "❗", "❕", "❓", "❔", "‼️", "⁉️", "🔅", "🔆", "🔱", "⚜️", "⚠️", "🚸", "🔰", "♻️", "🈯", "💹", "❇️", "✳️", "❎", "✅", "💠", "🌀", "➿", "🌐", "Ⓜ️", "🏧", "🈂️", "🛂", "🛃", "🛄", "🛅", "🚹", "🚺", "🚼", "🚻", "🚮", "🚾", "♿", "🅿️", "🈳", "🈵", "🚰", "📶", "🎦", "🔣", "🔡", "🔤", "🔠", "🔲", "🔳", "🔘", "🏁", "🚩", "🎌", "🏴", "🏳️", "🏳️‍🌈", "🏳️‍⚧️", "🏴‍☠️", "📅", "📆", "🗓️", "🗑️", "🗒️", "📋", "⌛", "⏳", "⌚", "⏰", "⏱️", "⏲️", "🕰️", "🌡️", "☀️", "⭐", "🌙", "☁️", "⛅", "⚡", "❄️", "🔥", "💧", "🌊"]
    }
]

const EmojiButton = React.memo(({ emoji, onSelect }: { emoji: string, onSelect: (e: string) => void }) => (
    <button
        onClick={() => onSelect(emoji)}
        className="size-8 flex items-center justify-center text-xl hover:bg-white/10 rounded-lg transition-transform hover:scale-125 active:scale-90"
    >
        {emoji}
    </button>
))
EmojiButton.displayName = "EmojiButton"

const RECENT_KEY = "artic-recent-emojis"
const DEFAULT_RECENT = ["🔥", "✨", "✅", "🎮", "⚔️", "💎", "🚀", "❤️", "👍", "👑"]

export function EmojiPicker({ onSelect, children }: EmojiPickerProps) {
    const [search, setSearch] = React.useState("")
    const deferredSearch = useDeferredValue(search)
    const [open, setOpen] = React.useState(false)
    const [activeTab, setActiveTab] = React.useState("recent")
    const [recentEmojis, setRecentEmojis] = React.useState<string[]>([])

    // Load recent on mount
    React.useEffect(() => {
        const saved = localStorage.getItem(RECENT_KEY)
        if (saved) {
            try {
                setRecentEmojis(JSON.parse(saved))
            } catch (e) {
                setRecentEmojis(DEFAULT_RECENT)
            }
        } else {
            setRecentEmojis(DEFAULT_RECENT)
        }
    }, [])

    const categoriesWithRecent = React.useMemo(() => {
        return EMOJI_CATEGORIES.map(cat => {
            if (cat.id === "recent") {
                return { ...cat, emojis: recentEmojis.length > 0 ? recentEmojis : cat.emojis }
            }
            return cat
        })
    }, [recentEmojis])

    // Memoize filtering
    const filteredCategories = React.useMemo(() => {
        const query = deferredSearch.toLowerCase()
        if (query === "") return null
        return EMOJI_CATEGORIES.map(cat => ({
            ...cat,
            emojis: cat.emojis.filter(e => e.includes(query))
        })).filter(cat => cat.emojis.length > 0)
    }, [deferredSearch])

    const handleSelect = React.useCallback((emoji: string) => {
        onSelect(emoji)
        setOpen(false)
        setSearch("")

        // Update recent
        const updated = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 14)
        setRecentEmojis(updated)
        localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
    }, [onSelect, recentEmojis])

    const activeCategory = React.useMemo(() => 
        categoriesWithRecent.find(cat => cat.id === activeTab)
    , [activeTab, categoriesWithRecent])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {children || (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-white/40 hover:text-white hover:bg-white/5 transition-all"
                        title="Insertar Emoji"
                    >
                        <IconMoodSmile className="size-4" />
                    </Button>
                )}
            </PopoverTrigger>
            <PopoverContent
                side="top"
                align="start"
                className="w-80 p-0 bg-zinc-950 border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95"
            >
                <div className="p-3 border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2 px-2.5 py-2 bg-white/5 rounded-xl border border-white/5 mb-3">
                        <IconSearch className="size-3.5 text-white/20" />
                        <Input
                            placeholder="Buscar emoji..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-5 border-0 bg-transparent p-0 text-xs focus-visible:ring-0 placeholder:text-white/20"
                        />
                    </div>

                    {search === "" && (
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="w-full h-8 bg-transparent p-0 justify-between gap-0.5">
                                {categoriesWithRecent.map(cat => (
                                    <TabsTrigger
                                        key={cat.id}
                                        value={cat.id}
                                        title={cat.name}
                                        className="flex-1 h-7 p-0 rounded-md data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/40 hover:text-white/60 transition-all focus-visible:ring-1 focus-visible:ring-white/20"
                                    >
                                        {cat.icon}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            <div className="mt-2 outline-none">
                                <h4 className="text-[10px] uppercase font-black tracking-widest text-white/30 px-1 mb-2">
                                    {activeCategory?.name}
                                </h4>
                                <ScrollArea className="h-56 pr-2">
                                    <div className="grid grid-cols-7 gap-1 pb-2">
                                        {activeCategory?.emojis.map((emoji, i) => (
                                            <EmojiButton
                                                key={`${activeTab}-${emoji}-${i}`}
                                                emoji={emoji}
                                                onSelect={handleSelect}
                                            />
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        </Tabs>
                    )}

                    {search !== "" && (
                        <ScrollArea className="h-64 mt-2">
                            <div className="space-y-4 pr-2">
                                {(!filteredCategories || filteredCategories.length === 0) ? (
                                    <div className="py-8 text-center text-[10px] uppercase font-bold tracking-widest text-white/20">
                                        No hay resultados
                                    </div>
                                ) : (
                                    filteredCategories.map(cat => (
                                        <div key={cat.id} className="space-y-2">
                                            <h4 className="text-[10px] uppercase font-black tracking-widest text-white/30 px-1">
                                                {cat.name}
                                            </h4>
                                            <div className="grid grid-cols-7 gap-1">
                                                {cat.emojis.map((emoji, i) => (
                                                    <EmojiButton
                                                        key={`search-${cat.id}-${emoji}-${i}`}
                                                        emoji={emoji}
                                                        onSelect={handleSelect}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    )}
                </div>

                <div className="px-3 py-1.5 bg-white/5 border-t border-white/5 flex items-center justify-between">
                    <p className="text-[9px] uppercase font-bold text-white/10 tracking-widest">
                        Artic Tempest
                    </p>
                    <div className="flex gap-1 items-center grayscale opacity-20 hover:grayscale-0 hover:opacity-100 transition-all">
                        <span className="text-[9px] font-bold text-white/40 cursor-default">⚡ Ultra Fast</span>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
