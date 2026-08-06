import type { Metadata } from "next";
import Image from "next/image";
import {
	IconBolt,
	IconMessage2,
	IconSword,
	IconUsers,
} from "@/shared/ui/tabler-icons";
import { LandingFooter } from "@/domains/landing/components/footer";
import { WebPageJsonLd } from "@/shared/seo/json-ld-webpage";
import { LandingNavigation } from "@/domains/landing/components/navigation";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://artictempest.es";

const pageTitle = "Nuestra historia y cultura | Artic Tempest";
const pageDescription =
	"Conoce la historia pública de Artic Tempest y la cultura de raid que define a nuestra hermandad en World of Warcraft.";

const pillars = [
	{
		title: "Preparación",
		copy: "Cada pull se prepara fuera del juego: encounters, logs, UI y consumibles. Aquí no se improvisa.",
		icon: IconSword,
	},
	{
		title: "Comunicación",
		copy: "En pull se habla lo justo. Entre intentos se comenta todo, se ajusta y se decide sin cortar ideas.",
		icon: IconMessage2,
	},
	{
		title: "Disciplina",
		copy: "Somos serios: venimos a hacer kills. Si una mecánica cae dos veces, se corrige. Si hace falta repetir, se repite.",
		icon: IconBolt,
	},
	{
		title: "Grupo",
		copy: "Hay Raid Leader, oficiales y una raid donde todos suman. El kill sale mejor cuando cada uno aporta lo suyo.",
		icon: IconUsers,
	},
];

const raidMoments = [
	{
		title: "Preparamos todo",
		copy: "Nuestra oficialía y raiders están preparados para cada jefe antes de ir, revisamos estratégias y mejoras en nuestros personajes para ir a full.",
		image: "/assets/images/culture/antes-de-pull.webp",
		alt: "Raiders de World of Warcraft preparándose antes del pull",
	},
	{
		title: "Durante el combate",
		copy: "Cada uno hace su parte y el Raid Leader marca el ritmo y si hace falta ajustar algo en el momento.",
		image: "/assets/images/culture/durante-el-combate.webp",
		alt: "Raiders de World of Warcraft durante el combate",
	},
	{
		title: "Después del intento",
		copy: "En cada wipe, se comenta lo justo y se corrige. Sin problem para las sugerencias pero nunca para las exigencias.",
		image: "/assets/images/culture/despues-del-intento.webp",
		alt: "Raiders de World of Warcraft revisando el intento",
	},
];

const cultureSignals = [
	"Progresar en mítico, sacar CE's y seguir mejorando.",
	"Buen ambiente, sí. Pero a la raid venimos a rendir.",
	"El kill sale mejor cuando todos aportan entre intentos.",
	"No hay una sola voz: hay un Raid Leader, oficiales y una raid comprometida.",
];

