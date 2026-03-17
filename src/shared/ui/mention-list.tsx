import * as React from "react"
import { forwardRef, useEffect, useImperativeHandle, useState } from "react"

export interface MentionListProps {
  items: any[]
  command: (item: any) => void
}

const CLASS_COLORS: Record<number, string> = {
  1: "#C69B6D", // Warrior
  2: "#F48CBA", // Paladin
  3: "#AAD372", // Hunter
  4: "#FFF468", // Rogue
  5: "#FFFFFF", // Priest
  6: "#C41E3A", // Death Knight
  7: "#0070DD", // Shaman
  8: "#3FC7EB", // Mage
  9: "#8788EE", // Warlock
  10: "#00FF98", // Monk
  11: "#FF7C0A", // Druid
  12: "#A330C9", // Demon Hunter
  13: "#33937F", // Evoker
}

export const MentionList = forwardRef((props: MentionListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = (index: number) => {
    const item = props.items[index]
    if (item) {
      props.command({ id: item.id, label: item.character_name })
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
    <div className="z-[100] min-w-[180px] overflow-hidden rounded-xl border border-white/10 bg-zinc-950 p-1 shadow-2xl shadow-black/50 animate-in fade-in-0 zoom-in-95 duration-200">
      {props.items.length ? (
        props.items.map((item, index) => (
          <button
            key={item.id}
            onClick={() => selectItem(index)}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all ${
              index === selectedIndex ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white/80"
            }`}
          >
            <div 
              className="size-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]" 
              style={{ backgroundColor: CLASS_COLORS[item.class_id] || "#FFFFFF" }}
            />
            <span className="font-bold flex-1 uppercase tracking-tight text-xs">{item.character_name}</span>
            <span className="text-[9px] font-black opacity-20 uppercase tracking-widest italic">{item.role || "Miembro"}</span>
          </button>
        ))
      ) : (
        <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/20">No hay resultados</div>
      )}
    </div>
  )
})

MentionList.displayName = "MentionList"
