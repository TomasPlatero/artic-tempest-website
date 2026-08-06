"use client";

import { useState } from "react";
import { IconSearch } from "@/shared/ui/tabler-icons";
import { Input } from "@/shared/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select";

type FilterBarProps = {
	onSearchChange: (query: string) => void;
	onTypeChange: (type: "all" | "image" | "document") => void;
	searchValue?: string;
	typeValue?: "all" | "image" | "document";
};

export function FilterBar({
	onSearchChange,
	onTypeChange,
	searchValue = "",
	typeValue = "all",
}: FilterBarProps) {
	const [localSearch, setLocalSearch] = useState(searchValue);

	const handleSearchSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSearchChange(localSearch);
	};

	const handleSearchClear = () => {
		setLocalSearch("");
		onSearchChange("");
	};

	return (
		<div className="flex flex-col sm:flex-row gap-3">
			<form onSubmit={handleSearchSubmit} className="relative flex-1">
				<IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
				<Input
					type="text"
					placeholder="Buscar archivos…"
					value={localSearch}
					onChange={(e) => setLocalSearch(e.target.value)}
					className="pl-9 pr-8"
					data-testid="filter-search-input"
				/>
				{localSearch && (
					<button
						type="button"
						onClick={handleSearchClear}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 text-sm"
						aria-label="Limpiar búsqueda"
					>
						✕
					</button>
				)}
			</form>
			<Select
				value={typeValue}
				onValueChange={(value) =>
					onTypeChange(value as "all" | "image" | "document")
				}
			>
				<SelectTrigger
					className="w-full sm:w-[160px]"
					data-testid="filter-type-select"
				>
					<SelectValue placeholder="Todos los tipos" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">Todos los tipos</SelectItem>
					<SelectItem value="image">Imágenes</SelectItem>
					<SelectItem value="document">Documentos</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);
}
