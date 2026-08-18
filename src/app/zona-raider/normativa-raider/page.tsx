import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import {
	IconAlertTriangle,
	IconBrandDiscord,
	IconCheck,
	IconClipboardList,
	IconPackage,
	IconUsers,
	IconShieldCheck,
} from "@/shared/ui/tabler-icons";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { auth } from "@/auth";
import { getRaiderRulesStatus } from "@/shared/lib/raider-rules.server";
import {
	RAIDER_PAGE_FADE_IN_CLASSES,
	RAIDER_CARD_REVEAL_CLASSES,
	RAIDER_STAGGER_DELAY_CLASSES,
} from "@/shared/components/raider-motion";

import { RaiderRulesAcceptance } from "./raider-rules-acceptance";

const pageTitle = "Normativa Raider | Artic Tempest";
const pageDescription =
	"Normas oficiales para Raiders y Trials de Artic Tempest con aceptación registrada.";

export const metadata: Metadata = {
	title: pageTitle,
	description: pageDescription,
	alternates: {
		canonical: "https://artictempest.es/zona-raider/normativa-raider",
	},
	openGraph: {
		title: pageTitle,
		description: pageDescription,
		type: "website",
		url: "https://artictempest.es/zona-raider/normativa-raider",
		siteName: "Artic Tempest",
		images: ["/assets/images/artic-tempest-og.webp"],
	},
	twitter: {
		card: "summary_large_image",
		title: pageTitle,
		description: pageDescription,
		images: ["/assets/images/artic-tempest-og.webp"],
	},
};

const coreRules = [
	"Conoce tu clase: domina mecánicas, rotaciones y prioridades de tu personaje.",
	"Optimiza tu personaje: mantén equipo, talentos y estadísticas en el mejor estado posible.",
	"Prepárate para los jefes: estudia las estrategias básicas antes de cada encuentro.",
	"Discord obligatorio durante la raid, incluso si estás en rotación.",
	"Addons y auras requeridos: instala y actualiza los obligatorios.",
	"Puntualidad: horario de lunes a jueves de 17:30 a 19:30; debes estar listo a las 17:15.",
	{
		label: "Ausencias",
		text: "avisa antes de las 15:00 en el canal de ausencias.",
		href: "https://discord.com/channels/1251201368467701791/1366451576298012744",
	},
	{
		label: "Cámara semanal",
		text: "completa al menos 2 aperturas y sube la captura cada miércoles.",
		href: "https://discord.com/channels/1251201368467701791/1415696046918471731",
	},
	{
		label: "Grupo Viserio / WowUtils",
		text: "únete obligatoriamente al grupo del equipo.",
		href: "https://wowutils.com/viserio-cooldowns/groups/join?token=de90cc0edca13112d4ea168d882d10f7&utm_source=invite&utm_medium=app_share",
	},
];

const lootRules = [
	{
		title: "Loot normal",
		value: "BIS > Mejora > Catalizar > OffSpec > Transfiguración",
	},
	{
		title: "Fichas / tokens / trinkets de cambio",
		value: "BIS > Mejora > Socket / 3ª stat > Transfiguración",
	},
];

const lootSupportRules = [
	"Los BOE's se destinan al banco de la hermandad; si un BIS es BOE, se gestiona con un oficial.",
];

const requiredTools = [
	{
		name: "Northrend Sky Raid Tools",
		href: "https://www.curseforge.com/wow/addons/search?search=Northrend%20Sky%20Raid%20Tools",
		modId: 954018,
	},
	{
		name: "RCLootCouncil",
		href: "https://www.curseforge.com/wow/addons/search?search=RCLootCouncil",
		modId: 39928,
	},
	{
		name: "WowUtils",
		href: "https://www.curseforge.com/wow/addons/wowutils",
		modId: 1620704,
	},
];

type RequiredTool = {
	name: string;
	href: string;
	modId: number;
	iconUrl: string | null;
};

async function loadCurseforgeAddonTool(
	tool: (typeof requiredTools)[number],
	origin: string,
	cookieHeader: string,
): Promise<RequiredTool> {
	try {
		const response = await fetch(`${origin}/api/curseforge-addon`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				cookie: cookieHeader,
			},
			body: JSON.stringify({ modId: tool.modId }),
			cache: "no-store",
		});

		if (!response.ok) {
			return { ...tool, iconUrl: null };
		}

		const data = (await response.json()) as { iconUrl?: string | null };
		return { ...tool, iconUrl: data.iconUrl ?? null };
	} catch {
		return { ...tool, iconUrl: null };
	}
}

const sanctions = [
	{
		tone: "border-sky-500/20 bg-sky-500/5 text-sky-300",
		title: "Bajada de rango",
		description: "Si se repite, puede escalar a la siguiente sanción.",
	},
	{
		tone: "border-amber-500/20 bg-amber-500/5 text-amber-300",
		title: "Expulsión del equipo de raid",
		description: "Para incumplimientos graves o reiterados.",
	},
	{
		tone: "border-rose-500/20 bg-rose-500/5 text-rose-300",
		title: "Expulsión inmediata de la hermandad",
		description: "Reservada para faltas de máxima gravedad.",
	},
];

