"use client";

import Link from "next/link";
import { IconArrowRight } from "@/shared/ui/tabler-icons";

import { Button } from "@/shared/ui/button";

export function Season2Banner() {
	return (
		<div
			className="sticky top-0 z-50 w-full"
			style={{
				backgroundColor: "#172554",
				borderBottom: "1px solid rgba(59, 130, 246, 0.4)",
			}}
		>
			<div className="mx-auto flex max-w-[1600px] items-center justify-center gap-3 px-4 py-5 text-sm desktop:px-6">
				<span
					style={{
						display: "flex",
						width: 20,
						height: 20,
						flexShrink: 0,
						alignItems: "center",
						justifyContent: "center",
						borderRadius: "50%",
						backgroundColor: "#eab308",
						fontSize: 11,
						fontWeight: 700,
						color: "#422006",
						lineHeight: 1,
					}}
				>
					!
				</span>
				<p className="min-w-0 text-sm font-semibold text-white">
					Apúntate al roster de la Temporada 2 de Midnight.
				</p>

				<Button
					asChild
					size="sm"
					className="shrink-0 gap-1.5 bg-blue-600 text-xs text-white shadow-none hover:bg-blue-500"
				>
					<Link href="/zona-raider/roster/season-2">
						Apuntarme
						<IconArrowRight className="size-3.5" />
					</Link>
				</Button>
			</div>
		</div>
	);
}
