"use client";

import React from "react";
import Image from "next/image";
import { IconUser } from "@/shared/ui/tabler-icons";
import { cn } from "@/shared/tailwind/tailwind-utils";
import useSWR from "swr";

interface CharacterAvatarProps {
	name: string;
	realm?: string;
	region?: string;
	className?: string;
	size?: number;
}

export function CharacterAvatar({
	name,
	realm = "dun-modr",
	region = "eu",
	className,
	size = 40,
}: CharacterAvatarProps) {
	const realmSlug = realm.toLowerCase().trim().replace(/\s+/g, "-");
	const avatarUrlProxy = name
		? `/api/raiderio?path=/characters/profile&region=${region}&realm=${realmSlug}&name=${encodeURIComponent(name)}&fields=active_spec_name`
		: null;

	const { data, error } = useSWR(avatarUrlProxy, async (url: string) => {
		// Only allow same-origin requests (SSRF guard)
		if (!url.startsWith("/")) return null;
		const res = await fetch(url);
		if (!res.ok) throw new Error("Failed to fetch avatar");
		return res.json();
	});

	const avatarUrl = data?.thumbnail_url ?? null;
	const loading = Boolean(name) && !data && !error;

	if (!name) return null;

	return (
		<div
			className={cn(
				"relative shrink-0 rounded-full overflow-hidden bg-zinc-800 border border-white/10 flex items-center justify-center",
				className,
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
				/>
			) : (
				<IconUser className="size-1/2 text-zinc-600" />
			)}

			{loading && (
				<div className="absolute inset-0 bg-zinc-800 animate-pulse" />
			)}
		</div>
	);
}
