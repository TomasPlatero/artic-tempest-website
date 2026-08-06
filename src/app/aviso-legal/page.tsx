// src/app/aviso-legal/page.tsx
import { type ReactNode } from "react";
import { LandingNavigation } from "@/domains/landing/components/navigation";
import { LandingFooter } from "@/domains/landing/components/footer";
import Image from "next/image";
import Link from "next/link";
import {
	IconScale,
	IconUsers,
	IconCopyright,
	IconAlertTriangle,
	IconBriefcase,
	IconGavel,
	IconServer,
	IconShield,
} from "@/shared/ui/tabler-icons";
import { WebPageJsonLd } from "@/shared/seo/json-ld-webpage";

import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Aviso Legal | Artic Tempest",
	description:
		"Marco legal, identidad del responsable, condiciones de uso, propiedad intelectual y exclusiones de responsabilidad de Artic Tempest.",
	alternates: {
		canonical: "/aviso-legal",
	},
	robots: {
		index: false,
		follow: true,
	},
};

// Shared section shell for the legal document.
function LegalSection({
	icon,
	title,
	id,
	children,
}: {
	icon: ReactNode;
	title: string;
	id: string;
	children: ReactNode;
}) {
	return (
		<section
			className="bg-zinc-900/50 p-8 md:p-10 rounded-[32px] border border-white/5 space-y-8"
			aria-labelledby={`${id}-title`}
		>
			<div className="flex items-center gap-4 border-b border-white/5 pb-6">
				<div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
					{icon}
				</div>
				<h2
					id={`${id}-title`}
					className="text-2xl font-semibold text-white uppercase tracking-tight m-0"
				>
					{title}
				</h2>
			</div>
			{children}
		</section>
	);
}

// 1. Datos del Responsable
function ResponsableSection() {
	return (
		<LegalSection
			icon={
				<IconBriefcase className="text-emerald-500 size-6" aria-hidden="true" />
			}
			title="1. Datos del Responsable"
			id="responsable"
		>
			<div className="space-y-4">
				<p className="text-zinc-300 leading-relaxed text-sm">
					En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de
					Servicios de la Sociedad de la Información y de Comercio Electrónico
					(LSSI-CE), y del Reglamento (UE) 2016/679 (RGPD), se informa que el
					titular de este sitio web es:
				</p>
				<ul className="list-none p-0 m-0 space-y-3">
					<li className="text-sm font-bold text-white/85 border-b border-white/5 pb-3 flex flex-wrap items-baseline gap-2">
						<span className="uppercase tracking-widest text-[10px]">
							Titular:
						</span>
						<span className="text-white">
							Tomás Platero (Zatoshi), actuando como persona física en nombre de
							la comunidad Artic Tempest
						</span>
					</li>
					<li className="text-sm font-bold text-white/85 border-b border-white/5 pb-3 flex flex-wrap items-baseline gap-2">
						<span className="uppercase tracking-widest text-[10px]">
							Dominio:
						</span>
						<span className="text-emerald-400">artictempest.es</span>
					</li>
					<li className="text-sm font-bold text-white/85 border-b border-white/5 pb-3 flex flex-wrap items-baseline gap-2">
						<span className="uppercase tracking-widest text-[10px]">
							Correo electrónico:
						</span>
						<span className="text-white">admin@artictempest.es</span>
					</li>
					<li className="text-sm font-bold text-white/85 border-b border-white/5 pb-3 flex flex-wrap items-baseline gap-2">
						<span className="uppercase tracking-widest text-[10px]">
							Actividad:
						</span>
						<span className="text-white">
							Portal de comunidad sin ánimo de lucro para la gestión de una
							hermandad de World of Warcraft
						</span>
					</li>
					<li className="text-sm font-bold text-white/85 flex flex-wrap items-baseline gap-2 pt-1">
						<span className="uppercase tracking-widest text-[10px]">
							Finalidad:
						</span>
						<span className="text-white">
							Gestión de comunidad competitiva, coordinación de raids, panel de
							herramientas internas y difusión de contenido
						</span>
					</li>
				</ul>
			</div>
		</LegalSection>
	);
}

