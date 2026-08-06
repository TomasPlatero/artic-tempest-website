"use client";

import { Input } from "@/shared/ui/input";
import { IconSearch, IconSwords } from "@/shared/ui/tabler-icons";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select";
import type { WclState } from "./stats.types";

export function WclFilterControls({
	wcl,
	zones,
	onZoneChange,
	onTagChange,
	onSearchChange,
}: {
	wcl: WclState;
	zones: { group: string; zones: { id: string; name: string }[] }[];
	onZoneChange: (value: string) => void;
	onTagChange: (value: string) => void;
	onSearchChange: (value: string) => void;
}) {
	return (
		<div className="flex flex-col md:flex-row items-stretch md:items-center justify-center gap-3 w-full md:w-auto">
			<a
				href="https://www.warcraftlogs.com/guild/id/743623"
				target="_blank"
				rel="noreferrer"
				className="h-9 px-4 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-900/20"
			>
				<IconSwords className="size-4" /> Perfil de Hermandad
			</a>
			<div className="grid grid-cols-2 md:flex md:items-center gap-2 w-full md:w-auto">
				<Select value={wcl.zoneFilter} onValueChange={onZoneChange}>
					<SelectTrigger className="h-9 w-full md:w-auto md:min-w-[180px] bg-background/50 border-border/40 text-[10px] md:text-xs">
						<SelectValue placeholder="Raid / Zona" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todas las zonas</SelectItem>
						{zones.map((group) => (
							<div key={group.group}>
								<div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
									{group.group}
								</div>
								{group.zones.map((z) => (
									<SelectItem key={z.id} value={z.id}>
										{z.name}
									</SelectItem>
								))}
							</div>
						))}
					</SelectContent>
				</Select>
				{wcl.tags.length > 0 ? (
					<Select value={wcl.tagFilter} onValueChange={onTagChange}>
						<SelectTrigger className="h-9 w-full md:w-auto md:min-w-[110px] bg-background/50 border-border/40 text-[10px] md:text-xs">
							<SelectValue placeholder="Tag" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Todos los Tags</SelectItem>
							{wcl.tags.map((tag) => (
								<SelectItem key={tag.id} value={String(tag.id)}>
									{tag.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				) : (
					<div className="h-9 px-3 rounded-md bg-background/50 border border-border/40 flex items-center justify-center text-[10px] text-muted-foreground/40 md:hidden">
						Sin Tags
					</div>
				)}
			</div>
			<div className="relative w-full md:w-48">
				<IconSearch className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
				<Input
					placeholder="Buscar reporte…"
					className="pl-9 h-9 bg-background/50 border-border/40 text-[10px] md:text-xs"
					value={wcl.searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
				/>
			</div>
		</div>
	);
}
