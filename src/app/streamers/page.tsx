import { Metadata } from "next";
import { LandingNavigation } from "@/domains/landing/components/navigation";
import { LandingStreamers } from "@/domains/landing/components/streamers";
import { LandingFooter } from "@/domains/landing/components/footer";
import { BreadcrumbJsonLd } from "@/shared/seo/json-ld";
import { getEnrichedStreamers } from "@/domains/streamers/lib/server-actions";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardTitle,
} from "@/shared/ui/card";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://artictempest.es";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Streamers | Artic Tempest – Creadores de Contenido WoW",
	description:
		"Sigue en directo a los creadores de contenido de Artic Tempest. Streams de progreso mítico, guías y entretenimiento de World of Warcraft.",
	alternates: {
		canonical: "/streamers",
	},
	openGraph: {
		title: "Streamers – Artic Tempest",
		description:
			"Sigue en directo a los creadores de contenido de Artic Tempest y disfruta de nuestro progreso en vivo.",
		type: "website",
		url: `${baseUrl}/streamers`,
	},
};

export default async function StreamersPage() {
	const streamers = await getEnrichedStreamers();

	return (
		<div className="min-h-dvh bg-zinc-950 selection:bg-blue-500/30 dark flex flex-col animate-fade-in animate-duration-slow motion-reduce:animate-none">
			<BreadcrumbJsonLd
				items={[
					{ name: "Inicio", url: baseUrl },
					{ name: "Streamers", url: `${baseUrl}/streamers` },
				]}
			/>
			<LandingNavigation />

			<div className="flex-1">
				<div className="mx-auto max-w-6xl px-4 pb-8 text-center">
					<h1 className="sr-only">Streamers</h1>
				</div>
				<LandingStreamers initialStreamers={streamers} />
				<div className="mx-auto max-w-6xl px-4 pb-16">
					<Card className="overflow-hidden border-white/10 bg-white/5">
						<CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
							<div className="max-w-2xl space-y-2">
								<CardTitle className="text-2xl font-semibold tracking-tight text-white">
									¿Necesitas banners y logos para tus directos?
								</CardTitle>
								<CardDescription className="text-base leading-7 text-white/65">
									Hemos preparado una página de recursos con los PNG oficiales
									de Artic Tempest, listos para descargar y usar.
								</CardDescription>
							</div>
							<Button
								asChild
								variant="landingTinted"
								size="public"
								className="shrink-0"
							>
								<Link href="/streamers/recursos">Ir a recursos</Link>
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>

			<LandingFooter />
		</div>
	);
}
