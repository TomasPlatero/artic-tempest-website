"use client";

import { useEffect, useRef, useState } from "react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://artictempest.es";
const WEBSITE_CARBON_URL = SITE_URL.replace(/^https?:\/\//, "").replace(
	/\/$/,
	"",
);

const API_URL = `https://api.websitecarbon.com/b?url=${encodeURIComponent(WEBSITE_CARBON_URL)}`;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const REFRESH_INTERVAL_MS = 60 * 60 * 1000; // re-fetch every hour while page is open

type BadgeData = {
	co2: string;
	percentage: string;
};

function readCachedBadge(key: string): BadgeData | null {
	try {
		if (typeof window === "undefined") return null;
		const cached = window.localStorage.getItem(key);
		if (!cached) return null;
		const parsed = JSON.parse(cached) as { c?: string; p?: string; t?: number };
		if (parsed.c && parsed.p) {
			if (parsed.t && Date.now() - parsed.t > CACHE_TTL_MS) {
				window.localStorage.removeItem(key);
				return null;
			}
			return { co2: parsed.c, percentage: parsed.p };
		}
	} catch {
		// ignore
	}
	return null;
}

function WebsiteCarbonBadgeWidgetInner() {
	const cacheKey = `wcb_${encodeURIComponent(WEBSITE_CARBON_URL)}`;
	const [badge, setBadge] = useState<BadgeData | null>(() =>
		readCachedBadge(cacheKey),
	);
	const errorRef = useRef(false);

	useEffect(() => {
		let cancelled = false;

		async function fetchBadge() {
			try {
				const res = await fetch(API_URL);
				if (cancelled) return;

				if (!res.ok) {
					errorRef.current = true;
					return;
				}
				const payload = (await res.json()) as { c?: string; p?: string };
				if (cancelled) return;

				if (payload.c && payload.p) {
					setBadge({ co2: payload.c, percentage: payload.p });
					window.localStorage.setItem(
						cacheKey,
						JSON.stringify({ ...payload, t: Date.now() }),
					);
				}
			} catch {
				if (!cancelled) errorRef.current = true;
			}
		}

		// Fetch latest data (cached value already initialized via useState lazy init)
		void fetchBadge();

		const interval = setInterval(() => {
			void fetchBadge();
		}, REFRESH_INTERVAL_MS);
		return () => {
			cancelled = true;
			clearInterval(interval);
		};
	}, [cacheKey]);

	const data = badge;

	const co2 = data?.co2 ?? "-";
	const percentage = data?.percentage ?? "";
	const percentageLabel = percentage
		? Number.parseInt(percentage, 10) > 50
			? `Cleaner than ${percentage}% of pages tested`
			: `Dirtier than ${percentage}% of pages tested`
		: "";

	return (
		<div className="flex flex-col gap-2">
			<a
				href={`https://www.websitecarbon.com/website/${WEBSITE_CARBON_URL}`}
				target="_blank"
				rel="noopener noreferrer"
				className="inline-flex items-stretch self-start overflow-hidden rounded-lg border border-emerald-400/30 text-[11px] font-bold uppercase tracking-[0.16em] text-white/90"
			>
				<span className="bg-white px-3 py-2 text-black">
					{co2}g of CO2/view
				</span>
				<span className="bg-emerald-400 px-3 py-2 text-black">
					Website Carbon
				</span>
			</a>
			{percentageLabel && (
				<p className="text-[10px] font-medium leading-relaxed text-white/60">
					{percentageLabel}
				</p>
			)}
		</div>
	);
}

export function WebsiteCarbonBadgeWidget() {
	return <WebsiteCarbonBadgeWidgetInner />;
}
