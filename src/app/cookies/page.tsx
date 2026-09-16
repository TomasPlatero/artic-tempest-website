// src/app/cookies/page.tsx
import { LandingNavigation } from "@/domains/landing/components/navigation";
import { LandingFooter } from "@/domains/landing/components/footer";
import Link from "next/link";
import Image from "next/image";
import {
	IconCookie,
	IconInfoCircle,
	IconSettings,
	IconShieldCheck,
	IconRefresh,
} from "@/shared/ui/tabler-icons";
import { CookieYesPolicyScript } from "@/shared/consent/cookieyes-policy-script";
import { Metadata } from "next";
import { WebPageJsonLd } from "@/shared/seo/json-ld-webpage";

export const metadata: Metadata = {
	title: "Política de Cookies | Artic Tempest",
	description:
		"Información sobre las cookies utilizadas en Artic Tempest, gestión del consentimiento y declaración de cookies conforme al RGPD y la LSSI-CE.",
	alternates: {
		canonical: "/cookies",
	},
	robots: {
		index: false,
		follow: true,
	},
};

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://artictempest.es";

export default function CookiesPage() {
	return (
		<>
			<WebPageJsonLd
				webPage={{
					id: `${baseUrl}/cookies`,
					name: "Política de Cookies | Artic Tempest",
					description:
						"Información sobre las cookies utilizadas en Artic Tempest, gestión del consentimiento y declaración de cookies conforme al RGPD y la LSSI-CE.",
				}}
				breadcrumb={[
					{ name: "Inicio", url: baseUrl },
					{ name: "Cookies", url: `${baseUrl}/cookies` },
				]}
			/>
			<div className="min-h-dvh bg-zinc-950 flex flex-col relative overflow-hidden animate-fade-in animate-duration-slow motion-reduce:animate-none">
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
						<div className="inline-flex bg-amber-500/10 p-4 rounded-3xl border border-amber-500/20 mb-6">
							<IconCookie className="size-10 text-amber-500" aria-hidden="true" />
						</div>
						<h1 className="text-5xl md:text-6xl font-semibold text-white uppercase tracking-tighter mb-4">
							Política de Cookies
						</h1>
						<p className="text-white/80 font-medium uppercase tracking-[0.2em] text-sm">
							Transparencia y control sobre tus datos
						</p>
					</header>

					<div className="prose prose-invert max-w-none space-y-16">
						{/* 1. Declaración de cookies — contenido generado por CookieYes */}
						<section
							className="bg-zinc-900/50 p-8 md:p-10 rounded-[32px] border border-white/5 space-y-8"
							aria-labelledby="declaration-title"
						>
							<div className="flex items-center gap-4 border-b border-white/5 pb-6">
								<div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
									<IconCookie className="text-amber-500 size-6" aria-hidden="true" />
								</div>
								<h2
									id="declaration-title"
									className="text-2xl md:text-3xl font-semibold text-white uppercase tracking-tight m-0"
								>
									1. Declaración de cookies
								</h2>
							</div>
							<p className="text-zinc-300 leading-relaxed">
								El contenido de esta sección —qué son las cookies, cómo las usamos, el
								inventario completo detectado en el sitio y los controles de
								preferencias— se genera y actualiza automáticamente desde{" "}
								<strong className="text-white/90">CookieYes</strong>, la plataforma de
								gestión del consentimiento que utilizamos. Esta política cumple con el
								artículo 22.2 de la LSSI-CE, el RGPD y las directrices de la Agencia
								Española de Protección de Datos (AEPD).
							</p>
							<div className="space-y-4">
								{/* La política completa (inventario incluido) la renderiza CookieYes
								    en este contenedor una vez hidratado el árbol. */}
								<CookieYesPolicyScript />
							</div>
						</section>

						{/* 2. Consentimiento */}
						<section
							className="bg-zinc-900/50 p-8 md:p-10 rounded-[32px] border border-white/5 space-y-8"
							aria-labelledby="consent-title"
						>
							<div className="flex items-center gap-4 border-b border-white/5 pb-6">
								<div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
									<IconShieldCheck
										className="text-amber-500 size-6"
										aria-hidden="true"
									/>
								</div>
								<h2
									id="consent-title"
									className="text-2xl md:text-3xl font-semibold text-white uppercase tracking-tight m-0"
								>
									2. Cómo gestionamos tu consentimiento
								</h2>
							</div>
							<p className="text-zinc-300 leading-relaxed">
								Utilizamos <strong className="text-white/90">CookieYes</strong> como
								plataforma de gestión del consentimiento. La primera vez que accedes al
								sitio, se muestra un banner que te permite aceptar todas las cookies,
								rechazar las opcionales o configurar tus preferencias por categoría.
								Hasta que no tomes una decisión explícita,{" "}
								<strong>
									no se instala ni ejecuta ninguna cookie que requiera consentimiento
								</strong>
								.
							</p>
							<p className="text-zinc-300 leading-relaxed">
								El consentimiento se almacena durante <strong>12 meses</strong>. Puedes
								cambiar tus preferencias en cualquier momento desde el botón
								«Preferencias de consentimiento» de la declaración de esta página.
							</p>
						</section>

						{/* 3. Gestión desde el navegador */}
						<section
							className="bg-zinc-900/50 p-8 md:p-10 rounded-[32px] border border-white/5 space-y-8"
							aria-labelledby="manage-title"
						>
							<div className="flex items-center gap-4 border-b border-white/5 pb-6">
								<div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
									<IconSettings className="text-amber-500 size-6" aria-hidden="true" />
								</div>
								<h2
									id="manage-title"
									className="text-2xl md:text-3xl font-semibold text-white uppercase tracking-tight m-0"
								>
									3. Cómo gestionar o desactivar las cookies
								</h2>
							</div>
							<p className="text-zinc-300 leading-relaxed">
								Además del banner de consentimiento, puedes gestionar, bloquear o
								eliminar las cookies desde la configuración de tu navegador:
							</p>
							<ul className="text-zinc-300 space-y-1 text-sm list-disc list-inside">
								<li>
									<strong className="text-white/90">Google Chrome:</strong> Configuración
									→ Privacidad y seguridad → Cookies y otros datos de sitios
								</li>
								<li>
									<strong className="text-white/90">Mozilla Firefox:</strong> Opciones →
									Privacidad y seguridad → Cookies y datos del sitio
								</li>
								<li>
									<strong className="text-white/90">Microsoft Edge:</strong>{" "}
									Configuración → Cookies y permisos del sitio
								</li>
								<li>
									<strong className="text-white/90">Safari:</strong> Preferencias →
									Privacidad → Cookies y datos de sitios web
								</li>
								<li>
									<strong className="text-white/90">Opera:</strong> Configuración →
									Privacidad y seguridad → Cookies
								</li>
							</ul>
							<p className="text-zinc-300 leading-relaxed">
								Ten en cuenta que desactivar las cookies técnicas necesarias impedirá el
								funcionamiento de la Zona Raider y la autenticación con Discord o
								Battle.net.
							</p>
						</section>

						{/* 4. Actualizaciones y referencias */}
						<section
							className="bg-zinc-900/50 p-8 md:p-10 rounded-[32px] border border-white/5 space-y-8"
							aria-labelledby="updates-title"
						>
							<div className="flex items-center gap-4 border-b border-white/5 pb-6">
								<div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
									<IconRefresh className="text-amber-500 size-6" aria-hidden="true" />
								</div>
								<h2
									id="updates-title"
									className="text-2xl md:text-3xl font-semibold text-white uppercase tracking-tight m-0"
								>
									4. Actualizaciones y Documentación Relacionada
								</h2>
							</div>
							<p className="text-zinc-300 leading-relaxed">
								La declaración de cookies se actualiza automáticamente mediante el
								escaneo de CookieYes. Esta página refleja siempre el inventario más
								reciente detectado en el sitio. CookieYes Limited (Reino Unido) actúa
								como encargado del tratamiento de los datos de consentimiento.
							</p>
							<div className="flex flex-col sm:flex-row gap-4 mt-4">
								<Link
									href="/privacidad"
									className="inline-flex items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors underline"
								>
									<IconShieldCheck className="size-4" aria-hidden="true" />
									Política de Privacidad
								</Link>
								<Link
									href="/aviso-legal"
									className="inline-flex items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors underline"
								>
									<IconInfoCircle className="size-4" aria-hidden="true" />
									Aviso Legal
								</Link>
							</div>
						</section>

						<footer className="text-center pt-10 text-white/20 text-xs uppercase font-semibold tracking-[0.2em]">
							Declaración de cookies gestionada por CookieYes. Conforme con LSSI-CE y
							RGPD (UE) 2016/679.
						</footer>
					</div>
				</main>

				<LandingFooter />
			</div>
		</>
	);
}
