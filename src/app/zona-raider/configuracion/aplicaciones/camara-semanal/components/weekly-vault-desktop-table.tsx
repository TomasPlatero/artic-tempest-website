import Image from "next/image";
import {
	IconArrowsSort,
	IconExternalLink,
	IconSortAscending,
	IconSortDescending,
	IconTrash,
} from "@/shared/ui/tabler-icons";
import { Button } from "@/shared/ui/button";
import {
	getWowColorClass,
	type SortConfig,
	type Upload,
} from "./weekly-vault-shared";

interface WeeklyVaultDesktopTableProps {
	uploads: Upload[];
	sortConfig: SortConfig;
	formatUploadDate: (value: string) => string;
	onSort: (key: string) => void;
	onDelete: (id: string) => void;
	isDeleting: string | null;
}

function getSortIcon(sortConfig: SortConfig, key: string) {
	if (sortConfig.key !== key)
		return <IconArrowsSort className="size-3.5 opacity-30" />;
	return sortConfig.direction === "asc" ? (
		<IconSortAscending className="size-3.5 text-blue-400" />
	) : (
		<IconSortDescending className="size-3.5 text-blue-400" />
	);
}

export function WeeklyVaultDesktopTable({
	uploads,
	sortConfig,
	formatUploadDate,
	onSort,
	onDelete,
	isDeleting,
}: WeeklyVaultDesktopTableProps) {
	return (
		<div className="hidden md:block rounded-xl border border-white/10 bg-card/60 backdrop-blur-sm overflow-hidden shadow-xl">
			<table className="w-full text-sm text-left">
				<thead className="bg-white/5 text-muted-foreground text-xs uppercase tracking-wider">
					<tr>
						<th className="px-4 py-3 font-medium">Captura</th>
						<th
							className="px-4 py-3 font-medium"
							aria-sort={
								sortConfig?.key === "character"
									? sortConfig.direction === "asc"
										? "ascending"
										: "descending"
									: "none"
							}
						>
							<button
								type="button"
								className="flex items-center gap-2 cursor-pointer hover:bg-white/5 transition-colors uppercase tracking-wider text-muted-foreground text-xs font-medium"
								onClick={() => onSort("character")}
							>
								Personaje {getSortIcon(sortConfig, "character")}
							</button>
						</th>
						<th
							className="px-4 py-3 font-medium"
							aria-sort={
								sortConfig?.key === "player"
									? sortConfig.direction === "asc"
										? "ascending"
										: "descending"
									: "none"
							}
						>
							<button
								type="button"
								className="flex items-center gap-2 cursor-pointer hover:bg-white/5 transition-colors uppercase tracking-wider text-muted-foreground text-xs font-medium"
								onClick={() => onSort("player")}
							>
								Jugador {getSortIcon(sortConfig, "player")}
							</button>
						</th>
						<th className="px-4 py-3 font-medium">Subida el</th>
						<th className="px-4 py-3 font-medium text-right">Acciones</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-white/5">
					{uploads.map((upload) => (
						<tr
							key={upload.id}
							className="hover:bg-white/5 transition-colors group"
						>
							<td className="px-4 py-3 w-32">
								<a
									href={upload.image_url}
									target="_blank"
									rel="noreferrer"
									className="block w-24 h-16 rounded overflow-hidden border border-white/10 shrink-0 relative"
								>
									<Image
										src={upload.image_url}
										alt="Vault"
										width={96}
										height={64}
										className="size-full object-cover group-hover:scale-110 transition-transform duration-300"
									/>
									<div className="absolute inset-0 bg-zinc-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
										<IconExternalLink className="size-5 text-white drop-shadow-md" />
									</div>
								</a>
							</td>
							<td className="px-4 py-3 whitespace-nowrap">
								<span
									className={`font-bold text-base ${upload.bnet_characters ? getWowColorClass(upload.bnet_characters.class_id) : "text-foreground"}`}
								>
									{upload.bnet_characters?.name || "Borrado"}
								</span>
							</td>
							<td className="px-4 py-3 whitespace-nowrap">
								<div className="flex items-center gap-2">
									{upload.profiles?.discord_avatar ? (
										<Image
											src={upload.profiles.discord_avatar}
											alt="Avatar"
											width={24}
											height={24}
											className="size-6 rounded-full bg-white/10 shrink-0"
										/>
									) : (
										<div className="size-6 rounded-full bg-white/10 shrink-0" />
									)}
									<span className="font-medium text-white/80">
										{upload.profiles?.discord_username || "Desconocido"}
									</span>
								</div>
							</td>
							<td
								className="px-4 py-3 whitespace-nowrap text-muted-foreground"
								suppressHydrationWarning
							>
								{formatUploadDate(upload.created_at)}
							</td>
							<td className="px-4 py-3 whitespace-nowrap text-right">
								<div className="flex justify-end gap-2">
									<Button
										size="sm"
										variant="outline"
										onClick={() =>
											window.open(
												upload.image_url,
												"_blank",
												"noopener,noreferrer",
											)
										}
									>
										Ver
									</Button>
									<Button
										size="sm"
										variant="destructive"
										onClick={() => onDelete(upload.id)}
										disabled={isDeleting === upload.id}
										aria-label="Eliminar"
									>
										<IconTrash className="size-4" />
									</Button>
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
