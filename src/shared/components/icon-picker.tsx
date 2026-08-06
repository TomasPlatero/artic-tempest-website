"use client";

import React from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { ALL_ICONS_MAP } from "@/shared/lib/icons-list";
import { IconSearch, IconCircle } from "@/shared/ui/tabler-icons";
import { cn } from "@/shared/tailwind/tailwind-utils";

interface IconPickerProps {
	value: string;
	onSelect: (value: string) => void;
}

type TablerModule = Record<string, React.ComponentType<{ className?: string }>>;

const ITEMS_PER_PAGE = 48;

/** Converts "a-b-2" → "IconAB2" */
function kebabToPascal(kebab: string) {
	const parts = kebab
		.split("-")
		.map((s) => s.charAt(0).toUpperCase() + s.slice(1));
	return `Icon${parts.join("")}`;
}

async function loadTablerModules(): Promise<[TablerModule, string[]]> {
	const [mod, list] = await Promise.all([
		import("@tabler/icons-react"),
		import("@tabler/icons-react/dist/esm/icons-list.mjs"),
	]);
	const tabler = mod as unknown as TablerModule;
	const names = (list as { default: string[] }).default;
	return [tabler, names.map(kebabToPascal)];
}

export function IconPicker({ value, onSelect }: IconPickerProps) {
	const [open, setOpen] = React.useState(false);
	const [search, setSearch] = React.useState("");
	const [page, setPage] = React.useState(1);
	const searchId = React.useId();

	// Lazy-loaded resources
	const [tablerModule, setTablerModule] = React.useState<TablerModule | null>(
		null,
	);
	const [allNames, setAllNames] = React.useState<string[] | null>(null);

	// Load everything in one shot when dialog opens
	React.useEffect(() => {
		if (open && tablerModule === null) {
			loadTablerModules()
				.then(([tabler, names]) => {
					setTablerModule(tabler);
					setAllNames(names);
				})
				.catch((err) => {
					console.error("Failed to load icon modules:", err);
				});
		}
	}, [open, tablerModule]);

	const CurrentIcon = ALL_ICONS_MAP[value] || IconCircle;

	const filteredNames = (() => {
		if (!allNames) return [];
		if (!search.trim()) return allNames;

		const q = search.toLowerCase();
		return allNames.filter((name) => name.toLowerCase().includes(q));
	})();

	const totalPages = Math.ceil(filteredNames.length / ITEMS_PER_PAGE);
	const pageNames = filteredNames.slice(
		(page - 1) * ITEMS_PER_PAGE,
		page * ITEMS_PER_PAGE,
	);

	/** Get an icon component from the lazy-loaded barrel */
	function getIcon(name: string) {
		if (tablerModule && tablerModule[name]) return tablerModule[name];
		return null;
	}

	const isLoading = tablerModule === null;

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					aria-haspopup="dialog"
					aria-expanded={open}
					className="w-full justify-start gap-3 h-12 bg-white/5 border-white/10 hover:bg-white/10 px-4"
				>
					<CurrentIcon className="size-5 text-primary" />
					<span className="truncate text-sm font-medium">
						{value || "Seleccionar icono..."}
					</span>
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-2xl bg-zinc-950 border-white/10 p-0 overflow-hidden rounded-[2rem] flex flex-col h-[80vh]">
				<DialogHeader className="p-6 pb-2">
					<DialogTitle className="text-xl font-semibold uppercase tracking-tight">
						Seleccionar Icono
					</DialogTitle>
					<DialogDescription className="sr-only">
						Busca y selecciona un icono de la librería de Tabler Icons
					</DialogDescription>
				</DialogHeader>

				<div className="px-6 pb-2 space-y-4">
					<div className="space-y-2">
						<Label
							htmlFor={searchId}
							className="text-xs uppercase tracking-widest text-white/40 font-semibold"
						>
							Buscar icono
						</Label>
						<div className="relative">
							<IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
							<Input
								id={searchId}
								placeholder="Buscar entre 6.000+ iconos..."
								className="bg-white/5 border-white/10 pl-10 h-11 rounded-xl"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
						</div>
					</div>
				</div>

				<div className="flex-1 overflow-y-auto px-6 pb-2 custom-scrollbar">
					{isLoading ? (
						<div className="flex items-center justify-center py-16">
							<div className="flex flex-col items-center gap-3">
								<div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
								<span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
									Cargando iconos...
								</span>
							</div>
						</div>
					) : pageNames.length === 0 ? (
						<div className="col-span-full py-12 text-center text-muted-foreground text-xs uppercase tracking-widest font-bold">
							No se encontraron iconos
						</div>
					) : (
						<div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
							{pageNames.map((iconName) => {
								const IconComp = getIcon(iconName);
								return (
									<button
										type="button"
										key={iconName}
										onClick={() => {
											onSelect(iconName);
											setOpen(false);
										}}
										aria-label={`Seleccionar icono ${iconName}`}
										className={cn(
											"group flex flex-col items-center justify-center p-3 rounded-xl border hover:scale-110 transition-transform",
											value === iconName
												? "bg-primary border-primary text-zinc-950 ring-4 ring-primary/20"
												: "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10 hover:border-white/10 hover:text-white",
										)}
										title={iconName}
									>
										{IconComp ? (
											<IconComp className="size-6 transition-transform group-hover:rotate-6" />
										) : (
											<div className="size-6" />
										)}
									</button>
								);
							})}
						</div>
					)}
				</div>

				{/* Pagination */}
				{totalPages > 1 && (
					<div className="px-6 py-3 bg-white/5 border-t border-white/5 flex items-center justify-center gap-4">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							disabled={page === 1}
							onClick={() => setPage((p) => Math.max(1, p - 1))}
							className="uppercase text-[10px] font-semibold tracking-widest"
						>
							Anterior
						</Button>
						<span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
							Página {page} de {totalPages}
						</span>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							disabled={page === totalPages}
							onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
							className="uppercase text-[10px] font-semibold tracking-widest"
						>
							Siguiente
						</Button>
					</div>
				)}

				<div className="p-4 bg-white/5 border-t border-white/5 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-primary/10 rounded-lg">
							<CurrentIcon className="size-5 text-primary" />
						</div>
						<div className="flex flex-col">
							<span className="text-[10px] uppercase font-semibold text-white/40 tracking-wider leading-none mb-1">
								Seleccionado
							</span>
							<span className="text-sm font-bold text-white max-w-[200px] truncate">
								{value || "Ninguno"}
							</span>
						</div>
					</div>
					<div className="text-[9px] uppercase font-semibold text-muted-foreground/40 tabular-nums">
						{allNames ? `${filteredNames.length} iconos` : "—"}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