// 2. Propiedad Intelectual
function PropiedadIntelectualSection() {
	return (
		<LegalSection
			icon={
				<IconCopyright className="text-emerald-500 size-6" aria-hidden="true" />
			}
			title="2. Propiedad Intelectual e Industrial"
			id="ip"
		>
			<p className="text-zinc-300 leading-relaxed text-sm">
				Artic Tempest es titular de los derechos de propiedad intelectual sobre
				los textos originales, logotipos propios (incluyendo isotipo y
				wordmark), diseño del sitio y código fuente original. Queda expresamente
				prohibida la reproducción, distribución, comunicación pública y
				transformación total o parcial de estos elementos sin autorización
				previa y por escrito del titular.
			</p>
			<p className="text-zinc-300 leading-relaxed text-sm">
				Las capturas de pantalla, ilustraciones, nombres de personajes y
				cualquier otro elemento visual relacionado con World of Warcraft son
				propiedad exclusiva de Blizzard Entertainment, Inc. y se utilizan
				únicamente con fines identificativos y de referencia dentro del contexto
				del videojuego, de acuerdo con la{" "}
				<a
					href="https://www.blizzard.com/es-es/legal/2aee0c4b-0cb8-4a16-a1f1-1e7a91d4643b/blizzard-video-policy"
					target="_blank"
					rel="noreferrer"
					className="text-emerald-400 hover:text-emerald-300 underline"
				>
					política de vídeos y contenido de Blizzard
				</a>
				.
			</p>
			<div className="mt-8 space-y-4">
				<div className="p-6 rounded-[24px] bg-zinc-900/80 border border-white/5 flex gap-4 items-start shadow-xl">
					<IconAlertTriangle
						className="size-6 text-emerald-500 shrink-0 mt-1"
						aria-hidden="true"
					/>
					<div className="space-y-2">
						<p className="text-xs font-bold text-white uppercase tracking-widest leading-none">
							Descargo sobre Blizzard Entertainment
						</p>
						<p className="text-xs text-zinc-400 leading-relaxed">
							Artic Tempest es una{" "}
							<strong className="text-white/90">hermandad de jugadores</strong>{" "}
							(guild) dentro del videojuego World of Warcraft. Este sitio web es
							un portal de fans no oficial destinado a la gestión interna de
							nuestra comunidad. No somos socios, representantes ni empleados de
							Blizzard Entertainment, Inc.
						</p>
						<p className="text-[10px] text-zinc-400 font-medium leading-relaxed border-t border-white/5 pt-3">
							World of Warcraft y Blizzard Entertainment son marcas comerciales
							o marcas comerciales registradas de Blizzard Entertainment, Inc.
							en los EE. UU. y/o otros países. Todos los derechos sobre los
							recursos visuales, nombres, personajes y entornos del juego
							pertenecen exclusivamente a Blizzard Entertainment, Inc.
						</p>
					</div>
				</div>
			</div>
		</LegalSection>
	);
}

