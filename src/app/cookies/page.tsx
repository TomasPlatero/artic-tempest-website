// src/app/cookies/page.tsx
import { LandingNavigation } from "@/domains/landing/components/navigation";
import { LandingFooter } from "@/domains/landing/components/footer";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import {
	IconCookie,
	IconInfoCircle,
	IconSettings,
	IconShieldCheck,
	IconRefresh,
} from "@/shared/ui/tabler-icons";
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
							<IconCookie
								className="size-10 text-amber-500"
								aria-hidden="true"
							/>
						</div>
						<h1 className="text-5xl md:text-6xl font-semibold text-white uppercase tracking-tighter mb-4">
							Política de Cookies
						</h1>
						<p className="text-white/80 font-medium uppercase tracking-[0.2em] text-sm">
							Transparencia y control sobre tus datos
						</p>
					</header>

					<div className="prose prose-invert max-w-none space-y-16">
						{/* 1. ¿Qué son las Cookies? */}
						<section
							className="bg-zinc-900/50 p-8 md:p-10 rounded-[32px] border border-white/5 space-y-8"
							aria-labelledby="what-title"
						>
							<div className="flex items-center gap-4 border-b border-white/5 pb-6">
								<div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
									<IconInfoCircle
										className="text-amber-500 size-6"
										aria-hidden="true"
									/>
								</div>
								<h2
									id="what-title"
									className="text-2xl md:text-3xl font-semibold text-white uppercase tracking-tight m-0"
								>
									1. ¿Qué son las Cookies y cómo las usamos?
								</h2>
							</div>
							<p className="text-zinc-300 leading-relaxed">
								Las cookies son pequeños ficheros de texto que los sitios web
								almacenan en tu navegador cuando los visitas. También utilizamos{" "}
								<strong className="text-white/90">almacenamiento local</strong>{" "}
								(localStorage) para algunas preferencias de interfaz. Ambos
								mecanismos nos permiten recordar tus elecciones, mantener tu
								sesión activa y comprender cómo interactúas con el sitio para
								mejorarlo.
							</p>
							<p className="text-zinc-300 leading-relaxed">
								Esta política cumple con el artículo 22.2 de la LSSI-CE, el RGPD
								y las directrices de la Agencia Española de Protección de Datos
								(AEPD). Utilizamos{" "}
								<strong className="text-white/90">Cookiebot CMP</strong> (Cybot
								A/S, Dinamarca) como plataforma de gestión del consentimiento,
								que escanea y clasifica automáticamente todas las cookies del
								sitio.
							</p>
						</section>

						{/* 2. Declaración de cookies — Cookiebot */}
						<section
							className="bg-zinc-900/50 p-8 md:p-10 rounded-[32px] border border-white/5 space-y-8"
							aria-labelledby="declaration-title"
						>
							<div className="flex items-center gap-4 border-b border-white/5 pb-6">
								<div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
									<IconCookie
										className="text-amber-500 size-6"
										aria-hidden="true"
									/>
								</div>
								<h2
									id="declaration-title"
									className="text-2xl md:text-3xl font-semibold text-white uppercase tracking-tight m-0"
								>
									2. Declaración de cookies
								</h2>
							</div>
							<p className="text-zinc-300 leading-relaxed">
								El siguiente listado es generado y actualizado automáticamente
								por Cookiebot. Incluye todas las cookies detectadas en el sitio,
								clasificadas por categoría, proveedor, finalidad y duración.
							</p>
							<div
								id="CookieDeclaration"
								className="[&_.CookieDeclaration]:!bg-transparent [&_.CookieDeclarationType]:!bg-white/[0.025] [&_.CookieDeclarationType]:!border-white/[0.06] [&_.CookieDeclarationType]:!rounded-2xl [&_.CookieDeclarationTable]:!text-sm [&_.CookieDeclarationTableCell]:!text-zinc-300 [&_.CookieDeclarationTableCell]:!border-white/[0.04] [&_.CookieDeclarationTableHeader]:!text-white/40 [&_.CookieDeclarationTableHeader]:!border-white/[0.08] [&_a]:!text-blue-400"
							>
								<Script
									id="CookieDeclaration"
									src="https://consent.cookiebot.com/72df8fdd-3a73-4c16-b7ad-8d2f5083346d/cd.js"
									strategy="afterInteractive"
								/>
							</div>
						</section>

						{/* 3. Consentimiento */}
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
									3. Cómo gestionamos tu consentimiento
								</h2>
							</div>
							<p className="text-zinc-300 leading-relaxed">
								Utilizamos{" "}
								<strong className="text-white/90">Cookiebot CMP</strong> como
								plataforma de gestión de consentimiento. La primera vez que
								accedes al sitio, se muestra un banner que te permite aceptar
								todas las cookies, solo las necesarias, o configurar tus
								preferencias por categoría. Hasta que no tomes una decisión
								explícita,{" "}
								<strong>
									no se instala ni ejecuta ninguna cookie que requiera
									consentimiento
								</strong>
								.
							</p>
							<p className="text-zinc-300 leading-relaxed">
								El consentimiento se almacena durante <strong>12 meses</strong>.
								Puedes cambiar tus preferencias en cualquier momento haciendo
								clic en el icono de cookies que aparece en la esquina inferior
								del sitio, o desde el enlace «Cambiar el consentimiento» en la
								declaración de cookies de esta misma página.
							</p>
						</section>

						{/* 4. Gestión desde el navegador */}
						<section
							className="bg-zinc-900/50 p-8 md:p-10 rounded-[32px] border border-white/5 space-y-8"
							aria-labelledby="manage-title"
						>
							<div className="flex items-center gap-4 border-b border-white/5 pb-6">
								<div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
									<IconSettings
										className="text-amber-500 size-6"
										aria-hidden="true"
									/>
								</div>
								<h2
									id="manage-title"
									className="text-2xl md:text-3xl font-semibold text-white uppercase tracking-tight m-0"
								>
									4. Cómo gestionar o desactivar las cookies
								</h2>
							</div>
							<p className="text-zinc-300 leading-relaxed">
								Además del banner de consentimiento, puedes gestionar, bloquear
								o eliminar las cookies desde la configuración de tu navegador:
							</p>
							<ul className="text-zinc-300 space-y-1 text-sm list-disc list-inside">
								<li>
									<strong className="text-white/90">Google Chrome:</strong>{" "}
									Configuración → Privacidad y seguridad → Cookies y otros datos
									de sitios
								</li>
								<li>
									<strong className="text-white/90">Mozilla Firefox:</strong>{" "}
									Opciones → Privacidad y seguridad → Cookies y datos del sitio
								</li>
								<li>
									<strong className="text-white/90">Microsoft Edge:</strong>{" "}
									Configuración → Cookies y permisos del sitio
								</li>
								<li>
									<strong className="text-white/90">Safari:</strong>{" "}
									Preferencias → Privacidad → Cookies y datos de sitios web
								</li>
								<li>
									<strong className="text-white/90">Opera:</strong>{" "}
									Configuración → Privacidad y seguridad → Cookies
								</li>
							</ul>
							<p className="text-zinc-300 leading-relaxed">
								Ten en cuenta que desactivar las cookies técnicas necesarias
								impedirá el funcionamiento de la Zona Raider y la autenticación
								con Discord o Battle.net.
							</p>
						</section>

						{/* 5. Actualizaciones y referencias */}
						<section
							className="bg-zinc-900/50 p-8 md:p-10 rounded-[32px] border border-white/5 space-y-8"
							aria-labelledby="updates-title"
						>
							<div className="flex items-center gap-4 border-b border-white/5 pb-6">
								<div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
									<IconRefresh
										className="text-amber-500 size-6"
										aria-hidden="true"
									/>
								</div>
								<h2
									id="updates-title"
									className="text-2xl md:text-3xl font-semibold text-white uppercase tracking-tight m-0"
								>
									5. Actualizaciones y Documentación Relacionada
								</h2>
							</div>
							<p className="text-zinc-300 leading-relaxed">
								La declaración de cookies se actualiza automáticamente mediante
								el escaneo mensual de Cookiebot. Esta página refleja siempre el
								inventario más reciente detectado en el sitio.
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
							Declaración de cookies gestionada por Cookiebot CMP. Conforme con
							LSSI-CE y RGPD (UE) 2016/679.
						</footer>
					</div>
				</main>

				<LandingFooter />
			</div>
		</>
	);
}
