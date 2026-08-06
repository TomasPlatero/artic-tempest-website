// src/app/privacidad/page.tsx
import { LandingNavigation } from "@/domains/landing/components/navigation";
import { LandingFooter } from "@/domains/landing/components/footer";
import Image from "next/image";
import { IconShieldCheck, IconUser, IconClock } from "@/shared/ui/tabler-icons";
import { Metadata } from "next";
import { PrivacidadContentSections } from "./_components/privacidad-content-sections";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://artictempest.es";
import { WebPageJsonLd } from "@/shared/seo/json-ld-webpage";

export const metadata: Metadata = {
	title: "Política de Privacidad | Artic Tempest",
	description:
		"Información detallada sobre el tratamiento de datos personales, bases legales, derechos ARCO y medidas de seguridad según el RGPD y la LOPD-GDD.",
	alternates: {
		canonical: "/privacidad",
	},
	robots: {
		index: false,
		follow: true,
	},
};

export default function PrivacidadPage() {
	return (
		<>
			<WebPageJsonLd
				webPage={{
					id: `\${baseUrl}/privacidad`,
					name: "Política de Privacidad | Artic Tempest",
					description:
						"Información detallada sobre el tratamiento de datos personales, bases legales, derechos ARCO y medidas de seguridad según el RGPD y la LOPD-GDD.",
				}}
				breadcrumb={[
					{ name: "Inicio", url: baseUrl },
					{ name: "Privacidad", url: `\${baseUrl}/privacidad` },
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
						<div className="inline-flex bg-blue-500/10 p-4 rounded-3xl border border-blue-500/20 mb-6">
							<IconShieldCheck
								className="size-10 text-blue-400"
								aria-hidden="true"
							/>
						</div>
						<h1 className="text-5xl md:text-6xl font-semibold text-white tracking-tighter mb-4">
							Política de Privacidad
						</h1>
						<p className="text-white/80 font-medium tracking-[0.2em] text-sm">
							Protección de datos personales — RGPD y LOPD-GDD
						</p>
					</header>

					<div className="prose prose-invert max-w-none space-y-16">
						{/* 1. Responsable del Tratamiento */}
						<section
							className="bg-zinc-900/50 p-8 md:p-10 rounded-[32px] border border-white/5 space-y-8"
							aria-labelledby="responsable-title"
						>
							<div className="flex items-center gap-4 border-b border-white/5 pb-6">
								<div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
									<IconUser
										className="text-blue-400 size-6"
										aria-hidden="true"
									/>
								</div>
								<h2
									id="responsable-title"
									className="text-2xl font-semibold text-white tracking-tight m-0"
								>
									1. Responsable del Tratamiento
								</h2>
							</div>
							<div className="space-y-3">
								<p className="text-zinc-300 leading-relaxed">
									De conformidad con el Reglamento (UE) 2016/679 del Parlamento
									Europeo y del Consejo (RGPD) y la Ley Orgánica 3/2018, de 5 de
									diciembre, de Protección de Datos Personales y garantía de los
									derechos digitales (LOPD-GDD), se informa:
								</p>
								<ul className="list-none p-0 m-0 space-y-3">
									<li className="text-sm font-bold text-white/85 border-b border-white/5 pb-3 flex flex-wrap items-baseline gap-2">
										<span className="uppercase tracking-widest text-[10px]">
											Responsable:
										</span>
										<span className="text-white">
											Tomás Platero, en representación de Artic Tempest
										</span>
									</li>
									<li className="text-sm font-bold text-white/85 border-b border-white/5 pb-3 flex flex-wrap items-baseline gap-2">
										<span className="uppercase tracking-widest text-[10px]">
											Correo:
										</span>
										<span className="text-blue-400">admin@artictempest.es</span>
									</li>
									<li className="text-sm font-bold text-white/85 border-b border-white/5 pb-3 flex flex-wrap items-baseline gap-2">
										<span className="uppercase tracking-widest text-[10px]">
											Sitio web:
										</span>
										<span className="text-white">artictempest.es</span>
									</li>
									<li className="text-sm font-bold text-white/85 flex flex-wrap items-baseline gap-2 pt-1">
										<span className="uppercase tracking-widest text-[10px]">
											Actividad:
										</span>
										<span className="text-white">
											Portal comunitario sin ánimo de lucro para gestión de
											hermandad de World of Warcraft
										</span>
									</li>
								</ul>
								<p className="text-zinc-300 leading-relaxed text-sm">
									Dado que la hermandad no realiza tratamiento de datos a gran
									escala, no procesa categorías especiales de datos ni efectúa
									un seguimiento sistemático de personas físicas, no existe la
									obligación legal de designar un Delegado de Protección de
									Datos (DPD). No obstante, cualquier consulta relativa a
									privacidad será atendida en{" "}
									<strong className="text-white">admin@artictempest.es</strong>.
								</p>
							</div>
						</section>

						<PrivacidadContentSections />

						{/* 3. Plazos de conservación */}
						<section
							className="bg-zinc-900/50 p-8 md:p-10 rounded-[32px] border border-white/5 space-y-8"
							aria-labelledby="retention-title"
						>
							<div className="flex items-center gap-4 border-b border-white/5 pb-6">
								<div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
									<IconClock
										className="text-blue-400 size-6"
										aria-hidden="true"
									/>
								</div>
								<h2
									id="retention-title"
									className="text-2xl font-semibold text-white tracking-tight m-0"
								>
									3. Plazos de Conservación
								</h2>
							</div>
							<div className="space-y-4">
								<p className="text-zinc-300 leading-relaxed text-sm">
									Los datos personales se conservarán únicamente durante el
									tiempo necesario para cumplir con la finalidad para la que
									fueron recabados:
								</p>
								<ul className="text-zinc-300 space-y-2 text-sm list-disc list-inside">
									<li>
										<strong className="text-white/90">
											Datos de cuenta y perfil:
										</strong>{" "}
										mientras mantengas vinculada tu cuenta a la hermandad. Al
										desvincularte, los datos se eliminan.
									</li>
									<li>
										<strong className="text-white/90">
											Formularios de contacto y feedback:
										</strong>{" "}
										máximo 12 meses desde la última comunicación, salvo que se
										derive una relación continuada.
									</li>
									<li>
										<strong className="text-white/90">
											Solicitudes de reclutamiento:
										</strong>{" "}
										3 meses desde la resolución definitiva (aceptación, rechazo
										o cierre).
									</li>
									<li>
										<strong className="text-white/90">
											Datos de analítica (Google Analytics):
										</strong>{" "}
										el período de retención configurado en GA4, actualmente 14
										meses desde la última interacción registrada.
									</li>
									<li>
										<strong className="text-white/90">
											Datos de logs de raid:
										</strong>{" "}
										se conservan de forma agregada mientras la hermandad esté
										activa, sin vinculación directa a datos personales una vez
										superado el período de actividad del miembro.
									</li>
								</ul>
								<p className="text-zinc-300 leading-relaxed text-sm">
									Transcurridos los plazos indicados, los datos serán suprimidos
									conforme a lo dispuesto en la normativa de protección de
									datos, lo que implicará su bloqueo durante los plazos legales
									de prescripción de obligaciones (generalmente 5 años según el
									Código Civil) y su posterior eliminación definitiva.
								</p>
							</div>
						</section>

						<footer className="text-center pt-10 text-white/20 text-[10px] font-semibold tracking-[0.3em]">
							Última actualización: Julio 2026. Conforme con RGPD (UE) 2016/679
							y LOPD-GDD 3/2018.
						</footer>
					</div>
				</main>

				<LandingFooter />
			</div>
		</>
	);
}
