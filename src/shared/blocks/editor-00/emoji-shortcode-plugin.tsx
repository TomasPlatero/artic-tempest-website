"use client"

import * as React from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
    LexicalTypeaheadMenuPlugin,
    MenuOption,
    useBasicTypeaheadTriggerMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin"
import { $createTextNode } from "lexical"

const ALL_EMOJIS = ["🔥", "✨", "✅", "🎮", "⚔️", "💎", "🚀", "❤️", "👍", "👑", "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😾", "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦵", "🦶", "👂", "🦻", "👃", "🧠", "🦷", "🦴", "👀", "👁️", "👅", "👄", "💋", "🩸", "🎮", "🕹️", "💻", "⌨️", "🖱️", "🖥️", "🎧", "🎤", "🎬", "📺", "📱", "⚔️", "🛡️", "🏹", "🗡️", "🪓", "💣", "🧨", "🐲", "🐉", "🐺", "🦁", "🐯", "💎", "🥇", "🥈", "🥉", "🏆", "🎯", "🎲", "🎰", "🎳", "🎭", "🎨", "🧵", "🧶", "🎼", "🎵", "🎶", "🎹", "🎸", "🎺", "🎻", "🥁", "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐒", "🦍", "🦧", "🐕", "🐩", "🐺", "🦝", "🐈", "🐅", "🐆", "🐴", "🐎", "🦄", "🦓", "🦌", "🐂", "🐃", "🐄", "🐷", "🐗", "🐽", "🐏", "🐑", "🐐", "🐪", "🐫", "🦙", "🦒", "🐘", "🦏", "🦛", "🐿️", "🦫", "🦔", "🦇", "🦦", "🦨", "🦘", "🦡", "🐾", "🦃", "🎄", "🌱", "🌿", "☘️", "🍀", "🍃", "🍂", "🍁", "🍄", "🌾", "💐", "🌷", "🌹", "🥀", "🌺", "🌸", "🌼", "🌻", "🌞", "🌝", "🌛", "🌜", "🌚", "🌙", "🌎", "🌍", "🌏", "🪐", "💫", "⭐", "🌟", "✨", "⚡", "☄️", "💥", "🔥", "🌪️", "🌈", "☀️", "🌤️", "⛅", "🌥️", "☁️", "🌧️", "🌩️", "❄️", "☃️", "💨", "💧", "💦", "☔", "🌊", "🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", "🌽", "🥕", "🧄", "🧅", "🥔", "🍠", "🥐", "🥯", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🌭", "🍔", "🍟", "🍕", "🥪", "🌮", "🌯", "🥗", "🥘", "🍝", "🍜", "🍲", "🍛", "🍣", "🍱", "🥟", "🦪", "🍤", "🍙", "🍚", "🍘", "🍥", "🥠", "🥮", "🍢", "🍡", "🍧", "🍨", "🍦", "🥧", "🧁", "🍰", "🎂", "🍮", "🍭", "🍬", "🍫", "🍿", "🍩", "🍪", "🌰", "🥜", "🍯", "🥛", "☕", "🍵", "🧃", "🥤", "🍶", "🍺", "🍻", "🥂", "🍷", "🥃", "🍸", "🍹", "🧉", "🍾", "🧊", "🥄", "🍴", "🍽️", "🥣", "🥡", "🥢", "🧂", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐", "⛎", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓", "🆔", "⚛️", "🉑", "☢️", "☣️", "📴", "📳", "🈶", "🈚", "🈸", "🈺", "🈷️", "✴️", "🆚", "💮", "🉐", "㊙️", "㊗️", "🈴", "🈵", "🈲", "🅰️", "🅱️", "🆎", "🆑", "🅾️", "🆘", "❌", "⭕", "🛑", "⛔", "📛", "🚫", "💯", "💢", "♨️", "🚷", "🚯", "🚳", "🚱", "🔞", "📵", "🚭", "❗", "❕", "❓", "❔", "‼️", "⁉️", "🔅", "🔆", "🔱", "⚜️", "⚠️", "🚸", "🔰", "♻️", "🈯", "💹", "❇️", "✳️", "❎", "✅", "💠", "🌀", "➿", "🌐", "Ⓜ️", "🏧", "🈂️", "強化", "🛃", "🛄", "🛅", "🚹", "🚺", "🚼", "🚻", "🚮", "🚾", "♿", "🅿️", "🈳", "🈵", "🚰", "📶", "🎦", "🔣", "🔡", "🔤", "🔠", "🔲", "🔳", "🔘", "🏁", "🚩", "🎌", "🏴", "🏳️", "🏳️‍🌈", "🏳️‍⚧️", "🏴‍☠️", "📅", "📆", "🗓️", "🗑️", "🗒️", "📋", "⌛", "⏳", "⌚", "⏰", "⏱️", "⏲️", "🕰️", "🌡️", "☀️", "⭐", "🌙", "☁️", "⛅", "⚡", "❄️", "🔥", "💧", "🌊"];

class EmojiOption extends MenuOption {
    emoji: string

    constructor(emoji: string) {
        super(emoji)
        this.emoji = emoji
    }
}

export function EmojiShortcodePlugin() {
    const [editor] = useLexicalComposerContext()
    const [queryString, setQueryString] = React.useState<string | null>(null)

    const checkForEmojiTrigger = useBasicTypeaheadTriggerMatch(":", {
        minLength: 0,
    })

    const options = React.useMemo(() => {
        // En una app real filtraríamos por queryString si fuera necesario
        // Por ahora devolvemos un set inicial rápido
        return ALL_EMOJIS.slice(0, 15).map(e => new EmojiOption(e))
    }, [queryString])

    return (
        <LexicalTypeaheadMenuPlugin<EmojiOption>
            onQueryChange={setQueryString}
            onSelectOption={(option, textNodeToReplace, closeMenu) => {
                editor.update(() => {
                    const emojiNode = $createTextNode(option.emoji + " ")
                    if (textNodeToReplace) {
                        textNodeToReplace.replace(emojiNode)
                    }
                    emojiNode.select()
                    closeMenu()
                })
            }}
            triggerFn={checkForEmojiTrigger}
            options={options}
            menuRenderFn={(
                anchorElementRef,
                { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }
            ) => {
                if (!anchorElementRef.current || options.length === 0) return null

                return (
                    <div className="z-[100] mt-8 overflow-hidden rounded-xl border border-white/10 bg-zinc-950 p-1 shadow-2xl shadow-black/50 animate-in fade-in-0 zoom-in-95 duration-200">
                        <div className="grid grid-cols-5 gap-1">
                            {options.map((option, index) => (
                                <button
                                    key={index}
                                    className={`flex size-8 items-center justify-center rounded-lg text-lg transition-all ${
                                        index === selectedIndex ? "bg-white/10 scale-110" : "hover:bg-white/5 opacity-60"
                                    }`}
                                    onClick={() => selectOptionAndCleanUp(option)}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                >
                                    {option.emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                )
            }}
        />
    )
}
