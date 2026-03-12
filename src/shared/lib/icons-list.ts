import * as Tabler from "@tabler/icons-react"
import * as Lucide from "lucide-react"

// Filter out non-icon exports
// React components can be functions OR objects (forwardRef)
const isIcon = (val: any) => val && (typeof val === "function" || typeof val === "object")

const tablerIcons = Object.keys(Tabler).filter(key => key.startsWith("Icon") && isIcon((Tabler as any)[key]))

// For Lucide, we also want to filter out keys ending in "Icon" to avoid duplicates (e.g. Activity and ActivityIcon)
const lucideIcons = Object.keys(Lucide).filter(key =>
    /^[A-Z]/.test(key) &&
    !key.endsWith("Icon") &&
    isIcon((Lucide as any)[key]) &&
    key !== "LucideIcon" &&
    key !== "icons"
)

export const FAMOUS_ICON_PACKS = [
    {
        name: "Tabler Icons",
        prefix: "",
        icons: tablerIcons
    },
    {
        name: "Lucide Icons",
        prefix: "Lucide",
        icons: lucideIcons
    }
]

export const ALL_ICONS_MAP: Record<string, any> = {
    // Tabler Icons
    ...Object.fromEntries(
        tablerIcons.map(key => [key, (Tabler as any)[key]])
    ),
    // Lucide Icons (with "Lucide" prefix)
    ...Object.fromEntries(
        lucideIcons.map(key => ["Lucide" + key, (Lucide as any)[key]])
    )
}
