import { Metadata } from "next";
import { SupportContent } from "@/domains/support/components/support-content";
import { LandingNavigation } from "@/domains/landing/components/navigation";
import { LandingFooter } from "@/domains/landing/components/footer";
import { WebPageJsonLd } from "@/shared/seo/json-ld-webpage";

export const metadata: Metadata = {
	title: "Centro de Ayuda | Artic Tempest – Soporte y Guías",
	description:
		"Soporte técnico, guías de la hermandad, primeros pasos y buzón de sugerencias de Artic Tempest. Resuelve tus dudas sobre la guild.",
	alternates: {
		canonical: "/ayuda",
	},
	openGraph: {
		title: "Centro de Ayuda – Artic Tempest",
		description:
			"Soporte técnico, guías de la hermandad y buzón de sugerencias de Artic Tempest.",
		type: "website",
	},
};

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://artictempest.es";

export default function AyudaPage() {
	return (
		<>
			<WebPageJsonLd
				webPage={{
					id: `${baseUrl}/ayuda`,
					name: "Centro de Ayuda | Artic Tempest",
					description:
						"Soporte técnico, guías de la hermandad, primeros pasos y buzón de sugerencias de Artic Tempest.",
				}}
				breadcrumb={[
					{ name: "Inicio", url: baseUrl },
					{ name: "Ayuda", url: `${baseUrl}/ayuda` },
				]}
			/>
			<div className="min-h-dvh bg-zinc-950 selection:bg-blue-500/30 dark flex flex-col animate-fade-in animate-duration-slow motion-reduce:animate-none">
				<LandingNavigation />
				<main id="main-content" className="flex-1 pt-24">
					<SupportContent />
				</main>
				<LandingFooter />
			</div>
		</>
	);
}
