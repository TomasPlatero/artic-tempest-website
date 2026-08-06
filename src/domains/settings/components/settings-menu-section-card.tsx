"use client";

import type React from "react";

export function SectionCard({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="space-y-4 rounded-2xl border border-white/5 bg-white/[0.015] p-4 sm:p-5">
			<div>
				<p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
					{title}
				</p>
				{description && (
					<p className="mt-1 text-sm text-muted-foreground/80">{description}</p>
				)}
			</div>
			{children}
		</div>
	);
}