export default async function RaiderNormsPage() {
	return renderRaiderNormsPage();
}

async function renderRaiderNormsPage() {
	const session = await auth();
	const initialStatus = session?.user?.id
		? await getRaiderRulesStatus(session.user.id)
		: null;

	const [requestHeaders, cookieStore] = await Promise.all([
		headers(),
		cookies(),
	]);
	const cookieHeader = cookieStore
		.getAll()
		.map(({ name, value }) => `${name}=${value}`)
		.join("; ");
	const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
	const host =
		requestHeaders.get("x-forwarded-host") ??
		requestHeaders.get("host") ??
		"artictempest.es";
	const origin = `${protocol}://${host}`;

	const requiredToolsWithIcons = await Promise.all(
		requiredTools.map((tool) =>
			loadCurseforgeAddonTool(tool, origin, cookieHeader),
		),
	);

	return (
		<div className={`space-y-6 pb-6 ${RAIDER_PAGE_FADE_IN_CLASSES}`}>
			<section
				className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-linear-to-br from-blue-500/10 via-white/[0.03] to-transparent p-6 md:p-8 shadow-2xl shadow-black/20 ${RAIDER_CARD_REVEAL_CLASSES}`}
			>
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_35%)] pointer-events-none" />
				<div className="relative space-y-5">
					<div className="space-y-3 max-w-4xl">
						<h1 className="text-3xl md:text-5xl font-semibold uppercase tracking-tighter text-white">
							Normativa Raider
						</h1>
						<p className="text-sm md:text-base text-white/65 leading-relaxed max-w-3xl">
							Estas son las normas oficiales que regulan la entrada y la
							permanencia en el equipo de raid de Artic Tempest. Léelas con
							atención antes de aceptar.
						</p>
					</div>

					<div
						className={`grid gap-3 md:grid-cols-4 ${RAIDER_STAGGER_DELAY_CLASSES[1]}`}
					>
						{[
							{ label: "Horario", value: "L-J 17:30 - 19:30" },
							{ label: "Conexión", value: "Discord" },
							{ label: "Vault", value: "2 aperturas mínimas de cámara" },
							{ label: "Ausencias", value: "Antes de las 15:00" },
						].map((item) => (
							<div
								key={item.label}
								className="rounded-2xl border border-white/10 bg-zinc-950/20 px-4 py-3"
							>
								<p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/40">
									{item.label}
								</p>
								<p className="mt-2 text-sm font-semibold text-white">
									{item.value}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			<div className="space-y-6">
				<Card
					className={`border-white/10 bg-white/[0.03] ${RAIDER_CARD_REVEAL_CLASSES} ${RAIDER_STAGGER_DELAY_CLASSES[2]}`}
				>
					<CardHeader className="space-y-3">
						<div className="flex items-center gap-3 text-white">
							<div className="flex size-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
								<IconShieldCheck className="size-5" />
							</div>
							<CardTitle className="text-xl uppercase tracking-tight">
								Obligaciones básicas
							</CardTitle>
						</div>
						<p className="text-sm text-white/55">
							Son requisitos mínimos para participar en raid con el equipo.
						</p>
					</CardHeader>
					<CardContent>
						<div className="grid gap-3 md:grid-cols-2">
							{coreRules.map((rule) => {
								const text = typeof rule === "string" ? rule : rule.text;

								return (
									<div
										key={text}
										className="flex items-start gap-3 rounded-2xl border border-white/8 bg-zinc-950/20 p-4"
									>
										<div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-300">
											<IconCheck className="size-3.5" />
										</div>
										<p className="text-sm leading-relaxed text-white/75">
											{typeof rule === "string" ? (
												rule
											) : (
												<>
													{rule.label}:{" "}
													<Link
														href={rule.href}
														className="text-white underline decoration-white/30 underline-offset-2 hover:text-blue-300 hover:decoration-blue-300"
														target="_blank"
														rel="noreferrer"
													>
														{rule.text}
													</Link>
												</>
											)}
										</p>
									</div>
								);
							})}
						</div>
					</CardContent>
				</Card>

				<Card className="border-white/10 bg-white/[0.03]">
					<CardHeader className="space-y-3">
						<div className="flex items-center gap-3 text-white">
							<div className="flex size-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
								<IconClipboardList className="size-5" />
							</div>
							<CardTitle className="text-xl uppercase tracking-tight">
								Sistema de loot
							</CardTitle>
						</div>
						<p className="text-sm text-white/55">
							El Master Looter decide según progreso, asistencia y beneficio
							real para la raid.
						</p>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-3 md:grid-cols-2">
							{lootRules.map((rule) => (
								<div
									key={rule.title}
									className="rounded-2xl border border-white/8 bg-zinc-950/20 p-4"
								>
									<p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/40">
										{rule.title}
									</p>
									<p className="mt-2 text-sm leading-relaxed text-white/80">
										{rule.value}
									</p>
								</div>
							))}
						</div>

						<div className="rounded-2xl border border-white/8 bg-zinc-950/20 p-4 space-y-3">
							<p className="text-sm font-semibold text-white">Puntos clave</p>
							<ul className="space-y-2">
								{lootSupportRules.map((item) => (
									<li key={item} className="flex gap-3 text-sm text-white/70">
										<IconCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" />
										<span>{item}</span>
									</li>
								))}
							</ul>
						</div>

						<div className="rounded-2xl border border-white/8 bg-zinc-950/20 p-4 space-y-3">
							<p className="text-sm font-semibold text-white">
								Nota importante sobre el loot
							</p>
							<p className="text-sm leading-relaxed text-white/65">
								Los criterios de loot no son determinantes ni automáticos. El
								Master Looter y los Oficiales que él considere decidirán siempre
								en base a:
							</p>
							<ul className="space-y-2">
								{[
									"El beneficio real e inmediato para el progreso del grupo.",
									"La asistencia y compromiso de cada jugador.",
									"El impacto global en la raid.",
								].map((item) => (
									<li key={item} className="flex gap-3 text-sm text-white/70">
										<IconCheck className="mt-0.5 size-4 shrink-0 text-amber-400" />
										<span>{item}</span>
									</li>
								))}
							</ul>
						</div>
					</CardContent>
				</Card>

				<Card className="border-white/10 bg-white/[0.03]">
					<CardHeader className="space-y-3">
						<div className="flex items-center gap-3 text-white">
							<div className="flex size-10 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
								<IconPackage className="size-5" />
							</div>
							<CardTitle className="text-xl uppercase tracking-tight">
								Addons y Comunicación
							</CardTitle>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-3 md:grid-cols-2">
							{requiredToolsWithIcons.map((tool, index) => (
								<Link
									key={tool.name}
									href={tool.href}
									target="_blank"
									rel="noreferrer"
									className="flex items-center gap-3 rounded-2xl border border-white/8 bg-zinc-950/20 px-4 py-3 text-sm text-white/75 transition-colors hover:border-blue-500/30 hover:bg-blue-500/5 hover:text-white"
								>
									<span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-500/10 text-blue-300">
										{tool.iconUrl ? (
											<Image
												src={tool.iconUrl}
												alt={tool.name}
												width={32}
												height={32}
												className="size-full object-cover"
											/>
										) : index === 0 ? (
											<IconPackage className="size-4" />
										) : (
											<IconShieldCheck className="size-4" />
										)}
									</span>
									<span className="min-w-0 truncate">{tool.name}</span>
								</Link>
							))}
						</div>

						<div className="rounded-2xl border border-white/8 bg-zinc-950/20 p-4 space-y-2">
							<div className="flex items-center gap-2 text-sm font-semibold text-white">
								<IconBrandDiscord className="size-4 text-[#5865F2]" />
								Comunicación
							</div>
							<p className="text-sm leading-relaxed text-white/65">
								Discord es el medio oficial y obligatorio para Raiders.
							</p>
						</div>
					</CardContent>
				</Card>

				<Card className="border-white/10 bg-white/[0.03]">
					<CardHeader className="space-y-3">
						<div className="flex items-center gap-3 text-white">
							<div className="flex size-10 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
								<IconUsers className="size-5" />
							</div>
							<CardTitle className="text-xl uppercase tracking-tight">
								Gestión del Roster
							</CardTitle>
						</div>
					</CardHeader>
					<CardContent className="space-y-3 text-sm leading-relaxed text-white/65">
						<p>
							El roster y las rotaciones se gestionan de forma interna por los
							Oficiales y el Raid Leader.
						</p>
					</CardContent>
				</Card>

				<Card className="border-white/10 bg-white/[0.03]">
					<CardHeader className="space-y-3">
						<div className="flex items-center gap-3 text-white">
							<div className="flex size-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-300">
								<IconAlertTriangle className="size-5" />
							</div>
							<CardTitle className="text-xl uppercase tracking-tight">
								Sanciones
							</CardTitle>
						</div>
						<p className="text-sm text-white/55">
							El incumplimiento puede conllevar medidas disciplinarias según la
							gravedad.
						</p>
					</CardHeader>
					<CardContent className="grid gap-3 md:grid-cols-3">
						{sanctions.map((sanction) => (
							<div
								key={sanction.title}
								className={`rounded-2xl border p-4 ${sanction.tone}`}
							>
								<p className="text-sm font-semibold uppercase tracking-wide">
									{sanction.title}
								</p>
								<p className="mt-2 text-sm leading-relaxed text-white/70">
									{sanction.description}
								</p>
							</div>
						))}
					</CardContent>
				</Card>
			</div>

			<RaiderRulesAcceptance initialStatus={initialStatus} />
		</div>
	);
}
