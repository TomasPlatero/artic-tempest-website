"use client";

import Image from "next/image";
import { SidebarTrigger } from "@/shared/components/sidebar";
import { Skeleton } from "@/shared/ui/skeleton";
import { useApiQuery } from "@/shared/hooks/use-api-query";

type GuildInfoResponse = {
	icon_url?: string | null;
	mobile_icon_url?: string | null;
};

export function SiteHeader() {
	const { data, isLoading } = useApiQuery<GuildInfoResponse>("/api/guild/info");
	const icons = {
		main: data?.icon_url ?? null,
		mobile: data?.mobile_icon_url ?? null,
	};

	return (
		<header className="flex h-16 shrink-0 items-center gap-2 border-b lg:hidden bg-background/50 backdrop-blur-sm z-50">
			<div className="flex w-full items-center justify-between gap-1 px-4">
				<SidebarTrigger className="-ml-1 size-8" />

				<div className="flex-1 flex justify-center pr-8">
					{isLoading ? (
						<Skeleton className="h-6 w-32 bg-white/5" />
					) : icons.mobile || icons.main ? (
						<div className="relative h-25 w-48">
							<Image
								src={icons.mobile || icons.main || ""}
								alt="Logo"
								fill
								sizes="192px"
								className="object-contain object-center"
								priority
							/>
						</div>
					) : (
						<span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40 italic">
							Artic Tempest
						</span>
					)}
				</div>
			</div>
		</header>
	);
}
