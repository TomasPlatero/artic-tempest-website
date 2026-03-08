"use client"

import React from "react"
import Image from "next/image"
import { IconUser } from "@tabler/icons-react"
import { cn } from "@/infrastructure/tailwind/tailwind-utils"

interface CharacterAvatarProps {
    name: string
    realm?: string
    region?: string
    className?: string
    size?: number
}

export function CharacterAvatar({
    name,
    realm = "dun-modr",
    region = "eu",
    className,
    size = 40
}: CharacterAvatarProps) {
    const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState(false)

    React.useEffect(() => {
        if (!name) return

        const fetchAvatar = async () => {
            try {
                const realmSlug = realm.toLowerCase().trim().replace(/\s+/g, '-')
                const url = `https://raider.io/api/v1/characters/profile?region=${region}&realm=${realmSlug}&name=${encodeURIComponent(name)}&fields=active_spec_name`

                const res = await fetch(url)
                if (res.ok) {
                    const data = await res.json()
                    if (data.thumbnail_url) {
                        setAvatarUrl(data.thumbnail_url)
                    }
                }
            } catch (err) {
                console.warn(`Failed to fetch avatar for ${name}:`, err)
                setError(true)
            } finally {
                setLoading(false)
            }
        }

        fetchAvatar()
    }, [name, realm, region])

    if (!name) return null

    return (
        <div
            className={cn(
                "relative flex-shrink-0 rounded-full overflow-hidden bg-zinc-800 border border-white/10 flex items-center justify-center",
                className
            )}
            style={{ width: size, height: size }}
        >
            {avatarUrl && !error ? (
                <Image
                    src={avatarUrl}
                    alt={name}
                    width={size}
                    height={size}
                    className="size-full object-cover"
                    onError={() => setError(true)}
                />
            ) : (
                <IconUser className="size-1/2 text-zinc-600" />
            )}

            {loading && (
                <div className="absolute inset-0 bg-zinc-800 animate-pulse" />
            )}
        </div>
    )
}
