"use client";

import { useState } from "react";
import { IconBrandTwitch } from "@/shared/ui/tabler-icons";
import Image from "next/image";
import Link from "next/link";
import { useApiQuery } from "@/shared/hooks/use-api-query";
import { Button } from "@/shared/ui/button";
import {
	PUBLIC_CARD_REVEAL_CLASSES,
	PUBLIC_SECTION_REVEAL_CLASSES,
	PUBLIC_STAGGER_DELAY_CLASSES,
} from "@/shared/components/public-motion";
import { cn } from "@/shared/tailwind/tailwind-utils";

export function LandingStreamers({
	limit,
	initialStreamers,
}: {
	limit?: number;
	initialStreamers?: any[];
}) {
	const [activeStream, setActiveStream] = useState<string | null>(null);

	const { data: streamersData, isLoading } = useApiQuery<any[]>(
		"/api/streamers",
		{
			fallbackData: initialStreamers,
			refreshInterval: 60 * 1000,
		},
	);

	const base = Array.isArray(streamersData) ? streamersData : [];
	const streamers = limit ? base.slice(0, limit) : base;

	if (isLoading && !initialStreamers) return null;
	if (streamers.length === 0) return null;

	return (
		<section
			className={cn(
				"bg-zinc-950 px-6 py-24 text-center",
				PUBLIC_SECTION_REVEAL_CLASSES,
			)}
			aria-labelledby="streamers-title"
		>
			<div className="mx-auto max-w-7xl">
				<h2
					id="streamers-title"
					className="mb-4 flex items-center justify-center gap-3 text-4xl font-semibold uppercase tracking-[0.18em]"
				>
					<IconBrandTwitch className="size-10 text-purple-500" />
					<span className="text-blue-100 drop-shadow-[0_0_24px_rgba(96,165,250,0.35)]">
						Nuestros Streamers
					</span>
				</h2>
				<p className="mx-auto mb-12 max-w-2xl text-white/80">
					Sigue en directo nuestro progreso, raids y contenido diario a través
					de los canales oficiales de nuestros miembros.
				</p>

				<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
					{streamers.map((s, idx) => (
						<div
							key={s.id}
							className={cn(
								"group overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4  hover:border-purple-500/50",
								PUBLIC_CARD_REVEAL_CLASSES,
								PUBLIC_STAGGER_DELAY_CLASSES[idx] ?? "animate-delay-500",
							)}
						>
							<button
								type="button"
								className="relative mb-4 aspect-video w-full cursor-pointer overflow-hidden rounded-xl bg-zinc-950/50 group/stream"
								onClick={() => setActiveStream(s.twitch_username)}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										setActiveStream(s.twitch_username);
									}
								}}
								tabIndex={0}
							>
								{s.is_live && activeStream !== s.twitch_username && (
									<div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
										<div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-red-500/50 bg-zinc-950/60 px-3 py-1 backdrop-blur-md">
											<span className="size-2 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
											<span className="text-[10px] font-semibold uppercase tracking-widest text-white shadow-sm">
												En Directo
											</span>
										</div>
									</div>
								)}
								{s.is_live && activeStream === s.twitch_username ? (
									<iframe
										src={`https://player.twitch.tv/?channel=${s.twitch_username}&parent=localhost&parent=127.0.0.1&parent=artictempest.es&parent=www.artictempest.es&muted=true&autoplay=true`}
										className="size-full border-none"
										allow="autoplay; fullscreen"
										allowFullScreen
										sandbox="allow-scripts allow-popups"
										loading="lazy"
										referrerPolicy="strict-origin-when-cross-origin"
										title={`Twitch stream de ${s.twitch_username}`}
									/>
								) : (
									<div className="relative flex size-full flex-col items-center justify-center overflow-hidden bg-zinc-950/80">
										{s.is_live && s.thumbnail_url ? (
											<div className="absolute inset-0 z-0">
												<Image
													src={s.thumbnail_url}
													alt="Live Thumbnail"
													width={1280}
													height={720}
													className="absolute inset-0 size-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-110"
												/>
												<div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent" />
											</div>
										) : (
											s.avatar_url && (
												<div
													className="absolute inset-0 scale-125 opacity-20 blur-xl"
													style={{
														backgroundImage: `url(${s.avatar_url})`,
														backgroundSize: "cover",
														backgroundPosition: "center",
													}}
												/>
											)
										)}

										<div className="relative z-10 flex flex-col items-center gap-3">
											{s.avatar_url ? (
												<Image
													src={s.avatar_url}
													alt={s.twitch_username}
													width={64}
													height={64}
													className={`size-16 rounded-full border-2 border-white/10  ${s.is_live ? "border-purple-500 opacity-100 grayscale-0 shadow-[0_0_15px_rgba(168,85,247,0.5)]" : "opacity-70 grayscale"}`}
												/>
											) : (
												<IconBrandTwitch
													className={`size-12 transition-colors ${s.is_live ? "text-purple-400" : "text-white/20"}`}
												/>
											)}
											<div className="px-4 text-center">
												<p className="font-bold text-white/80">
													{s.twitch_username}
												</p>
												<p
													className={`mt-1 text-xs font-semibold uppercase tracking-widest ${s.is_live ? "text-purple-400" : "text-white/50"}`}
												>
													{s.is_live ? "En Vivo" : "Desconectado"}
												</p>
											</div>
										</div>
									</div>
								)}
							</button>
							<Button
								variant="landingTinted"
								size="landing"
								className="h-auto min-h-10 w-full px-4 py-2 text-[11px] normal-case tracking-[0.04em] whitespace-normal leading-snug"
								asChild
							>
								<a
									href={`https://twitch.tv/${s.twitch_username}`}
									target="_blank"
									rel="noreferrer"
									className="flex w-full items-center justify-center gap-2 text-center"
								>
									<IconBrandTwitch className="size-5 shrink-0 text-purple-300" />
									<span>Ver a {s.twitch_username}</span>
								</a>
							</Button>
						</div>
					))}
				</div>

				{limit && streamers.length >= limit && (
					<div className="mt-12">
						<Button variant="landingSecondary" size="landing" asChild>
							<Link href="/streamers">Ver todos los streamers</Link>
						</Button>
					</div>
				)}
			</div>
		</section>
	);
}
