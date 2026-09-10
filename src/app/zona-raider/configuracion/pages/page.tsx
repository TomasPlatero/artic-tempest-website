import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCachedServerSession } from "@/shared/auth/get-cached-server-session";
import { getAppPermission } from "@/shared/auth/permissions";
import { Forbidden } from "@/shared/components/forbidden";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/ui/table";
import { IconArrowLeft, IconSettings } from "@/shared/ui/tabler-icons";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import { cn } from "@/shared/tailwind/tailwind-utils";

export const metadata: Metadata = {
	title: "Páginas | Artic Tempest",
};

export default async function PagesListPage() {
	const session = await getCachedServerSession();
	if (!session) redirect("/login");

	const roleLevel = session?.user?.roleLevel ?? "invitado";
	const settingsPerm = await getAppPermission(roleLevel, "settings");

	if (!settingsPerm.canView) {
		return <Forbidden />;
	}

	const { data: pages } = await supabaseAdmin
		.from("app_pages")
		.select("*")
		.order("priority", { ascending: true });

	const groupOrder = ["raider", "admin"];
	const groupLabels: Record<string, string> = {
		raider: "Zona Raider",
		admin: "Administración",
	};
	const groupColors: Record<string, string> = {
		raider: "bg-emerald-500",
		admin: "bg-sky-500",
	};

	const grouped = (pages ?? []).reduce<Record<string, typeof pages>>(
		(acc, page) => {
			const g = page.group_id ?? "other";
			if (!acc[g]) acc[g] = [];
			acc[g].push(page);
			return acc;
		},
		{},
	);

	return (
		<div className="flex flex-col gap-6 p-4 md:p-6 lg:px-8 w-full max-w-full">
			<div className="flex items-center gap-6">
				<Link href="/zona-raider/configuracion">
					<Button
						variant="outline"
						size="icon"
						aria-label="Volver a configuración"
						className="size-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 shadow-xl"
					>
						<IconArrowLeft className="size-6" />
					</Button>
				</Link>
				<div>
					<h1 className="text-3xl font-semibold font-heading italic tracking-tight flex items-center gap-3">
						GESTIÓN DE PÁGINAS
					</h1>
					<p className="text-sm font-medium text-white/40 mt-2 tracking-widest leading-relaxed">
						Administra las páginas registradas, sus títulos y permisos por rol.
					</p>
				</div>
			</div>

			{groupOrder.flatMap((groupId) => {
				const groupPages = grouped[groupId];
				if (!groupPages?.length) return [];
				return [
					<section key={groupId}>
						<div className="flex items-center gap-3 mb-4 px-1">
							<div
								className={cn(
									"size-1.5 h-5 rounded-full",
									groupColors[groupId],
								)}
							/>
							<h2 className="text-sm font-semibold uppercase tracking-widest text-white/50">
								{groupLabels[groupId] ?? groupId}
							</h2>
							<span className="text-[11px] text-white/30">
								({groupPages.length})
							</span>
						</div>

						<div className="rounded-xl border border-white/[0.08] bg-zinc-950/40 overflow-hidden">
							<Table>
								<TableHeader className="bg-white/[0.03]">
									<TableRow className="border-white/[0.05] hover:bg-transparent">
										<TableHead className="h-10 px-4 uppercase tracking-[0.2em] text-[10px] font-semibold text-white/40">
											Nombre
										</TableHead>
										<TableHead className="h-10 px-4 uppercase tracking-[0.2em] text-[10px] font-semibold text-white/40">
											ID
										</TableHead>
										<TableHead className="h-10 px-4 uppercase tracking-[0.2em] text-[10px] font-semibold text-white/40 hidden md:table-cell">
											Ruta
										</TableHead>
										<TableHead className="h-10 px-4 uppercase tracking-[0.2em] text-[10px] font-semibold text-white/40 w-20">
											Tipo
										</TableHead>
										<TableHead className="h-10 px-4 w-12" />
									</TableRow>
								</TableHeader>
								<TableBody>
									{groupPages.map((page) => (
										<TableRow
											key={page.id}
											className="border-white/[0.05] hover:bg-white/[0.03]"
										>
											<TableCell className="px-4 py-3">
												<Link
													href={`/zona-raider/configuracion/pages/${page.id}`}
													className="font-semibold text-white text-sm hover:text-blue-400 transition-colors"
												>
													{page.name}
												</Link>
											</TableCell>
											<TableCell className="px-4 py-3 text-[11px] font-mono text-white/40">
												{page.id}
											</TableCell>
											<TableCell className="px-4 py-3 text-[11px] font-mono text-white/30 hidden md:table-cell">
												{page.path}
											</TableCell>
											<TableCell className="px-4 py-3">
												<Badge
													variant="outline"
													className={cn(
														"text-[9px] uppercase tracking-[0.2em] px-2 py-0 h-5",
														page.is_admin
															? "border-sky-500/40 text-sky-300"
															: "border-emerald-500/40 text-emerald-300",
													)}
												>
													{page.is_admin ? "Admin" : "Raider"}
												</Badge>
											</TableCell>
											<TableCell className="px-4 py-3">
												<Link
													href={`/zona-raider/configuracion/pages/${page.id}`}
												>
													<IconSettings className="size-4 text-white/20 hover:text-white/60 transition-colors" />
												</Link>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</section>,
				];
			})}
		</div>
	);
}
