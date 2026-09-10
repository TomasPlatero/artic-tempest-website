import Image from "next/image";
import { IconExternalLink, IconTrash } from "@/shared/ui/tabler-icons";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { openExternalUrl } from "@/shared/lib/external-url";
import { getWowColorClass, type Upload } from "./weekly-vault-shared";

interface WeeklyVaultMobileGridProps {
	uploads: Upload[];
	formatUploadDate: (value: string) => string;
	onDelete: (id: string) => void;
	isDeleting: string | null;
}

export function WeeklyVaultMobileGrid({
	uploads,
	formatUploadDate,
	onDelete,
	isDeleting,
}: WeeklyVaultMobileGridProps) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
			{uploads.map((upload) => (
				<Card
					key={upload.id}
					className="overflow-hidden bg-white/5 border-white/10 group shadow-sm hover:shadow-md transition-shadow p-0"
				>
					<a
						href={upload.image_url}
						target="_blank"
						rel="noreferrer"
						className="block w-full h-28 overflow-hidden border-b border-white/10 shrink-0 relative"
					>
						<Image
							src={upload.image_url}
							alt="Vault"
							width={400}
							height={112}
							className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
						/>
						<div className="absolute inset-0 bg-zinc-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
							<IconExternalLink className="size-8 text-white drop-shadow-lg" />
						</div>
					</a>
					<CardContent className="p-3.5 flex items-center justify-between gap-3">
						<div className="flex flex-col min-w-0 flex-1">
							<div className="flex items-center gap-2 mb-1">
								{upload.profiles?.discord_avatar ? (
									<Image
										src={upload.profiles.discord_avatar}
										alt="Avatar"
										width={20}
										height={20}
										className="size-5 rounded-full bg-white/10 shrink-0"
									/>
								) : (
									<div className="size-5 rounded-full bg-white/10 shrink-0" />
								)}
								<span className="text-xs font-semibold text-white/90 truncate">
									{upload.profiles?.discord_username || "Desconocido"}
								</span>
								<span className="text-muted-foreground/30 text-[10px]">•</span>
								<span
									className="text-[10px] font-medium text-muted-foreground whitespace-nowrap"
									suppressHydrationWarning
								>
									{formatUploadDate(upload.created_at)}
								</span>
							</div>

							<div className="flex items-center gap-2">
								<span
									className={`font-bold text-lg leading-relaxed ${upload.bnet_characters ? getWowColorClass(upload.bnet_characters.class_id) : "text-foreground"} truncate`}
								>
									{upload.bnet_characters?.name || "Borrado"}
								</span>
							</div>
						</div>

						<div className="flex flex-col gap-2 shrink-0">
							<Button
								size="sm"
								variant="outline"
								onClick={() =>
									openExternalUrl(upload.image_url)
								}
							>
								Ver
							</Button>
							<Button
								size="icon"
								variant="destructive"
								aria-label="Eliminar captura"
								className="size-10 shrink-0 rounded-xl"
								onClick={() => onDelete(upload.id)}
								disabled={isDeleting === upload.id}
							>
								<IconTrash className="size-5" />
							</Button>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