// 3. Condiciones de Uso
function CondicionesUsoSection() {
	return (
		<LegalSection
			icon={
				<IconUsers className="text-emerald-500 size-6" aria-hidden="true" />
			}
			title="3. Condiciones de Uso"
			id="terms"
		>
			<p className="text-zinc-300 leading-relaxed text-sm">
				El acceso y navegación por este sitio web atribuye la condición de
				usuario e implica la aceptación plena y sin reservas de las presentes
				condiciones de uso. El usuario se compromete a utilizar el portal y sus
				servicios de conformidad con la ley, la moral, las buenas costumbres y
				el orden público.
			</p>
			<p className="text-zinc-300 leading-relaxed text-sm">
				Queda expresamente prohibido el uso del sitio web con fines ilícitos,
				lesivos de los derechos e intereses de terceros, o que de cualquier
				forma puedan dañar, inutilizar, sobrecargar o deteriorar el portal. En
				particular, los formularios de{" "}
				<Link
					href="/feedback"
					className="text-emerald-400 hover:text-emerald-300 underline"
				>
					feedback
				</Link>
				,{" "}
				<Link
					href="/reclutamiento"
					className="text-emerald-400 hover:text-emerald-300 underline"
				>
					reclutamiento
				</Link>{" "}
				y demás herramientas interactivas deben usarse exclusivamente para los
				fines previstos, quedando terminantemente prohibido el envío de spam,
				contenido ofensivo o material publicitario no solicitado.
			</p>
		</LegalSection>
	);
}

// 4. Exclusiones de Responsabilidad
function ExclusionesSection() {
	return (
		<LegalSection
			icon={
				<IconShield className="text-emerald-500 size-6" aria-hidden="true" />
			}
			title="4. Exclusiones de Responsabilidad"
			id="liability"
		>
			<div className="space-y-4">
				<p className="text-zinc-300 leading-relaxed text-sm">
					El titular del sitio web no se hace responsable de:
				</p>
				<ul className="text-zinc-300 space-y-2 text-sm list-disc list-inside">
					<li>
						La disponibilidad y continuidad del funcionamiento del sitio web y
						de los servicios vinculados. Se realizarán los mejores esfuerzos
						para mantener la plataforma operativa, pero no se garantiza la
						ausencia de interrupciones temporales por mantenimiento técnico,
						actualizaciones o causas de fuerza mayor.
					</li>
					<li>
						Los contenidos, informaciones, opiniones o manifestaciones que los
						usuarios difundan a través de los formularios, foros o cualquier
						otra herramienta de participación habilitada en el portal.
					</li>
					<li>
						Los daños y perjuicios de cualquier naturaleza que pudieran
						derivarse del conocimiento que terceros no autorizados pudieran
						tener de los datos de los usuarios, siempre que se hayan adoptado
						las medidas de seguridad razonables según el estado de la técnica.
					</li>
					<li>
						La presencia de enlaces a sitios web de terceros (Raider.io,
						Warcraft Logs, Twitch, RestedXP, Proton VPN, etc.) no implica la
						aprobación de sus contenidos. El titular declina cualquier
						responsabilidad sobre el contenido y funcionamiento de dichos sitios
						externos.
					</li>
					<li>
						Los errores u omisiones en los contenidos del sitio web, así como
						los daños derivados del uso de la información publicada cuando esta
						provenga de fuentes ajenas al titular.
					</li>
				</ul>
			</div>
		</LegalSection>
	);
}

// 5. Proveedor de Alojamiento
function AlojamientoSection() {
	return (
		<LegalSection
			icon={
				<IconServer className="text-emerald-500 size-6" aria-hidden="true" />
			}
			title="5. Proveedor de Alojamiento"
			id="hosting"
		>
			<p className="text-zinc-300 leading-relaxed text-sm">
				El sitio web se aloja en los servidores gestionados por{" "}
				<strong>Vercel Inc.</strong>, 340 S Lemon Ave #4133, Walnut, CA 91789,
				Estados Unidos. La base de datos se aloja en{" "}
				<strong>Supabase Inc.</strong>, en infraestructura dentro del Espacio
				Económico Europeo (región eu-west-1). Ambas plataformas cumplen con las
				certificaciones y medidas de seguridad requeridas por el RGPD,
				incluyendo el cifrado en tránsito mediante TLS y el cifrado en reposo.
			</p>
		</LegalSection>
	);
}

