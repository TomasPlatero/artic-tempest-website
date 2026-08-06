"use client";

import { type ReactNode } from "react";
import {
	IconDeviceFloppy,
	IconInnerShadowTop,
	IconRefresh,
	IconPhoto,
} from "@/shared/ui/tabler-icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Separator } from "@/shared/ui/separator";
import type { GuildInfo, SettingsGeneralState } from "./settings-general.types";

function GuildFieldRow({
	label,
	children,
}: {
	label: string;
	children: ReactNode;
}) {
	return (
		<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
			<span className="text-muted-foreground min-w-[100px]">{label}</span>
			<div className="flex-1 flex gap-2 justify-end max-w-md">{children}</div>
		</div>
	);
}

function IconPickerRow({
	title,
	description,
	avatarSrc,
	avatarAlt,
	uploading,
	canEdit,
	onOpenPicker,
	fallback,
	titleClassName,
}: {
	title: string;
	description: string;
	avatarSrc: string;
	avatarAlt: string;
	uploading: boolean;
	canEdit: boolean;
	onOpenPicker: () => void;
	fallback: ReactNode;
	titleClassName?: string;
}) {
	return (
		<div className="flex items-center justify-between">
			<div className="space-y-0.5">
				<span
					className={`text-muted-foreground block text-xs uppercase font-bold tracking-tight ${titleClassName ?? ""}`}
				>
					{title}
				</span>
				<p className="text-[10px] text-muted-foreground/40 leading-relaxed">
					{description}
				</p>
			</div>
			<div className="flex items-center gap-4">
				<Avatar className="size-10 border border-border/50 shadow-sm bg-[#1e1e24]">
					<AvatarImage
						src={avatarSrc}
						alt={avatarAlt}
						className="object-cover"
					/>
					<AvatarFallback className="bg-transparent">{fallback}</AvatarFallback>
				</Avatar>
				<div className="flex flex-col gap-1 items-end">
					{canEdit && (
						<Button
							variant="outline"
							size="sm"
							onClick={onOpenPicker}
							disabled={uploading}
							aria-label="Subir medio"
						>
							<IconPhoto className="size-3 mr-2" />
							{uploading ? "Actualizando..." : "Subir medio"}
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}

export function SettingsGeneralGuildCard({
	guild,
	canEditGeneral,
	state,
	saveGuildInfo,
	saveVersion,
	onGuildFieldChange,
	onVersionChange,
	onOpenPicker,
}: {
	guild: GuildInfo;
	canEditGeneral: boolean;
	state: SettingsGeneralState;
	saveGuildInfo: () => Promise<void>;
	saveVersion: () => Promise<void>;
	onGuildFieldChange: (
		field: keyof SettingsGeneralState["guildInfo"],
	) => (value: string) => void;
	onVersionChange: (value: string) => void;
	onOpenPicker: (type: "main" | "mobile" | "public") => void;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Hermandad</CardTitle>
				<CardDescription>
					Información de la hermandad vinculada a este sitio
				</CardDescription>
			</CardHeader>
			<CardContent>
				{!canEditGeneral && (
					<p className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-200/80">
						Tienes acceso de solo lectura a esta seccion.
					</p>
				)}
				<div className="grid gap-3 text-sm">
					<IconPickerRow
						title="Logotipo Portada Web"
						titleClassName="text-blue-400/80"
						description="Se muestra en el hero, la barra de navegación, el footer y la página de login del sitio público."
						avatarSrc={guild.publicLogoUrl ?? ""}
						avatarAlt="Portada Web"
						uploading={state.uploadingPublic}
						canEdit={canEditGeneral}
						onOpenPicker={() => onOpenPicker("public")}
						fallback={
							<span className="text-[10px] font-semibold italic text-blue-400/20">
								WEB
							</span>
						}
					/>
					<Separator />
					<IconPickerRow
						title="Logotipo Principal"
						description="Se utiliza en la barra lateral y en la cabecera de Zona Raider."
						avatarSrc={guild.iconUrl ?? ""}
						avatarAlt={guild.name}
						uploading={state.uploading}
						canEdit={canEditGeneral}
						onOpenPicker={() => onOpenPicker("main")}
						fallback={
							<IconInnerShadowTop className="size-5 text-muted-foreground" />
						}
					/>
					<Separator />
					<IconPickerRow
						title="Logotipo para Móvil"
						titleClassName="text-amber-500/80"
						description="Se muestra exclusivamente en la cabecera cuando accedes desde el móvil."
						avatarSrc={guild.mobileIconUrl ?? ""}
						avatarAlt="Móvil"
						uploading={state.uploadingMobile}
						canEdit={canEditGeneral}
						onOpenPicker={() => onOpenPicker("mobile")}
						fallback={
							<span className="text-[10px] font-semibold italic text-muted-foreground/20">
								MOB
							</span>
						}
					/>
					<Separator />
					<GuildFieldRow label="Nombre">
						<Input
							className="h-9 bg-white/5 border-white/10"
							value={state.guildInfo.name}
							onChange={(e) => onGuildFieldChange("name")(e.target.value)}
							disabled={!canEditGeneral}
						/>
					</GuildFieldRow>
					<Separator />
					<GuildFieldRow label="Realm">
						<Input
							className="h-9 bg-white/5 border-white/10"
							value={state.guildInfo.realm}
							onChange={(e) => onGuildFieldChange("realm")(e.target.value)}
							disabled={!canEditGeneral}
						/>
					</GuildFieldRow>
					<Separator />
					<GuildFieldRow label="Región">
						<select
							className="h-9 w-full rounded-md border border-white/10 bg-white/5 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
							value={state.guildInfo.region}
							onChange={(e) => onGuildFieldChange("region")(e.target.value)}
							disabled={!canEditGeneral}
						>
							<option value="eu">EU</option>
							<option value="us">US</option>
							<option value="kr">KR</option>
							<option value="tw">TW</option>
							<option value="cn">CN</option>
						</select>
					</GuildFieldRow>
					{canEditGeneral && (
						<div className="flex justify-end pt-2">
							<Button
								size="sm"
								onClick={() => void saveGuildInfo()}
								disabled={
									state.savingGuild ||
									(state.guildInfo.name === guild.name &&
										state.guildInfo.realm === guild.realm &&
										state.guildInfo.region === guild.region)
								}
							>
								{state.savingGuild ? (
									<IconRefresh className="size-4 mr-2 animate-spin" />
								) : (
									<IconDeviceFloppy className="size-4 mr-2" />
								)}
								Guardar Cambios
							</Button>
						</div>
					)}
					<Separator />
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
						<div className="space-y-1">
							<span className="text-muted-foreground block">
								Versión de Zona Raider
							</span>
							<p className="text-[10px] text-muted-foreground/60 leading-relaxed">
								Se muestra en la barra lateral debajo del nombre de la
								hermandad.
							</p>
						</div>
						<div className="flex items-center gap-2">
							<Input
								className="h-9 w-[180px] font-mono text-xs bg-white/5 border-white/10"
								value={state.version}
								onChange={(e) => onVersionChange(e.target.value)}
								placeholder="Zona Raider"
								disabled={!canEditGeneral}
							/>
							<Button
								size="sm"
								variant="secondary"
								disabled={
									!canEditGeneral ||
									state.savingVersion ||
									state.version === guild.version
								}
								onClick={() => void saveVersion()}
							>
								{state.savingVersion ? (
									<IconRefresh className="size-3 animate-spin" />
								) : (
									<IconDeviceFloppy className="size-3 mr-2" />
								)}
								Actualizar
							</Button>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
