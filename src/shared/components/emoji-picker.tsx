"use client";

import * as React from "react";
import { useDeferredValue } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import {
  EMOJI_LIST,
  getEmojiDisplayName,
  getEmojiSearchTerms,
} from "@/shared/lib/emojis";
import {
  IconMoodSmile,
  IconSearch,
  IconClock,
  IconHandStop,
  IconDeviceGamepad2,
  IconLeaf,
  IconMeat,
  IconComponents,
} from "@/shared/ui/tabler-icons";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  children?: React.ReactNode;
  recentScope?: string;
}

const EMOJI_CATEGORIES = [
  {
    id: "recent",
    name: "Recientes",
    icon: <IconClock className="size-3.5" />,
    emojis: ["🔥", "✨", "✅", "🎮", "⚔️", "💎", "🚀", "❤️", "👍", "👑"],
  },
  {
    id: "faces",
    name: "Caras y Personas",
    icon: <IconMoodSmile className="size-3.5" />,
    emojis: [
      "😀",
      "😃",
      "😄",
      "😁",
      "😆",
      "😅",
      "😂",
      "🤣",
      "😊",
      "😇",
      "🙂",
      "🙃",
      "😉",
      "😌",
      "😍",
      "🥰",
      "😘",
      "😗",
      "😙",
      "😚",
      "😋",
      "😛",
      "😝",
      "😜",
      "🤪",
      "🤨",
      "🧐",
      "🤓",
      "😎",
      "🤩",
      "🥳",
      "😏",
      "😒",
      "😞",
      "😔",
      "😟",
      "😕",
      "🙁",
      "☹️",
      "😣",
      "😖",
      "😫",
      "😩",
      "🥺",
      "😢",
      "😭",
      "😤",
      "😠",
      "😡",
      "🤬",
      "🤯",
      "😳",
      "🥵",
      "🥶",
      "😱",
      "😨",
      "😰",
      "😥",
      "😓",
      "🤗",
      "🤔",
      "🤭",
      "🤫",
      "🤥",
      "😶",
      "😐",
      "😑",
      "😬",
      "🙄",
      "😯",
      "😦",
      "😧",
      "😮",
      "😲",
      "🥱",
      "😴",
      "🤤",
      "😪",
      "😵",
      "🤐",
      "🥴",
      "🤢",
      "🤮",
      "🤧",
      "😷",
      "🤒",
      "🤕",
      "🤑",
      "🤠",
      "😈",
      "👿",
      "👹",
      "👺",
      "🤡",
      "💩",
      "👻",
      "💀",
      "☠️",
      "👽",
      "👾",
      "🤖",
      "🎃",
      "😺",
      "😸",
      "😹",
      "😻",
      "😼",
      "😽",
      "🙀",
      "😾",
    ],
  },
  {
    id: "gestures",
    name: "Gestos y Cuerpo",
    icon: <IconHandStop className="size-3.5" />,
    emojis: [
      "👋",
      "🤚",
      "🖐️",
      "✋",
      "🖖",
      "👌",
      "🤏",
      "✌️",
      "🤞",
      "🤟",
      "🤘",
      "🤙",
      "👈",
      "👉",
      "👆",
      "🖕",
      "👇",
      "☝️",
      "👍",
      "👎",
      "✊",
      "👊",
      "🤛",
      "🤜",
      "👏",
      "🙌",
      "👐",
      "🤲",
      "🤝",
      "🙏",
      "✍️",
      "💅",
      "🤳",
      "💪",
      "🦾",
      "🦵",
      "🦶",
      "👂",
      "🦻",
      "👃",
      "🧠",
      "🦷",
      "🦴",
      "👀",
      "👁️",
      "👅",
      "👄",
      "💋",
      "🩸",
    ],
  },
  {
    id: "gaming",
    name: "Gaming y Ocio",
    icon: <IconDeviceGamepad2 className="size-3.5" />,
    emojis: [
      "🎮",
      "🕹️",
      "💻",
      "⌨️",
      "🖱️",
      "🖥️",
      "🎧",
      "🎤",
      "🎬",
      "📺",
      "📱",
      "⚔️",
      "🛡️",
      "🏹",
      "🗡️",
      "🪓",
      "💣",
      "🧨",
      "🐲",
      "🐉",
      "🐺",
      "🦁",
      "🐯",
      "💎",
      "🥇",
      "🥈",
      "🥉",
      "🏆",
      "🎯",
      "🎲",
      "🎰",
      "🎳",
      "🎭",
      "🎨",
      "🧵",
      "🧶",
      "🎼",
      "🎵",
      "🎶",
      "🎹",
      "🎸",
      "🎺",
      "🎻",
      "🥁",
    ],
  },
  {
    id: "nature",
    name: "Naturaleza",
    icon: <IconLeaf className="size-3.5" />,
    emojis: [
      "🐶",
      "🐱",
      "🐭",
      "🐹",
      "🐰",
      "🦊",
      "🐻",
      "🐼",
      "🐨",
      "🐯",
      "🦁",
      "🐮",
      "🐷",
      "🐸",
      "🐵",
      "🐒",
      "🦍",
      "🦧",
      "🐕",
      "🐩",
      "🐺",
      "🦝",
      "🐈",
      "🐅",
      "🐆",
      "🐴",
      "🐎",
      "🦄",
      "🦓",
      "🦌",
      "🐂",
      "🐃",
      "🐄",
      "🐷",
      "🐗",
      "🐽",
      "🐏",
      "🐑",
      "🐐",
      "🐪",
      "🐫",
      "🦙",
      "🦒",
      "🐘",
      "🦏",
      "🦛",
      "🐿️",
      "🦫",
      "🦔",
      "🦇",
      "🦦",
      "🦨",
      "🦘",
      "🦡",
      "🐾",
      "🦃",
      "🎄",
      "🌱",
      "🌿",
      "☘️",
      "🍀",
      "🍃",
      "🍂",
      "🍁",
      "🍄",
      "🌾",
      "💐",
      "🌷",
      "🌹",
      "🥀",
      "🌺",
      "🌸",
      "🌼",
      "🌻",
      "🌞",
      "🌝",
      "🌛",
      "🌜",
      "🌚",
      "🌙",
      "🌎",
      "🌍",
      "🌏",
      "🪐",
      "💫",
      "⭐",
      "🌟",
      "✨",
      "⚡",
      "☄️",
      "💥",
      "🔥",
      "🌪️",
      "🌈",
      "☀️",
      "🌤️",
      "⛅",
      "🌥️",
      "☁️",
      "🌧️",
      "🌩️",
      "❄️",
      "☃️",
      "💨",
      "💧",
      "💦",
      "☔",
      "🌊",
    ],
  },
  {
    id: "food",
    name: "Comida",
    icon: <IconMeat className="size-3.5" />,
    emojis: [
      "🍏",
      "🍎",
      "🍐",
      "🍊",
      "🍋",
      "🍌",
      "🍉",
      "🍇",
      "🍓",
      "🍈",
      "🍒",
      "🍑",
      "🥭",
      "🍍",
      "🥥",
      "🥝",
      "🍅",
      "🍆",
      "🥑",
      "🥦",
      "🥬",
      "🥒",
      "🌶️",
      "🌽",
      "🥕",
      "🧄",
      "🧅",
      "🥔",
      "🍠",
      "🥐",
      "🥯",
      "🍞",
      "🥖",
      "🥨",
      "🧀",
      "🥚",
      "🍳",
      "🧈",
      "🥞",
      "🧇",
      "🥓",
      "🥩",
      "🍗",
      "🍖",
      "🌭",
      "🍔",
      "🍟",
      "🍕",
      "🥪",
      "🌮",
      "🌯",
      "🥗",
      "🥘",
      "🍝",
      "🍜",
      "🍲",
      "🍛",
      "🍣",
      "🍱",
      "🥟",
      "🦪",
      "🍤",
      "🍙",
      "🍚",
      "🍘",
      "🍥",
      "🥠",
      "🥮",
      "🍢",
      "🍡",
      "🍧",
      "🍨",
      "🍦",
      "🥧",
      "🧁",
      "🍰",
      "🎂",
      "🍮",
      "🍭",
      "🍬",
      "🍫",
      "🍿",
      "🍩",
      "🍪",
      "🌰",
      "🥜",
      "🍯",
      "🥛",
      "☕",
      "🍵",
      "🧃",
      "🥤",
      "🍶",
      "🍺",
      "🍻",
      "🥂",
      "🍷",
      "🥃",
      "🍸",
      "🍹",
      "🧉",
      "🍾",
      "🧊",
      "🥄",
      "🍴",
      "🍽️",
      "🥣",
      "🥡",
      "🥢",
      "🧂",
    ],
  },
  {
    id: "symbols",
    name: "Símbolos",
    icon: <IconComponents className="size-3.5" />,
    emojis: [
      "❤️",
      "🧡",
      "💛",
      "💚",
      "💙",
      "💜",
      "🖤",
      "🤍",
      "🤎",
      "💔",
      "❣️",
      "💕",
      "💞",
      "💓",
      "💗",
      "💖",
      "💘",
      "💝",
      "💟",
      "☮️",
      "✝️",
      "☪️",
      "🕉️",
      "☸️",
      "✡️",
      "🔯",
      "🕎",
      "☯️",
      "☦️",
      "🛐",
      "⛎",
      "♈",
      "♉",
      "♊",
      "♋",
      "♌",
      "♍",
      "♎",
      "♏",
      "♐",
      "♑",
      "♒",
      "♓",
      "🆔",
      "⚛️",
      "🉑",
      "☢️",
      "☣️",
      "📴",
      "📳",
      "🈶",
      "🈚",
      "🈸",
      "🈺",
      "🈷️",
      "✴️",
      "🆚",
      "💮",
      "🉐",
      "㊙️",
      "㊗️",
      "🈴",
      "🈵",
      "🈲",
      "🅰️",
      "🅱️",
      "🆎",
      "🆑",
      "🅾️",
      "🆘",
      "❌",
      "⭕",
      "🛑",
      "⛔",
      "📛",
      "🚫",
      "💯",
      "💢",
      "♨️",
      "🚷",
      "🚯",
      "🚳",
      "🚱",
      "🔞",
      "📵",
      "🚭",
      "❗",
      "❕",
      "❓",
      "❔",
      "‼️",
      "⁉️",
      "🔅",
      "🔆",
      "🔱",
      "⚜️",
      "⚠️",
      "🚸",
      "🔰",
      "♻️",
      "🈯",
      "💹",
      "❇️",
      "✳️",
      "❎",
      "✅",
      "💠",
      "🌀",
      "➿",
      "🌐",
      "Ⓜ️",
      "🏧",
      "🈂️",
      "🛂",
      "🛃",
      "🛄",
      "🛅",
      "🚹",
      "🚺",
      "🚼",
      "🚻",
      "🚮",
      "🚾",
      "♿",
      "🅿️",
      "🈳",
      "🈵",
      "🚰",
      "📶",
      "🎦",
      "🔣",
      "🔡",
      "🔤",
      "🔠",
      "🔲",
      "🔳",
      "🔘",
      "🏁",
      "🚩",
      "🎌",
      "🏴",
      "🏳️",
      "🏳️‍🌈",
      "🏳️‍⚧️",
      "🏴‍☠️",
      "📅",
      "📆",
      "🗓️",
      "🗑️",
      "🗒️",
      "📋",
      "⌛",
      "⏳",
      "⌚",
      "⏰",
      "⏱️",
      "⏲️",
      "🕰️",
      "🌡️",
      "☀️",
      "⭐",
      "🌙",
      "☁️",
      "⛅",
      "⚡",
      "❄️",
      "🔥",
      "💧",
      "🌊",
    ],
  },
];

