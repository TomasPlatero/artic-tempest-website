"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { parseISO } from "date-fns";
import { cn } from "@/shared/tailwind/tailwind-utils";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select";
import {
	IconLoader2,
	IconCloudUpload,
	IconPhoto,
} from "@/shared/ui/tabler-icons";

const WEEKLY_VAULT_DATE_FORMATTER = new Intl.DateTimeFormat("es-ES", {
	day: "2-digit",
	month: "2-digit",
	year: "numeric",
	hour: "2-digit",
	minute: "2-digit",
	hour12: false,
	timeZone: "UTC",
});

const WEEKLY_VAULT_WEEK_FORMATTER = new Intl.DateTimeFormat("es-ES", {
	day: "numeric",
	month: "long",
	timeZone: "UTC",
});

function VaultDateText({ value }: { value: string }) {
	return WEEKLY_VAULT_DATE_FORMATTER.format(new Date(value));
}

function VaultWeekText({ value }: { value: string }) {
	return WEEKLY_VAULT_WEEK_FORMATTER.format(parseISO(value));
}

function getWowColorClass(classId: number): string {
	const classColors: Record<number, string> = {
		1: "text-[#C79C6E]", // Warrior
		2: "text-[#F58CBA]", // Paladin
		3: "text-[#ABD473]", // Hunter
		4: "text-[#FFF569]", // Rogue
		5: "text-[#FFFFFF]", // Priest
		6: "text-[#C41E3A]", // Death Knight
		7: "text-[#0070DE]", // Shaman
		8: "text-[#69CCF0]", // Mage
		9: "text-[#9482C9]", // Warlock
		10: "text-[#00FF96]", // Monk
		11: "text-[#FF7D0A]", // Druid
		12: "text-[#A330C9]", // Demon Hunter
		13: "text-[#33937F]", // Evoker
	};
	return classColors[classId] || "text-foreground";
}

type Character = {
	id: string;
	name: string;
	realm_slug: string;
	char_class: number;
};

type Upload = {
	id: string;
	created_at: string;
	week_start: string;
	image_url: string;
	notes: string | null;
	bnet_characters: { name: string; class_id: number };
};

interface Props {
	characters: any[];
	guildId?: string;
	uploads: any[];
	activeCharacterId?: string;
	mainCharacterId?: string;
}

/** Helper separado para que React Compiler pueda optimizar el componente principal */
async function doUpload(
	file: File,
	guildId: string,
	selectedCharacter: string,
	notes: string,
	setUploadState: any,
): Promise<{ success: boolean; error?: string }> {
	try {
		const formData = new FormData();
		formData.append("file", file);
		formData.append("guild_id", guildId);
		formData.append("character_id", selectedCharacter);
		formData.append("notes", notes);

		const res = await fetch("/api/weekly-vault", {
			method: "POST",
			body: formData,
		});

		if (!res.ok) {
			const data = await res.json();
			return { success: false, error: data.error || "Failed to upload image." };
		}

		const newUpload = await res.json();
		setUploadState((prev: any) => ({
			...prev,
			uploads: [newUpload, ...prev.uploads],
		}));

		toast.success("¡Captura subida con éxito!");
		setUploadState((prev: any) => ({ ...prev, file: null, previewUrl: null }));
		return { success: true };
	} catch (error: any) {
		return {
			success: false,
			error: error.message || "Hubo un error al subir la captura.",
		};
	}
}

export function WeeklyVaultUploader(props: Props) {
	return useWeeklyVaultUploader(props);
}

