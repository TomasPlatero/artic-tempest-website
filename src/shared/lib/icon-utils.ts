import { IconCircle } from "@tabler/icons-react"
import { ALL_ICONS_MAP } from "./icons-list"

export const ICON_MAP: Record<string, any> = {
    ...ALL_ICONS_MAP,
    IconCircle
}

export function getIconByName(name: string | null | undefined) {
    if (!name) return IconCircle
    return ICON_MAP[name] || ICON_MAP[`Icon${name}`] || ICON_MAP[`Lucide${name}`] || IconCircle
}
