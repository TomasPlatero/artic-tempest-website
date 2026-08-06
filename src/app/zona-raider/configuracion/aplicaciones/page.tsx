import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import {
	IconArrowLeft,
	IconCamera,
	IconPhoto,
} from "@/shared/ui/tabler-icons";
import React from "react";
import { getCachedServerSession } from "@/shared/auth/get-cached-server-session";
import { getAuthzSnapshot } from "@/shared/auth/authz";

import { getAppPermission } from "@/shared/auth/permissions";
import { Forbidden } from "@/shared/components/forbidden";

export default async function AppsSettingsHubPage() {
	const session = await getCachedServerSession();
	const authz = session ? await getAuthzSnapshot(session) : null;
	const roleLevel = authz?.roleSlug ?? session?.user?.roleLevel ?? "invitado";
	const { canView } = await getAppPermission(roleLevel, "settings");

	if (!canView) {
		return <Forbidden />;
	}

	const [settingsPermission, , weeklyVaultPermission] =
		await Promise.all([
			getAppPermission(roleLevel, "settings"),
			getAppPermission(roleLevel, "settings-api"),
			getAppPermission(roleLevel, "weekly-vault-admin"),
		]);

	const apps = [
		{
			title: "Imágenes de Kills",
			description:
				"Elige las capturas que aparecen en la línea de tiempo de progreso de la hermandad.",
			icon: IconPhoto,
			href: "/zona-raider/configuracion/aplicaciones/progreso-kills",
			color: "text-fuchsia-400",
			bg: "bg-fuchsia-400/10",
			visible: settingsPermission.canEdit,
		},
		{
			title: "Cámara Semanal",
			description:
				"Revisa las capturas de la Gran Cámara subidas por los miembros.",
			icon: IconCamera,
			href: "/zona-raider/configuracion/aplicaciones/camara-semanal",
			color: "text-teal-500",
			bg: "bg-teal-500/10",
			visible: weeklyVaultPermission.canView,
		},
	];

	return (
		<div className="flex flex-col gap-4 py-6 px-4 lg:px-6 w-full animate-in fade-in duration-500">
			<div className="flex items-center gap-4">
				<Link href="/zona-raider/configuracion">
					<Button
						variant="outline"
						size="icon"
						className="size-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10  shadow-xl"
					>
						<IconArrowLeft className="size-6" />
					</Button>
				</Link>
				<div>
					<h1 className="text-3xl font-semibold font-heading italic tracking-tight uppercase flex items-center gap-3">
						CONFIGURACIÓN DE APPS
					</h1>
					<p className="text-sm font-medium text-white/40 mt-2 uppercase tracking-widest leading-relaxed">
						Ajustes para cada funcionalidad de Zona Raider.
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8 [&_a]:hover:scale-[1.02] w-full">
				{apps.reduce<React.ReactNode[]>((visibleApps, app) => {
					if (!app.visible) return visibleApps;

					const Icon = app.icon;
					visibleApps.push(
						<Link href={app.href} key={app.href} className="block">
							<Card className="h-full hover:border-primary/50 cursor-pointer overflow-hidden border-border/40 bg-card/40 backdrop-blur-sm  hover:border-primary/50 hover:bg-card/50">
								<CardHeader className="flex flex-row items-center gap-4 p-5">
									<div
										className={`p-3 rounded-xl ${app.bg} ${app.color} shrink-0 shadow-sm border border-white/5 shrink-0`}
									>
										<Icon className="size-6" />
									</div>
									<div className="flex flex-col text-left">
										<CardTitle className="text-base font-semibold leading-none mb-2">
											{app.title}
										</CardTitle>
										<CardDescription className="mt-1 sm:mt-1.5 leading-snug text-sm sm:text-base">
											{app.description}
										</CardDescription>
									</div>
								</CardHeader>
							</Card>
						</Link>,
					);

					return visibleApps;
				}, [])}
			</div>
		</div>
	);
}