const EmojiButton = ({
  emoji,
  onSelect,
  label,
}: {
  emoji: string;
  onSelect: (e: string) => void;
  label?: string;
}) => (
  <button type="button"
    onClick={() => onSelect(emoji)}
    className="size-8 flex items-center justify-center text-xl hover:bg-white/10 rounded-lg transition-transform hover:scale-125 active:scale-90"
    title={label || emoji}
    aria-label={label || emoji}
  >
    {emoji}
  </button>
);
EmojiButton.displayName = "EmojiButton";

const RECENT_KEY_PREFIX = "artic-recent-emojis";
const RECENT_LIMIT = 14;

const getRecentStorageKey = (scope?: string) =>
  scope ? `${RECENT_KEY_PREFIX}:${scope}` : RECENT_KEY_PREFIX;

const normalizeEmojiQuery = (value: string) =>
  value.toLowerCase().trim().replace(/[_-]+/g, " ").replace(/\s+/g, " ");

const EMOJI_SEARCH_INDEX = EMOJI_LIST.reduce<Record<string, string[]>>(
  (acc, item) => {
    const key = item.char;
    if (!acc[key]) acc[key] = [];
    acc[key].push(...getEmojiSearchTerms(item.name));
    return acc;
  },
  {},
);

const getEmojiLabel = (emoji: string) => {
  const aliases = EMOJI_SEARCH_INDEX[emoji] || [];
  if (aliases.length === 0) return emoji;
  return getEmojiDisplayName(aliases[0]);
};

