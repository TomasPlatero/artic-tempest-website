"use client";

import { TabsList, TabsTrigger } from "@/shared/ui/tabs";
import {
	IconSwords,
	IconChartBar,
	IconTrophy,
} from "@/shared/ui/tabler-icons";

export function StatsTabsHeader() {
	return (
		<TabsList
			className="mb-4 w-full justify-start overflow-x-auto h-auto min-h-10 bg-muted/20 p-1 flex-nowrap scrollbar-none"
			data-tour-step="stats-tabs"
		>
			<TabsTrigger
				value="wcl"
				className="shrink-0 flex items-center justify-center gap-2 text-[10px] sm:text-xs py-2 px-3 whitespace-nowrap"
			>
				<IconSwords className="size-3.5" /> Logs
			</TabsTrigger>
			<TabsTrigger
				value="inspector"
				className="shrink-0 flex items-center justify-center gap-2 text-[10px] sm:text-xs py-2 px-3 whitespace-nowrap"
			>
				<IconChartBar className="size-3.5" />
				<span className="hidden sm:inline">Armería Míticas Plus</span>
				<span className="sm:hidden">Armería M+</span>
			</TabsTrigger>
			<TabsTrigger
				value="performance"
				className="shrink-0 flex items-center justify-center gap-2 text-[10px] sm:text-xs py-2 px-3 whitespace-nowrap"
			>
				<IconTrophy className="size-3.5" /> Mi Rendimiento
			</TabsTrigger>
		</TabsList>
	);
}