export const metadata: Metadata = {
	title: pageTitle,
	description: pageDescription,
	alternates: { canonical: "https://artictempest.es/historia-y-cultura" },
	openGraph: {
		title: pageTitle,
		description: pageDescription,
		type: "website",
		url: "https://artictempest.es/historia-y-cultura",
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

export const revalidate = 3600;

export default function CulturePage() {
	return (
		<>
			<WebPageJsonLd
				webPage={{
					id: `\${baseUrl}/historia-y-cultura`,
					name: "Nuestra historia y cultura | Artic Tempest",
					description:
						"Conoce la historia pública de Artic Tempest y la cultura de raid que define a nuestra hermandad en World of Warcraft.",
				}}
				breadcrumb={[
					{ name: "Inicio", url: baseUrl },
					{ name: "Historia y Cultura", url: `\${baseUrl}/historia-y-cultura` },
				]}
			/>
			<div className="min-h-dvh overflow-x-hidden bg-[#04070f] text-white animate-fade-in animate-duration-slow motion-reduce:animate-none">
				<LandingNavigation />

				<main id="main-content" className="relative">
					<section className="relative overflow-hidden border-b border-white/5">
						<div className="absolute inset-0">
							<Image
								src="/assets/images/historia-cultura.webp"
								alt="Historia y cultura de Artic Tempest"
								fill
								priority
								sizes="100vw"
								className="object-cover object-center opacity-55"
							/>
							<div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(110,156,255,0.12),transparent_30%),linear-gradient(180deg,rgba(3,8,19,0.12)_0%,rgba(3,8,19,0.52)_60%,#04070f_100%)]" />
						</div>

						<div className="relative z-10 mx-auto flex min-h-[62svh] max-w-5xl flex-col justify-center px-6 py-20 text-center lg:px-8 lg:py-24">
							<h1 className="mx-auto max-w-3xl text-4xl font-semibold uppercase tracking-[0.18em] text-balance sm:text-5xl lg:text-6xl">
								<span className="text-blue-100 drop-shadow-[0_0_24px_rgba(96,165,250,0.35)]">
									Historia y Cultura de Artic Tempest
								</span>
							</h1>
						</div>
					</section>

					<section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
						<div className="w-full max-w-none">
							<div className="mt-4 space-y-5 text-base leading-relaxed text-white/70 sm:text-lg">
								<p>
									Artic Tempest nace con una idea clara: progresar con seriedad
									sin perder el buen ambiente que hace que una hermandad
									funcione a largo plazo. No somos un proyecto improvisado;
									somos un grupo consolidado en{" "}
									<span className="font-semibold text-white">Dun Modr</span>,
									con una estructura estable y un compromiso real con el
									progreso PvE.
								</p>

								<p>
									Tras haber conseguido nuestro primer{" "}
									<span className="font-semibold text-white">
										Cutting Edge en The War Within
									</span>{" "}
									y posicionarnos como una hermandad{" "}
									<span className="font-semibold text-white">
										Top 25 de España
									</span>
									, hemos demostrado que sabemos competir a buen nivel sin
									perder nuestra identidad.
								</p>

								<p>
									En Artic Tempest no buscamos únicamente rendimiento
									individual. Buscamos jugadores que entiendan lo que implica
									formar parte de un equipo serio: puntualidad, preparación
									previa de cada encuentro, mentalidad de mejora continua y
									capacidad de adaptación.
								</p>

								<p>
									El objetivo es claro: seguir creciendo en Midnight,
									consolidando lo conseguido y dando un paso más en nuestro
									nivel de juego, manteniendo lo que nos ha traído hasta aquí:
									estabilidad, constancia y cohesión de grupo.
								</p>

								<p>
									Si encajas en este enfoque y buscas una hermandad seria, sin
									dramas y con ambición real, Artic Tempest es tu sitio.
								</p>
							</div>

							<div className="mt-12 rounded-[2rem] border border-blue-400/20 bg-linear-to-br from-blue-500/10 via-blue-400/5 to-transparent p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur sm:p-10">
								<p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-blue-200/80">
									Hito de hermandad
								</p>
								<div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
									<div>
										<h2 className="text-3xl font-semibold uppercase tracking-tight text-white sm:text-4xl">
											19º de España
										</h2>
										<p className="mt-3 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
											Temporada 1 de{" "}
											<span className="font-semibold text-white">Midnight</span>{" "}
											completada con{" "}
											<span className="font-semibold text-white">
												10 de 10 jefes en Mítico
											</span>
											, consolidando nuestro nivel competitivo como hermandad.
										</p>
									</div>
									<div className="flex shrink-0 items-center gap-2 self-start rounded-2xl border border-blue-300/15 bg-blue-400/10 px-5 py-3">
										<span className="text-sm font-bold uppercase tracking-widest text-blue-200">
											10/10 M
										</span>
									</div>
								</div>
							</div>
						</div>
					</section>

					<section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
						<div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
							<article className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur sm:p-8">
								<h2 className="mt-3 text-3xl font-semibold uppercase tracking-tight sm:text-4xl">
									Nuestra Cultura
								</h2>
								<div className="mt-6 grid gap-4">
									{pillars.map((pillar) => {
										const Icon = pillar.icon;

										return (
											<div
												key={pillar.title}
												className="flex gap-4 rounded-2xl border border-white/10 bg-black/20 p-4"
											>
												<div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-blue-300/15 bg-blue-400/10 text-blue-200">
													<Icon className="size-5" />
												</div>
												<div>
													<h3 className="text-lg font-semibold uppercase tracking-tight text-white">
														{pillar.title}
													</h3>
													<p className="mt-2 text-sm leading-relaxed text-white/65">
														{pillar.copy}
													</p>
												</div>
											</div>
										);
									})}
								</div>
							</article>

							<div className="grid gap-4 sm:grid-cols-2">
								{raidMoments.map((moment, index) => (
									<article
										key={moment.title}
										className={`group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] ${index === 0 ? "sm:col-span-2" : ""}`}
									>
										<Image
											src={moment.image}
											alt={moment.alt}
											width={900}
											height={index === 0 ? 520 : 420}
											className={`w-full object-cover brightness-[0.62] contrast-110 saturate-90 transition-colors duration-700 group-hover:scale-105 ${index === 0 ? "h-64" : "h-56"}`}
										/>
										<div className="absolute inset-0 bg-linear-to-t from-[#04070f] via-[#04070f]/35 to-transparent" />
										<div className="absolute inset-0 bg-[#04070f]/20" />
										<div className="absolute bottom-0 left-0 right-0 p-5">
											<p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/70">
												{moment.title}
											</p>
											<p className="mt-2 text-sm leading-relaxed text-white/70">
												{moment.copy}
											</p>
										</div>
									</article>
								))}

								<article className="rounded-[2rem] border border-white/10 bg-linear-to-br from-white/10 to-white/5 p-6 backdrop-blur sm:col-span-2">
									<p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-blue-200/80">
										Lo que se siente
									</p>
									<ul className="mt-4 grid gap-3 sm:grid-cols-2">
										{cultureSignals.map((item) => (
											<li
												key={item}
												className="flex gap-3 text-sm text-white/70"
											>
												<span className="mt-2 size-1.5 shrink-0 rounded-full bg-blue-300" />
												<span>{item}</span>
											</li>
										))}
									</ul>
								</article>
							</div>
						</div>
					</section>
					<section className="mx-auto max-w-7xl border-t border-white/5 px-6 py-20 lg:px-8">
						<div className="w-full max-w-none">
							<h2 className="mt-3 inline-block text-3xl font-semibold uppercase tracking-[0.18em] sm:text-4xl">
								<span className="text-blue-100 drop-shadow-[0_0_24px_rgba(96,165,250,0.35)]">
									Qué buscamos en un raider
								</span>
								<span className="mt-3 block h-px w-24 bg-linear-to-r from-blue-300 via-white/80 to-transparent" />
							</h2>
							<div className="mt-4 space-y-5 text-base leading-relaxed text-white/70 sm:text-lg">
								<p>
									Esto no es un anuncio de reclutamiento al uso. Es dejar claro
									qué tipo de jugador encaja aquí y cuál no.
								</p>

								<p>
									Buscamos gente seria, con nivel, ganas de progresar y cabeza
									para llegar preparada a cada raid. No hace falta ser el mejor
									del mundo, pero sí hace falta ser fiable.
								</p>

								<p>
									El encounter se estudia antes. Los consumibles se traen. La
									rotación se sabe. Si hace falta ajustar algo, se ajusta entre
									intentos, no en medio del caos.
								</p>

								<p>
									También cuidamos el ambiente. No somos tóxicos, damos margen y
									entendemos que cada persona es distinta. Si alguien no encaja,
									se habla con calma y se toma la decisión que toque.
								</p>

								<p>
									Queremos mantener el ambiente que se ha construido este último
									año y hacerlo mejor todavía con jugadores que vengan a
									aportar, sumar y jugar con nosotros de verdad.
								</p>

								<p>
									Lo que valoramos: consistencia, ganas de mejorar y ambición
									por hacer kills cada vez mejores. Si tienes eso, el resto se
									entrena.
								</p>
							</div>
						</div>
					</section>
				</main>

				<LandingFooter />
			</div>
		</>
	);
}