export function EmojiPicker({
  onSelect,
  children,
  recentScope,
}: EmojiPickerProps) {
  const [search, setSearch] = React.useState("");
  const deferredSearch = useDeferredValue(search);
  const [open, setOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("recent");
  const recentStorageKey = (() =>
    getRecentStorageKey(recentScope))();
  const [recentEmojis, setRecentEmojis] = React.useState<string[]>(() => {
    if (typeof localStorage === "undefined") return [];
    let nextRecent: string[] = [];
    try {
      const saved = localStorage.getItem(recentStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const seen = new Set<string>();
          nextRecent = parsed.flatMap((emoji) => {
            if (
              typeof emoji !== "string" ||
              !(EMOJI_SEARCH_INDEX[emoji] || []).length ||
              seen.has(emoji)
            ) {
              return [];
            }
            seen.add(emoji);
            return [emoji];
          }).slice(0, RECENT_LIMIT);
        }
      }
    } catch {
      nextRecent = [];
    }
    return nextRecent;
  });

  const categoriesWithRecent = (() => {
    return EMOJI_CATEGORIES.map((cat) => {
      if (cat.id === "recent") {
        return {
          ...cat,
          emojis: recentEmojis,
        };
      }
      return cat;
    });
  })();

  // Filter — React Compiler manages this
  const filteredCategories = (() => {
    const query = normalizeEmojiQuery(deferredSearch);
    if (query === "") return null;

    return categoriesWithRecent.reduce(
      (acc, cat) => {
        const filtered = cat.emojis.filter((emoji) => {
          if (emoji.includes(query)) return true;

          const aliases = EMOJI_SEARCH_INDEX[emoji] || [];
          return aliases.some((alias) =>
            normalizeEmojiQuery(alias).includes(query),
          );
        });

        if (filtered.length > 0) {
          acc.push({ ...cat, emojis: filtered });
        }
        return acc;
      },
      [] as Array<{ id: string; name: string; emojis: string[] }>,
    );
  })();

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    setOpen(false);
    setSearch("");

    // Update recent
    const updated = [emoji, ...recentEmojis.filter((e) => e !== emoji)].slice(
      0,
      RECENT_LIMIT,
    );
    setRecentEmojis(updated);
    localStorage.setItem(recentStorageKey, JSON.stringify(updated));
  };

  const activeCategory = (() =>
    categoriesWithRecent.find((cat) => cat.id === activeTab))();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children || (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-white/40 hover:text-white hover:bg-white/5 "
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
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="w-full h-8 bg-transparent p-0 justify-between gap-0.5">
                {categoriesWithRecent.map((cat) => (
                  <TabsTrigger
                    key={cat.id}
                    value={cat.id}
                    title={cat.name}
                    className="flex-1 h-7 p-0 rounded-md data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/40 hover:text-white/60  focus-visible:ring-1 focus-visible:ring-white/20"
                  >
                    {cat.icon}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="mt-2 outline-none">
                <h4 className="text-[10px] uppercase font-semibold tracking-widest text-white/30 px-1 mb-2">
                  {activeCategory?.name}
                </h4>
                <ScrollArea className="h-56 pr-2">
                  {activeCategory?.id === "recent" &&
                  (activeCategory?.emojis.length || 0) === 0 ? (
                    <div className="py-8 text-center text-[10px] uppercase font-bold tracking-widest text-white/20">
                      Aun no usaste emojis
                    </div>
                  ) : (
                    <div className="grid grid-cols-7 gap-1 pb-2">
                      {activeCategory?.emojis.map((emoji) => (
                        <EmojiButton
                          key={`${activeTab}-${emoji}`}
                          emoji={emoji}
                          onSelect={handleSelect}
                          label={getEmojiLabel(emoji)}
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </Tabs>
          )}

          {search !== "" && (
            <ScrollArea className="h-64 mt-2">
              <div className="space-y-4 pr-2">
                {!filteredCategories || filteredCategories.length === 0 ? (
                  <div className="py-8 text-center text-[10px] uppercase font-bold tracking-widest text-white/20">
                    No hay resultados
                  </div>
                ) : (
                  filteredCategories.map((cat) => (
                    <div key={cat.id} className="space-y-2">
                      <h4 className="text-[10px] uppercase font-semibold tracking-widest text-white/30 px-1">
                        {cat.name}
                      </h4>
                      <div className="grid grid-cols-7 gap-1">
                        {cat.emojis.map((emoji) => (
                          <EmojiButton
                            key={`search-${cat.id}-${emoji}`}
                            emoji={emoji}
                            onSelect={handleSelect}
                            label={getEmojiLabel(emoji)}
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
          <div className="flex gap-1 items-center grayscale opacity-20 hover:grayscale-0 hover:opacity-100 ">
            <span className="text-[9px] font-bold text-white/40 cursor-default">
              ⚡ Ultra Fast
            </span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