function useWeeklyVaultUploader({
	characters,
	guildId,
	uploads: initialUploads,
	activeCharacterId,
	mainCharacterId,
}: Props) {
	const sortedCharacters = (() => {
		if (!characters) return characters;

		const hasMain = mainCharacterId != null;
		const hasActive = activeCharacterId != null;

		if (!hasMain && !hasActive) return characters;

		return characters.toSorted((a, b) => {
			const aIsMain = hasMain && a.id === mainCharacterId;
			const bIsMain = hasMain && b.id === mainCharacterId;
			if (aIsMain !== bIsMain) return aIsMain ? -1 : 1;

			const aIsActive = hasActive && a.id === activeCharacterId;
			const bIsActive = hasActive && b.id === activeCharacterId;
			if (aIsActive !== bIsActive) return aIsActive ? -1 : 1;

			return 0;
		});
	})();

	const [uploadState, setUploadState] = useState({
		selectedCharacter: (sortedCharacters[0]?.id || "") as string,
		file: null as File | null,
		isUploading: false,
		uploads: initialUploads as Upload[],
		previewUrl: null as string | null,
		notes: "",
		isDragging: false,
	});

	// Revoke previous object URL to free memory
	useEffect(() => {
		const url = uploadState.previewUrl;
		return () => {
			if (url) URL.revokeObjectURL(url);
		};
	}, [uploadState.previewUrl]);
	const {
		selectedCharacter,
		file,
		isUploading,
		uploads,
		previewUrl,
		notes,
		isDragging,
	} = uploadState;
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setUploadState((prev) => ({ ...prev, isDragging: true }));
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setUploadState((prev) => ({ ...prev, isDragging: false }));
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setUploadState((prev) => ({ ...prev, isDragging: false }));

		if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
			const droppedFile = e.dataTransfer.files[0];
			if (droppedFile.type.startsWith("image/")) {
				setUploadState((prev) => ({
					...prev,
					file: droppedFile,
					previewUrl: URL.createObjectURL(droppedFile), // react-doctor-disable-line no-create-object-url-without-revoke
				}));
			} else {
				toast.error("Por favor, sube solo archivos de imagen.");
			}
		}
	};

	const handleContainerClick = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			const selectedFile = e.target.files[0];
			setUploadState((prev) => ({
				...prev,
				file: selectedFile,
				previewUrl: URL.createObjectURL(selectedFile), // react-doctor-disable-line no-create-object-url-without-revoke
			}));
		}
	};

	const isSubmittingRef = useRef(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (isSubmittingRef.current) return;

		if (!guildId) {
			toast.error("No se ha encontrado a qué hermandad perteneces.");
			return;
		}
		if (!selectedCharacter) {
			toast.error("Selecciona un personaje.");
			return;
		}
		if (!file) {
			toast.error("Selecciona una captura de pantalla.");
			return;
		}

		isSubmittingRef.current = true;

		setUploadState((prev) => ({ ...prev, isUploading: true }));

		// Separado para que React Compiler pueda optimizar el resto del componente
		const result = await doUpload(
			file,
			guildId,
			selectedCharacter,
			notes,
			setUploadState,
		);

		if (!result.success) {
			toast.error(result.error || "Hubo un error al subir la captura.");
		}

		isSubmittingRef.current = false;
		setUploadState((prev) => ({ ...prev, isUploading: false }));
	};

	return (
		<div className="grid gap-6 md:grid-cols-2">
			<Card data-tour-step="weekly-vault-upload">
				<CardHeader>
					<CardTitle>Subir Captura</CardTitle>
					<CardDescription>
						Sube la imagen completa de lo que te ha salido en la Gran Cámara
						para el personaje seleccionado.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-6">
						<div className="space-y-2" data-tour-step="weekly-vault-character">
							<Label htmlFor="character">Personaje</Label>
							<Select
								value={selectedCharacter}
								onValueChange={(value) =>
									setUploadState((prev) => ({
										...prev,
										selectedCharacter: value,
									}))
								}
							>
								<SelectTrigger id="character">
									<SelectValue placeholder="Selecciona un personaje" />
								</SelectTrigger>
								<SelectContent>
									{sortedCharacters.map((char: Character) => (
										<SelectItem key={char.id} value={char.id}>
											<span className={getWowColorClass(char.char_class)}>
												{char.name}
											</span>{" "}
											- {char.realm_slug}
											{mainCharacterId === char.id
												? " (Principal)"
												: activeCharacterId === char.id
													? " (Roster)"
													: null}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2" data-tour-step="weekly-vault-notes">
							<Label htmlFor="notes">Notas (opcional)</Label>
							<textarea
								id="notes"
								aria-label="Notas opcionales de la captura"
								value={notes}
								onChange={(e) =>
									setUploadState((prev) => ({ ...prev, notes: e.target.value }))
								}
								placeholder="Ej: 'Llevo 3 semanas seguidas con este loot...'"
								className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="weekly-vault-image-dropzone">
								Imagen de la Gran Cámara
							</Label>
							<button
								id="weekly-vault-image-dropzone"
								type="button"
								onClick={handleContainerClick}
								onDragOver={handleDragOver}
								onDragLeave={handleDragLeave}
								onDrop={handleDrop}
								className={cn(
									"relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors duration-200 cursor-pointer group px-6 py-10 overflow-hidden",
									isDragging
										? "border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
										: "border-border/40 hover:border-blue-500/40 hover:bg-white/[0.02]",
									previewUrl ? "border-solid" : "border-dashed",
								)}
								style={{
									backgroundImage: previewUrl ? `url(${previewUrl})` : "none",
									backgroundSize: "cover",
									backgroundPosition: "center",
								}}
							>
								{previewUrl && (
									<div className="absolute inset-0 bg-zinc-950/60 group-hover:bg-zinc-950/40 transition-colors" />
								)}

								<div className="relative z-10 text-center flex flex-col items-center">
									{!previewUrl && (
										<div
											className={cn(
												"mb-4 p-4 rounded-full bg-white/[0.03] border border-white/5 transition-colors group-hover:bg-blue-500/10 group-hover:border-blue-500/20",
												isDragging && "bg-blue-500/20 border-blue-500/30",
											)}
										>
											<IconPhoto
												className={cn(
													"size-10 text-zinc-500 transition-colors group-hover:text-blue-400",
													isDragging && "text-blue-400",
												)}
												aria-hidden="true"
											/>
										</div>
									)}

									<div className="flex flex-col gap-1 items-center">
										<span
											className={cn(
												"text-sm font-bold transition-colors group-hover:text-white",
												previewUrl ? "text-white" : "text-zinc-400",
											)}
										>
											{previewUrl
												? "Cambiar imagen"
												: isDragging
													? "¡Suéltala aquí!"
													: "Sube un archivo"}
										</span>

										{!previewUrl && !isDragging && (
											<p className="text-xs text-zinc-500 font-medium">
												Click o arrastra: PNG, JPG, GIF hasta 5MB
											</p>
										)}

										{isDragging && (
											<p className="text-xs text-blue-400 font-bold animate-pulse">
												Listo para subir
											</p>
										)}
									</div>
								</div>
							</button>
							<input
								ref={fileInputRef}
								type="file"
								aria-label="Subir captura para la Gran Cámara"
								className="sr-only"
								accept="image/*"
								onChange={handleFileChange}
							/>
						</div>

						<Button
							type="submit"
							disabled={isUploading || !file}
							className="w-full"
						>
							{isUploading ? (
								<>
									<IconLoader2 className="mr-2 size-4 animate-spin" /> Subiendo…
								</>
							) : (
								<>
									<IconCloudUpload className="mr-2 size-4" /> Enviar Captura
								</>
							)}
						</Button>
					</form>
				</CardContent>
			</Card>

			<div className="space-y-4">
				<h3 className="text-lg font-medium">Tus subidas recientes</h3>
				{uploads.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No has subido ninguna captura todavía.
					</p>
				) : (
					<div className="flex flex-col gap-4">
						{uploads.map((upload) => (
							<Card key={upload.id}>
								<CardContent className="p-4 flex gap-4 items-center">
									<div className="size-16 rounded overflow-hidden shrink-0 border bg-muted">
										<Image
											src={upload.image_url}
											alt="Vault"
											width={64}
											height={64}
											className="size-full object-cover"
										/>
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium text-foreground truncate">
											Semana del <VaultWeekText value={upload.week_start} />
										</p>
										<p
											className={`text-sm ${getWowColorClass(upload.bnet_characters.class_id)} truncate font-medium`}
										>
											{upload.bnet_characters.name}
										</p>
										{upload.notes && (
											<p className="text-xs text-muted-foreground mt-1 truncate">
												{upload.notes}
											</p>
										)}
										<p
											className="text-xs text-muted-foreground mt-1"
											suppressHydrationWarning
										>
											Subido el <VaultDateText value={upload.created_at} />
										</p>
									</div>
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											window.open(
												upload.image_url,
												"_blank",
												"noopener,noreferrer",
											)
										}
									>
										Ver grande
									</Button>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