// 6. Ley Aplicable y Jurisdicción
function LeySection() {
	return (
		<LegalSection
			icon={
				<IconGavel className="text-emerald-500 size-6" aria-hidden="true" />
			}
			title="6. Ley Aplicable y Jurisdicción"
			id="law"
		>
			<p className="text-zinc-300 leading-relaxed text-sm">
				El presente aviso legal se rige por la legislación española. Para la
				resolución de cualquier conflicto o controversia que pudiera surgir de
				la interpretación o aplicación de estas condiciones, ambas partes se
				someten, con renuncia expresa a cualquier otro fuero que pudiera
				corresponderles, a la jurisdicción de los Juzgados y Tribunales de la
				provincia del domicilio del titular del sitio web, siempre que la
				legislación aplicable lo permita.
			</p>
			<p className="text-zinc-300 leading-relaxed text-sm">
				Para cualquier reclamación relacionada con los servicios prestados a
				través de este sitio web, el usuario puede dirigirse al correo
				electrónico{" "}
				<strong className="text-white">admin@artictempest.es</strong>. Asimismo,
				la Comisión Europea facilita una plataforma de resolución de litigios en
				línea disponible en{" "}
				<a
					href="https://ec.europa.eu/consumers/odr/"
					target="_blank"
					rel="noreferrer"
					className="text-emerald-400 hover:text-emerald-300 underline"
				>
					https://ec.europa.eu/consumers/odr/
				</a>
				.
			</p>
		</LegalSection>
	);
}

export default function AvisoLegalPage() {
	const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://artictempest.es";

	return (
		<>
			<WebPageJsonLd
				webPage={{
					id: `\${baseUrl}/aviso-legal`,
					name: "Aviso Legal | Artic Tempest",
					description:
						"Marco legal, identidad del responsable, condiciones de uso, propiedad intelectual y exclusiones de responsabilidad de Artic Tempest.",
				}}
				breadcrumb={[
					{ name: "Inicio", url: baseUrl },
					{ name: "Aviso Legal", url: `\${baseUrl}/aviso-legal` },
				]}
			/>
			<div className="min-h-dvh bg-zinc-950 flex flex-col relative overflow-hidden dark animate-fade-in animate-duration-slow motion-reduce:animate-none">
				<div className="absolute inset-0 z-0 select-none pointer-events-none overflow-hidden size-full">
					<Image
						src="/assets/images/housing-contact.webp"
						alt=""
						fill
						aria-hidden="true"
						className="object-cover blur-[2px] opacity-30 scale-105"
						sizes="100vw"
						priority
					/>
					<div className="absolute inset-0 bg-linear-to-b from-black/80 via-black/40 to-black/90" />
				</div>

				<LandingNavigation />

				<main
					id="main-content"
					className="relative z-10 flex-1 py-32 px-6 max-w-4xl mx-auto"
				>
					<header className="mb-16 text-center">
						<div className="inline-flex bg-emerald-500/10 p-4 rounded-3xl border border-emerald-500/20 mb-6">
							<IconScale
								className="size-10 text-emerald-500"
								aria-hidden="true"
							/>
						</div>
						<h1 className="text-5xl md:text-6xl font-semibold text-white uppercase tracking-tighter mb-4">
							Aviso Legal
						</h1>
						<p className="text-white/80 font-medium uppercase tracking-[0.2em] text-sm">
							Marco normativo y transparencia
						</p>
					</header>

					<div className="prose prose-invert max-w-none space-y-16">
						<ResponsableSection />
						<PropiedadIntelectualSection />
						<CondicionesUsoSection />
						<ExclusionesSection />
						<AlojamientoSection />
						<LeySection />

						<footer className="text-center pt-10 text-white/20 text-[10px] uppercase font-semibold tracking-[0.3em]">
							Documento actualizado — Julio 2026. Conforme con LSSI-CE, RGPD
							(UE) 2016/679 y LOPD-GDD 3/2018.
						</footer>
					</div>
				</main>

				<LandingFooter />
			</div>
		</>
	);
}
