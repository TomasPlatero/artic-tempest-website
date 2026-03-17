import * as React from "react"
import { forwardRef, useEffect, useImperativeHandle, useState } from "react"

export interface EmojiSuggestionListProps {
  items: string[]
  command: (item: any) => void
}

export const EmojiSuggestionList = forwardRef((props: EmojiSuggestionListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = (index: number) => {
    const item = props.items[index]
    if (item) {
      props.command({ name: item })
    }
  }

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
  }

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length)
  }

  const enterHandler = () => {
    selectItem(selectedIndex)
  }

  useEffect(() => setSelectedIndex(0), [props.items])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler()
        return true
      }
      if (event.key === 'ArrowDown') {
        downHandler()
        return true
      }
      if (event.key === 'Enter') {
        enterHandler()
        return true
      }
      return false
    },
  }))

  return (
    <div className="z-[100] min-w-[120px] overflow-hidden rounded-xl border border-white/10 bg-zinc-950 p-1 shadow-2xl shadow-black/50 animate-in fade-in-0 zoom-in-95 duration-200">
      {props.items.length ? (
        <div className="grid grid-cols-5 gap-1">
          {props.items.map((item, index) => (
            <button
              key={index}
              onClick={() => selectItem(index)}
              className={`flex size-8 items-center justify-center rounded-lg text-lg transition-all ${
                index === selectedIndex ? "bg-white/10 scale-110" : "hover:bg-white/5 opacity-60 hover:opacity-100"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      ) : (
        <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/20">No hay emojis</div>
      )}
    </div>
  )
})

EmojiSuggestionList.displayName = "EmojiSuggestionList"
